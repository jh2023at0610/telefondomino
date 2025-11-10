'use client';

import { Tile } from '@/types/game';
import { DominoTile } from './DominoTile';
import { Play } from 'lucide-react';

interface StartingTileSelectorProps {
  myHand: Tile[];
  onSelectTile: (tile: Tile) => void;
  gameIndex: number;
}

export function StartingTileSelector({
  myHand,
  onSelectTile,
  gameIndex,
}: StartingTileSelectorProps) {
  console.log('StartingTileSelector rendered! Hand:', myHand, 'GameIndex:', gameIndex);
  
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-4xl w-full border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <Play className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">
            You Start Game {gameIndex + 1}!
          </h2>
          <p className="text-gray-400">
            Choose any tile from your hand to start the next game
          </p>
        </div>

        {/* Tile Selection */}
        <div className="bg-gray-900/50 rounded-xl p-6 mb-4">
          <p className="text-sm text-gray-400 mb-4 text-center">
            Click a tile to start the game with it:
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {myHand.map((tile, idx) => (
              <button
                key={idx}
                onClick={() => onSelectTile(tile)}
                className="transform transition-all hover:scale-110 hover:shadow-2xl"
              >
                <DominoTile
                  tile={tile}
                  size="lg"
                  orientation="vertical"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Hint */}
        <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 text-center">
          <p className="text-blue-300 text-sm">
            💡 Tip: Starting with [5-5] scores 10 points if you have less than 300 match points!
          </p>
        </div>
      </div>
    </div>
  );
}

