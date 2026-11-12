'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useCsrfToken } from '@/hooks/useCsrfToken';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { syncOfflineWorkouts } from '@/lib/offline-sync';
import { handleSignedInUser } from '@/lib/account-data';

// Fired by the offline workout form after it stores a workout
export const OFFLINE_WORKOUT_QUEUED_EVENT = 'offline-workout-queued';

// Uploads workouts stored offline whenever the app is online and signed in, after clearing the previous
// account's cached data if a different user signed in on this device. Mounted once in Providers.
export const OfflineSyncManager = () => {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const { getToken, refreshToken } = useCsrfToken();
  const { showSuccess, showError } = useToast();
  const { t } = useLanguage();

  // Keep the latest helpers in a ref so the listeners below only re-register when sign-in status changes
  const helpersRef = useRef({ getToken, refreshToken, showSuccess, showError, t });
  helpersRef.current = { getToken, refreshToken, showSuccess, showError, t };

  useEffect(() => {
    if (status !== 'authenticated' || !userId) return;

    const runSync = async () => {
      const { getToken, refreshToken, showSuccess, showError, t } = helpersRef.current;
      const result = await syncOfflineWorkouts({ getToken, refreshToken }, userId);
      if (result.uploaded > 0) {
        showSuccess(t('offlineSync.uploaded', { count: result.uploaded }));
      }
      if (result.failed > 0) {
        showError(t('offlineSync.failed', { count: result.failed }));
      }
      if (result.rejected > 0) {
        showError(t('offlineSync.rejected', { count: result.rejected }));
      }
    };

    // Upload anything left over from earlier sessions
    handleSignedInUser(userId).then(runSync);

    window.addEventListener('online', runSync);
    // Dispatched when the service worker asks for a background sync
    window.addEventListener('sync-workouts', runSync);
    window.addEventListener(OFFLINE_WORKOUT_QUEUED_EVENT, runSync);

    return () => {
      window.removeEventListener('online', runSync);
      window.removeEventListener('sync-workouts', runSync);
      window.removeEventListener(OFFLINE_WORKOUT_QUEUED_EVENT, runSync);
    };
  }, [status, userId]);

  return null;
};
