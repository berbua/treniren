// Notification service for push notifications and in-app messages
// Supports both browser push notifications and in-app message system

export interface NotificationMessage {
  id: string;
  type: 'cycle_reminder' | 'cycle_overdue' | 'workout_reminder' | 'workout_inactivity' | 'general';
  title: string;
  message: string;
  actionButton?: {
    text: string;
    action: string;
    data?: unknown;
  };
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface NotificationSettings {
  pushNotificationsEnabled: boolean;
  cycleRemindersEnabled: boolean;
  cycleOverdueEnabled: boolean;
  latePeriodNotificationsEnabled: boolean;
  workoutRemindersEnabled: boolean;
  workoutInactivityEnabled: boolean;
  workoutInactivityDays: number;
}

class NotificationService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private messages: NotificationMessage[] = [];
  private listeners: ((messages: NotificationMessage[]) => void)[] = [];

  constructor() {
    this.loadMessages();
    this.initializeServiceWorker();
  }

  // Initialize service worker for push notifications
  private async initializeServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Send push notification
  async sendPushNotification(message: NotificationMessage): Promise<boolean> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      return false;
    }

    try {
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(message.title, {
          body: message.message,
          icon: '/icon-192.svg',
          badge: '/icon-192.svg',
          tag: message.id,
          data: {
            notificationId: message.id,
            type: message.type,
            action: message.actionButton?.action,
            actionData: message.actionButton?.data
          }
        });
        return true;
      } else {
        // Fallback to browser notification
        new Notification(message.title, {
          body: message.message,
          icon: '/icon-192.svg',
          tag: message.id
        });
        return true;
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  // Add message to in-app message system
  addMessage(message: Omit<NotificationMessage, 'id' | 'timestamp' | 'read'>): NotificationMessage {
    const newMessage: NotificationMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    this.messages.unshift(newMessage); // Add to beginning
    this.saveMessages();
    this.notifyListeners();
    
    return newMessage;
  }

  // Get all messages
  getMessages(): NotificationMessage[] {
    return [...this.messages];
  }

  // Get unread messages count
  getUnreadCount(): number {
    return this.messages.filter(msg => !msg.read).length;
  }

  // Mark message as read
  markAsRead(messageId: string): void {
    const message = this.messages.find(msg => msg.id === messageId);
    if (message) {
      message.read = true;
      this.saveMessages();
      this.notifyListeners();
    }
  }

  // Mark all messages as read
  markAllAsRead(): void {
    this.messages.forEach(msg => msg.read = true);
    this.saveMessages();
    this.notifyListeners();
  }

  // Remove message
  removeMessage(messageId: string): void {
    this.messages = this.messages.filter(msg => msg.id !== messageId);
    this.saveMessages();
    this.notifyListeners();
  }

  // Clear all messages
  clearAllMessages(): void {
    this.messages = [];
    this.saveMessages();
    this.notifyListeners();
  }

  // Subscribe to message updates
  subscribe(listener: (messages: NotificationMessage[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.messages));
  }

  // Load messages from localStorage
  private loadMessages(): void {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('notification-messages');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.messages = parsed.map((msg: NotificationMessage) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        }
      } catch (error) {
        console.error('Failed to load notification messages:', error);
        this.messages = [];
      }
    }
  }

  // Save messages to localStorage
  private saveMessages(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('notification-messages', JSON.stringify(this.messages));
      } catch (error) {
        console.error('Failed to save notification messages:', error);
      }
    }
  }

  // Get default notification settings
  getDefaultSettings(): NotificationSettings {
    return {
      pushNotificationsEnabled: false,
      cycleRemindersEnabled: true,
      cycleOverdueEnabled: true,
      latePeriodNotificationsEnabled: true,
      workoutRemindersEnabled: false,
      workoutInactivityEnabled: false,
      workoutInactivityDays: 3
    };
  }

  // Load notification settings
  getSettings(): NotificationSettings {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('notification-settings');
        if (saved) {
          return { ...this.getDefaultSettings(), ...JSON.parse(saved) };
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    }
    return this.getDefaultSettings();
  }

  // Save notification settings
  saveSettings(settings: NotificationSettings): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('notification-settings', JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save notification settings:', error);
      }
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
