// Per-account data the browser keeps between visits. The service worker caches API responses by URL and
// several features keep state in localStorage, none of it keyed by user, so it has to be dropped whenever
// the signed-in account goes away or changes - otherwise the next person on the device sees it.
import { notificationService, SENT_REMINDERS_KEY } from './notification-service';

const LAST_USER_KEY = 'treniren_last_user';
// localStorage entries that belong to one account (offline workouts are tagged with their user instead)
const ACCOUNT_STORAGE_KEYS = ['notification-messages', 'cycle-settings', SENT_REMINDERS_KEY];
// Service worker cache holding API responses (see public/sw.js)
const API_CACHE_PREFIX = 'treniren-dynamic-';

export const clearAccountData = async (): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    ACCOUNT_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    localStorage.removeItem(LAST_USER_KEY);
  } catch (error) {
    console.error('Failed to clear account data from localStorage:', error);
  }
  notificationService.clearAllMessages();

  if ('caches' in window) {
    try {
      const names = await caches.keys();
      await Promise.all(names.filter(name => name.startsWith(API_CACHE_PREFIX)).map(name => caches.delete(name)));
    } catch (error) {
      console.error('Failed to clear cached API responses:', error);
    }
  }
};

/** Clears the previous account's data when a different user signs in on this device. */
export const handleSignedInUser = async (userId: string): Promise<void> => {
  let lastUserId: string | null = null;
  try {
    lastUserId = localStorage.getItem(LAST_USER_KEY);
  } catch {
    return;
  }
  if (lastUserId === userId) return;

  // Unknown previous user (first visit after this change, or after sign-out) or a different one
  await clearAccountData();
  try {
    localStorage.setItem(LAST_USER_KEY, userId);
  } catch {
    // Storage unavailable; nothing to remember
  }
};
