'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useCsrfToken } from '@/hooks/useCsrfToken';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { syncOfflineWorkouts } from '@/lib/offline-sync';

// Fired by the offline workout form after it stores a workout
export const OFFLINE_WORKOUT_QUEUED_EVENT = 'offline-workout-queued';

// Uploads workouts stored offline whenever the app is online and signed in. Mounted once in Providers.
export const OfflineSyncManager = () => {
  const { status } = useSession();
  const { getToken, refreshToken } = useCsrfToken();
  const { showSuccess, showError } = useToast();
  const { t } = useLanguage();

  // Keep the latest helpers in a ref so the listeners below only re-register when sign-in status changes
  const helpersRef = useRef({ getToken, refreshToken, showSuccess, showError, t });
  helpersRef.current = { getToken, refreshToken, showSuccess, showError, t };

  useEffect(() => {
    if (status !== 'authenticated') return;

    const runSync = async () => {
      const { getToken, refreshToken, showSuccess, showError, t } = helpersRef.current;
      const result = await syncOfflineWorkouts({ getToken, refreshToken });
      if (result.uploaded > 0) {
        showSuccess(t('offlineSync.uploaded', { count: result.uploaded }));
      }
      if (result.failed > 0) {
        showError(t('offlineSync.failed', { count: result.failed }));
      }
    };

    // Upload anything left over from earlier sessions
    runSync();

    window.addEventListener('online', runSync);
    // Dispatched when the service worker asks for a background sync
    window.addEventListener('sync-workouts', runSync);
    window.addEventListener(OFFLINE_WORKOUT_QUEUED_EVENT, runSync);

    return () => {
      window.removeEventListener('online', runSync);
      window.removeEventListener('sync-workouts', runSync);
      window.removeEventListener(OFFLINE_WORKOUT_QUEUED_EVENT, runSync);
    };
  }, [status]);

  return null;
};
