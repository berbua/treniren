// Test reminder notification logic
import { FingerboardTestResult } from '@/types/workout';
import { notificationService, NotificationMessage } from './notification-service';

export interface TestReminderCheck {
  shouldRemind: boolean;
  daysSinceLastTest: number;
  lastTestDate: Date | null;
}

/**
 * Convert reminder interval to days
 */
function intervalToDays(interval: number, unit: 'days' | 'weeks' | 'months'): number {
  switch (unit) {
    case 'days':
      return interval;
    case 'weeks':
      return interval * 7;
    case 'months':
      return interval * 30; // Approximate
    default:
      return interval;
  }
}

/**
 * Check if test reminder notification should be sent
 */
export function checkTestReminder(
  testResults: FingerboardTestResult[],
  reminderInterval: number,
  reminderUnit: 'days' | 'weeks' | 'months'
): TestReminderCheck {
  if (testResults.length === 0) {
    return {
      shouldRemind: false,
      daysSinceLastTest: 0,
      lastTestDate: null
    };
  }

  // Get the most recent test result
  const sortedResults = [...testResults].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const lastTest = sortedResults[0];
  const lastTestDate = new Date(lastTest.date);
  
  // Calculate days since last test
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastTestDate.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - lastTestDate.getTime();
  const daysSinceLastTest = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Convert reminder interval to days
  const reminderDays = intervalToDays(reminderInterval, reminderUnit);
  
  // Should remind if days since last test >= reminder interval
  const shouldRemind = daysSinceLastTest >= reminderDays;
  
  return {
    shouldRemind,
    daysSinceLastTest,
    lastTestDate
  };
}

/**
 * Create test reminder notification
 */
export function createTestReminderNotification(
  check: TestReminderCheck,
  reminderInterval: number,
  reminderUnit: 'days' | 'weeks' | 'months'
): Omit<NotificationMessage, 'id' | 'timestamp' | 'read'> {
  const unitText = reminderUnit === 'weeks' 
    ? (reminderInterval === 1 ? 'week' : 'weeks')
    : reminderUnit === 'months'
    ? (reminderInterval === 1 ? 'month' : 'months')
    : (reminderInterval === 1 ? 'day' : 'days');
  
  const daysText = check.daysSinceLastTest === 1 
    ? '1 day' 
    : `${check.daysSinceLastTest} days`;
  
  return {
    type: 'general',
    title: '📊 Test Reminder',
    message: `You haven't tested in ${daysText}. Time to track your progress!`,
    priority: 'medium',
    actionButton: {
      text: 'Perform Test',
      action: 'perform_test',
      data: {}
    }
  };
}

/**
 * Process test reminder notifications and send them if needed
 */
export function processTestReminderNotifications(
  testResults: FingerboardTestResult[],
  settings: { 
    testReminderEnabled: boolean; 
    testReminderInterval: number | null; 
    testReminderUnit: string | null;
  }
): NotificationMessage[] {
  const notifications: NotificationMessage[] = [];
  
  if (!settings.testReminderEnabled || !settings.testReminderInterval || !settings.testReminderUnit) {
    return notifications;
  }
  
  const unit = settings.testReminderUnit as 'days' | 'weeks' | 'months';
  const check = checkTestReminder(testResults, settings.testReminderInterval, unit);
  
  if (check.shouldRemind) {
    // Check if we already sent a notification today
    const existingReminder = notificationService.getMessages().find(
      msg => msg.type === 'general' && 
             msg.title.includes('Test Reminder') &&
             msg.timestamp.toDateString() === new Date().toDateString()
    );
    
    if (!existingReminder) {
      const notification = createTestReminderNotification(
        check, 
        settings.testReminderInterval, 
        unit
      );
      const sentNotification = notificationService.addMessage(notification);
      notifications.push(sentNotification);
    }
  }
  
  return notifications;
}

/**
 * Schedule daily test reminder check
 */
export function scheduleDailyTestReminderCheck(
  testResults: FingerboardTestResult[],
  settings: { 
    testReminderEnabled: boolean; 
    testReminderInterval: number | null; 
    testReminderUnit: string | null;
  }
): () => void {
  if (!settings.testReminderEnabled || !settings.testReminderInterval || !settings.testReminderUnit || testResults.length === 0) {
    return () => {}; // Return empty cleanup function
  }
  
  // Check immediately
  processTestReminderNotifications(testResults, settings);
  
  // Set up interval to check daily at 10 AM
  const checkInterval = setInterval(() => {
    const now = new Date();
    if (now.getHours() === 10 && now.getMinutes() < 5) {
      processTestReminderNotifications(testResults, settings);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
  
  // Return cleanup function
  return () => clearInterval(checkInterval);
}




