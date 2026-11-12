// Uploads workouts saved in offline storage to the server
import {
  OfflineWorkout,
  getPendingUploadWorkouts,
  markWorkoutAsUploaded,
  markWorkoutSyncError,
  setLastSyncTime,
} from './offline-storage';

// Fired on window when offline storage changes in this tab (the `storage` event only fires in other tabs)
export const OFFLINE_WORKOUTS_CHANGED_EVENT = 'offline-workouts-changed';
// Fired on window after at least one workout was uploaded, so pages can refetch their data
export const OFFLINE_WORKOUTS_SYNCED_EVENT = 'offline-workouts-synced';

const SYNC_LOCK_NAME = 'treniren-offline-sync';

export interface SyncResult {
  uploaded: number;
  failed: number;
  // Refused by the server; kept until the user discards them (see OfflineWorkout.rejected)
  rejected: number;
  // True when sync was skipped because another sync (this tab or another) is already running
  skipped: boolean;
}

interface TokenProvider {
  getToken: () => Promise<string>;
  refreshToken: (force?: boolean) => Promise<string>;
}

// Map the stored workout to the POST /api/workouts payload
export const toCreateWorkoutPayload = (workout: OfflineWorkout) => {
  const type = workout.type.toUpperCase();
  const isMentalPractice = type === 'MENTAL_PRACTICE';

  return {
    type,
    date: workout.startTime.slice(0, 10),
    trainingVolume: workout.trainingVolume ?? null,
    details: { ...(workout.details || {}), offlineId: workout.id },
    preSessionFeel: workout.preSessionFeel ?? null,
    dayAfterTiredness: workout.dayAfterTiredness ?? null,
    focusLevel: workout.focusLevel ?? null,
    notes: workout.notes ?? null,
    sector: workout.sector ?? null,
    mentalPracticeType: isMentalPractice ? workout.mentalPracticeType ?? null : null,
    // The API only accepts timeOfDay for mental practice
    timeOfDay: isMentalPractice ? workout.timeOfDay ?? null : null,
    gratitude: workout.gratitude ?? null,
    improvements: workout.improvements ?? null,
    mentalState: workout.mentalState ?? null,
  };
};

class AuthRequiredError extends Error {}
// The server refused the workout itself (e.g. invalid data), so sending it again won't help
class RejectedError extends Error {}

// 4xx answers that are about this workout, not about the session, timing or rate limits
const isRejection = (status: number) => status >= 400 && status < 500 && ![401, 403, 408, 429].includes(status);

const postWorkout = async (workout: OfflineWorkout, tokens: TokenProvider): Promise<string> => {
  const body = JSON.stringify(toCreateWorkoutPayload(workout));
  const send = (csrfToken: string) =>
    fetch('/api/workouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      credentials: 'include',
      body,
    });

  let response = await send(await tokens.getToken());

  // If CSRF validation failed, refresh the token and retry once (same as the workout form)
  if (response.status === 403) {
    const errorData = await response.clone().json().catch(() => null);
    if (errorData?.error === 'CSRF token validation failed') {
      response = await send(await tokens.refreshToken(true));
    }
  }

  if (response.status === 401) {
    throw new AuthRequiredError('Authentication required');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.error || `Upload failed with status ${response.status}`;
    throw isRejection(response.status) ? new RejectedError(message) : new Error(message);
  }

  const created = await response.json();
  return created.id as string;
};

// Workouts the signed-in user may upload: their own, plus untagged ones (see OfflineWorkout.userId).
// Rejected ones wait for the user to discard them.
const getUploadableWorkouts = (userId: string) =>
  getPendingUploadWorkouts().filter(workout => !workout.rejected && (!workout.userId || workout.userId === userId));

const uploadPending = async (tokens: TokenProvider, userId: string): Promise<SyncResult> => {
  const pending = getUploadableWorkouts(userId);
  let uploaded = 0;
  let failed = 0;
  let rejected = 0;

  for (const workout of pending) {
    // Stop if the connection dropped mid-sync; the rest stays queued
    if (!navigator.onLine) break;

    try {
      const serverId = await postWorkout(workout, tokens);
      markWorkoutAsUploaded(workout.id, serverId);
      uploaded++;
    } catch (error) {
      if (error instanceof AuthRequiredError) {
        // Not signed in - keep everything queued until the next attempt
        break;
      }
      console.error('Failed to upload offline workout:', workout.id, error);
      const isRejected = error instanceof RejectedError;
      markWorkoutSyncError(workout.id, error instanceof Error ? error.message : 'Upload failed', isRejected);
      if (isRejected) rejected++;
      else failed++;
    }
  }

  if (uploaded > 0) {
    setLastSyncTime(new Date().toISOString());
  }

  return { uploaded, failed, rejected, skipped: false };
};

let inFlight: Promise<SyncResult> | null = null;

export const syncOfflineWorkouts = async (tokens: TokenProvider, userId: string): Promise<SyncResult> => {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { uploaded: 0, failed: 0, rejected: 0, skipped: true };
  }
  if (getUploadableWorkouts(userId).length === 0) {
    return { uploaded: 0, failed: 0, rejected: 0, skipped: false };
  }
  // Already running in this tab
  if (inFlight) {
    return { uploaded: 0, failed: 0, rejected: 0, skipped: true };
  }

  inFlight = (async () => {
    try {
      // Web Locks keep two open tabs from uploading the same workout twice
      if ('locks' in navigator) {
        const result = await navigator.locks.request(
          SYNC_LOCK_NAME,
          { ifAvailable: true },
          async (lock) => (lock ? uploadPending(tokens, userId) : null)
        );
        return result ?? { uploaded: 0, failed: 0, rejected: 0, skipped: true };
      }
      return await uploadPending(tokens, userId);
    } finally {
      window.dispatchEvent(new CustomEvent(OFFLINE_WORKOUTS_CHANGED_EVENT));
    }
  })();

  try {
    const result = await inFlight;
    if (result.uploaded > 0) {
      window.dispatchEvent(new CustomEvent(OFFLINE_WORKOUTS_SYNCED_EVENT, { detail: result }));
    }
    return result;
  } finally {
    inFlight = null;
  }
};
