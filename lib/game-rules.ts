// Telefon Domino Game Rules Implementation

import { Tile } from '@/types/game';
import { sumTileValues, findHighestDouble } from './domino-utils';

// Starting tile priority for FIRST game of match
const STARTING_TILE_PRIORITY: Tile[] = [
  [2, 3], // 1st priority
  [1, 1], // 2nd priority
  [2, 2], // 3rd priority
  [3, 3],
  [4, 4],
  [5, 5],
  [6, 6],
  [0, 0], // Last priority
];

/**
 * Find which player should start the FIRST game based on starting tile priority
 * Returns: { seat: number, tile: Tile }
 */
export function findFirstGameStarter(
  hands: Record<number, Tile[]>
): { seat: number; tile: Tile } {
  // Check priority tiles in order
  for (const priorityTile of STARTING_TILE_PRIORITY) {
    for (const [seat, hand] of Object.entries(hands)) {
      const hasTile = hand.some(
        (t) => t[0] === priorityTile[0] && t[1] === priorityTile[1]
      );
      if (hasTile) {
        return { seat: parseInt(seat), tile: priorityTile };
      }
    }
  }

  // Fallback: Find player with lowest point tile
  let lowestSeat = 0;
  let lowestTile: Tile = [6, 6];
  let lowestValue = 12;

  for (const [seat, hand] of Object.entries(hands)) {
    for (const tile of hand) {
      const value = tile[0] + tile[1];
      if (value < lowestValue) {
        lowestValue = value;
        lowestTile = tile;
        lowestSeat = parseInt(seat);
      }
    }
  }

  return { seat: lowestSeat, tile: lowestTile };
}

/**
 * Calculate bonus from remaining tiles (round UP to nearest 5)
 * Examples:
 * - 13 → 15
 * - 41 → 45
 * - 8 → 10
 * - 26 → 30
 */
export function calculateBonusRoundedUp(
  hands: Record<number, Tile[]>,
  winnerSeat: number
): number {
  let total = 0;

  // Sum all tiles from losing players
  Object.entries(hands).forEach(([seat, hand]) => {
    if (parseInt(seat) !== winnerSeat) {
      total += sumTileValues(hand);
    }
  });

  // Round UP to nearest multiple of 5
  return Math.ceil(total / 5) * 5;
}

/**
 * Apply bonus with 300-point cap
 * If winner >= 300: no bonus
 * If winner would exceed 300: cap at 300
 */
export function applyBonusWithCap(
  currentScore: number,
  bonus: number
): number {
  if (currentScore >= 300) {
    return 0; // No bonus if already at/above 300
  }

  const newScore = currentScore + bonus;
  if (newScore > 300) {
    return 300 - currentScore; // Cap at 300
  }

  return bonus; // Full bonus
}

/**
 * Check if starting tile should score points
 * Rules:
 * - First game: No starting tile scores (even [5-5])
 * - Subsequent games: Only [5-5] scores IF starter < 300 points
 */
export function shouldStartingTileScore(
  tile: Tile,
  isFirstGame: boolean,
  starterMatchScore: number
): boolean {
  // First game: no starting tile scores
  if (isFirstGame) {
    return false;
  }

  // Only [5-5] can score as starting tile
  if (tile[0] !== 5 || tile[1] !== 5) {
    return false;
  }

  // [5-5] scores only if starter has < 300 points
  return starterMatchScore < 300;
}

/**
 * Calculate score for starting tile
 * Returns 10 for [5-5] if rules allow, otherwise 0
 */
export function calculateStartingTileScore(
  tile: Tile,
  isFirstGame: boolean,
  starterMatchScore: number
): number {
  if (shouldStartingTileScore(tile, isFirstGame, starterMatchScore)) {
    return 10; // [5-5] scores 10 points
  }
  return 0;
}

/**
 * Check if match should end (any player >= 365)
 * But the current game continues to completion
 */
export function shouldEndMatch(matchScores: Record<number, number>): boolean {
  return Object.values(matchScores).some((score) => score >= 365);
}

/**
 * Find match winner (highest score after game ends)
 */
export function findMatchWinner(matchScores: Record<number, number>): number {
  let maxScore = -1;
  let winner = 0;

  Object.entries(matchScores).forEach(([seat, score]) => {
    if (score > maxScore) {
      maxScore = score;
      winner = parseInt(seat);
    }
  });

  return winner;
}



