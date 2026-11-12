'use client';

import { useOffline } from '@/hooks/useOffline';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

export const OfflineIndicator = () => {
  const { isOnline, unsyncedWorkouts } = useOffline();
  const { t } = useLanguage();
  const [showIndicator, setShowIndicator] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure this component only renders on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Queued workouts are also unsynced, so count them once
  const pendingCount = unsyncedWorkouts.length;

  // Don't render anything on the server side to prevent hydration mismatch
  if (!isClient || (!showIndicator && isOnline)) {
    return null;
  }

  return (
    <div
      role="status"
      className={`fixed top-[calc(12px+env(safe-area-inset-top))] inset-x-4 lg:left-[calc(16rem+16px)] z-40 mx-auto max-w-lg transition-all duration-300 ${
        showIndicator ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div
        className={`rounded-uc-card px-4 py-3 shadow-uc border ${
          isOnline ? 'bg-uc-success-bg border-uc-success/30' : 'bg-uc-warning-bg border-uc-warning/30'
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={`size-2.5 shrink-0 rounded-full ${isOnline ? 'bg-uc-success' : 'bg-uc-warning'}`}
          />
          <span className="flex-1 min-w-0 text-[15px] font-bold text-uc-text">
            {isOnline ? (t('offlineBanner.backOnline') || 'Back online') : (t('offlineBanner.offline') || "You're offline")}
          </span>
          {!isOnline && pendingCount > 0 && (
            <span className="shrink-0 text-sm font-bold text-uc-text-muted uc-num">
              {t('offlineBanner.pending', { count: pendingCount }) || `${pendingCount} pending`}
            </span>
          )}
        </div>
        {!isOnline && (
          <p className="mt-1 pl-[22px] text-[13px] text-uc-text-muted">
            {t('offlineBanner.savedLocally') || "Your workouts will be saved locally and synced when you're back online."}
          </p>
        )}
      </div>
    </div>
  );
};
