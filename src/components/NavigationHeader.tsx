'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOffline } from '@/hooks/useOffline';
import LanguageSwitcher from './LanguageSwitcher';
import { UserProfile } from './UserProfile';

export const NavigationHeader = () => {
  const { t } = useLanguage();
  const { isOnline } = useOffline();
  const pathname = usePathname();
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: t('nav.home'), href: '/', icon: '🏠' },
    { name: t('nav.workouts'), href: '/workouts', icon: '🏋️' },
    { name: t('nav.calendar'), href: '/calendar', icon: '📅' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

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
              
              {/* User profile button */}
              <button
                onClick={() => setShowUserProfile(true)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                <span className="text-lg">👤</span>
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
                  {isOnline ? t('common.online') : t('common.offline')}
                </span>
              </div>
              
              {/* Language switcher */}
              <LanguageSwitcher />
              
              {/* User profile button */}
              <button
                onClick={() => setShowUserProfile(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <span className="text-lg">👤</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('nav.profile')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfile onClose={() => setShowUserProfile(false)} />
      )}
    </>
  );
};
