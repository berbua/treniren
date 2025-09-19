'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  OfflineWorkout, 
  getOfflineWorkouts, 
  getUnsyncedWorkouts, 
  getSyncQueue,
  isOnline,
  getStorageSize,
  getLastSyncTime
} from '@/lib/offline-storage';

export interface UseOfflineReturn {
  isOnline: boolean;
  offlineWorkouts: OfflineWorkout[];
  unsyncedWorkouts: OfflineWorkout[];
  syncQueue: OfflineWorkout[];
  storageSize: { used: number; total: number };
  lastSyncTime: string | null;
  refreshOfflineData: () => void;
}

export const useOffline = (): UseOfflineReturn => {
  const [online, setOnline] = useState(true);
  const [offlineWorkouts, setOfflineWorkouts] = useState<OfflineWorkout[]>([]);
  const [unsyncedWorkouts, setUnsyncedWorkouts] = useState<OfflineWorkout[]>([]);
  const [syncQueue, setSyncQueue] = useState<OfflineWorkout[]>([]);
  const [storageSize, setStorageSize] = useState({ used: 0, total: 0 });
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const refreshOfflineData = useCallback(() => {
    setOfflineWorkouts(getOfflineWorkouts());
    setUnsyncedWorkouts(getUnsyncedWorkouts());
    setSyncQueue(getSyncQueue());
    setStorageSize(getStorageSize());
    setLastSyncTime(getLastSyncTime());
  }, []);

  useEffect(() => {
    // Initial load
    refreshOfflineData();

    // Listen for online/offline events
    const handleOnline = () => {
      setOnline(true);
      refreshOfflineData();
    };

    const handleOffline = () => {
      setOnline(false);
      refreshOfflineData();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for storage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('treniren_')) {
        refreshOfflineData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Poll for changes every 5 seconds when offline
    const interval = setInterval(() => {
      if (!isOnline()) {
        refreshOfflineData();
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [refreshOfflineData]);

  return {
    isOnline: online,
    offlineWorkouts,
    unsyncedWorkouts,
    syncQueue,
    storageSize,
    lastSyncTime,
    refreshOfflineData,
  };
};
