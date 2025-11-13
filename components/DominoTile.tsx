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
    // SVG approach - most reliable across ALL devices and pixel densities
    // SVG coordinates are absolute and work consistently
    const dotRadius = size === 'sm' ? 2 : size === 'md' ? 3 : 4;
    
    if (value === 0) {
      return <div className="w-full h-full" />;
    }

    // SVG viewBox: 100x100 coordinate system
    const renderSVGDots = () => {
      const dots: { cx: number; cy: number }[] = [];
      
      switch (value) {
        case 1:
          dots.push({ cx: 50, cy: 50 });
          break;
        case 2:
          dots.push({ cx: 25, cy: 25 }, { cx: 75, cy: 75 });
          break;
        case 3:
          dots.push({ cx: 25, cy: 25 }, { cx: 50, cy: 50 }, { cx: 75, cy: 75 });
          break;
        case 4:
          dots.push({ cx: 30, cy: 30 }, { cx: 70, cy: 30 }, { cx: 30, cy: 70 }, { cx: 70, cy: 70 });
          break;
        case 5:
          dots.push({ cx: 25, cy: 25 }, { cx: 75, cy: 25 }, { cx: 50, cy: 50 }, { cx: 25, cy: 75 }, { cx: 75, cy: 75 });
          break;
        case 6:
          dots.push(
            { cx: 35, cy: 20 }, { cx: 65, cy: 20 },
            { cx: 35, cy: 50 }, { cx: 65, cy: 50 },
            { cx: 35, cy: 80 }, { cx: 65, cy: 80 }
          );
          break;
      }
      
      return dots;
    };

    return (
      <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {renderSVGDots().map((dot, idx) => (
          <circle
            key={idx}
            cx={dot.cx}
            cy={dot.cy}
            r={dotRadius * 2}
            fill="#111827"
            className="transition-all"
          />
        ))}
      </svg>
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



