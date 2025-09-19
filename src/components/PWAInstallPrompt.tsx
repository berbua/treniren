'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isClient, setIsClient] = useState(false);

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
        console.log('PWA: App is already installed');
      } else {
        console.log('PWA: App is not installed');
      }
    };

    checkInstalled();

    // Listen for the beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event): void => {
      console.log('PWA: beforeinstallprompt event received');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Always show prompt for now (remove cooldown for testing)
      setShowInstallPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA: App installed event received');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS Safari, show manual install instructions after a delay
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isInStandaloneMode) {
      console.log('PWA: iOS detected, showing manual install instructions');
      // Show manual install prompt for iOS after 3 seconds
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isClient]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
    }
    setShowInstallPrompt(false);
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't render anything on the server side to prevent hydration mismatch
  if (!isClient || isInstalled || !showInstallPrompt || !deferredPrompt) {
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
              Install Treniren
            </h3>
            {deferredPrompt ? (
              <>
                <p className="text-sm text-gray-500 mt-1">
                  Install this app on your device for quick access and offline use.
                </p>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={handleInstallClick}
                    className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Install
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="text-gray-500 text-sm px-3 py-1.5 rounded-md hover:text-gray-700 transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mt-1">
                  {isIOS 
                    ? 'To install this app on your iPhone:'
                    : 'Install this app for quick access and offline use.'
                  }
                </p>
                {isIOS ? (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-gray-600">
                      <p>1. Tap the <strong>Share</strong> button below</p>
                      <p>2. Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></p>
                      <p>3. Tap <strong>&quot;Add&quot;</strong> to confirm</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleDismiss}
                        className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Got it!
                      </button>
                      <button
                        onClick={handleDismiss}
                        className="text-gray-500 text-sm px-3 py-1.5 rounded-md hover:text-gray-700 transition-colors"
                      >
                        Maybe later
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={handleDismiss}
                      className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      OK
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="text-gray-500 text-sm px-3 py-1.5 rounded-md hover:text-gray-700 transition-colors"
                    >
                      Not now
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          <button
            onClick={handleDismiss}
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
