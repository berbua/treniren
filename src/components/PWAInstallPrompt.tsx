'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // Don't ask again for 14 days

const wasRecentlyDismissed = () => {
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY));
    return !!dismissedAt && Date.now() - dismissedAt < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
};

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt = () => {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Ensure this component only renders on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as Navigator & { standalone?: boolean }).standalone === true) {
        setIsInstalled(true);
      } else {
      }
    };

    checkInstalled();

    // Listen for the beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event): void => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt for PWA installation
      if (!wasRecentlyDismissed()) {
        setShowInstallPrompt(true);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS Safari, show manual install instructions after a delay
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsIOS(isIOSDevice);

    let iosPromptTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIOSDevice && !isInStandaloneMode && !wasRecentlyDismissed()) {
      // Show manual install prompt for iOS after 3 seconds
      iosPromptTimer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(iosPromptTimer);
    };
  }, [isClient]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
      } else {
      }
      
      setDeferredPrompt(null);
    }
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      // Storage unavailable (e.g. private mode) - just hide for this session
    }
  };

  // Don't render anything on the server side to prevent hydration mismatch.
  // Without a deferred prompt, only iOS has something to show (manual instructions).
  if (!isClient || isInstalled || !showInstallPrompt || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900">
              {t('pwaPrompt.title')}
            </h3>
            {deferredPrompt ? (
              <>
                <p className="text-sm text-gray-500 mt-1">
                  {t('pwaPrompt.description')}
                </p>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={handleInstallClick}
                    className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {t('pwaPrompt.install')}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="text-gray-500 text-sm px-3 py-1.5 rounded-md hover:text-gray-700 transition-colors"
                  >
                    {t('pwaPrompt.notNow')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mt-1">
                  {isIOS ? t('pwaPrompt.iosIntro') : t('pwaPrompt.description')}
                </p>
                {isIOS ? (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-gray-600">
                      <p>{t('pwaPrompt.iosStep1')}</p>
                      <p>{t('pwaPrompt.iosStep2')}</p>
                      <p>{t('pwaPrompt.iosStep3')}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleDismiss}
                        className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        {t('pwaPrompt.gotIt')}
                      </button>
                      <button
                        onClick={handleDismiss}
                        className="text-gray-500 text-sm px-3 py-1.5 rounded-md hover:text-gray-700 transition-colors"
                      >
                        {t('pwaPrompt.maybeLater')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={handleDismiss}
                      className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {t('pwaPrompt.ok')}
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="text-gray-500 text-sm px-3 py-1.5 rounded-md hover:text-gray-700 transition-colors"
                    >
                      {t('pwaPrompt.notNow')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          <button
            onClick={handleDismiss}
            aria-label={t('pwaPrompt.close')}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
