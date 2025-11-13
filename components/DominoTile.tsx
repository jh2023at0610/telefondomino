'use client';

import { Tile } from '@/types/game';
import { motion } from 'framer-motion';

interface DominoTileProps {
  tile: Tile;
  onClick?: () => void;
  disabled?: boolean;
  highlighted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical' | 'auto';
  animateEntry?: boolean; // Animate when tile first appears
  delay?: number; // Stagger animation delay
}

export function DominoTile({ 
  tile, 
  onClick, 
  disabled, 
  highlighted, 
  size = 'md',
  orientation = 'auto',
  animateEntry = false,
  delay = 0
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

    // Better spacing for mobile - dots won't get cut off
    // Using more generous spacing to ensure dots are fully visible
    const spacing = {
      sm: '0.5rem',    // 8px for small tiles (board) - increased!
      md: '0.625rem',  // 10px for medium tiles (hand) - increased!
      lg: '0.75rem',   // 12px for large tiles (modals)
    };

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {dots.map((pos, idx) => {
          let positionStyle: React.CSSProperties = {};
          
          switch (pos) {
            case 'top-left':
              positionStyle = { top: spacing[size], left: spacing[size] };
              break;
            case 'top-right':
              positionStyle = { top: spacing[size], right: spacing[size] };
              break;
            case 'middle-left':
              positionStyle = { top: '50%', left: spacing[size], transform: 'translateY(-50%)' };
              break;
            case 'middle-right':
              positionStyle = { top: '50%', right: spacing[size], transform: 'translateY(-50%)' };
              break;
            case 'center':
              positionStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
              break;
            case 'bottom-left':
              positionStyle = { bottom: spacing[size], left: spacing[size] };
              break;
            case 'bottom-right':
              positionStyle = { bottom: spacing[size], right: spacing[size] };
              break;
          }

          return (
            <div
              key={idx}
              style={positionStyle}
              className={`absolute ${dotSizes[size]} bg-gray-900 rounded-full`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || !onClick}
      
      // Entry animation (when tile first appears)
      initial={animateEntry ? { scale: 0, opacity: 0, rotateZ: -180 } : false}
      animate={animateEntry ? { scale: 1, opacity: 1, rotateZ: 0 } : {}}
      transition={animateEntry ? {
        type: 'spring',
        stiffness: 200,
        damping: 20,
        delay,
      } : {}}
      
      // Tap/Click animations - MOBILE-OPTIMIZED
      whileTap={onClick && !disabled ? { 
        scale: 0.9,
        rotate: isDouble ? 0 : (Math.random() > 0.5 ? 2 : -2),
        transition: { duration: 0.1 }
      } : {}}
      
      // Hover animation (desktop only, no lag on mobile)
      whileHover={onClick && !disabled ? {
        scale: 1.05,
        y: -4,
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3)',
        transition: { duration: 0.2 }
      } : {}}
      
      className={`
        ${sizeClasses[size]}
        relative
        overflow-hidden
        bg-gradient-to-br from-gray-100 to-gray-200
        rounded-lg
        shadow-lg
        border-2
        ${onClick && !disabled ? 'cursor-pointer' : 'cursor-default'}
        ${highlighted ? 'border-blue-400 ring-4 ring-blue-400/50 shadow-blue-400/50' : 'border-gray-300'}
        ${disabled ? 'opacity-50' : ''}
        flex
        ${isVertical ? 'flex-col' : 'flex-row'}
      `}
    >
      {/* First half (top for vertical, left for horizontal) */}
      <div className={`${isVertical ? 'h-1/2 border-b' : 'w-1/2 border-r'} border-gray-400 p-2 relative overflow-hidden`}>
        {renderDots(tile[0])}
      </div>
      
      {/* Second half (bottom for vertical, right for horizontal) */}
      <div className={`${isVertical ? 'h-1/2' : 'w-1/2'} p-2 relative overflow-hidden`}>
        {renderDots(tile[1])}
      </div>
    </motion.button>
  );
}



