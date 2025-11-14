'use client';

import { useEffect, useState } from 'react';
import { Tile, PlayedTile } from '@/types/game';
import { DominoTile } from './DominoTile';

interface DominoBoardProps {
  // 2-WAY MODE: Single board array
  board?: PlayedTile[];
  
  // 4-WAY MODE: Four separate chains
  leftChain?: PlayedTile[];
  rightChain?: PlayedTile[];
  upChain?: PlayedTile[];
  downChain?: PlayedTile[];
  lockedDouble?: Tile | null;
  is4WayActive?: boolean;
}

export function DominoBoard({
  board = [],
  leftChain = [],
  rightChain = [],
  upChain = [],
  downChain = [],
  lockedDouble = null,
  is4WayActive = false,
}: DominoBoardProps) {
  // Force re-render when props change
  const [renderKey, setRenderKey] = useState(0);
  
  useEffect(() => {
    setRenderKey(prev => prev + 1);
    console.log('🎨 DominoBoard props changed - forcing re-render', {
      is4WayActive,
      boardLen: board.length,
      leftLen: leftChain.length,
      rightLen: rightChain.length,
      upLen: upChain.length,
      downLen: downChain.length,
      lockedDouble,
    });
    
    // 🔍 DEEP DEBUG: Log actual arrays
    if (is4WayActive) {
      console.log('🔍 DominoBoard 4-WAY ARRAYS:', {
        leftChain,
        rightChain,
        upChain,
        downChain,
        lockedDouble,
      });
    }
  }, [is4WayActive, board, leftChain, rightChain, upChain, downChain, lockedDouble]);
  
  if (board.length === 0 && leftChain.length === 0 && rightChain.length === 0) {
    console.log('⚠️ DominoBoard: All arrays empty!', {
      is4WayActive,
      board,
      leftChain,
      rightChain,
      upChain,
      downChain,
      lockedDouble,
    });
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500 text-sm">No tiles played yet</p>
      </div>
    );
  }

  // 2-WAY MODE: Display horizontal snake pattern - CENTERED from start
  if (!is4WayActive) {
    console.log('📏 Rendering 2-WAY mode with', board.length, 'tiles');
    
    // The board array structure is: [...left tiles][first tile][...right tiles]
    // The first tile (center) is the one with the earliest timestamp (played when board was empty)
    // OR it's the tile at the position where left and right sides meet
    if (board.length === 0) {
      return (
        <div className="w-full min-h-[300px] sm:min-h-[400px] bg-gray-900/30 rounded-lg p-6 flex items-center justify-center">
          <p className="text-gray-500 text-sm">No tiles played yet</p>
        </div>
      );
    }
    
    // Find the center tile (first tile played - has earliest timestamp)
    const centerTile = board.reduce((earliest, current) => 
      current.timestamp < earliest.timestamp ? current : earliest
    );
    const centerIdx = board.findIndex(t => t === centerTile);
    
    // Split board: left side (before center), center, right side (after center)
    const leftSide = board.slice(0, centerIdx).reverse(); // Reverse to display right-to-left
    const rightSide = board.slice(centerIdx + 1);
    
    return (
      <div className="w-full min-h-[300px] sm:min-h-[400px] bg-gray-900/30 rounded-lg p-6 relative overflow-auto">
        {/* Centered container */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center gap-1">
            {/* LEFT SIDE - extends left from center */}
            {leftSide.length > 0 && (
              <div className="flex flex-row-reverse items-center gap-1">
                {leftSide.map((played, idx) => {
                  const displayTile: Tile = played.flipped 
                    ? [played.tile[1], played.tile[0]]
                    : played.tile;
                  return (
                    <div key={`left-${idx}`} className="flex-shrink-0">
                      <DominoTile 
                        tile={displayTile} 
                        size="sm"
                        orientation="auto"
                      />
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* CENTER TILE (first tile played) */}
            <div className="flex-shrink-0">
              <DominoTile 
                tile={centerTile.flipped 
                  ? [centerTile.tile[1], centerTile.tile[0]]
                  : centerTile.tile
                } 
                size="sm"
                orientation="auto"
              />
            </div>
            
            {/* RIGHT SIDE - extends right from center */}
            {rightSide.length > 0 && (
              <div className="flex items-center gap-1">
                {rightSide.map((played, idx) => {
                  const displayTile: Tile = played.flipped 
                    ? [played.tile[1], played.tile[0]]
                    : played.tile;
                  return (
                    <div key={`right-${idx}`} className="flex-shrink-0">
                      <DominoTile 
                        tile={displayTile} 
                        size="sm"
                        orientation="auto"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4-WAY MODE: Relative positioning layout - locked double at center
  console.log('🔀 Rendering 4-WAY mode - L:', leftChain.length, 'R:', rightChain.length, 'U:', upChain.length, 'D:', downChain.length);
  
  return (
    <div className="w-full min-h-[500px] bg-gray-900/30 rounded-lg p-6 relative overflow-auto">
      {/* Centered container with locked double as anchor point */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        
        {/* UP CHAIN - extends upward from locked double */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1">
          <div className="flex flex-col-reverse items-center gap-1">
            {upChain.map((played, idx) => {
              const displayTile: Tile = played.flipped 
                ? [played.tile[1], played.tile[0]]
                : played.tile;
              // Check if it's a double tile
              const isDouble = displayTile[0] === displayTile[1];
              return (
                <div key={`up-${idx}`} className="flex-shrink-0">
                  <DominoTile 
                    tile={displayTile} 
                    size="sm" 
                    orientation={isDouble ? "horizontal" : "vertical"} 
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* LEFT CHAIN - extends left from locked double */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-1">
          <div className="flex flex-row-reverse items-center gap-1">
            {leftChain.map((played, idx) => {
              const displayTile: Tile = played.flipped 
                ? [played.tile[1], played.tile[0]]
                : played.tile;
              return (
                <div key={`left-${idx}`} className="flex-shrink-0">
                  <DominoTile 
                    tile={displayTile} 
                    size="sm" 
                    orientation="auto" 
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* LOCKED DOUBLE - STAYS AT CENTER (0,0 position) */}
        {lockedDouble && (
          <div className="relative">
            <DominoTile 
              tile={lockedDouble} 
              size="sm" 
              orientation="vertical" 
            />
          </div>
        )}

        {/* RIGHT CHAIN - extends right from locked double */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-1">
          <div className="flex items-center gap-1">
            {rightChain.map((played, idx) => {
              const displayTile: Tile = played.flipped 
                ? [played.tile[1], played.tile[0]]
                : played.tile;
              return (
                <div key={`right-${idx}`} className="flex-shrink-0">
                  <DominoTile 
                    tile={displayTile} 
                    size="sm" 
                    orientation="auto" 
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* DOWN CHAIN - extends downward from locked double */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1">
          <div className="flex flex-col items-center gap-1">
            {downChain.map((played, idx) => {
              const displayTile: Tile = played.flipped 
                ? [played.tile[1], played.tile[0]]
                : played.tile;
              // Check if it's a double tile
              const isDouble = displayTile[0] === displayTile[1];
              return (
                <div key={`down-${idx}`} className="flex-shrink-0">
                  <DominoTile 
                    tile={displayTile} 
                    size="sm" 
                    orientation={isDouble ? "horizontal" : "vertical"} 
                  />
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
