'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface TurnIndicatorProps {
  isMyTurn: boolean;
  playerName?: string;
}

export function TurnIndicator({ isMyTurn, playerName }: TurnIndicatorProps) {
  if (!isMyTurn) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-40"
    >
      <motion.div
        animate={{
          boxShadow: [
            '0 0 20px rgba(59, 130, 246, 0.5)',
            '0 0 40px rgba(59, 130, 246, 0.8)',
            '0 0 20px rgba(59, 130, 246, 0.5)',
          ],
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
        }}
        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        >
          <Sparkles className="w-5 h-5" />
        </motion.div>
        <span className="font-bold text-lg">Your Turn!</span>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        >
          <Sparkles className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

