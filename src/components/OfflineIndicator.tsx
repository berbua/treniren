'use client';

import { useOffline } from '@/hooks/useOffline';
import { useState, useEffect } from 'react';

export const OfflineIndicator = () => {
  const { isOnline, unsyncedWorkouts, syncQueue } = useOffline();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true);
    } else {
      // Hide after a short delay when coming back online
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const pendingCount = unsyncedWorkouts.length + syncQueue.length;

  if (!showIndicator && isOnline) {
    return null;
  }

  return (
    <div className={`fixed top-4 left-4 right-4 z-40 transition-all duration-300 ${
      showIndicator ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
    }`}>
      <div className={`rounded-lg px-4 py-2 shadow-lg ${
        isOnline 
          ? 'bg-green-100 border border-green-200 text-green-800' 
          : 'bg-yellow-100 border border-yellow-200 text-yellow-800'
      }`}>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
          <span className="text-sm font-medium">
            {isOnline ? 'Back online' : 'You&apos;re offline'}
          </span>
          {!isOnline && pendingCount > 0 && (
            <span className="text-xs bg-yellow-200 px-2 py-0.5 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
        {!isOnline && (
          <p className="text-xs mt-1 text-yellow-700">
            Your workouts will be saved locally and synced when you&apos;re back online.
          </p>
        )}
      </div>
    </div>
  );
};
