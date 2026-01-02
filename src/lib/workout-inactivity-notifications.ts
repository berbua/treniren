// Workout inactivity notification logic
import { Workout } from '@/types/workout';
import { notificationService, NotificationMessage } from './notification-service';

export interface WorkoutInactivityCheck {
  shouldRemind: boolean;
  daysSinceLastWorkout: number;
  lastWorkoutDate: Date | null;
}

/**
 * Check if workout inactivity notification should be sent
 */
export function checkWorkoutInactivity(
  workouts: Workout[],
  inactivityDays: number
): WorkoutInactivityCheck {
  if (workouts.length === 0) {
    return {
      shouldRemind: false,
      daysSinceLastWorkout: 0,
      lastWorkoutDate: null
    };
  }

  // Get the most recent workout
  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  const lastWorkout = sortedWorkouts[0];
  const lastWorkoutDate = new Date(lastWorkout.startTime);
  
  // Calculate days since last workout
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastWorkoutDate.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - lastWorkoutDate.getTime();
  const daysSinceLastWorkout = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Should remind if days since last workout >= inactivityDays
  const shouldRemind = daysSinceLastWorkout >= inactivityDays;
  
  return {
    shouldRemind,
    daysSinceLastWorkout,
    lastWorkoutDate
  };
}

/**
 * Create workout inactivity notification
 */
export function createWorkoutInactivityNotification(
  check: WorkoutInactivityCheck
): Omit<NotificationMessage, 'id' | 'timestamp' | 'read'> {
  const daysText = check.daysSinceLastWorkout === 1 
    ? '1 day' 
    : `${check.daysSinceLastWorkout} days`;
  
  return {
    type: 'workout_inactivity',
    title: '🏋️ Workout Reminder',
    message: `You haven't logged a workout in ${daysText}. Time to get back on track!`,
    priority: 'medium',
    actionButton: {
      text: 'Log Workout',
      action: 'create_workout',
      data: {}
    }
  };
}

/**
 * Process workout inactivity notifications and send them if needed
 */
export function processWorkoutInactivityNotifications(
  workouts: Workout[],
  settings: { workoutInactivityEnabled: boolean; workoutInactivityDays: number }
): NotificationMessage[] {
  const notifications: NotificationMessage[] = [];
  
  if (!settings.workoutInactivityEnabled) {
    return notifications;
  }
  
  const check = checkWorkoutInactivity(workouts, settings.workoutInactivityDays);
  
  if (check.shouldRemind) {
    // Check if we already sent a notification today
    const existingReminder = notificationService.getMessages().find(
      msg => msg.type === 'workout_inactivity' && 
             msg.timestamp.toDateString() === new Date().toDateString()
    );
    
    if (!existingReminder) {
      const notification = createWorkoutInactivityNotification(check);
      const sentNotification = notificationService.addMessage(notification);
      notifications.push(sentNotification);
    }
  }
  
  return notifications;
}

/**
 * Schedule daily workout inactivity check
 */
export function scheduleDailyWorkoutInactivityCheck(
  workouts: Workout[],
  settings: { workoutInactivityEnabled: boolean; workoutInactivityDays: number }
): () => void {
  if (!settings.workoutInactivityEnabled || workouts.length === 0) {
    return () => {}; // Return empty cleanup function
  }
  
  // Check immediately
  processWorkoutInactivityNotifications(workouts, settings);
  
  // Set up interval to check daily at 9 AM
  const checkInterval = setInterval(() => {
    const now = new Date();
    if (now.getHours() === 9 && now.getMinutes() < 5) {
      processWorkoutInactivityNotifications(workouts, settings);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
  
  // Return cleanup function
  return () => clearInterval(checkInterval);
}




