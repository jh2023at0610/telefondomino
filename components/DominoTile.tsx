'use client';

import { Tile } from '@/types/game';

interface DominoTileProps {
  tile: Tile;
  onClick?: () => void;
  disabled?: boolean;
  highlighted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical' | 'auto'; // New prop for orientation
}

export function DominoTile({ 
  tile, 
  onClick, 
  disabled, 
  highlighted, 
  size = 'md',
  orientation = 'auto' 
}: DominoTileProps) {
  // Determine if tile is a double
  const isDouble = tile[0] === tile[1];
  
  // Auto-orientation: doubles are vertical, others horizontal
  const isVertical = orientation === 'vertical' || (orientation === 'auto' && isDouble);
  
  // Size classes based on orientation - RESPONSIVE for mobile
  const sizeClasses = {
    // Board tiles - smaller, more compact
    sm: isVertical ? 'w-7 h-14 sm:w-8 sm:h-16' : 'w-14 h-7 sm:w-16 sm:h-8',
    // Hand tiles - larger on mobile for better touch targets
    md: isVertical ? 'w-14 h-28 sm:w-12 sm:h-24 md:w-14 md:h-28' : 'w-28 h-14 sm:w-24 sm:h-12 md:w-28 md:h-14',
    // Selection/Modal tiles - nice and big
    lg: isVertical ? 'w-16 h-32 sm:w-18 sm:h-36' : 'w-32 h-16 sm:w-36 sm:h-18',
  };

  const dotSizes = {
    sm: 'w-1 h-1 sm:w-1.5 sm:h-1.5',        // Responsive dots
    md: 'w-1.5 h-1.5 sm:w-2 sm:h-2',        // Bigger on mobile
    lg: 'w-2 h-2 sm:w-2.5 sm:h-2.5',        // Even bigger
  };

  const renderDots = (value: number) => {
    const positions: { [key: number]: string[] } = {
      0: [],
      1: ['center'],
      2: ['top-left', 'bottom-right'],
      3: ['top-left', 'center', 'bottom-right'],
      4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
      6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
    };

    const dots = positions[value] || [];

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {dots.map((pos, idx) => {
          let positionClass = '';
          
          switch (pos) {
            case 'top-left':
              positionClass = 'top-1 left-1';
              break;
            case 'top-right':
              positionClass = 'top-1 right-1';
              break;
            case 'middle-left':
              positionClass = 'top-1/2 -translate-y-1/2 left-1';
              break;
            case 'middle-right':
              positionClass = 'top-1/2 -translate-y-1/2 right-1';
              break;
            case 'center':
              positionClass = 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
              break;
            case 'bottom-left':
              positionClass = 'bottom-1 left-1';
              break;
            case 'bottom-right':
              positionClass = 'bottom-1 right-1';
              break;
          }

          return (
            <div
              key={idx}
              className={`absolute ${positionClass} ${dotSizes[size]} bg-gray-900 rounded-full`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`
        ${sizeClasses[size]}
        relative
        bg-gradient-to-br from-gray-100 to-gray-200
        rounded-lg
        shadow-lg
        border-2
        transition-all
        duration-200
        ${onClick && !disabled ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : 'cursor-default'}
        ${highlighted ? 'border-blue-400 ring-2 ring-blue-400/50' : 'border-gray-300'}
        ${disabled ? 'opacity-50' : ''}
        flex
        ${isVertical ? 'flex-col' : 'flex-row'}
      `}
    >
      {/* First half (top for vertical, left for horizontal) */}
      <div className={`${isVertical ? 'h-1/2 border-b' : 'w-1/2 border-r'} border-gray-400 p-1`}>
        {renderDots(tile[0])}
      </div>
      
      {/* Second half (bottom for vertical, right for horizontal) */}
      <div className={`${isVertical ? 'h-1/2' : 'w-1/2'} p-1`}>
        {renderDots(tile[1])}
      </div>
    </button>
  );
}



