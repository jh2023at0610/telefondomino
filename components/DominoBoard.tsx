'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Tile, PlayedTile } from '@/types/game';
import { DominoTile } from './DominoTile';

// Tile dimensions for sm size
const TILE_WIDTH_H = 64; // w-16 = 64px (horizontal)
const TILE_HEIGHT_H = 32; // h-8 = 32px (horizontal)
const TILE_WIDTH_V = 32; // w-8 = 32px (vertical)
const TILE_HEIGHT_V = 64; // h-16 = 64px (vertical)
const GAP = 4; // gap-1 = 4px
const BOUNDARY_THRESHOLD = 0.5; // 0.5 tiles from edge

interface VisualTile {
  tile: PlayedTile;
  x: number; // X position from center
  y: number; // Y position from center
  direction: 'left' | 'right' | 'up' | 'down';
  wrapped: boolean; // Whether this tile wrapped
}

// Calculate visual wrapping for a chain
function calculateWrappedChain(
  chain: PlayedTile[],
  startDirection: 'left' | 'right' | 'up' | 'down',
  containerWidth: number,
  containerHeight: number,
  chainCounts: { up: number; down: number; left: number; right: number }
): VisualTile[] {
  if (chain.length === 0) return [];

  const visualTiles: VisualTile[] = [];
  let currentDirection = startDirection;
  let currentX = 0; // Relative to center (center is 0,0)
  let currentY = 0; // Relative to center (center is 0,0)

  // Calculate center and boundaries
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  chain.forEach((tile, idx) => {
    const isDouble = tile.tile[0] === tile.tile[1];
    const isVertical = (currentDirection === 'up' || currentDirection === 'down') && !isDouble;
    
    const tileW = isVertical ? TILE_WIDTH_V : TILE_WIDTH_H;
    const tileH = isVertical ? TILE_HEIGHT_V : TILE_HEIGHT_H;
    
    // Calculate next position from current position
    let nextX = currentX;
    let nextY = currentY;
    
    // For first tile, position it one tile away from center in the start direction
    if (idx === 0) {
      if (startDirection === 'left') {
        nextX = -(tileW / 2 + GAP);
      } else if (startDirection === 'right') {
        nextX = tileW / 2 + GAP;
      } else if (startDirection === 'up') {
        nextY = -(tileH / 2 + GAP);
      } else if (startDirection === 'down') {
        nextY = tileH / 2 + GAP;
      }
    } else {
      // For subsequent tiles, extend in current direction
      if (currentDirection === 'left') {
        nextX = currentX - tileW - GAP;
      } else if (currentDirection === 'right') {
        nextX = currentX + tileW + GAP;
      } else if (currentDirection === 'up') {
        nextY = currentY - tileH - GAP;
      } else if (currentDirection === 'down') {
        nextY = currentY + tileH + GAP;
      }
    }

    // Boundary check (0.5 tiles from edge)
    const bufferW = tileW * BOUNDARY_THRESHOLD;
    const bufferH = tileH * BOUNDARY_THRESHOLD;
    
    // Absolute positions from container edge (0,0 is top-left)
    const absX = centerX + nextX;
    const absY = centerY + nextY;
    
    const leftBound = bufferW;
    const rightBound = containerWidth - bufferW;
    const topBound = bufferH;
    const bottomBound = containerHeight - bufferH;

    let shouldWrap = false;
    
    // Check if next tile would exceed boundary
    if (currentDirection === 'left' && absX - tileW / 2 < leftBound) {
      shouldWrap = true;
    } else if (currentDirection === 'right' && absX + tileW / 2 > rightBound) {
      shouldWrap = true;
    } else if (currentDirection === 'up' && absY - tileH / 2 < topBound) {
      shouldWrap = true;
    } else if (currentDirection === 'down' && absY + tileH / 2 > bottomBound) {
      shouldWrap = true;
    }

    if (shouldWrap && idx > 0) { // Don't wrap first tile
      // Wrap to perpendicular direction
      let perpendicularDirs: Array<'up' | 'down' | 'left' | 'right'>;
      
      if (currentDirection === 'left' || currentDirection === 'right') {
        perpendicularDirs = ['up', 'down'];
      } else {
        perpendicularDirs = ['left', 'right'];
      }

      // Choose direction with fewer tiles (exclude current chain)
      let chosenDir: 'up' | 'down' | 'left' | 'right';
      
      if (perpendicularDirs.includes('up') && perpendicularDirs.includes('down')) {
        // Compare up vs down
        const upCount = startDirection === 'up' ? chainCounts.up : chainCounts.up;
        const downCount = startDirection === 'down' ? chainCounts.down : chainCounts.down;
        
        if (upCount < downCount) {
          chosenDir = 'up';
        } else if (downCount < upCount) {
          chosenDir = 'down';
        } else {
          // Equal - choose based on available space
          const spaceUp = absY - topBound;
          const spaceDown = bottomBound - absY;
          chosenDir = spaceUp >= spaceDown ? 'up' : 'down';
        }
      } else {
        // Compare left vs right
        const leftCount = startDirection === 'left' ? chainCounts.left : chainCounts.left;
        const rightCount = startDirection === 'right' ? chainCounts.right : chainCounts.right;
        
        if (leftCount < rightCount) {
          chosenDir = 'left';
        } else if (rightCount < leftCount) {
          chosenDir = 'right';
        } else {
          // Equal - choose based on available space
          const spaceLeft = absX - leftBound;
          const spaceRight = rightBound - absX;
          chosenDir = spaceLeft >= spaceRight ? 'left' : 'right';
        }
      }

      // Update direction and adjust position
      currentDirection = chosenDir;
      
      // Place tile at current position, then extend in new direction for next tile
      // Keep same position, just change direction
      nextX = currentX;
      nextY = currentY;
    }

    visualTiles.push({
      tile,
      x: nextX,
      y: nextY,
      direction: currentDirection,
      wrapped: shouldWrap && idx > 0,
    });

    // Update position for next tile
    if (!shouldWrap || idx === 0) {
      currentX = nextX;
      currentY = nextY;
    } else {
      // After wrapping, position for next tile in new direction
      const isVertical = (currentDirection === 'up' || currentDirection === 'down') && !isDouble;
      const nextTileW = isVertical ? TILE_WIDTH_V : TILE_WIDTH_H;
      const nextTileH = isVertical ? TILE_HEIGHT_V : TILE_HEIGHT_H;
      
      if (currentDirection === 'left') {
        currentX = nextX - nextTileW - GAP;
        currentY = nextY;
      } else if (currentDirection === 'right') {
        currentX = nextX + nextTileW + GAP;
        currentY = nextY;
      } else if (currentDirection === 'up') {
        currentY = nextY - nextTileH - GAP;
        currentX = nextX;
      } else {
        currentY = nextY + nextTileH + GAP;
        currentX = nextX;
      }
    }
  });

  return visualTiles;
}

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
  const boardRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [renderKey, setRenderKey] = useState(0);

  // Measure container size for wrapping calculations
  useEffect(() => {
    const updateSize = () => {
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    // Use ResizeObserver for more accurate size tracking
    let resizeObserver: ResizeObserver | null = null;
    if (boardRef.current) {
      resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(boardRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      if (resizeObserver && boardRef.current) {
        resizeObserver.unobserve(boardRef.current);
      }
    };
  }, [is4WayActive]);
  
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
      containerSize,
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
  }, [is4WayActive, board, leftChain, rightChain, upChain, downChain, lockedDouble, containerSize]);
  
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
    // Note: Tiles played on LEFT are prepended (earlier indices), so they come BEFORE center
    // Tiles played on RIGHT are appended (later indices), so they come AFTER center
    // Left tiles are in reverse chronological order (newest first), so we reverse to display correctly
    const leftSide = board.slice(0, centerIdx).reverse(); // Reverse to show oldest-to-newest (closest-to-furthest from center)
    const rightSide = board.slice(centerIdx + 1); // Already in chronological order (oldest-to-newest)
    
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

  // Calculate wrapped chains for 4-way mode
  const wrappedChains = useMemo(() => {
    if (!is4WayActive) return null;

    const chainCounts = {
      up: upChain.length,
      down: downChain.length,
      left: leftChain.length,
      right: rightChain.length,
    };

    return {
      left: calculateWrappedChain(leftChain, 'left', containerSize.width, containerSize.height, chainCounts),
      right: calculateWrappedChain(rightChain, 'right', containerSize.width, containerSize.height, chainCounts),
      up: calculateWrappedChain(upChain, 'up', containerSize.width, containerSize.height, chainCounts),
      down: calculateWrappedChain(downChain, 'down', containerSize.width, containerSize.height, chainCounts),
    };
  }, [is4WayActive, leftChain, rightChain, upChain, downChain, containerSize]);

  // 4-WAY MODE: Visual wrapping layout - locked double at center
  console.log('🔀 Rendering 4-WAY mode - L:', leftChain.length, 'R:', rightChain.length, 'U:', upChain.length, 'D:', downChain.length);
  
  return (
    <div 
      ref={boardRef}
      className="w-full min-h-[500px] bg-gray-900/30 rounded-lg p-6 relative overflow-hidden"
    >
      {/* Centered container with locked double as anchor point */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* LOCKED DOUBLE - STAYS AT CENTER */}
        {lockedDouble && (
          <div className="relative">
            <DominoTile 
              tile={lockedDouble} 
              size="sm" 
              orientation="vertical" 
            />
          </div>
        )}

        {/* Render wrapped chains using absolute positioning */}
        {wrappedChains && (
          <>
            {/* LEFT CHAIN */}
            {wrappedChains.left.map((visualTile, idx) => {
              const displayTile: Tile = visualTile.tile.flipped 
                ? [visualTile.tile.tile[1], visualTile.tile.tile[0]]
                : visualTile.tile.tile;
              const isDouble = displayTile[0] === displayTile[1];
              const isVertical = (visualTile.direction === 'up' || visualTile.direction === 'down') && !isDouble;
              
              // Convert center-relative to absolute position
              const absX = containerSize.width / 2 + visualTile.x;
              const absY = containerSize.height / 2 + visualTile.y;
              
              return (
                <div
                  key={`left-${idx}`}
                  className="absolute flex-shrink-0"
                  style={{
                    left: `${absX}px`,
                    top: `${absY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <DominoTile 
                    tile={displayTile} 
                    size="sm" 
                    orientation={isDouble && (visualTile.direction === 'up' || visualTile.direction === 'down') ? "horizontal" : isVertical ? "vertical" : "auto"} 
                  />
                </div>
              );
            })}

            {/* RIGHT CHAIN */}
            {wrappedChains.right.map((visualTile, idx) => {
              const displayTile: Tile = visualTile.tile.flipped 
                ? [visualTile.tile.tile[1], visualTile.tile.tile[0]]
                : visualTile.tile.tile;
              const isDouble = displayTile[0] === displayTile[1];
              const isVertical = (visualTile.direction === 'up' || visualTile.direction === 'down') && !isDouble;
              
              // Convert center-relative to absolute position
              const absX = containerSize.width / 2 + visualTile.x;
              const absY = containerSize.height / 2 + visualTile.y;
              
              return (
                <div
                  key={`right-${idx}`}
                  className="absolute flex-shrink-0"
                  style={{
                    left: `${absX}px`,
                    top: `${absY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <DominoTile 
                    tile={displayTile} 
                    size="sm" 
                    orientation={isDouble && (visualTile.direction === 'up' || visualTile.direction === 'down') ? "horizontal" : isVertical ? "vertical" : "auto"} 
                  />
                </div>
              );
            })}

            {/* UP CHAIN */}
            {wrappedChains.up.map((visualTile, idx) => {
              const displayTile: Tile = visualTile.tile.flipped 
                ? [visualTile.tile.tile[1], visualTile.tile.tile[0]]
                : visualTile.tile.tile;
              const isDouble = displayTile[0] === displayTile[1];
              const isVertical = (visualTile.direction === 'up' || visualTile.direction === 'down') && !isDouble;
              
              // Convert center-relative to absolute position
              const absX = containerSize.width / 2 + visualTile.x;
              const absY = containerSize.height / 2 + visualTile.y;
              
              return (
                <div
                  key={`up-${idx}`}
                  className="absolute flex-shrink-0"
                  style={{
                    left: `${absX}px`,
                    top: `${absY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <DominoTile 
                    tile={displayTile} 
                    size="sm" 
                    orientation={isDouble && (visualTile.direction === 'up' || visualTile.direction === 'down') ? "horizontal" : isVertical ? "vertical" : "horizontal"} 
                  />
                </div>
              );
            })}

            {/* DOWN CHAIN */}
            {wrappedChains.down.map((visualTile, idx) => {
              const displayTile: Tile = visualTile.tile.flipped 
                ? [visualTile.tile.tile[1], visualTile.tile.tile[0]]
                : visualTile.tile.tile;
              const isDouble = displayTile[0] === displayTile[1];
              const isVertical = (visualTile.direction === 'up' || visualTile.direction === 'down') && !isDouble;
              
              // Convert center-relative to absolute position
              const absX = containerSize.width / 2 + visualTile.x;
              const absY = containerSize.height / 2 + visualTile.y;
              
              return (
                <div
                  key={`down-${idx}`}
                  className="absolute flex-shrink-0"
                  style={{
                    left: `${absX}px`,
                    top: `${absY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <DominoTile 
                    tile={displayTile} 
                    size="sm" 
                    orientation={isDouble && (visualTile.direction === 'up' || visualTile.direction === 'down') ? "horizontal" : isVertical ? "vertical" : "horizontal"} 
                  />
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
