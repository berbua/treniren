'use client';

import { useNotifications } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface NotificationBellProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const NotificationBell = ({ size = 'md', showLabel = false }: NotificationBellProps) => {
  const { unreadCount, setIsMessagesPanelOpen } = useNotifications();
  const { t } = useLanguage();

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <button
      onClick={() => setIsMessagesPanelOpen(true)}
      className={`relative ${sizeClasses[size]} rounded-full bg-uc-dark-bg/50 hover:bg-uc-dark-bg flex items-center justify-center transition-colors group border border-uc-purple/20 hover:border-uc-purple/40`}
      title={t('nav.messages') || 'Messages'}
    >
      {/* Bell Icon */}
      <svg 
        className={`${iconSizes[size]} text-uc-text-muted group-hover:text-uc-mustard transition-colors`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
        />
      </svg>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-uc-alert text-uc-text-light text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Label */}
      {showLabel && (
        <span className={`ml-2 ${textSizes[size]} font-medium text-uc-text-light`}>
          {t('nav.messages') || 'Messages'}
        </span>
      )}
    </button>
  );
};
