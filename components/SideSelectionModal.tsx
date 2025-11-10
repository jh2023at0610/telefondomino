'use client';

import { Tile } from '@/types/game';
import { DominoTile } from './DominoTile';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface SideSelectionModalProps {
  tile: Tile;
  validSides: Array<'left' | 'right' | 'up' | 'down'>; // 4-WAY: Support all 4 directions
  openEnds: {
    left: number | null;
    right: number | null;
    up: number | null;
    down: number | null;
  };
  onSelect: (side: 'left' | 'right' | 'up' | 'down') => void;
  onCancel: () => void;
}

export function SideSelectionModal({
  tile,
  validSides,
  openEnds,
  onSelect,
  onCancel,
}: SideSelectionModalProps) {
  // Configuration for each direction
  const directionConfig = {
    left: {
      icon: ArrowLeft,
      label: 'Left End',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    },
    right: {
      icon: ArrowRight,
      label: 'Right End',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    },
    up: {
      icon: ArrowUp,
      label: 'Up',
      color: 'green',
      gradient: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    },
    down: {
      icon: ArrowDown,
      label: 'Down',
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
    },
  };
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-lg w-full border border-gray-700 shadow-2xl">
        {/* Header */}
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          Choose Placement
        </h2>
        <p className="text-gray-400 text-center mb-6">
          This tile can be played on multiple ends. Where do you want to place it?
        </p>

        {/* Tile Preview */}
        <div className="flex justify-center mb-6">
          <DominoTile tile={tile} size="lg" orientation="vertical" />
        </div>

        {/* Direction Options - Dynamic grid based on number of options */}
        <div className={`grid ${validSides.length === 2 ? 'grid-cols-2' : validSides.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mb-4`}>
          {validSides.map((side) => {
            const config = directionConfig[side];
            const Icon = config.icon;
            const endValue = openEnds[side];

            return (
              <button
                key={side}
                onClick={() => onSelect(side)}
                className={`p-5 bg-gradient-to-br ${config.gradient} rounded-xl transition-all hover:scale-105 shadow-lg`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon className="w-7 h-7 text-white" />
                  <div className="text-white font-semibold text-base">{config.label}</div>
                  <div className={`text-${config.color}-100 text-xs`}>
                    Match: {endValue}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}



