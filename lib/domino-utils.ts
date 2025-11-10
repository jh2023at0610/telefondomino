import { Tile, PlayedTile } from '@/types/game';

// Generate all 28 domino tiles (0-0 to 6-6)
export function generateAllTiles(): Tile[] {
  const tiles: Tile[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      tiles.push([i, j]);
    }
  }
  return tiles;
}

// Shuffle array using Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Check if a tile can be played on the given end value
export function canPlayTile(tile: Tile, endValue: number): boolean {
  return tile[0] === endValue || tile[1] === endValue;
}

// Check if tile matches either open end
export function getValidPlacements(tile: Tile, leftEnd: number, rightEnd: number): ('left' | 'right')[] {
  const placements: ('left' | 'right')[] = [];
  if (canPlayTile(tile, leftEnd)) placements.push('left');
  if (canPlayTile(tile, rightEnd)) placements.push('right');
  return placements;
}

// Get the connecting value when placing a tile
export function getConnectingValue(tile: Tile, targetValue: number): number {
  if (tile[0] === targetValue) return tile[1];
  if (tile[1] === targetValue) return tile[0];
  throw new Error('Tile does not match target value');
}

// Calculate sum of open ends
export function calculateOpenEndSum(board: PlayedTile[]): number {
  if (board.length === 0) return 0;
  
  const leftEnd = board[0].tile[0];
  const rightEnd = board[board.length - 1].tile[1];
  
  return leftEnd + rightEnd;
}

// Check if sum is a multiple of 5 and return score
export function calculateScore(sum: number): number {
  return sum % 5 === 0 ? sum : 0;
}

// Sum the values of all tiles in a hand
export function sumTileValues(tiles: Tile[]): number {
  return tiles.reduce((sum, tile) => sum + tile[0] + tile[1], 0);
}

// Find the highest double in a hand
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

// Check if a tile exists in hand
export function hasTile(hand: Tile[], tile: Tile): boolean {
  return hand.some(t => t[0] === tile[0] && t[1] === tile[1]);
}

// Remove a tile from hand (returns new hand array)
export function removeTile(hand: Tile[], tile: Tile): Tile[] {
  const index = hand.findIndex(t => t[0] === tile[0] && t[1] === tile[1]);
  if (index === -1) return hand;
  return [...hand.slice(0, index), ...hand.slice(index + 1)];
}

// Alias for removeTile (used in API routes)
export function removeTileFromHand(hand: Tile[], tile: Tile): Tile[] {
  return removeTile(hand, tile);
}

// Check if player has any valid moves
export function hasValidMoves(hand: Tile[], leftEnd: number, rightEnd: number): boolean {
  return hand.some(tile => canPlayTile(tile, leftEnd) || canPlayTile(tile, rightEnd));
}

// Format tile for display (e.g., "3-5")
export function formatTile(tile: Tile): string {
  return `${tile[0]}-${tile[1]}`;
}

// Check if two tiles are equal
export function tilesEqual(a: Tile, b: Tile): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

// Check if table is blocked (no one can play)
export function isTableBlocked(
  hands: Record<number, Tile[]>,
  leftEnd: number | null,
  rightEnd: number | null,
  stockEmpty: boolean
): boolean {
  if (!stockEmpty) return false;
  if (leftEnd === null || rightEnd === null) return false;
  
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

// Calculate round bonus (sum of other players' tiles, rounded UP to nearest 5)
export function calculateRoundBonus(hands: Record<number, Tile[]>, winnerSeat: number, winnerScore: number): number {
  let total = 0;
  
  Object.entries(hands).forEach(([seat, hand]) => {
    if (parseInt(seat) !== winnerSeat) {
      total += sumTileValues(hand);
    }
  });
  
  // Round UP to nearest multiple of 5
  const bonus = Math.ceil(total / 5) * 5;
  
  // Apply 300-point cap
  if (winnerScore >= 300) {
    return 0; // No bonus after 300
  } else if (winnerScore + bonus > 300) {
    return 300 - winnerScore; // Cap at 300
  }
  
  return bonus;
}

// Find starting tile based on priority for first game
// Priority: [2-3] → [1-1] → [2-2] → [3-3] → [4-4] → [5-5] → [6-6] → [0-0] → lowest
export function findStartingTileForFirstGame(
  hands: Record<number, Tile[]>
): { seat: number; tile: Tile } | null {
  
  // Priority tiles in order
  const priorityTiles: Tile[] = [
    [2, 3],
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 5],
    [6, 6],
    [0, 0],
  ];
  
  // Check each priority tile
  for (const priorityTile of priorityTiles) {
    for (const [seat, hand] of Object.entries(hands)) {
      const tileIndex = hand.findIndex(t => 
        (t[0] === priorityTile[0] && t[1] === priorityTile[1]) ||
        (t[0] === priorityTile[1] && t[1] === priorityTile[0])
      );
      
      if (tileIndex !== -1) {
        return { seat: parseInt(seat), tile: hand[tileIndex] };
      }
    }
  }
  
  // If no priority tile found, find lowest point tile
  let lowestValue = Infinity;
  let lowestSeat = 0;
  let lowestTile: Tile | null = null;
  
  Object.entries(hands).forEach(([seat, hand]) => {
    hand.forEach(tile => {
      const value = tile[0] + tile[1];
      if (value < lowestValue) {
        lowestValue = value;
        lowestSeat = parseInt(seat);
        lowestTile = tile;
      }
    });
  });
  
  return lowestTile ? { seat: lowestSeat, tile: lowestTile } : null;
}

// ============================================================================
// 4-WAY DOMINO SYSTEM - New functions for 4-directional gameplay
// ============================================================================

/**
 * Check if a double tile is "locked" (has tiles on both left and right sides)
 * Returns the first locked double found, or null
 */
export function findLockedDouble(
  leftChain: PlayedTile[],
  rightChain: PlayedTile[],
  currentLockedDouble: Tile | null
): Tile | null {
  // If already have a locked double, don't look for more
  if (currentLockedDouble) return currentLockedDouble;
  
  // Check if any double exists in the left chain (which would be at the junction)
  // The last tile of leftChain connects to the locked double
  if (leftChain.length > 0 && rightChain.length > 0) {
    // Look through left chain for doubles
    for (const played of leftChain) {
      const tile = played.tile;
      if (tile[0] === tile[1]) {
        // This is a double, and both left and right chains exist
        // So it's locked!
        return tile;
      }
    }
    
    // Also check right chain
    for (const played of rightChain) {
      const tile = played.tile;
      if (tile[0] === tile[1]) {
        return tile;
      }
    }
  }
  
  return null;
}

/**
 * Detect when first double gets locked after a move
 * Scans the entire board array to find first double with tiles on both sides
 */
export function detectLockedDouble(
  board: PlayedTile[],
  currentLockedDouble: Tile | null
): { tile: Tile; leftIndex: number; rightIndex: number } | null {
  // If already have a locked double, don't check for more
  if (currentLockedDouble) return null;
  
  // Find first double in board
  for (let i = 0; i < board.length; i++) {
    const tile = board[i].tile;
    if (tile[0] === tile[1]) {
      // Check if tiles exist on both left and right of this double
      const hasLeft = i > 0;
      const hasRight = i < board.length - 1;
      
      if (hasLeft && hasRight) {
        return { tile, leftIndex: i - 1, rightIndex: i + 1 };
      }
    }
  }
  
  return null;
}

/**
 * Split board into left and right chains at the locked double position
 */
export function splitBoardAtDouble(
  board: PlayedTile[],
  doubleIndex: number
): { leftChain: PlayedTile[]; rightChain: PlayedTile[]; double: Tile } {
  const leftChain = board.slice(0, doubleIndex).reverse(); // Reverse so [0] is the end
  const double = board[doubleIndex].tile;
  const rightChain = board.slice(doubleIndex + 1);
  
  return { leftChain, rightChain, double };
}

/**
 * Get valid placements for a tile in 4-way mode
 */
export function getValidPlacements4Way(
  tile: Tile,
  leftEnd: number | null,
  rightEnd: number | null,
  upEnd: number | null,
  downEnd: number | null
): Array<'left' | 'right' | 'up' | 'down'> {
  const placements: Array<'left' | 'right' | 'up' | 'down'> = [];
  
  if (leftEnd !== null && canPlayTile(tile, leftEnd)) {
    placements.push('left');
  }
  if (rightEnd !== null && canPlayTile(tile, rightEnd)) {
    placements.push('right');
  }
  if (upEnd !== null && canPlayTile(tile, upEnd)) {
    placements.push('up');
  }
  if (downEnd !== null && canPlayTile(tile, downEnd)) {
    placements.push('down');
  }
  
  return placements;
}

/**
 * Check if player has valid moves in 4-way mode
 */
export function hasValidMoves4Way(
  hand: Tile[],
  leftEnd: number | null,
  rightEnd: number | null,
  upEnd: number | null,
  downEnd: number | null
): boolean {
  return hand.some(tile => {
    const placements = getValidPlacements4Way(tile, leftEnd, rightEnd, upEnd, downEnd);
    return placements.length > 0;
  });
}

/**
 * Calculate score from 4 open ends
 * Doubles count twice!
 * Only count up/down if they have tiles (Option B from user's answer)
 */
export function calculate4WayScore(
  leftValue: number | null,
  rightValue: number | null,
  upValue: number | null,
  downValue: number | null,
  leftIsDouble: boolean,
  rightIsDouble: boolean,
  upIsDouble: boolean,
  downIsDouble: boolean,
  upChainLength: number,
  downChainLength: number
): number {
  let sum = 0;
  
  // Left and right always count (if not null)
  if (leftValue !== null) {
    sum += leftIsDouble ? leftValue * 2 : leftValue;
  }
  if (rightValue !== null) {
    sum += rightIsDouble ? rightValue * 2 : rightValue;
  }
  
  // Up only counts if there's at least one tile in up chain
  if (upValue !== null && upChainLength > 0) {
    sum += upIsDouble ? upValue * 2 : upValue;
  }
  
  // Down only counts if there's at least one tile in down chain
  if (downValue !== null && downChainLength > 0) {
    sum += downIsDouble ? downValue * 2 : downValue;
  }
  
  return sum % 5 === 0 ? sum : 0;
}

/**
 * Check if table is blocked in 4-way mode
 */
export function isTableBlocked4Way(
  hands: Record<number, Tile[]>,
  leftEnd: number | null,
  rightEnd: number | null,
  upEnd: number | null,
  downEnd: number | null,
  stockEmpty: boolean
): boolean {
  if (!stockEmpty) return false;
  
  const allHands = Object.values(hands);
  return allHands.every(hand => !hasValidMoves4Way(hand, leftEnd, rightEnd, upEnd, downEnd));
}



