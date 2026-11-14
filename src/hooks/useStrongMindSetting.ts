'use client';

// The Profile "Strong Mind tracking" setting and whether the one-time "Track your headspace on lead?" question was
// answered. Stored on the user profile; a per-user copy in localStorage keeps it usable offline, and a change made
// offline is marked pending and sent on the next load or when the connection comes back.

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCsrfToken } from './useCsrfToken';

interface StrongMindSetting {
  enabled: boolean;
  answered: boolean;
}

interface StoredSetting extends StrongMindSetting {
  pending?: boolean;
}

// Other hook instances (e.g. Profile and the workout form) pick up a change without a reload
const CHANGED_EVENT = 'strong-mind-setting-changed';

const storageKey = (userId: string) => `uc-strong-mind-setting-${userId}`;

const readStored = (userId: string): StoredSetting | null => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStored = (userId: string, value: StoredSetting) => {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(value));
  } catch {
    // Storage blocked: the server copy still applies
  }
};

export function useStrongMindSetting() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { getToken } = useCsrfToken();
  const [setting, setSetting] = useState<StrongMindSetting>({ enabled: false, answered: false });
  // False until the value is known, so the one-time question doesn't flash before the stored answer loads
  const [loaded, setLoaded] = useState(false);

  const push = useCallback(async (id: string, value: StrongMindSetting) => {
    try {
      const token = await getToken();
      const response = await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        credentials: 'include',
        body: JSON.stringify({
          strongMindTrackingEnabled: value.enabled,
          strongMindPromptAnswered: value.answered,
        }),
      });
      if (!response.ok) throw new Error(`Failed to save Strong Mind setting: ${response.status}`);
      // Only clear the pending mark if nothing changed meanwhile
      const stored = readStored(id);
      if (stored && stored.enabled === value.enabled && stored.answered === value.answered) {
        writeStored(id, value);
      }
    } catch (error) {
      console.error('Error saving Strong Mind setting:', error);
    }
  }, [getToken]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const stored = readStored(userId);
    if (stored) {
      setSetting({ enabled: stored.enabled, answered: stored.answered });
      setLoaded(true);
    }

    const sync = async () => {
      const current = readStored(userId);
      if (current?.pending) {
        await push(userId, current);
        return;
      }
      try {
        const response = await fetch('/api/user-profile', { credentials: 'include' });
        if (!response.ok) return;
        const profile = await response.json();
        // A change made while this request was in flight wins
        if (cancelled || readStored(userId)?.pending) return;
        const value = {
          enabled: !!profile?.strongMindTrackingEnabled,
          answered: !!profile?.strongMindPromptAnswered,
        };
        writeStored(userId, value);
        setSetting(value);
        setLoaded(true);
      } catch {
        // Offline: keep the stored copy
      }
    };
    sync();

    const onChanged = () => {
      const next = readStored(userId);
      if (next) setSetting({ enabled: next.enabled, answered: next.answered });
    };
    const onOnline = () => {
      const current = readStored(userId);
      if (current?.pending) push(userId, current);
    };
    window.addEventListener(CHANGED_EVENT, onChanged);
    window.addEventListener('online', onOnline);
    return () => {
      cancelled = true;
      window.removeEventListener(CHANGED_EVENT, onChanged);
      window.removeEventListener('online', onOnline);
    };
  }, [userId, push]);

  const save = useCallback((value: StrongMindSetting) => {
    setSetting(value);
    setLoaded(true);
    if (!userId) return;
    writeStored(userId, { ...value, pending: true });
    window.dispatchEvent(new Event(CHANGED_EVENT));
    if (navigator.onLine) push(userId, value);
  }, [userId, push]);

  return {
    enabled: setting.enabled,
    answered: setting.answered,
    loaded,
    /** Profile toggle or "Turn on": either way the question counts as answered. */
    setEnabled: (enabled: boolean) => save({ enabled, answered: true }),
    /** "Not now": tracking stays off and the question isn't asked again. */
    dismissPrompt: () => save({ enabled: setting.enabled, answered: true }),
  };
}
