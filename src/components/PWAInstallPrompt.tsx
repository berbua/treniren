'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui';

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

  // Step strings carry their number ("1. Tap…"); the number goes in its own circle
  const iosSteps = [t('pwaPrompt.iosStep1'), t('pwaPrompt.iosStep2'), t('pwaPrompt.iosStep3')].map((step) =>
    step.replace(/^\d+\.\s*/, '')
  );

  return (
    <div
      role="dialog"
      aria-label={t('pwaPrompt.title')}
      className="fixed bottom-[calc(108px+env(safe-area-inset-bottom))] lg:bottom-4 inset-x-4 z-50 sm:left-auto sm:w-[380px]"
    >
      <div className="bg-uc-elevated border border-uc-border rounded-uc-card shadow-uc p-4">
        <div className="flex items-start gap-3">
          <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-uc-primary-container text-2xl">
            🦄
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[17px] font-extrabold leading-6 text-uc-text">{t('pwaPrompt.title')}</h3>
            <p className="mt-0.5 text-sm text-uc-text-muted">
              {deferredPrompt || !isIOS ? t('pwaPrompt.description') : t('pwaPrompt.iosIntro')}
            </p>
          </div>
        </div>

        {deferredPrompt ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={handleDismiss}>
              {t('pwaPrompt.notNow')}
            </Button>
            <Button variant="accent" onClick={handleInstallClick}>
              {t('pwaPrompt.install')}
            </Button>
          </div>
        ) : isIOS ? (
          <>
            <ol className="mt-4 space-y-2.5">
              {iosSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-uc-text">
                  <span
                    aria-hidden
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-uc-primary-container text-[13px] font-extrabold text-uc-on-primary-container uc-num"
                  >
                    {index + 1}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-3 flex flex-wrap justify-end gap-1">
              <button
                type="button"
                onClick={handleDismiss}
                className="min-h-11 px-3 rounded-uc-input text-sm font-bold text-uc-text-muted hover:text-uc-text hover:bg-uc-surface transition-colors"
              >
                {t('pwaPrompt.maybeLater')}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="min-h-11 px-3 rounded-uc-input text-sm font-extrabold text-uc-primary hover:bg-uc-surface transition-colors"
              >
                {t('pwaPrompt.gotIt')}
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={handleDismiss}>
              {t('pwaPrompt.notNow')}
            </Button>
            <Button variant="primary" onClick={handleDismiss}>
              {t('pwaPrompt.ok')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
