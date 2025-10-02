// Cycle notification logic for menstrual cycle reminders
import { CycleSettings, calculateCycleInfo } from './cycle-utils';
import { notificationService, NotificationMessage, NotificationSettings } from './notification-service';

export interface CycleNotificationCheck {
  shouldRemindBeforePeriod: boolean;
  shouldRemindOverdue: boolean;
  daysUntilPeriod: number;
  daysOverdue: number;
  nextPeriodDate: Date;
}

/**
 * Check if cycle notifications should be sent based on current cycle state
 */
export function checkCycleNotifications(cycleSettings: CycleSettings): CycleNotificationCheck {
  const cycleInfo = calculateCycleInfo(cycleSettings);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const nextPeriodDate = new Date(cycleInfo.nextPeriodDate);
  nextPeriodDate.setHours(0, 0, 0, 0);
  
  // Calculate days until next period
  const daysUntilPeriod = Math.ceil(
    (nextPeriodDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Calculate days overdue (if current cycle is longer than expected)
  const daysOverdue = Math.max(0, daysUntilPeriod * -1);
  
  // Check if we should remind 1 day before period
  const shouldRemindBeforePeriod = daysUntilPeriod === 1;
  
  // Check if we should remind about overdue period (cycle longer than 32 days)
  const shouldRemindOverdue = daysOverdue > 0 && cycleSettings.cycleLength + daysOverdue > 32;
  
  return {
    shouldRemindBeforePeriod,
    shouldRemindOverdue,
    daysUntilPeriod,
    daysOverdue,
    nextPeriodDate
  };
}

/**
 * Create cycle reminder notification
 */
export function createCycleReminderNotification(
  cycleSettings: CycleSettings,
  check: CycleNotificationCheck
): Omit<NotificationMessage, 'id' | 'timestamp' | 'read'> {
  if (check.shouldRemindBeforePeriod) {
    return {
      type: 'cycle_reminder',
      title: '🔄 Period Reminder',
      message: `Your period is expected tomorrow (${formatDate(check.nextPeriodDate)}). Time to prepare for the menstrual phase!`,
      priority: 'medium',
      actionButton: {
        text: 'Mark Period Started',
        action: 'mark_period_started',
        data: { date: check.nextPeriodDate.toISOString() }
      }
    };
  }
  
  if (check.shouldRemindOverdue) {
    return {
      type: 'cycle_overdue',
      title: '⚠️ Cycle Overdue',
      message: `Your period is ${check.daysOverdue} day${check.daysOverdue > 1 ? 's' : ''} overdue (cycle day ${cycleSettings.cycleLength + check.daysOverdue}). Your period should have started by now.`,
      priority: 'high',
      actionButton: {
        text: 'Update Period Date',
        action: 'update_period_date',
        data: { 
          suggestedDate: new Date().toISOString(),
          originalCycleLength: cycleSettings.cycleLength,
          currentCycleLength: cycleSettings.cycleLength + check.daysOverdue
        }
      }
    };
  }
  
  // This shouldn't happen, but return a default notification
  return {
    type: 'cycle_reminder',
    title: 'Cycle Update',
    message: 'Your cycle is progressing normally.',
    priority: 'low'
  };
}

/**
 * Process cycle notifications and send them if needed
 */
export function processCycleNotifications(cycleSettings: CycleSettings, settings?: NotificationSettings): NotificationMessage[] {
  const check = checkCycleNotifications(cycleSettings);
  const notifications: NotificationMessage[] = [];
  
  // Get notification settings
  const notificationSettings = settings || notificationService.getSettings();
  
  // Check if we should send before period reminder
  if (check.shouldRemindBeforePeriod && notificationSettings.cycleRemindersEnabled) {
    const existingReminder = notificationService.getMessages().find(
      msg => msg.type === 'cycle_reminder' && 
             msg.timestamp.toDateString() === new Date().toDateString()
    );
    
    if (!existingReminder) {
      const notification = createCycleReminderNotification(cycleSettings, check);
      const sentNotification = notificationService.addMessage(notification);
      notifications.push(sentNotification);
    }
  }
  
  // Check if we should send overdue reminder (only if late period notifications are enabled)
  if (check.shouldRemindOverdue && notificationSettings.latePeriodNotificationsEnabled) {
    const existingOverdue = notificationService.getMessages().find(
      msg => msg.type === 'cycle_overdue' && 
             msg.timestamp.toDateString() === new Date().toDateString()
    );
    
    if (!existingOverdue) {
      const notification = createCycleReminderNotification(cycleSettings, check);
      const sentNotification = notificationService.addMessage(notification);
      notifications.push(sentNotification);
    }
  }
  
  return notifications;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return `${weekdays[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Check if cycle notifications should be processed (daily check)
 */
export function shouldProcessCycleNotifications(cycleSettings: CycleSettings): boolean {
  if (!cycleSettings) return false;
  
  const check = checkCycleNotifications(cycleSettings);
  return check.shouldRemindBeforePeriod || check.shouldRemindOverdue;
}

/**
 * Schedule daily cycle notification check
 */
export function scheduleDailyCycleCheck(cycleSettings: CycleSettings | null): () => void {
  if (!cycleSettings) {
    return () => {}; // Return empty cleanup function
  }
  
  // Check immediately
  processCycleNotifications(cycleSettings);
  
  // Set up interval to check daily at 9 AM
  const checkInterval = setInterval(() => {
    const now = new Date();
    if (now.getHours() === 9 && now.getMinutes() < 5) {
      processCycleNotifications(cycleSettings);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
  
  // Return cleanup function
  return () => clearInterval(checkInterval);
}
