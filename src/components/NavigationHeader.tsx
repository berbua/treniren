'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOffline } from '@/hooks/useOffline';
import LanguageSwitcher from './LanguageSwitcher';
import { UserProfile } from './UserProfile';
import { NotificationBell } from './NotificationBell';
import { StatisticsButton } from './StatisticsButton';
import { StatisticsDashboard } from './StatisticsDashboard';

export const NavigationHeader = () => {
  const { t } = useLanguage();
  const { isOnline } = useOffline();
  const pathname = usePathname();
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showStatistics, setShowStatistics] = useState(false);

  const navigation = [
    { name: t('nav.home') || 'Home', href: '/', icon: '🏠' },
    { name: t('nav.workouts') || 'Workouts', href: '/workouts', icon: '🏋️' },
    { name: t('nav.calendar') || 'Calendar', href: '/calendar', icon: '📅' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user-profile');
        if (response.ok) {
          const profile = await response.json();
          if (profile?.photoUrl) {
            setUserPhotoUrl(profile.photoUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Avatar component
  const UserAvatar = ({ size = 'w-8 h-8', showLabel = false }: { size?: string; showLabel?: boolean }) => (
    <div className="flex items-center space-x-2">
      <div className={`${size} rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden`}>
        {isLoadingProfile ? (
          <div className="animate-pulse bg-slate-300 dark:bg-slate-600 w-full h-full rounded-full"></div>
        ) : userPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userPhotoUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-lg">👤</span>
        )}
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('nav.profile') || 'Profile'}
        </span>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🏋️‍♀️</span>
              <span className="font-bold text-slate-900 dark:text-slate-50">Treniren</span>
            </Link>

            {/* Right side controls */}
            <div className="flex items-center space-x-3">
              {/* Online status indicator */}
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`} />
              
              {/* Language switcher */}
              <LanguageSwitcher />
              
              {/* Statistics button */}
              <StatisticsButton size="sm" onClick={() => setShowStatistics(true)} />
              
              {/* Notification bell */}
              <NotificationBell size="sm" />
              
              {/* User profile button */}
              <button
                onClick={() => setShowUserProfile(true)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                <UserAvatar size="w-6 h-6" />
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="mt-4 pb-4 border-t border-slate-200 dark:border-slate-700">
              <nav className="flex flex-col space-y-2 pt-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive(item.href)
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <span className="text-2xl">🏋️‍♀️</span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-50">Treniren</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Right side controls */}
            <div className="flex items-center space-x-4">
              {/* Online status indicator with label */}
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-slate-600 dark:text-slate-400">
                  {isOnline ? (t('common.online') || 'Online') : (t('common.offline') || 'Offline')}
                </span>
              </div>
              
              {/* Language switcher */}
              <LanguageSwitcher />
              
              {/* Statistics button */}
              <StatisticsButton size="md" showLabel={true} onClick={() => setShowStatistics(true)} />
              
              {/* Notification bell */}
              <NotificationBell size="md" showLabel={true} />
              
              {/* User profile button */}
              <button
                onClick={() => setShowUserProfile(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <UserAvatar size="w-6 h-6" showLabel={true} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfile 
          onClose={() => setShowUserProfile(false)} 
          onPhotoUpdate={(photoUrl: string | null) => setUserPhotoUrl(photoUrl)}
        />
      )}

      {/* Statistics Dashboard */}
      {showStatistics && (
        <StatisticsDashboard 
          isOpen={showStatistics} 
          onClose={() => setShowStatistics(false)} 
        />
      )}
    </>
  );
};
