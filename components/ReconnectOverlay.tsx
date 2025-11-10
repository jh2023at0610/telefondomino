'use client';

import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useGameStore } from '@/store/game-store';

export function ReconnectOverlay() {
  const { isConnected, isReconnecting } = useGameStore();

  if (isConnected && !isReconnecting) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md text-center border border-gray-700 shadow-2xl">
        {isReconnecting ? (
          <>
            <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-2">Reconnecting...</h2>
            <p className="text-gray-400">
              Lost connection to server. Attempting to reconnect.
            </p>
          </>
        ) : (
          <>
            <WifiOff className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Connection Lost</h2>
            <p className="text-gray-400 mb-4">
              You are offline. Please check your internet connection.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Retry Connection
            </button>
          </>
        )}
      </div>
    </div>
  );
}



