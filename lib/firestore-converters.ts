// Firestore Converters - Handle nested arrays limitation
// Converts tiles between array format and string format for Firestore storage

import { Tile, PlayedTile } from '@/types/game';

// Convert tile array [a, b] to string "a-b"
export function tileToString(tile: Tile): string {
  return `${tile[0]}-${tile[1]}`;
}

// Convert string "a-b" to tile array [a, b]
export function stringToTile(str: string): Tile {
  const parts = str.split('-').map(Number);
  return [parts[0], parts[1]] as Tile;
}

// Convert array of tiles to array of strings
export function tilesToStrings(tiles: Tile[]): string[] {
  return tiles.map(tileToString);
}

// Convert array of strings to array of tiles
export function stringsToTiles(strings: string[]): Tile[] {
  return strings.map(stringToTile);
}

// Convert hands object for Firestore storage
export function serializeHands(hands: Record<number, Tile[]>): Record<number, string[]> {
  const serialized: Record<number, string[]> = {};
  Object.entries(hands).forEach(([seat, tiles]) => {
    serialized[parseInt(seat)] = tilesToStrings(tiles);
  });
  return serialized;
}

// Convert hands from Firestore format
export function deserializeHands(hands: Record<number, string[]>): Record<number, Tile[]> {
  const deserialized: Record<number, Tile[]> = {};
  Object.entries(hands).forEach(([seat, tiles]) => {
    deserialized[parseInt(seat)] = stringsToTiles(tiles);
  });
  return deserialized;
}

// Convert board for Firestore storage
export function serializeBoard(board: PlayedTile[]): any[] {
  return board.map(played => ({
    tile: tileToString(played.tile),
    placement: played.placement,
    timestamp: played.timestamp,
    flipped: played.flipped ?? false,
  }));
}

// Convert board from Firestore format
export function deserializeBoard(board: any[]): PlayedTile[] {
  return board.map(played => ({
    tile: stringToTile(played.tile),
    placement: played.placement,
    timestamp: played.timestamp,
    flipped: played.flipped ?? false,
  }));
}

// Serialize entire game state for Firestore
export function serializeGameState(state: any): any {
  return {
    ...state,
    board: serializeBoard(state.board || []),
    // 4-WAY: Serialize the 4 chains
    leftChain: serializeBoard(state.leftChain || []),
    rightChain: serializeBoard(state.rightChain || []),
    upChain: serializeBoard(state.upChain || []),
    downChain: serializeBoard(state.downChain || []),
    lockedDouble: state.lockedDouble ? tileToString(state.lockedDouble) : null,
    stock: tilesToStrings(state.stock || []),
    hands: serializeHands(state.hands || {}),
    startingTile: state.startingTile ? tileToString(state.startingTile) : null,
  };
}

// Deserialize game state from Firestore
export function deserializeGameState(state: any): any {
  return {
    ...state,
    board: deserializeBoard(state.board || []),
    // 4-WAY: Deserialize the 4 chains
    leftChain: deserializeBoard(state.leftChain || []),
    rightChain: deserializeBoard(state.rightChain || []),
    upChain: deserializeBoard(state.upChain || []),
    downChain: deserializeBoard(state.downChain || []),
    lockedDouble: state.lockedDouble ? stringToTile(state.lockedDouble) : null,
    is4WayActive: state.is4WayActive || false,
    stock: stringsToTiles(state.stock || []),
    hands: deserializeHands(state.hands || {}),
    startingTile: state.startingTile ? stringToTile(state.startingTile) : null,
    gameScores: state.gameScores || {},
    matchScores: state.matchScores || {},
    openEnds: {
      left: state.openEnds?.left ?? null,
      right: state.openEnds?.right ?? null,
      up: state.openEnds?.up ?? null,
      down: state.openEnds?.down ?? null,
      leftIsDouble: state.openEnds?.leftIsDouble ?? false,
      rightIsDouble: state.openEnds?.rightIsDouble ?? false,
      upIsDouble: state.openEnds?.upIsDouble ?? false,
      downIsDouble: state.openEnds?.downIsDouble ?? false,
    },
  };
}

