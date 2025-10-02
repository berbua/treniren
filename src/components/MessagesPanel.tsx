'use client';

import { useState, useEffect } from 'react';
import { notificationService, NotificationMessage } from '@/lib/notification-service';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCycle } from '@/contexts/CycleContext';

interface MessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onActionClick?: (action: string, data?: unknown) => void;
}

export const MessagesPanel = ({ isOpen, onClose, onActionClick }: MessagesPanelProps) => {
  const { t } = useLanguage();
  const { setCycleSettings } = useCycle();
  const [messages, setMessages] = useState<NotificationMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load initial messages
    setMessages(notificationService.getMessages());
    setUnreadCount(notificationService.getUnreadCount());

    // Subscribe to message updates
    const unsubscribe = notificationService.subscribe((updatedMessages) => {
      setMessages(updatedMessages);
      setUnreadCount(notificationService.getUnreadCount());
    });

    return unsubscribe;
  }, []);

  const handleActionClick = async (message: NotificationMessage) => {
    if (!message.actionButton) return;

    const { action, data } = message.actionButton;

    try {
      switch (action) {
        case 'mark_period_started':
          if (data && typeof data === 'object' && 'date' in data) {
            const newSettings = {
              cycleLength: 28, // Default cycle length
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              lastPeriodDate: new Date((data as any).date),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            await setCycleSettings(newSettings);
            notificationService.removeMessage(message.id);
          }
          break;

        case 'update_period_date':
          if (data && typeof data === 'object' && 'suggestedDate' in data) {
            const newSettings = {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cycleLength: (data as any).currentCycleLength || 28,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              lastPeriodDate: new Date((data as any).suggestedDate),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            await setCycleSettings(newSettings);
            notificationService.removeMessage(message.id);
          }
          break;

        default:
      }

      // Call parent action handler if provided
      if (onActionClick) {
        onActionClick(action, data);
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  };

  const handleMarkAsRead = (messageId: string) => {
    notificationService.markAsRead(messageId);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    if (confirm(t('messages.clearAllConfirm') || 'Are you sure you want to clear all messages?')) {
      notificationService.clearAllMessages();
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'cycle_reminder':
        return '🔄';
      case 'cycle_overdue':
        return '⚠️';
      case 'workout_reminder':
        return '🏋️';
      default:
        return '📢';
    }
  };

  const getMessageColor = (type: string, priority: string) => {
    if (priority === 'high') {
      return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
    }
    if (priority === 'medium') {
      return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    }
    return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              📬 {t('messages.title') || 'Messages'}
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all read
              </button>
            )}
            {messages.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {messages.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-2">
                {t('messages.empty') || 'No messages yet'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t('messages.emptyDesc') || 'You\'ll receive cycle reminders and other notifications here.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 border-l-4 ${getMessageColor(message.type, message.priority)} ${
                    !message.read ? 'font-medium' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getMessageIcon(message.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50">
                          {message.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {message.timestamp.toLocaleDateString()} {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!message.read && (
                            <button
                              onClick={() => handleMarkAsRead(message.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {message.message}
                      </p>
                      {message.actionButton && (
                        <button
                          onClick={() => handleActionClick(message)}
                          className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {message.actionButton.text}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
              {unreadCount > 0 && ` • ${unreadCount} unread`}
            </span>
            <span>
              {t('messages.lastUpdated') || 'Last updated'}: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
