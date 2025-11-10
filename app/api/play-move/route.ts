// API Route: /api/play-move
// Validates and processes a player's move
// NOW WITH 4-WAY DOMINO SUPPORT!

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { doc, getDoc, collection, getDocs, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Tile, PlayedTile } from '@/types/game';
import {
  canPlayTile,
  getValidPlacements,
  getValidPlacements4Way,
  calculateScore as calcOpenEndScore,
  calculate4WayScore,
  hasTile,
  removeTileFromHand,
  detectLockedDouble,
  splitBoardAtDouble,
} from '@/lib/domino-utils';
import { deserializeGameState, serializeBoard, tilesToStrings, serializeHands, tileToString } from '@/lib/firestore-converters';
import { 
  calculateBonusRoundedUp,
  applyBonusWithCap,
  shouldEndMatch,
  findMatchWinner 
} from '@/lib/game-rules';

export async function POST(request: NextRequest) {
  try {
    const { roomId, userId, tile, side } = await request.json();

    if (!roomId || !userId || !tile || !side) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // 1. Get player's seat
    const memberRef = doc(db, 'rooms', roomId, 'members', userId);
    const memberSnap = await getDoc(memberRef);

    if (!memberSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Player not found in room' },
        { status: 404 }
      );
    }

    const playerSeat = memberSnap.data()!.seat;

    // 2. Get current game state
    const stateRef = doc(db, 'game_states', roomId);
    const stateSnap = await getDoc(stateRef);

    if (!stateSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Game state not found' },
        { status: 404 }
      );
    }

    const gameState = deserializeGameState(stateSnap.data()!);

    // 3. Verify it's the player's turn
    if (gameState.turn !== playerSeat) {
      return NextResponse.json(
        { success: false, error: 'Not your turn' },
        { status: 400 }
      );
    }

    // 4. Verify tile is in player's hand
    const playerHand = gameState.hands[playerSeat] || [];
    if (!hasTile(playerHand, tile as Tile)) {
      return NextResponse.json(
        { success: false, error: 'Tile not in your hand' },
        { status: 400 }
      );
    }

    const tileArray = tile as Tile;
    const isDouble = tileArray[0] === tileArray[1];
    
    // Check if this is an empty board (first tile)
    const isEmptyBoard = gameState.board.length === 0 && 
                         gameState.leftChain.length === 0 && 
                         gameState.rightChain.length === 0;
    
    let newBoard = gameState.board;
    let newLeftChain = gameState.leftChain || [];
    let newRightChain = gameState.rightChain || [];
    let newUpChain = gameState.upChain || [];
    let newDownChain = gameState.downChain || [];
    let newOpenEnds: any;
    let newLockedDouble = gameState.lockedDouble;
    let newIs4WayActive = gameState.is4WayActive || false;
    
    // =================================================================
    // HANDLE FIRST TILE (EMPTY BOARD)
    // =================================================================
    if (isEmptyBoard) {
      console.log(`🎯 First tile played: [${tileArray[0]}-${tileArray[1]}] by seat ${playerSeat}`);
      
      newBoard = [{
        tile: tile as Tile,
        placement: 'left',
        timestamp: Date.now(),
        flipped: false,
      }];
      
      newOpenEnds = {
        left: tileArray[0],
        right: tileArray[1],
        up: null,
        down: null,
        leftIsDouble: isDouble,
        rightIsDouble: isDouble,
        upIsDouble: false,
        downIsDouble: false,
      };
    }
    // =================================================================
    // HANDLE 4-WAY MODE (LOCKED DOUBLE EXISTS)
    // =================================================================
    else if (newIs4WayActive && (side === 'up' || side === 'down')) {
      console.log(`🔀 4-WAY MODE: Playing on ${side} direction`);
      
      const targetEnd = gameState.openEnds[side];
      
      if (targetEnd === null || !canPlayTile(tile as Tile, targetEnd)) {
        return NextResponse.json(
          { success: false, error: `Invalid move - tile does not match ${side} end` },
          { status: 400 }
        );
      }

      // Determine orientation and new end value for up/down
      const matchesWithFirst = tileArray[0] === targetEnd;
      let flipped = false;
      let newEndValue: number;
      
      if (side === 'up') {
        // Up: tile extends upward, matching end connects to chain
        if (matchesWithFirst) {
          flipped = true;
          newEndValue = tileArray[1];
        } else {
          flipped = false;
          newEndValue = tileArray[0];
        }
      } else { // down
        // Down: tile extends downward
        if (matchesWithFirst) {
          flipped = false;
          newEndValue = tileArray[1];
        } else {
          flipped = true;
          newEndValue = tileArray[0];
        }
      }

      const playedTile: PlayedTile = {
        tile: tile as Tile,
        placement: side,
        timestamp: Date.now(),
        flipped,
      };

      // Add to appropriate chain
      if (side === 'up') {
        newUpChain = [...newUpChain, playedTile];
      } else {
        newDownChain = [...newDownChain, playedTile];
      }

      // Update open ends
      newOpenEnds = {
        ...gameState.openEnds,
        [side]: newEndValue,
        [`${side}IsDouble`]: isDouble,
      };
    }
    // =================================================================
    // HANDLE 2-WAY MODE OR 4-WAY LEFT/RIGHT
    // =================================================================
    else {
      // Validate move on left or right
      let targetEnd: number | null;
      
      if (newIs4WayActive) {
        // 4-WAY MODE: left/right still work on chains
        targetEnd = side === 'left' ? gameState.openEnds.left : gameState.openEnds.right;
      } else {
        // 2-WAY MODE: normal board
        targetEnd = side === 'left' ? gameState.openEnds.left : gameState.openEnds.right;
      }
      
      if (targetEnd === null || !canPlayTile(tile as Tile, targetEnd)) {
        return NextResponse.json(
          { success: false, error: 'Invalid move - tile does not match' },
          { status: 400 }
        );
      }

      // Determine orientation and new end value
      const matchesWithFirst = tileArray[0] === targetEnd;
      let flipped = false;
      let newEndValue: number;
      
      if (side === 'left') {
        if (matchesWithFirst) {
          flipped = true;
          newEndValue = tileArray[1];
        } else {
          flipped = false;
          newEndValue = tileArray[0];
        }
      } else { // right
        if (matchesWithFirst) {
          flipped = false;
          newEndValue = tileArray[1];
        } else {
          flipped = true;
          newEndValue = tileArray[0];
        }
      }

      const playedTile: PlayedTile = {
        tile: tile as Tile,
        placement: side,
        timestamp: Date.now(),
        flipped,
      };

      if (newIs4WayActive) {
        // 4-WAY MODE: Add to left/right chains
        if (side === 'left') {
          newLeftChain = [...newLeftChain, playedTile];
        } else {
          newRightChain = [...newRightChain, playedTile];
        }
      } else {
        // 2-WAY MODE: Add to main board
        newBoard = side === 'left' 
          ? [playedTile, ...newBoard]
          : [...newBoard, playedTile];
      }

      // Update open ends
      if (newIs4WayActive) {
        newOpenEnds = {
          ...gameState.openEnds,
          [side]: newEndValue,
          [`${side}IsDouble`]: isDouble,
        };
      } else {
        newOpenEnds = {
          left: side === 'left' ? newEndValue : gameState.openEnds.left,
          right: side === 'right' ? newEndValue : gameState.openEnds.right,
          up: null,
          down: null,
          leftIsDouble: side === 'left' ? isDouble : gameState.openEnds.leftIsDouble,
          rightIsDouble: side === 'right' ? isDouble : gameState.openEnds.rightIsDouble,
          upIsDouble: false,
          downIsDouble: false,
        };
      }
    }

    // =================================================================
    // CHECK FOR LOCKED DOUBLE (ACTIVATE 4-WAY)
    // =================================================================
    if (!newIs4WayActive && newBoard.length > 0) {
      const lockedInfo = detectLockedDouble(newBoard, newLockedDouble);
      
      if (lockedInfo) {
        console.log(`🔒 DOUBLE LOCKED! [${lockedInfo.tile[0]}-${lockedInfo.tile[1]}] - ACTIVATING 4-WAY MODE!`);
        
        // Split board at the locked double
        const doubleIndex = newBoard.findIndex((p: PlayedTile) => 
          p.tile[0] === lockedInfo.tile[0] && p.tile[1] === lockedInfo.tile[1]
        );
        
        const splitResult = splitBoardAtDouble(newBoard, doubleIndex);
        
        newLeftChain = splitResult.leftChain;
        newRightChain = splitResult.rightChain;
        newLockedDouble = splitResult.double;
        newIs4WayActive = true;
        newUpChain = [];
        newDownChain = [];
        
        // ✅ CRITICAL: Clear the old board array since everything is now in chains
        newBoard = [];
        
        // Update open ends to include up/down
        const leftEndTile = newLeftChain.length > 0 ? newLeftChain[0].tile : null;
        const rightEndTile = newRightChain.length > 0 ? newRightChain[newRightChain.length - 1].tile : null;
        
        const leftEndValue = leftEndTile ? 
          (newLeftChain[0].flipped ? leftEndTile[1] : leftEndTile[0]) : 
          newLockedDouble[0];
        const rightEndValue = rightEndTile ?
          (newRightChain[newRightChain.length - 1].flipped ? rightEndTile[0] : rightEndTile[1]) :
          newLockedDouble[0];
        
        newOpenEnds = {
          left: leftEndValue,
          right: rightEndValue,
          up: newLockedDouble[0], // Double's value
          down: newLockedDouble[0], // Same value
          leftIsDouble: leftEndTile ? (leftEndTile[0] === leftEndTile[1]) : false,
          rightIsDouble: rightEndTile ? (rightEndTile[0] === rightEndTile[1]) : false,
          upIsDouble: false,
          downIsDouble: false,
        };
        
        console.log(`   📍 Open ends now: L=${newOpenEnds.left}, R=${newOpenEnds.right}, U=${newOpenEnds.up}, D=${newOpenEnds.down}`);
      }
    }

    // =================================================================
    // CALCULATE SCORE
    // =================================================================
    let score = 0;
    
    const isFirstTileOfGame = gameState.board.length === 0 && !gameState.is4WayActive;
    const isFirstGameOfMatch = gameState.gameIndex === 0;
    
    if (isFirstTileOfGame && !isFirstGameOfMatch) {
      // Starting tile scoring ([5-5] exception)
      const isStartingWith55 = tileArray[0] === 5 && tileArray[1] === 5;
      const starterMatchScore = gameState.matchScores[playerSeat] || 0;
      
      if (isStartingWith55 && starterMatchScore < 300) {
        score = 10;
        console.log(`✨ [5-5] starting tile scores 10 points!`);
      }
    } else if (newIs4WayActive) {
      // 4-WAY SCORING: Sum all 4 directions (only count up/down if they have tiles)
      score = calculate4WayScore(
        newOpenEnds.left,
        newOpenEnds.right,
        newOpenEnds.up,
        newOpenEnds.down,
        newOpenEnds.leftIsDouble || false,
        newOpenEnds.rightIsDouble || false,
        newOpenEnds.upIsDouble || false,
        newOpenEnds.downIsDouble || false,
        newUpChain.length,
        newDownChain.length
      );
      
      if (score > 0) {
        console.log(`🎯 4-WAY TELEFON! Score: ${score}`);
      }
    } else {
      // 2-WAY SCORING: Traditional left + right
      const leftValue = newOpenEnds.left || 0;
      const rightValue = newOpenEnds.right || 0;
      const leftScore = newOpenEnds.leftIsDouble ? leftValue * 2 : leftValue;
      const rightScore = newOpenEnds.rightIsDouble ? rightValue * 2 : rightValue;
      const openEndSum = leftScore + rightScore;
      score = calcOpenEndScore(openEndSum);
      
      if (score > 0) {
        console.log(`🎯 2-WAY TELEFON! Score: ${score}`);
      }
    }

    // =================================================================
    // UPDATE PLAYER'S HAND AND SCORES
    // =================================================================
    const newHand = removeTileFromHand(playerHand, tile as Tile);
    const newHands = { ...gameState.hands, [playerSeat]: newHand };

    let newGameScores = { ...gameState.gameScores };
    let newMatchScores = { ...gameState.matchScores };
    
    if (score > 0) {
      newGameScores[playerSeat] = (newGameScores[playerSeat] || 0) + score;
      newMatchScores[playerSeat] = (newMatchScores[playerSeat] || 0) + score;
    }

    // =================================================================
    // CHECK GAME FINISH
    // =================================================================
    let gameFinished = false;
    let matchFinished = false;
    let gameWinner: number | null = null;
    let matchWinner: number | null = null;

    if (newHand.length === 0) {
      gameFinished = true;
      gameWinner = playerSeat;
      
      const rawBonus = calculateBonusRoundedUp(newHands, playerSeat);
      const currentMatchScore = newMatchScores[playerSeat] || 0;
      const actualBonus = applyBonusWithCap(currentMatchScore, rawBonus);
      
      newGameScores[playerSeat] = (newGameScores[playerSeat] || 0) + actualBonus;
      newMatchScores[playerSeat] = currentMatchScore + actualBonus;

      console.log(`🎉 Game finished! Seat ${playerSeat} wins! Bonus: ${actualBonus}`);
      
      if (shouldEndMatch(newMatchScores)) {
        matchFinished = true;
        matchWinner = findMatchWinner(newMatchScores);
        console.log(`🏆 Match finished! Winner: Seat ${matchWinner}`);
      }
    }

    // =================================================================
    // UPDATE DATABASE
    // =================================================================
    const membersRef = collection(db, 'rooms', roomId, 'members');
    const membersSnap = await getDocs(membersRef);
    const playerCount = membersSnap.size;
    const nextTurn = gameFinished ? playerSeat : (playerSeat + 1) % playerCount;

    const updatedState = {
      board: serializeBoard(newBoard),
      leftChain: serializeBoard(newLeftChain),
      rightChain: serializeBoard(newRightChain),
      upChain: serializeBoard(newUpChain),
      downChain: serializeBoard(newDownChain),
      lockedDouble: newLockedDouble ? tileToString(newLockedDouble) : null,
      is4WayActive: newIs4WayActive,
      openEnds: newOpenEnds,
      hands: serializeHands(newHands),
      gameScores: newGameScores,
      matchScores: newMatchScores,
      lastScore: score,
      turn: nextTurn,
      finished: gameFinished,
      winnerSeat: gameWinner,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(stateRef, updatedState);

    // Log the move
    const movesRef = collection(db, 'moves');
    await addDoc(movesRef, {
      roomId,
      gameIndex: gameState.gameIndex || 0,
      seat: playerSeat,
      type: 'play',
      payload: { tile: tileToString(tile as Tile), side, score, locked4Way: !gameState.is4WayActive && newIs4WayActive },
      createdAt: serverTimestamp(),
    });

    // Update room if finished
    if (gameFinished) {
      const roomRef = doc(db, 'rooms', roomId);
      
      const roomUpdates: any = {
        lastGameWinner: gameWinner,
        matchScores: newMatchScores,
        updatedAt: serverTimestamp(),
      };
      
      if (matchFinished) {
        roomUpdates.status = 'finished';
        roomUpdates.matchWinner = matchWinner;
      } else {
        roomUpdates.currentGameIndex = (gameState.gameIndex || 0) + 1;
      }
      
      await updateDoc(roomRef, roomUpdates);
    }

    return NextResponse.json({
      success: true,
      score,
      gameFinished,
      matchFinished,
      gameWinner,
      matchWinner,
      matchScores: gameFinished ? newMatchScores : undefined,
      locked4Way: !gameState.is4WayActive && newIs4WayActive, // Signal to UI that 4-way activated
    });

  } catch (error: any) {
    console.error('Error in play-move:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
