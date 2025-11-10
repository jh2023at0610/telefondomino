'use client';

import { X, RefreshCw } from 'lucide-react';

interface VersionCheckModalProps {
  onRefresh?: () => void;
  onDismiss: () => void;
}

// Force hard reload with cache bypass
async function forceHardReload() {
  console.log('🔄 Forcing HARD reload with cache bypass...');
  
  try {
    // Fetch current server version FIRST
    const response = await fetch('/api/version', { cache: 'no-store' });
    const data = await response.json();
    
    // Store the NEW version (so modal won't show again)
    localStorage.setItem('app_version', data.version);
    console.log(`✅ Updated stored version to: ${data.version}`);
  } catch (error) {
    console.error('Failed to fetch version, clearing storage:', error);
    localStorage.removeItem('app_version');
  }
  
  // Hard reload with cache-busting timestamp
  const url = new URL(window.location.href);
  url.searchParams.set('_v', Date.now().toString());
  
  // Force reload
  window.location.href = url.toString();
}

export function VersionCheckModal({ onRefresh, onDismiss }: VersionCheckModalProps) {
  const handleRefresh = async () => {
    if (onRefresh) {
      onRefresh();
    } else {
      // Default: Force hard reload with cache bypass
      await forceHardReload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">New Version Available</h2>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-300">
            A new version of the game has been deployed with updates and fixes.
          </p>
          
          <p className="text-sm text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
            ⚠️ <strong>Important:</strong> To prevent sync issues, please refresh your browser now.
          </p>

          <div className="space-y-2">
            <p className="text-xs text-gray-400">
              <strong>What's new:</strong>
            </p>
            <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
              <li>Bug fixes and improvements</li>
              <li>Better synchronization</li>
              <li>Enhanced game experience</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleRefresh}
            className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Now
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold rounded-lg transition-colors"
          >
            Later
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          You can also press <kbd className="px-1 py-0.5 bg-gray-700 rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-gray-700 rounded">Shift</kbd> + <kbd className="px-1 py-0.5 bg-gray-700 rounded">R</kbd>
        </p>
      </div>
    </div>
  );
}

