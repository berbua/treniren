'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOffline } from '@/hooks/useOffline';
import { NotificationBell } from './NotificationBell';
import UserMenu from './UserMenu';
import LanguageSwitcher from './LanguageSwitcher';

export const NavigationHeader = () => {
  const { t } = useLanguage();
  const { isOnline } = useOffline();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  
  // Check if user is logged in
  const isLoggedIn = !!session?.user;

  // Primary navigation items (always visible on desktop when logged in)
  // Note: "Home" (landing page) is removed for logged-in users - logo links to it instead
  const primaryNavigation = isLoggedIn ? [
    { name: t('nav.dashboard') || 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: t('nav.workouts') || 'Workouts', href: '/workouts', icon: '🏋️' },
    { name: t('nav.calendar') || 'Calendar', href: '/calendar', icon: '📅' },
  ] : [
    { name: t('nav.home') || 'Home', href: '/', icon: '🏠' },
  ];

  // Secondary navigation items (in "More" dropdown on desktop, only when logged in)
  const secondaryNavigation = isLoggedIn ? [
    { name: t('nav.exercises') || 'Exercises', href: '/exercises', icon: '💪' },
    { name: t('nav.routines') || 'Routines', href: '/routines', icon: '👯' },
    { name: t('nav.fingerboardProtocols') || 'Fingerboard', href: '/fingerboard-protocols', icon: '🖐️' },
    { name: t('nav.statistics') || 'Statistics', href: '/statistics', icon: '📈' },
    { name: t('strongMind.title') || 'Strong Mind', href: '/strong-mind', icon: '🧠' },
  ] : [];

  // All navigation items (for mobile menu)
  const allNavigation = [...primaryNavigation, ...secondaryNavigation];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Close "More" menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    }

    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  // Check if any secondary navigation item is active
  const hasActiveSecondary = secondaryNavigation.some(item => isActive(item.href));

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
              
              {/* Language switcher - keep on mobile for easy access */}
              <div className="px-2 py-1 rounded-xl bg-uc-dark-bg/50">
                <LanguageSwitcher />
              </div>
              
              {/* User menu (includes online status badge) - only show when logged in */}
              {isLoggedIn && <UserMenu isOnline={isOnline} />}

              {/* Sign In Button - only show when logged out on mobile */}
              {!isLoggedIn && (
                <Link
                  href="/auth/signin"
                  className="px-3 py-1.5 rounded-xl text-sm font-medium transition-colors bg-uc-purple/20 text-uc-mustard hover:bg-uc-purple/30"
                >
                  {t('auth.signIn') || 'Sign In'}
                </Link>
              )}

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
                {allNavigation.map((item) => (
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
              {/* Primary Navigation Items */}
              {primaryNavigation.map((item) => (
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

              {/* More Dropdown - only show when logged in and there are secondary items */}
              {isLoggedIn && secondaryNavigation.length > 0 && (
                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      hasActiveSecondary || isMoreMenuOpen
                        ? 'bg-uc-purple/20 text-uc-mustard'
                        : 'text-uc-text-muted hover:bg-uc-dark-bg/50 hover:text-uc-text-light'
                    }`}
                  >
                    <span>⋯</span>
                    <span>{t('common.more') || 'More'}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isMoreMenuOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-uc-dark-bg rounded-xl shadow-lg border border-uc-purple/20 py-2 z-50">
                      {secondaryNavigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMoreMenuOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-2 text-sm font-medium transition-colors ${
                            isActive(item.href)
                              ? 'bg-uc-purple/20 text-uc-mustard'
                              : 'text-uc-text-muted hover:bg-uc-dark-bg/50 hover:text-uc-text-light'
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sign In Button - only show when logged out */}
              {!isLoggedIn && (
                <Link
                  href="/auth/signin"
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-uc-purple/20 text-uc-mustard hover:bg-uc-purple/30"
                >
                  <span>{t('auth.signIn') || 'Sign In'}</span>
                </Link>
              )}
            </nav>

            {/* Right side controls */}
            <div className="flex items-center space-x-3">
              {/* Notification bell - only show for logged in users */}
              {isLoggedIn && <NotificationBell size="md" showLabel={false} />}
              
              {/* User menu (includes online status badge and language switcher) */}
              {isLoggedIn && <UserMenu isOnline={isOnline} />}
            </div>
          </div>
        </div>
      </header>

    </>
  );
};
