'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOffline } from '@/hooks/useOffline';
import LanguageSwitcher from './LanguageSwitcher';
import { NotificationBell } from './NotificationBell';
import UserMenu from './UserMenu';

export const NavigationHeader = () => {
  const { t } = useLanguage();
  const { isOnline } = useOffline();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Check if user is logged in
  const isLoggedIn = !!session?.user;

  const navigation = [
    { name: t('nav.home') || 'Home', href: '/', icon: '🏠' },
    { name: t('nav.dashboard') || 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: t('nav.workouts') || 'Workouts', href: '/workouts', icon: '🏋️' },
    { name: t('nav.calendar') || 'Calendar', href: '/calendar', icon: '📅' },
    { name: t('nav.statistics') || 'Statistics', href: '/statistics', icon: '📈' },
    { name: t('strongMind.title') || 'Strong Mind', href: '/strong-mind', icon: '🧠' },
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
      <header className="lg:hidden bg-uc-black border-b border-uc-dark-bg sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🦄</span>
              <span className="font-bold text-uc-text-light">{t('app.name') || 'Unicorn Climb'}</span>
            </Link>

            {/* Right side controls */}
            <div className="flex items-center space-x-2">
              {/* Notification bell - only show for logged in users */}
              {isLoggedIn && <NotificationBell size="sm" showLabel={false} />}
              
              {/* Online status indicator - only show for logged in users */}
              {isLoggedIn && (
                <div className="flex items-center space-x-1 px-2 py-1 rounded-xl bg-uc-dark-bg/50">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-uc-success' : 'bg-uc-mustard'}`} />
                  <span className="text-xs text-uc-text-muted">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              )}
              
              {/* Language switcher */}
              <div className="px-2 py-1 rounded-xl bg-uc-dark-bg/50">
                <LanguageSwitcher />
              </div>
              
              {/* User menu */}
              <UserMenu />

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl bg-uc-dark-bg/50 hover:bg-uc-dark-bg transition-colors text-uc-text-light"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="mt-4 pb-4 border-t border-uc-dark-bg">
              <nav className="flex flex-col space-y-2 pt-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-uc-purple/20 text-uc-mustard'
                        : 'text-uc-text-muted hover:bg-uc-dark-bg/50 hover:text-uc-text-light'
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
      <header className="hidden lg:block bg-uc-black border-b border-uc-dark-bg sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <span className="text-2xl">🦄</span>
              <span className="text-xl font-bold text-uc-text-light">{t('app.name') || 'Unicorn Climb'}</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-uc-purple/20 text-uc-mustard'
                      : 'text-uc-text-muted hover:bg-uc-dark-bg/50 hover:text-uc-text-light'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Right side controls */}
            <div className="flex items-center space-x-2">
              {/* Notification bell - only show for logged in users */}
              {isLoggedIn && <NotificationBell size="md" showLabel={false} />}
              
              {/* Online status indicator with label - only show for logged in users */}
              {isLoggedIn && (
                <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-uc-dark-bg/50">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-uc-success' : 'bg-uc-mustard'}`} />
                  <span className="text-sm text-uc-text-muted">
                    {isOnline ? (t('common.online') || 'Online') : (t('common.offline') || 'Offline')}
                  </span>
                </div>
              )}
              
              {/* Language switcher */}
              <div className="px-3 py-2 rounded-xl bg-uc-dark-bg/50">
                <LanguageSwitcher />
              </div>
              
              {/* User menu */}
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

    </>
  );
};
