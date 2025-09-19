'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/service-worker';

export const ServiceWorkerProvider = () => {
  useEffect(() => {
    // Register service worker on component mount
    registerServiceWorker().then((registration) => {
      if (registration) {
        console.log('Service Worker registered successfully');
        
        // Listen for service worker messages
        if (registration.active) {
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'SYNC_WORKOUTS') {
              // Handle sync message from service worker
              console.log('Sync workouts message received from service worker');
              // You could dispatch a custom event or use a context here
              window.dispatchEvent(new CustomEvent('sync-workouts'));
            }
          });
        }
      }
    });

    // Handle beforeunload to prepare for offline
    const handleBeforeUnload = () => {
      // Save any pending data before page unload
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PAGE_UNLOAD'
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null; // This component doesn't render anything
};
