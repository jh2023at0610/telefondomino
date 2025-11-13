'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ScorePopProps {
  score: number;
  onComplete?: () => void;
}

export function ScorePop({ score, onComplete }: ScorePopProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (score === 0) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, y: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.2, 1],
            y: -50,
            opacity: [0, 1, 1, 0],
          }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{
            duration: 2,
            times: [0, 0.2, 0.3, 1],
            ease: 'easeOut'
          }}
          className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full shadow-2xl font-bold text-xl">
            +{score}
            <motion.span
              animate={{ 
                scale: [1, 1.5, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 0.5
              }}
              className="inline-block ml-1"
            >
              ✨
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

