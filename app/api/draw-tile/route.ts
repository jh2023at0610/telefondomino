// API Route: /api/draw-tile
// Allows a player to draw a tile from the stock

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Tile } from '@/types/game';
import { hasValidMoves, hasValidMoves4Way } from '@/lib/domino-utils';
import { deserializeGameState, tilesToStrings, serializeHands, tileToString } from '@/lib/firestore-converters';

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

    // 4. Check if stock has tiles
    if (!gameState.stock || gameState.stock.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Stock is empty' },
        { status: 400 }
      );
    }

    // 4.5. Check if player has valid moves (can only draw if stuck)
    // 4-WAY: Check all 4 ends if active, otherwise check 2 ends
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
        { success: false, error: 'You must play a tile! You can only draw if you have no valid moves.' },
        { status: 400 }
      );
    }

    // 5. Draw tile from stock
    const drawnTile = gameState.stock[0];
    const newStock = gameState.stock.slice(1);

    // 6. Add tile to player's hand
    const newHand = [...(gameState.hands[playerSeat] || []), drawnTile];
    const newHands = { ...gameState.hands, [playerSeat]: newHand };

    // 7. Update game state (serialize for Firestore)
    await updateDoc(stateRef, {
      stock: tilesToStrings(newStock),
      hands: serializeHands(newHands),
      lastScore: 0,
      updatedAt: serverTimestamp(),
    });

    // 8. Log the move
    const movesRef = collection(db, 'moves');
    await addDoc(movesRef, {
      roomId,
      roundIndex: gameState.gameIndex || 0,
      seat: playerSeat,
      type: 'draw',
      payload: { tile: tileToString(drawnTile) },
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      tile: drawnTile,
      stockRemaining: newStock.length,
    });

  } catch (error: any) {
    console.error('Error in draw-tile:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

