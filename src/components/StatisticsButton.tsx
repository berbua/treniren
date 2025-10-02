'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface StatisticsButtonProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onClick: () => void;
}

export const StatisticsButton = ({ size = 'md', showLabel = false, onClick }: StatisticsButtonProps) => {
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
      onClick={onClick}
      className={`relative ${sizeClasses[size]} rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors group`}
      title={t('nav.statistics') || 'Statistics'}
    >
      {/* Chart Icon */}
      <svg 
        className={`${iconSizes[size]} text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
        />
      </svg>

      {/* Label */}
      {showLabel && (
        <span className={`ml-2 ${textSizes[size]} font-medium text-slate-700 dark:text-slate-300`}>
          {t('nav.statistics') || 'Statistics'}
        </span>
      )}
    </button>
  );
};
