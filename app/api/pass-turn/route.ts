// API Route: /api/pass-turn
// Allows a player to pass their turn when they cannot play

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { doc, getDoc, collection, getDocs, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Tile } from '@/types/game';
import {
  hasValidMoves,
  hasValidMoves4Way,
  isTableBlocked,
  isTableBlocked4Way,
  findBlockedWinner,
} from '@/lib/domino-utils';
import { 
  calculateBonusRoundedUp, 
  applyBonusWithCap,
  shouldEndMatch,
  findMatchWinner 
} from '@/lib/game-rules';
import { deserializeGameState } from '@/lib/firestore-converters';

export async function POST(request: NextRequest) {
  try {
    const { roomId, userId } = await request.json();

    if (!roomId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing roomId or userId' },
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

    // Deserialize game state
    const gameState = deserializeGameState(stateSnap.data()!);

    // 3. Verify it's the player's turn
    if (gameState.turn !== playerSeat) {
      return NextResponse.json(
        { success: false, error: 'Not your turn' },
        { status: 400 }
      );
    }

    // 4. Verify player has no valid moves (check 4 ends if 4-way active)
    const playerHand = gameState.hands[playerSeat] || [];
    let canPlay: boolean;
    
    if (gameState.is4WayActive) {
      // 4-WAY MODE: Check all 4 directions
      canPlay = hasValidMoves4Way(
        playerHand,
        gameState.openEnds.left,
        gameState.openEnds.right,
        gameState.openEnds.up,
        gameState.openEnds.down
      );
    } else {
      // 2-WAY MODE: Check left/right only
      canPlay = hasValidMoves(
        playerHand,
        gameState.openEnds.left,
        gameState.openEnds.right
      );
    }

    if (canPlay) {
      return NextResponse.json(
        { success: false, error: 'You have valid moves available' },
        { status: 400 }
      );
    }

    // 5. Get player count for turn calculation
    const membersRef = collection(db, 'rooms', roomId, 'members');
    const membersSnap = await getDocs(membersRef);
    const playerCount = membersSnap.size;

    // 6. Check if table is blocked (draw condition)
    // 4-WAY: Check all 4 ends if active
    const stockEmpty = !gameState.stock || gameState.stock.length === 0;
    let tableBlocked: boolean;
    
    if (gameState.is4WayActive) {
      // 4-WAY MODE: Check if all players blocked on all 4 directions
      tableBlocked = isTableBlocked4Way(
        gameState.hands,
        gameState.openEnds.left,
        gameState.openEnds.right,
        gameState.openEnds.up,
        gameState.openEnds.down,
        stockEmpty
      );
    } else {
      // 2-WAY MODE: Check left/right only
      tableBlocked = isTableBlocked(
        gameState.hands,
        gameState.openEnds.left,
        gameState.openEnds.right,
        stockEmpty
      );
    }

    let gameFinished = false;
    let matchFinished = false;
    let gameWinner: number | null = null;
    let matchWinner: number | null = null;
    let newGameScores = { ...gameState.gameScores };
    let newMatchScores = { ...gameState.matchScores };
    let bonusAwarded = 0;

    if (tableBlocked) {
      // BLOCKED GAME: Player with LOWEST pip count wins
      console.log('🚫 Table blocked! Finding winner with lowest pip count...');
      
      gameFinished = true;
      gameWinner = findBlockedWinner(gameState.hands);
      
      // Calculate bonus: sum of ALL other players' pips, rounded UP to nearest 5
      const rawBonus = calculateBonusRoundedUp(gameState.hands, gameWinner);
      const currentMatchScore = newMatchScores[gameWinner] || 0;
      const actualBonus = applyBonusWithCap(currentMatchScore, rawBonus);
      
      bonusAwarded = actualBonus;
      newGameScores[gameWinner] = (newGameScores[gameWinner] || 0) + actualBonus;
      newMatchScores[gameWinner] = currentMatchScore + actualBonus;
      
      console.log(`🏆 Blocked game winner: Seat ${gameWinner}`);
      console.log(`💰 Raw bonus: ${rawBonus}, Actual bonus (after cap): ${actualBonus}`);
      console.log(`📊 Match score: ${currentMatchScore} → ${newMatchScores[gameWinner]}`);

      // Check if match should end (365+ points)
      if (shouldEndMatch(newMatchScores)) {
        matchFinished = true;
        matchWinner = findMatchWinner(newMatchScores);
        console.log(`🎉 Match finished! Winner: Seat ${matchWinner}`);
      }
    }

    // 7. Determine next turn
    const nextTurn = gameFinished ? playerSeat : (playerSeat + 1) % playerCount;

    // 8. Update game state
    await updateDoc(stateRef, {
      turn: nextTurn,
      gameScores: newGameScores,
      matchScores: newMatchScores,
      lastScore: bonusAwarded,
      finished: gameFinished,
      winnerSeat: gameWinner,
      updatedAt: serverTimestamp(),
    });

    // 9. Log the move
    const movesRef = collection(db, 'moves');
    await addDoc(movesRef, {
      roomId,
      gameIndex: gameState.gameIndex || 0,
      seat: playerSeat,
      type: 'pass',
      payload: { tableBlocked, bonus: bonusAwarded },
      createdAt: serverTimestamp(),
    });

    // 10. Update room if game finished
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
      tableBlocked,
      gameFinished,
      matchFinished,
      gameWinner,
      matchWinner,
      bonusAwarded,
      matchScores: gameFinished ? newMatchScores : undefined,
    });

  } catch (error: any) {
    console.error('Error in pass-turn:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

