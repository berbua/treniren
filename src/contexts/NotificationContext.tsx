'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationService, NotificationMessage, NotificationSettings } from '@/lib/notification-service';
import { processCycleNotifications, scheduleDailyCycleCheck } from '@/lib/cycle-notifications';
import { processActivityNotifications, scheduleDailyActivityCheck } from '@/lib/activity-notifications';
import { processWorkoutInactivityNotifications, scheduleDailyWorkoutInactivityCheck } from '@/lib/workout-inactivity-notifications';
import { processTestReminderNotifications, scheduleDailyTestReminderCheck } from '@/lib/test-reminder-notifications';
import { useCycle } from './CycleContext';

interface NotificationContextType {
  messages: NotificationMessage[];
  unreadCount: number;
  settings: NotificationSettings;
  isMessagesPanelOpen: boolean;
  setIsMessagesPanelOpen: (open: boolean) => void;
  updateSettings: (settings: NotificationSettings) => void;
  addMessage: (message: Omit<NotificationMessage, 'id' | 'timestamp' | 'read'>) => NotificationMessage;
  markAsRead: (messageId: string) => void;
  markAllAsRead: () => void;
  removeMessage: (messageId: string) => void;
  clearAllMessages: () => void;
  requestNotificationPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { cycleSettings, isCycleTrackingEnabled } = useCycle();
  const [messages, setMessages] = useState<NotificationMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getDefaultSettings());
  const [isMessagesPanelOpen, setIsMessagesPanelOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    setMessages(notificationService.getMessages());
    setUnreadCount(notificationService.getUnreadCount());
    setSettings(notificationService.getSettings());
  }, []);

  // Subscribe to message updates
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((updatedMessages) => {
      setMessages(updatedMessages);
      setUnreadCount(notificationService.getUnreadCount());
    });

    return unsubscribe;
  }, []);

  // Process cycle notifications when cycle settings change
  useEffect(() => {
    if (isCycleTrackingEnabled && cycleSettings) {
      // Process notifications immediately
      const newNotifications = processCycleNotifications(cycleSettings, settings);
      
      // Send push notifications for new messages if enabled
      if (settings.pushNotificationsEnabled) {
        newNotifications.forEach(notification => {
          notificationService.sendPushNotification(notification);
        });
      }
    }
  }, [cycleSettings, isCycleTrackingEnabled, settings]);

  // Process activity notifications when workouts change
  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const response = await fetch('/api/workouts', { credentials: 'include' });
        if (response.ok) {
          const workouts = await response.json();
          if (workouts.length > 0) {
            // Process activity notifications
            const activityNotifications = processActivityNotifications(workouts);
            
            // Process workout inactivity notifications
            const inactivityNotifications = processWorkoutInactivityNotifications(workouts, {
              workoutInactivityEnabled: settings.workoutInactivityEnabled,
              workoutInactivityDays: settings.workoutInactivityDays
            });
            
            // Combine all notifications
            const allNotifications = [...activityNotifications, ...inactivityNotifications];
            
            // Send push notifications for new messages if enabled
            if (settings.pushNotificationsEnabled) {
              allNotifications.forEach(notification => {
                notificationService.sendPushNotification(notification);
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading workouts for activity notifications:', error);
      }
    };

    loadWorkouts();
  }, [settings.pushNotificationsEnabled, settings.workoutInactivityEnabled, settings.workoutInactivityDays]);

  // Process test reminder notifications
  useEffect(() => {
    const loadTestReminders = async () => {
      try {
        // Load test reminder settings
        const settingsResponse = await fetch('/api/test-reminder');
        if (settingsResponse.ok) {
          const reminderSettings = await settingsResponse.json();
          
          if (reminderSettings.testReminderEnabled && reminderSettings.testReminderInterval && reminderSettings.testReminderUnit) {
            // Load test results
            const testResultsResponse = await fetch('/api/fingerboard-test-results?protocolId=all');
            if (testResultsResponse.ok) {
              const testResults = await testResultsResponse.json();
              
              if (testResults.length > 0) {
                const testNotifications = processTestReminderNotifications(testResults, {
                  testReminderEnabled: reminderSettings.testReminderEnabled,
                  testReminderInterval: reminderSettings.testReminderInterval,
                  testReminderUnit: reminderSettings.testReminderUnit
                });
                
                // Send push notifications for new messages if enabled
                if (settings.pushNotificationsEnabled) {
                  testNotifications.forEach(notification => {
                    notificationService.sendPushNotification(notification);
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading test reminders:', error);
      }
    };

    loadTestReminders();
  }, [settings.pushNotificationsEnabled]);

  // Schedule daily cycle checks
  useEffect(() => {
    if (isCycleTrackingEnabled && cycleSettings) {
      const cleanup = scheduleDailyCycleCheck(cycleSettings);
      return cleanup;
    }
  }, [cycleSettings, isCycleTrackingEnabled]);

  // Schedule daily activity checks
  useEffect(() => {
    const loadWorkoutsForScheduling = async () => {
      try {
        const response = await fetch('/api/workouts', { credentials: 'include' });
        if (response.ok) {
          const workouts = await response.json();
          if (workouts.length > 0) {
            const activityCleanup = scheduleDailyActivityCheck(workouts);
            const inactivityCleanup = scheduleDailyWorkoutInactivityCheck(workouts, {
              workoutInactivityEnabled: settings.workoutInactivityEnabled,
              workoutInactivityDays: settings.workoutInactivityDays
            });
            
            return () => {
              activityCleanup();
              inactivityCleanup();
            };
          }
        }
      } catch (error) {
        console.error('Error loading workouts for activity scheduling:', error);
      }
      return () => {};
    };

    const cleanupPromise = loadWorkoutsForScheduling();
    return () => {
      cleanupPromise.then(cleanup => cleanup());
    };
  }, [settings.workoutInactivityEnabled, settings.workoutInactivityDays]);

  // Schedule daily test reminder checks
  useEffect(() => {
    const loadTestRemindersForScheduling = async () => {
      try {
        const settingsResponse = await fetch('/api/test-reminder');
        if (settingsResponse.ok) {
          const reminderSettings = await settingsResponse.json();
          
          if (reminderSettings.testReminderEnabled && reminderSettings.testReminderInterval && reminderSettings.testReminderUnit) {
            const testResultsResponse = await fetch('/api/fingerboard-test-results?protocolId=all');
            if (testResultsResponse.ok) {
              const testResults = await testResultsResponse.json();
              
              if (testResults.length > 0) {
                const testCleanup = scheduleDailyTestReminderCheck(testResults, {
                  testReminderEnabled: reminderSettings.testReminderEnabled,
                  testReminderInterval: reminderSettings.testReminderInterval,
                  testReminderUnit: reminderSettings.testReminderUnit
                });
                
                return testCleanup;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading test reminders for scheduling:', error);
      }
      return () => {};
    };

    const cleanupPromise = loadTestRemindersForScheduling();
    return () => {
      cleanupPromise.then(cleanup => cleanup());
    };
  }, []);

  const updateSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    notificationService.saveSettings(newSettings);
  };

  const addMessage = (message: Omit<NotificationMessage, 'id' | 'timestamp' | 'read'>): NotificationMessage => {
    return notificationService.addMessage(message);
  };

  const markAsRead = (messageId: string) => {
    notificationService.markAsRead(messageId);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const removeMessage = (messageId: string) => {
    notificationService.removeMessage(messageId);
  };

  const clearAllMessages = () => {
    notificationService.clearAllMessages();
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    const hasPermission = await notificationService.requestPermission();
    if (hasPermission) {
      updateSettings({ ...settings, pushNotificationsEnabled: true });
    }
    return hasPermission;
  };

  return (
    <NotificationContext.Provider
      value={{
        messages,
        unreadCount,
        settings,
        isMessagesPanelOpen,
        setIsMessagesPanelOpen,
        updateSettings,
        addMessage,
        markAsRead,
        markAllAsRead,
        removeMessage,
        clearAllMessages,
        requestNotificationPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
