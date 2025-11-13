'use client';

import { useEffect, useState } from 'react';

const CHECK_INTERVAL = 30000; // Check every 30 seconds
const VERSION_KEY = 'app_version';

export function useVersionCheck(onNewVersion: () => void) {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Get initial version
    const fetchVersion = async () => {
      try {
        const response = await fetch('/api/version', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        const data = await response.json();
        
        const storedVersion = localStorage.getItem(VERSION_KEY);
        
        if (!storedVersion) {
          // First load - store version
          localStorage.setItem(VERSION_KEY, data.version);
          setCurrentVersion(data.version);
          console.log('🔖 Initial version:', data.version);
        } else if (storedVersion !== data.version) {
          // Version mismatch - new version available!
          console.log('🔄 New version detected!', {
            stored: storedVersion,
            server: data.version,
          });
          onNewVersion();
          // Don't update stored version yet - wait for refresh
        } else {
          setCurrentVersion(data.version);
        }
      } catch (error) {
        console.error('Failed to check version:', error);
      }
    };

    fetchVersion();

    // Check periodically
    const interval = setInterval(() => {
      if (!isChecking) {
        setIsChecking(true);
        fetchVersion().finally(() => setIsChecking(false));
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [onNewVersion, isChecking]);

  return { currentVersion };
}


