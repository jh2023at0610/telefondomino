'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useGameStore } from '@/store/game-store';

export function Toast() {
  const { toastMessage, clearToast } = useGameStore();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        clearToast();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [toastMessage, clearToast]);

  if (!toastMessage) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
        <span className="flex-1">{toastMessage}</span>
        <button
          onClick={clearToast}
          className="hover:bg-blue-600 rounded p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}



