// Activity notification logic for mental sessions and falls tracking
import { Workout } from '@/types/workout';
import { notificationService, NotificationMessage } from './notification-service';
import { statisticsService } from './statistics-service';

export interface ActivityNotificationCheck {
  shouldRemindMentalSession: boolean;
  shouldRemindFalls: boolean;
  daysSinceLastMentalSession: number;
  daysSinceLastFall: number;
}

/**
 * Check if activity notifications should be sent
 */
export function checkActivityNotifications(workouts: Workout[]): ActivityNotificationCheck {
  
  // Get all workouts from the last 90 days for analysis
  const recentTimeRange = statisticsService.getTimeRange('3months');
  const recentWorkouts = statisticsService.filterWorkoutsByTimeRange(workouts, recentTimeRange);
  
  // "Days since last" comes from all workouts, so it's correct even when the last session or fall
  // was more than 3 months ago (it used to read Infinity, or the reminder stopped for good)
  const mentalStats = statisticsService.calculateMentalSessionStats(workouts);
  const fallsStats = statisticsService.calculateFallsStats(workouts);
  // Falls reminders only make sense while actively climbing
  const recentFallsStats = statisticsService.calculateFallsStats(recentWorkouts);
  
  // Check if we should remind about mental sessions (more than 7 days)
  const shouldRemindMentalSession = mentalStats.totalSessions > 0 && mentalStats.daysSinceLastSession > 7;
  
  // Check if we should remind about falls (more than 30 days, while climbing in the last 3 months).
  // No reminder if no fall was ever logged - there's no day count to show.
  const shouldRemindFalls = Number.isFinite(fallsStats.daysSinceLastFall) && fallsStats.daysSinceLastFall > 30 &&
    recentFallsStats.totalClimbingSessions > 0;
  
  return {
    shouldRemindMentalSession,
    shouldRemindFalls,
    daysSinceLastMentalSession: mentalStats.daysSinceLastSession,
    daysSinceLastFall: fallsStats.daysSinceLastFall,
  };
}

/**
 * Create mental session reminder notification
 */
export function createMentalSessionNotification(check: ActivityNotificationCheck): Omit<NotificationMessage, 'id' | 'timestamp' | 'read'> {
  const daysText = check.daysSinceLastMentalSession === 1 ? '1 day' : `${check.daysSinceLastMentalSession} days`;
  
  return {
    type: 'general',
    title: '🧘 Mental Practice Reminder',
    message: `It's been ${daysText} since your last mental practice session. Regular mental training is important for climbing performance and well-being.`,
    priority: 'medium',
    actionButton: {
      text: 'Log Mental Session',
      action: 'create_mental_workout',
      data: { type: 'MENTAL_PRACTICE' }
    }
  };
}

/**
 * Create falls tracking reminder notification
 */
export function createFallsTrackingNotification(check: ActivityNotificationCheck): Omit<NotificationMessage, 'id' | 'timestamp' | 'read'> {
  const daysText = check.daysSinceLastFall === 1 ? '1 day' : `${check.daysSinceLastFall} days`;
  
  return {
    type: 'general',
    title: '🧗‍♀️ Falls Tracking Reminder',
    message: `It's been ${daysText} since you last took a fall while climbing. Taking falls is a normal part of pushing your limits and improving your climbing. Consider challenging yourself more!`,
    priority: 'low',
    actionButton: {
      text: 'Log Climbing Session',
      action: 'create_climbing_workout',
      data: { types: ['BOULDERING', 'LEAD_ROCK', 'LEAD_ARTIFICIAL'] }
    }
  };
}

/**
 * Process activity notifications and send them if needed
 */
export function processActivityNotifications(workouts: Workout[]): NotificationMessage[] {
  const check = checkActivityNotifications(workouts);
  const notifications: NotificationMessage[] = [];
  
  // Check if we should send mental session reminder
  if (check.shouldRemindMentalSession) {
    const existingReminder = notificationService.getMessages().find(
      msg => msg.type === 'general' && 
             msg.title.includes('Mental Practice Reminder') &&
             msg.timestamp.toDateString() === new Date().toDateString()
    );
    
    if (!existingReminder) {
      const notification = createMentalSessionNotification(check);
      const sentNotification = notificationService.addMessage(notification);
      notifications.push(sentNotification);
    }
  }
  
  // Check if we should send falls tracking reminder
  if (check.shouldRemindFalls) {
    const existingReminder = notificationService.getMessages().find(
      msg => msg.type === 'general' && 
             msg.title.includes('Falls Tracking Reminder') &&
             msg.timestamp.toDateString() === new Date().toDateString()
    );
    
    if (!existingReminder) {
      const notification = createFallsTrackingNotification(check);
      const sentNotification = notificationService.addMessage(notification);
      notifications.push(sentNotification);
    }
  }
  
  return notifications;
}

/**
 * Check if activity notifications should be processed (daily check)
 */
export function shouldProcessActivityNotifications(workouts: Workout[]): boolean {
  const check = checkActivityNotifications(workouts);
  return check.shouldRemindMentalSession || check.shouldRemindFalls;
}

/**
 * Schedule daily activity notification check
 */
export function scheduleDailyActivityCheck(workouts: Workout[], reloadWorkouts?: () => Promise<Workout[]>): () => void {
  if (workouts.length === 0) {
    return () => {}; // Return empty cleanup function
  }
  
  // Check immediately
  processActivityNotifications(workouts);
  
  // Set up interval to check daily at 10 AM (1 hour after cycle check)
  const checkInterval = setInterval(() => {
    const now = new Date();
    if (now.getHours() === 10 && now.getMinutes() < 5) {
      // Reload so workouts logged since the page opened count (PWA left open for days)
      (reloadWorkouts ? reloadWorkouts() : Promise.resolve(workouts))
        .then(latest => processActivityNotifications(latest))
        .catch(error => console.error('Failed to run activity check:', error));
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
  
  // Return cleanup function
  return () => clearInterval(checkInterval);
}
