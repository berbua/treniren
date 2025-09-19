// Offline storage utilities for PWA functionality
export interface OfflineWorkout {
  id: string;
  type: 'gym' | 'bouldering' | 'circuits' | 'lead_rock' | 'lead_artificial';
  startTime: string;
  endTime?: string;
  trainingVolume?: 'TR1' | 'TR2' | 'TR3' | 'TR4' | 'TR5';
  details?: Record<string, unknown>;
  preSessionFeel?: number;
  notes?: string;
  exercises?: OfflineExercise[];
  createdAt: string;
  synced: boolean;
}

export interface OfflineExercise {
  id: string;
  name: string;
  category: string;
  sets: OfflineSet[];
}

export interface OfflineSet {
  id: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  rir?: number;
  success?: boolean;
  notes?: string;
}

const STORAGE_KEYS = {
  OFFLINE_WORKOUTS: 'treniren_offline_workouts',
  SYNC_QUEUE: 'treniren_sync_queue',
  LAST_SYNC: 'treniren_last_sync',
} as const;

// Workout storage functions
export const saveOfflineWorkout = (workout: OfflineWorkout): void => {
  try {
    const existingWorkouts = getOfflineWorkouts();
    const updatedWorkouts = [...existingWorkouts.filter(w => w.id !== workout.id), workout];
    localStorage.setItem(STORAGE_KEYS.OFFLINE_WORKOUTS, JSON.stringify(updatedWorkouts));
  } catch (error) {
    console.error('Failed to save offline workout:', error);
  }
};

export const getOfflineWorkouts = (): OfflineWorkout[] => {
  if (typeof window === 'undefined') return []; // Server-side default
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.OFFLINE_WORKOUTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get offline workouts:', error);
    return [];
  }
};

export const deleteOfflineWorkout = (id: string): void => {
  try {
    const workouts = getOfflineWorkouts();
    const updatedWorkouts = workouts.filter(w => w.id !== id);
    localStorage.setItem(STORAGE_KEYS.OFFLINE_WORKOUTS, JSON.stringify(updatedWorkouts));
  } catch (error) {
    console.error('Failed to delete offline workout:', error);
  }
};

export const getUnsyncedWorkouts = (): OfflineWorkout[] => {
  return getOfflineWorkouts().filter(workout => !workout.synced);
};

// Sync queue management
export const addToSyncQueue = (workout: OfflineWorkout): void => {
  try {
    const queue = getSyncQueue();
    const updatedQueue = [...queue.filter(w => w.id !== workout.id), workout];
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Failed to add to sync queue:', error);
  }
};

export const getSyncQueue = (): OfflineWorkout[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get sync queue:', error);
    return [];
  }
};

export const clearSyncQueue = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
  } catch (error) {
    console.error('Failed to clear sync queue:', error);
  }
};

export const markWorkoutAsSynced = (id: string): void => {
  try {
    const workouts = getOfflineWorkouts();
    const updatedWorkouts = workouts.map(w => 
      w.id === id ? { ...w, synced: true } : w
    );
    localStorage.setItem(STORAGE_KEYS.OFFLINE_WORKOUTS, JSON.stringify(updatedWorkouts));
    
    // Remove from sync queue
    const queue = getSyncQueue();
    const updatedQueue = queue.filter(w => w.id !== id);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Failed to mark workout as synced:', error);
  }
};

// Last sync timestamp
export const setLastSyncTime = (timestamp: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
  } catch (error) {
    console.error('Failed to set last sync time:', error);
  }
};

export const getLastSyncTime = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  } catch (error) {
    console.error('Failed to get last sync time:', error);
    return null;
  }
};

// Utility functions
export const generateOfflineId = (): string => {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const isOnline = (): boolean => {
  if (typeof window === 'undefined') return true; // Default to online on server
  return navigator.onLine;
};

export const getStorageSize = (): { used: number; total: number } => {
  if (typeof window === 'undefined') return { used: 0, total: 0 }; // Server-side default
  
  try {
    let used = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length;
      }
    }
    
    // Estimate total storage (most browsers give ~5-10MB)
    const total = 5 * 1024 * 1024; // 5MB estimate
    
    return { used, total };
  } catch (error) {
    console.error('Failed to get storage size:', error);
    return { used: 0, total: 0 };
  }
};
