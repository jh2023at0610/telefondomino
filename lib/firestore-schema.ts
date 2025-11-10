// Firestore Database Schema for Telefon Domino
// Defines the structure of our NoSQL collections

import { Timestamp, serverTimestamp as firestoreServerTimestamp } from 'firebase/firestore';
import { Tile, PlayedTile } from '@/types/game';

// ============================================
// COLLECTION: rooms
// ============================================
export interface Room {
  id: string; // Document ID (same as code)
  code: string; // 6-char room code (e.g., "ABC123")
  status: 'lobby' | 'running' | 'finished';
  targetScore: number; // Match target (365)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Match tracking
  currentGameIndex: number; // Current game number (0, 1, 2...)
  lastGameWinner: number | null; // Seat of last game winner (starts next game)
  matchScores: Record<number, number>; // Total match scores per seat
}

// ============================================
// SUBCOLLECTION: rooms/{roomId}/members
// ============================================
export interface RoomMember {
  id: string; // Document ID (user's UUID)
  userId: string; // Player UUID
  nickname: string;
  seat: number; // 0-3
  ready: boolean;
  connected: boolean;
  joinedAt: Timestamp;
  lastSeen: Timestamp;
}

// ============================================
// COLLECTION: game_states
// ============================================
export interface GameState {
  id: string; // Document ID (same as roomId)
  roomId: string;
  gameIndex: number; // Which game in the match (0 = first game)
  turn: number; // Current player seat (0-3)
  
  // 4-WAY SYSTEM: Replaced single board with 4 chains
  board: PlayedTile[]; // Keep for backward compat during transition
  leftChain: PlayedTile[]; // Tiles going left from locked double
  rightChain: PlayedTile[]; // Tiles going right from locked double
  upChain: PlayedTile[]; // Tiles going up from locked double
  downChain: PlayedTile[]; // Tiles going down from locked double
  lockedDouble: Tile | null; // The first double locked on both sides
  is4WayActive: boolean; // Whether 4-way play is currently active
  
  openEnds: {
    left: number | null;
    right: number | null;
    up: number | null; // 4-WAY: Added
    down: number | null; // 4-WAY: Added
    leftIsDouble?: boolean;
    rightIsDouble?: boolean;
    upIsDouble?: boolean; // 4-WAY: Added
    downIsDouble?: boolean; // 4-WAY: Added
  };
  stock: Tile[]; // Remaining tiles in "bazar"
  hands: Record<number, Tile[]>; // Per-seat tile arrays
  gameScores: Record<number, number>; // Scores in THIS game only
  matchScores: Record<number, number>; // Total match scores
  lastScore: number; // Last points scored
  finished: boolean; // This game finished
  winnerSeat: number | null;
  startingTile: Tile | null; // The first tile played (for scoring rules)
  startingSeat: number; // Who started this game
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// COLLECTION: moves
// ============================================
export interface Move {
  id: string; // Auto-generated document ID
  roomId: string;
  roundIndex: number;
  seat: number;
  type: 'play' | 'draw' | 'pass';
  payload: Record<string, any>; // Flexible payload
  createdAt: Timestamp;
}

// ============================================
// FIRESTORE PATHS (for reference)
// ============================================
export const COLLECTIONS = {
  ROOMS: 'rooms',
  MEMBERS: 'members', // subcollection
  GAME_STATES: 'game_states',
  MOVES: 'moves',
} as const;

// Helper type for creating documents without id
export type CreateRoom = Omit<Room, 'id'>;
export type CreateMember = Omit<RoomMember, 'id'>;
export type CreateGameState = Omit<GameState, 'id'>;
export type CreateMove = Omit<Move, 'id'>;

// ============================================
// FIRESTORE UTILITIES
// ============================================

// Convert Firestore Timestamp to Date
export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

// Get server timestamp (for created/updated fields)
export function serverTimestamp() {
  return firestoreServerTimestamp();
}

// Sanitize game state for client (hide other players' hands)
export function sanitizeGameState(
  gameState: GameState,
  playerSeat: number
): {
  myHand: Tile[];
  others: Array<{ seat: number; handCount: number }>;
} & Omit<GameState, 'hands'> {
  const others: Array<{ seat: number; handCount: number }> = [];
  
  Object.entries(gameState.hands).forEach(([seat, hand]) => {
    const seatNum = parseInt(seat);
    if (seatNum !== playerSeat) {
      others.push({ seat: seatNum, handCount: hand.length });
    }
  });

  const { hands, ...restState } = gameState;

  return {
    ...restState,
    myHand: gameState.hands[playerSeat] || [],
    others,
  };
}

