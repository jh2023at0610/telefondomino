// API Route: /api/start-game
// Initializes a new game in the match (first or subsequent)

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Tile, PlayedTile } from '@/types/game';
import {
  generateAllTiles,
  shuffleArray,
  removeTileFromHand,
} from '@/lib/domino-utils';
import { serializeGameState, tileToString } from '@/lib/firestore-converters';
import { 
  findFirstGameStarter,
  calculateStartingTileScore 
} from '@/lib/game-rules';

export async function POST(request: NextRequest) {
  try {
    const { roomId, userId, chosenStartingTile } = await request.json();

    if (!roomId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing roomId or userId' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // 1. Get room info
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    const room = roomSnap.data()!;
    
    // Check if this is first game or subsequent game
    const isFirstGame = (room.currentGameIndex || 0) === 0;
    const gameIndex = room.currentGameIndex || 0;

    // 2. Get all players
    const membersRef = collection(db, 'rooms', roomId, 'members');
    const membersQuery = query(membersRef, orderBy('seat'));
    const membersSnap = await getDocs(membersQuery);
    const members = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (members.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Need at least 2 players' },
        { status: 400 }
      );
    }

    // 3. Check all players are ready (only for first game)
    if (isFirstGame && room.status === 'lobby') {
      const allReady = members.every((m: any) => m.ready);
      if (!allReady) {
        return NextResponse.json(
          { success: false, error: 'Not all players are ready' },
          { status: 400 }
        );
      }
    }

    const playerCount = members.length;

    // 4. Generate and shuffle all tiles
    const allTiles = generateAllTiles();
    const shuffled = shuffleArray(allTiles);

    // 5. Distribute tiles
    const tilesPerPlayer = playerCount === 2 ? 7 : 5;
    const hands: Record<number, Tile[]> = {};
    let tileIndex = 0;

    members.forEach((member: any) => {
      const seat = member.seat ?? member.data?.seat;
      if (seat !== undefined && seat !== null) {
        hands[seat] = shuffled.slice(tileIndex, tileIndex + tilesPerPlayer);
        tileIndex += tilesPerPlayer;
      }
    });

    const stock = shuffled.slice(tileIndex);

    // 6. Determine starting player and tile
    let startingSeat: number;
    let priorityTile: Tile | null = null;
    
    if (isFirstGame) {
      // FIRST GAME: Use priority system ([2-3] → [1-1] → [2-2] → etc.)
      const startInfo = findFirstGameStarter(hands);
      startingSeat = startInfo.seat;
      priorityTile = startInfo.tile;
      
      console.log(`🎲 First game - Seat ${startingSeat} has priority tile [${startInfo.tile[0]}-${startInfo.tile[1]}]`);
    } else {
      // SUBSEQUENT GAMES: Last winner starts (will pick tile manually)
      startingSeat = room.lastGameWinner ?? 0;
      console.log(`🎯 Subsequent game - Seat ${startingSeat} (last winner) will choose starting tile`);
    }

    // 7. Initialize board and open ends
    let board: PlayedTile[] = [];
    let openEnds: any = { left: null, right: null, leftIsDouble: false, rightIsDouble: false };
    let startingTileScore = 0;
    
    if (isFirstGame && priorityTile) {
      // FIRST GAME: Auto-play the PRIORITY tile (not just first tile in hand)
      const firstTile = priorityTile;
      hands[startingSeat] = removeTileFromHand(hands[startingSeat], firstTile);
      
      board = [{
        tile: firstTile,
        placement: 'left',
        timestamp: Date.now(),
        flipped: false,
      }];
      
      const isFirstTileDouble = firstTile[0] === firstTile[1];
      openEnds = {
        left: firstTile[0],
        right: firstTile[1],
        leftIsDouble: isFirstTileDouble,
        rightIsDouble: isFirstTileDouble,
      };
      
      console.log(`🎲 First game auto-started with [${firstTile[0]}-${firstTile[1]}]`);
    } else {
      // SUBSEQUENT GAMES: No auto-play - winner will pick manually on their turn
      // Board stays empty, openEnds stay null
      console.log(`🎯 Game ${gameIndex} ready - Seat ${startingSeat}'s turn to pick starting tile`);
    }

    // 8. Initialize scores
    const matchScores = room.matchScores || {};
    
    members.forEach((member: any) => {
      const seat = member.seat ?? member.data?.seat;
      if (seat !== undefined && matchScores[seat] === undefined) {
        matchScores[seat] = 0;
      }
    });

    const gameScores: Record<number, number> = {};
    members.forEach((member: any) => {
      const seat = member.seat ?? member.data?.seat;
      if (seat !== undefined) {
        gameScores[seat] = 0;
      }
    });

    // 10. Create game state (WITH 4-WAY SUPPORT)
    const gameState = {
      roomId,
      gameIndex,
      turn: isFirstGame ? (startingSeat + 1) % playerCount : startingSeat, // Subsequent games: winner's turn first
      // 2-WAY: Standard board (used initially)
      board,
      // 4-WAY: Initialize empty chains (activated when first double is locked)
      leftChain: [],
      rightChain: [],
      upChain: [],
      downChain: [],
      lockedDouble: null, // No locked double yet
      is4WayActive: false, // Starts in 2-way mode
      openEnds,
      stock,
      hands,
      gameScores,
      matchScores,
      lastScore: startingTileScore,
      finished: false,
      winnerSeat: null,
      startingTile: isFirstGame ? board[0]?.tile : null,
      startingSeat,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 11. Save game state
    const gameStateRef = doc(db, 'game_states', roomId);
    const serializedState = serializeGameState(gameState);
    await setDoc(gameStateRef, serializedState);

    // 12. Update room
    await updateDoc(roomRef, {
      status: 'running',
      currentGameIndex: gameIndex,
      matchScores: matchScores,
      updatedAt: serverTimestamp(),
    });

    // 13. Log the initial move (only for first game)
    if (isFirstGame && board.length > 0) {
      const firstTile = board[0].tile;
      const movesRef = collection(db, 'moves');
      await addDoc(movesRef, {
        roomId,
        roundIndex: gameIndex,
        seat: startingSeat,
        type: 'play',
        payload: { tile: tileToString(firstTile), placement: 'left', score: startingTileScore },
        createdAt: serverTimestamp(),
      });
    }

    const starterMember = members.find((m: any) => m.seat === startingSeat) as any;
    
    return NextResponse.json({
      success: true,
      message: isFirstGame ? 'Match started!' : `Game ${gameIndex + 1} ready - ${starterMember?.nickname || 'Winner'}'s turn to start!`,
      startingSeat,
      gameIndex,
      isFirstGame,
    });

  } catch (error: any) {
    console.error('Error in start-game:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
