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
    // Board tiles - smaller, more compact (slightly bigger on mobile now)
    sm: isVertical ? 'w-8 h-16 sm:w-8 sm:h-16' : 'w-16 h-8 sm:w-16 sm:h-8',
    // Hand tiles - BIGGER on mobile for dots to fit properly
    md: isVertical ? 'w-16 h-32 sm:w-14 sm:h-28 md:w-16 md:h-32' : 'w-32 h-16 sm:w-28 sm:h-14 md:w-32 md:h-16',
    // Selection/Modal tiles - nice and big
    lg: isVertical ? 'w-18 h-36 sm:w-20 sm:h-40' : 'w-36 h-18 sm:w-40 sm:h-20',
  };

  const dotSizes = {
    sm: 'w-1 h-1',                           // Tiny dots for board tiles (4px)
    md: 'w-1.5 h-1.5',                       // Small dots for hand tiles (6px)
    lg: 'w-2 h-2',                           // Normal dots for modals (8px)
  };

  const renderDots = (value: number) => {
    const dotClass = `${dotSizes[size]} bg-gray-900 rounded-full flex-shrink-0`;
    
    // Render different dot patterns based on value - ULTRA SIMPLE
    if (value === 0) {
      return <div className="w-full h-full" />;
    }

    if (value === 1) {
      return (
        <div className="w-full h-full flex items-center justify-center p-2">
          <div className={dotClass} />
        </div>
      );
    }

    if (value === 2) {
      return (
        <div className="w-full h-full p-2">
          <div className="h-full flex flex-col justify-between items-stretch">
            <div className="w-full flex justify-start items-start">
              <div className={dotClass} style={{ marginLeft: '10%' }} />
            </div>
            <div className="w-full flex justify-end items-end">
              <div className={dotClass} style={{ marginRight: '10%' }} />
            </div>
          </div>
        </div>
      );
    }

    if (value === 3) {
      return (
        <div className="w-full h-full p-2">
          <div className="h-full flex flex-col justify-between items-stretch">
            <div className="w-full flex justify-start items-start">
              <div className={dotClass} style={{ marginLeft: '10%' }} />
            </div>
            <div className="w-full flex justify-center items-center">
              <div className={dotClass} />
            </div>
            <div className="w-full flex justify-end items-end">
              <div className={dotClass} style={{ marginRight: '10%' }} />
            </div>
          </div>
        </div>
      );
    }

    if (value === 4) {
      return (
        <div className="w-full h-full p-2">
          <div className="h-full flex flex-col justify-between items-stretch">
            <div className="w-full flex justify-between items-center px-1">
              <div className={dotClass} />
              <div className={dotClass} />
            </div>
            <div className="w-full flex justify-between items-center px-1">
              <div className={dotClass} />
              <div className={dotClass} />
            </div>
          </div>
        </div>
      );
    }

    if (value === 5) {
      return (
        <div className="w-full h-full p-2">
          <div className="h-full flex flex-col justify-between items-stretch">
            <div className="w-full flex justify-between items-center px-1">
              <div className={dotClass} />
              <div className={dotClass} />
            </div>
            <div className="w-full flex justify-center items-center">
              <div className={dotClass} />
            </div>
            <div className="w-full flex justify-between items-center px-1">
              <div className={dotClass} />
              <div className={dotClass} />
            </div>
          </div>
        </div>
      );
    }

    if (value === 6) {
      return (
        <div className="w-full h-full p-2">
          <div className="h-full flex justify-between items-stretch px-1">
            <div className="flex flex-col justify-between items-center">
              <div className={dotClass} />
              <div className={dotClass} />
              <div className={dotClass} />
            </div>
            <div className="flex flex-col justify-between items-center">
              <div className={dotClass} />
              <div className={dotClass} />
              <div className={dotClass} />
            </div>
          </div>
        </div>
      );
    }

    return <div className="w-full h-full" />;
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
      <div className={`${isVertical ? 'h-1/2 border-b' : 'w-1/2 border-r'} border-gray-400`}>
        {renderDots(tile[0])}
      </div>
      
      {/* Second half (bottom for vertical, right for horizontal) */}
      <div className={`${isVertical ? 'h-1/2' : 'w-1/2'}`}>
        {renderDots(tile[1])}
      </div>
    </motion.button>
  );
}



