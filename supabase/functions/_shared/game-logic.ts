// Shared game logic for Telefon Domino
// Used by all Edge Functions

export type Tile = [number, number];

export interface PlayedTile {
  tile: Tile;
  placement: 'left' | 'right';
  timestamp: number;
}

export interface GameState {
  room_id: string;
  round_index: number;
  turn: number;
  board: PlayedTile[];
  open_ends: { left: number | null; right: number | null };
  stock: Tile[];
  hands: Record<number, Tile[]>;
  scores: Record<number, number>;
  last_score: number;
  finished: boolean;
  winner_seat: number | null;
}

// Generate all 28 domino tiles
export function generateAllTiles(): Tile[] {
  const tiles: Tile[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      tiles.push([i, j]);
    }
  }
  return tiles;
}

// Shuffle array using Fisher-Yates
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Find highest double in tiles
export function findHighestDouble(tiles: Tile[]): { tile: Tile; index: number } | null {
  let highestDouble: Tile | null = null;
  let highestIndex = -1;
  
  tiles.forEach((tile, index) => {
    if (tile[0] === tile[1]) {
      if (highestDouble === null || tile[0] > highestDouble[0]) {
        highestDouble = tile;
        highestIndex = index;
      }
    }
  });
  
  return highestDouble ? { tile: highestDouble, index: highestIndex } : null;
}

// Check if tile matches a value
export function canPlayTile(tile: Tile, endValue: number): boolean {
  return tile[0] === endValue || tile[1] === endValue;
}

// Get the new end value when placing a tile
export function getNewEndValue(tile: Tile, matchingValue: number): number {
  if (tile[0] === matchingValue) return tile[1];
  if (tile[1] === matchingValue) return tile[0];
  throw new Error('Tile does not match the end value');
}

// Calculate score based on open ends
export function calculateScore(leftEnd: number | null, rightEnd: number | null): number {
  if (leftEnd === null || rightEnd === null) return 0;
  const sum = leftEnd + rightEnd;
  return sum % 5 === 0 ? sum : 0;
}

// Sum all tile values in a hand
export function sumTileValues(tiles: Tile[]): number {
  return tiles.reduce((sum, tile) => sum + tile[0] + tile[1], 0);
}

// Check if tile exists in hand
export function hasTile(hand: Tile[], tile: Tile): boolean {
  return hand.some(t => t[0] === tile[0] && t[1] === tile[1]);
}

// Remove tile from hand
export function removeTileFromHand(hand: Tile[], tile: Tile): Tile[] {
  const index = hand.findIndex(t => t[0] === tile[0] && t[1] === tile[1]);
  if (index === -1) return hand;
  return [...hand.slice(0, index), ...hand.slice(index + 1)];
}

// Check if player has valid moves
export function hasValidMoves(hand: Tile[], leftEnd: number | null, rightEnd: number | null): boolean {
  if (leftEnd === null || rightEnd === null) return false;
  return hand.some(tile => canPlayTile(tile, leftEnd) || canPlayTile(tile, rightEnd));
}

// Check if table is blocked (no one can play)
export function isTableBlocked(
  hands: Record<number, Tile[]>,
  leftEnd: number | null,
  rightEnd: number | null,
  stockEmpty: boolean
): boolean {
  if (!stockEmpty) return false;
  
  const allHands = Object.values(hands);
  return allHands.every(hand => !hasValidMoves(hand, leftEnd, rightEnd));
}

// Find winner when table is blocked (player with lowest tile sum)
export function findBlockedWinner(hands: Record<number, Tile[]>): number {
  let minSum = Infinity;
  let winner = 0;
  
  Object.entries(hands).forEach(([seat, hand]) => {
    if (hand.length > 0) {
      const sum = sumTileValues(hand);
      if (sum < minSum) {
        minSum = sum;
        winner = parseInt(seat);
      }
    }
  });
  
  return winner;
}

// Calculate round bonus (sum of other players' tiles, rounded down to nearest 5)
export function calculateRoundBonus(hands: Record<number, Tile[]>, winnerSeat: number): number {
  let total = 0;
  
  Object.entries(hands).forEach(([seat, hand]) => {
    if (parseInt(seat) !== winnerSeat) {
      total += sumTileValues(hand);
    }
  });
  
  // Round down to nearest multiple of 5
  return Math.floor(total / 5) * 5;
}

// Sanitize game state for client (hide other players' hands)
export function sanitizeStateForPlayer(state: GameState, playerSeat: number): any {
  const others: Array<{ seat: number; handCount: number }> = [];
  
  Object.entries(state.hands).forEach(([seat, hand]) => {
    const seatNum = parseInt(seat);
    if (seatNum !== playerSeat) {
      others.push({ seat: seatNum, handCount: hand.length });
    }
  });
  
  return {
    players: Object.keys(state.hands).length,
    board: state.board,
    openEnds: state.open_ends,
    myHand: state.hands[playerSeat] || [],
    others,
    scores: state.scores,
    lastScore: state.last_score,
    turn: state.turn,
    roundIndex: state.round_index,
    finished: state.finished,
    stockCount: state.stock.length,
    winnerSeat: state.winner_seat,
  };
}



