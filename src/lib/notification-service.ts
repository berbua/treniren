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
  // Injury phase notification
  injuryPhaseNotificationEnabled?: boolean;
  injuryPhaseNotificationPhase?: 'menstrual' | 'follicular' | 'ovulation' | 'earlyLuteal' | 'lateLuteal';
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
        console.log('Registering service worker at /sw.js...');
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service worker registered successfully');
        console.log('   Scope:', this.serviceWorkerRegistration.scope);
        console.log('   Active:', this.serviceWorkerRegistration.active?.state);
        console.log('   Installing:', this.serviceWorkerRegistration.installing?.state);
        console.log('   Waiting:', this.serviceWorkerRegistration.waiting?.state);
        
        // Wait for service worker to be ready
        if (this.serviceWorkerRegistration.installing) {
          console.log('   Service worker is installing, waiting...');
          await new Promise((resolve) => {
            this.serviceWorkerRegistration!.installing!.addEventListener('statechange', () => {
              if (this.serviceWorkerRegistration!.installing?.state === 'installed') {
                resolve(undefined);
              }
            });
          });
        }
        
      } catch (error) {
        console.error('❌ Service worker registration failed:', error);
        console.error('   Error details:', error);
      }
    } else {
      console.error('❌ Service workers not supported in this browser');
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.error('Notifications not supported in this browser');
      return false;
    }

    const currentPermission = Notification.permission;

    if (currentPermission === 'granted') {
      return true;
    }

    if (currentPermission === 'denied') {
      console.error('Notification permission was denied. User must enable it in browser settings.');
      return false;
    }

    // Permission is 'default' - ask user
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
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
      workoutInactivityDays: 3,
      injuryPhaseNotificationEnabled: false,
      injuryPhaseNotificationPhase: undefined,
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

  // Get VAPID public key from server
  async getPublicKey(): Promise<string | null> {
    try {
      const response = await fetch('/api/push/public-key', { credentials: 'include' });
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received public key:', data.publicKey ? 'Yes (length: ' + data.publicKey.length + ')' : 'No');
        return data.publicKey || null;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to get public key. Status:', response.status, 'Error:', errorData);
      }
    } catch (error) {
      console.error('Failed to get public key (network error):', error);
    }
    return null;
  }

  // Subscribe to push notifications
  async subscribeToPush(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      await this.initializeServiceWorker();
      if (!this.serviceWorkerRegistration) {
        console.error('Service worker not available');
        return false;
      }
    }

    // Request permission first
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      if (Notification.permission === 'denied') {
        console.error('Notifications are blocked. User must enable in browser settings.');
      }
      return false;
    }

    try {
      // Get public key
      const publicKey = await this.getPublicKey();
      if (!publicKey) {
        console.error('Failed to get public key - check if VAPID_PUBLIC_KEY is set in .env.local');
        return false;
      }

      // Subscribe to push
      if (!this.serviceWorkerRegistration?.pushManager) {
        console.error('PushManager not available! Service worker might not be ready.');
        return false;
      }
      
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey) as BufferSource
      });

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
          }
        })
      });

      if (response.ok) {
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to save subscription to server:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        // Unsubscribe from push service
        await subscription.unsubscribe();

        // Remove from server
        const response = await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });

        return response.ok;
      }
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Check if user is subscribed to push
  async isSubscribedToPush(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Failed to check push subscription:', error);
      return false;
    }
  }

  // Helper: Convert base64 URL to Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Helper: Convert ArrayBuffer to base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
