// Core game types for Telefon Domino

export type Tile = [number, number]; // [left, right] where each side is 0-6

export type PlayedTile = {
  tile: Tile;
  placement: 'left' | 'right' | 'up' | 'down'; // 4-WAY: Added up/down directions
  timestamp: number;
  flipped?: boolean; // Whether tile should be displayed flipped
};

export interface Player {
  id: string;
  nickname: string;
  seat: number;
  ready: boolean;
  connected: boolean;
}

export interface Room {
  id: string;
  code: string;
  status: 'lobby' | 'running' | 'finished';
  target_score: number;
  created_at: string;
}

export interface GameState {
  room_id: string;
  round_index: number;
  turn: number; // Current player seat (0-3)
  board: PlayedTile[]; // All tiles played on the board
  open_ends: { left: number; right: number }; // Current open ends
  stock: Tile[]; // Remaining tiles in "bazar"
  hands: Record<number, Tile[]>; // Per-seat tile arrays
  scores: Record<number, number>; // Per-seat score totals
  last_score: number; // Last points scored
  finished: boolean;
  updated_at: string;
}

// Sanitized state sent to clients (hides other players' hands)
export interface PublicState {
  players: number;
  // 4-WAY: Changed from single board to 4 chains
  leftChain: PlayedTile[];
  rightChain: PlayedTile[];
  upChain: PlayedTile[];
  downChain: PlayedTile[];
  lockedDouble: Tile | null; // The first double locked on both sides
  is4WayActive: boolean; // Whether 4-way play is active
  board: PlayedTile[]; // Keep for backward compatibility display
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
  myHand: Tile[];
  others: Array<{ seat: number; handCount: number }>;
  gameScores: Record<number, number>; // Points in current game
  matchScores: Record<number, number>; // Total match points
  lastScore: number;
  turn: number;
  gameIndex: number;
  finished: boolean;
  winnerSeat: number | null;
  stockCount: number;
}

export interface Move {
  id: number;
  room_id: string;
  round_index: number;
  seat: number;
  type: 'play' | 'draw' | 'pass';
  payload: any;
  created_at: string;
}

// Edge function request/response types
export interface StartGameRequest {
  room_id: string;
  user_id: string;
}

export interface PlayMoveRequest {
  room_id: string;
  user_id: string;
  tile: Tile;
  side: 'left' | 'right' | 'up' | 'down'; // 4-WAY: Added up/down
}

export interface DrawTileRequest {
  room_id: string;
  user_id: string;
}

export interface PassTurnRequest {
  room_id: string;
  user_id: string;
}

export interface GameResponse {
  success: boolean;
  error?: string;
  state?: PublicState;
  message?: string;
}



