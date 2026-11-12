'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notificationService, NotificationMessage } from '@/lib/notification-service';
import { useLanguage } from '@/contexts/LanguageContext';
import { toLocalDateString } from '@/lib/date-utils';
import { useCycle } from '@/contexts/CycleContext';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Button, Card, EmptyState } from '@/components/ui';

interface MessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onActionClick?: (action: string, data?: unknown) => void;
}

export const MessagesPanel = ({ isOpen, onClose, onActionClick }: MessagesPanelProps) => {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { cycleSettings, setCycleSettings } = useCycle();
  const [messages, setMessages] = useState<NotificationMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

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
              // Keep the user's cycle length
              cycleLength: cycleSettings?.cycleLength || 28,
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
              // The period started by now: use the day the button is clicked, not when the reminder was created
              lastPeriodDate: new Date(toLocalDateString()),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            await setCycleSettings(newSettings);
            notificationService.removeMessage(message.id);
          }
          break;

        case 'create_workout':
          // Navigate to workouts page to create a workout
          router.push('/workouts');
          notificationService.markAsRead(message.id);
          onClose();
          break;

        case 'create_mental_workout':
          // Navigate to workouts page with mental practice type
          router.push('/workouts?type=MENTAL_PRACTICE');
          notificationService.markAsRead(message.id);
          onClose();
          break;

        case 'create_climbing_workout':
          // Navigate to workouts page
          router.push('/workouts');
          notificationService.markAsRead(message.id);
          onClose();
          break;

        case 'perform_test':
          // Navigate to fingerboard testing page
          router.push('/fingerboard-testing');
          notificationService.markAsRead(message.id);
          onClose();
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
    notificationService.clearAllMessages();
    setIsClearConfirmOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !isClearConfirmOpen && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose, isClearConfirmOpen]);

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'cycle_reminder':
        return '🔄';
      case 'cycle_overdue':
        return '⚠️';
      case 'workout_reminder':
        return '🏋️';
      case 'workout_inactivity':
        return '🏋️';
      default:
        return '📢';
    }
  };

  const locale = language === 'pl' ? 'pl-PL' : 'en-GB';
  const formatTimestamp = (timestamp: Date) => {
    const time = timestamp.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    const day = toLocalDateString(timestamp);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (day === toLocalDateString()) return `${t('common.today') || 'Today'}, ${time}`;
    if (day === toLocalDateString(yesterday)) return `${t('common.yesterday') || 'Yesterday'}, ${time}`;
    return `${timestamp.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}, ${time}`;
  };

  if (!isOpen) return null;

  const title = t('messages.title') || 'Messages';

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 hidden sm:block bg-uc-scrim" onClick={onClose} aria-hidden />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="relative flex h-full w-full sm:max-w-md flex-col bg-uc-bg sm:bg-uc-elevated text-uc-text sm:border-l sm:border-uc-border sm:shadow-uc pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
        >
          {/* Header */}
          <div className="px-4 pt-3 pb-3 space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                aria-label={t('common.close') || 'Close'}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-uc-text hover:bg-uc-surface transition-colors -ml-2"
              >
                <svg aria-hidden className="size-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <h2 className="text-[28px] leading-9 font-extrabold">{title}</h2>
              {unreadCount > 0 && (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-uc-pill bg-uc-accent px-2 text-xs font-extrabold text-uc-on-accent uc-num">
                  {unreadCount}
                </span>
              )}
            </div>
            {messages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" onClick={handleMarkAllAsRead}>
                    {t('messages.markAllRead') || 'Mark all read'}
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setIsClearConfirmOpen(true)} className="text-uc-error">
                  {t('messages.clearAll') || 'Clear all'}
                </Button>
              </div>
            )}
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {messages.length === 0 ? (
              <EmptyState
                icon="📭"
                title={t('messages.empty') || 'No messages yet'}
                description={t('messages.emptyDesc') || 'You\'ll receive cycle reminders and other notifications here.'}
              />
            ) : (
              <ul className="space-y-3">
                {messages.map((message) => (
                  <li key={message.id}>
                    <Card className={message.priority === 'high' && !message.read ? 'border-uc-error/50' : ''}>
                      <div className="flex items-start gap-3">
                        <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-uc-elevated text-xl">
                          {getMessageIcon(message.type)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {!message.read && <span aria-hidden className="size-2 shrink-0 rounded-full bg-uc-accent" />}
                            <h3 className="text-[15px] font-extrabold leading-5">{message.title}</h3>
                            {message.priority === 'high' && (
                              <span className="rounded-md bg-uc-error-bg px-1.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-uc-error">
                                {t('messages.priorityHigh') || 'High'}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-uc-text-muted">{message.message}</p>
                          <p className="mt-1 text-xs font-semibold text-uc-text-muted uc-num">{formatTimestamp(message.timestamp)}</p>
                        </div>
                      </div>
                      {(!message.read || message.actionButton) && (
                        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                          {!message.read && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(message.id)}
                              className="min-h-11 px-3 rounded-uc-input text-sm font-bold text-uc-text-muted hover:text-uc-text hover:bg-uc-elevated transition-colors"
                            >
                              {t('messages.markRead') || 'Mark read'}
                            </button>
                          )}
                          {message.actionButton && (
                            <Button variant="tonal" onClick={() => handleActionClick(message)}>
                              {message.actionButton.text}
                            </Button>
                          )}
                        </div>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-uc-border flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-semibold text-uc-text-muted">
            <span className="uc-num">
              {messages.length} {messages.length === 1 ? t('messages.message') || 'message' : t('messages.messages_plural') || 'messages'}
              {unreadCount > 0 && ` · ${unreadCount} ${t('messages.unread') || 'unread'}`}
            </span>
            <span className="uc-num">
              {t('messages.lastUpdated') || 'Last updated'}: {new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleClearAll}
        title={t('messages.clearAll') || 'Clear all'}
        message={t('messages.clearAllConfirm') || 'Are you sure you want to clear all messages?'}
        confirmText={t('messages.clearAll') || 'Clear all'}
      />
    </>
  );
};
