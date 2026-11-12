'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCycle } from '@/contexts/CycleContext';
import { useOffline } from '@/hooks/useOffline';
import { NotificationBell } from './NotificationBell';
import UserMenu from './UserMenu';
import LanguageSwitcher from './LanguageSwitcher';
import { BottomSheet, Icon, IconName, Overline, buttonClasses, phaseBandBg, phaseSolidBg, phaseTranslationKey } from './ui';

interface NavItem {
  name: string;
  href: string;
  icon: IconName;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Logged-in app: floating bottom tab bar + "More" sheet on phones, left sidebar from `lg`. */
export const NavigationHeader = () => {
  const { t } = useLanguage();
  const { isOnline } = useOffline();
  const { data: session } = useSession();
  const { cycleInfo, cycleSettings, isCycleTrackingEnabled } = useCycle();
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isLoggedIn = !!session?.user;

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const item = (key: string, fallback: string, href: string, icon: IconName): NavItem => ({
    name: t(key) || fallback,
    href,
    icon,
  });

  const dashboard = item('nav.dashboard', 'Dashboard', '/dashboard', 'home');
  const workouts = item('nav.workouts', 'Workouts', '/workouts', 'workouts');
  const calendar = item('nav.calendar', 'Calendar', '/calendar', 'calendar');
  const exercises = item('nav.exercises', 'Exercises', '/exercises', 'type-gym');
  const routines = item('nav.routines', 'Routines', '/routines', 'library');
  const fingerboard = item('nav.fingerboardProtocols', 'Fingerboard', '/fingerboard-protocols', 'type-fingerboard');
  const statistics = item('nav.statistics', 'Statistics', '/statistics', 'stats');
  const strongMind = item('strongMind.title', 'Strong Mind', '/strong-mind', 'strong-mind');
  const cycle = item('nav.cycle', 'Cycle', '/cycle', 'cycle');
  const events = item('nav.events', 'Events', '/events', 'event-other');
  const fingerboardTesting = item('nav.fingerboardTesting', 'Fingerboard testing', '/fingerboard-testing', 'test');
  const profile = item('nav.profile', 'Profile', '/profile', 'user');

  const trainingLabel = t('dashboard.categories.training') || 'Training';
  const libraryLabel = t('dashboard.categories.library') || 'Library';
  const analysisLabel = t('dashboard.categories.analysis') || 'Analysis';

  // Desktop sidebar: same links as the old header nav + "More" dropdown
  const sidebarGroups: NavGroup[] = [
    { label: trainingLabel, items: [dashboard, workouts, calendar] },
    { label: libraryLabel, items: [exercises, routines, fingerboard] },
    { label: analysisLabel, items: [statistics, strongMind, cycle] },
  ];

  // Mobile: four tabs (short labels, as in the mockup) + "More" sheet with everything else
  const tabs: NavItem[] = [
    { ...dashboard, name: t('nav.today') || 'Today' },
    calendar,
    workouts,
    { ...statistics, name: t('nav.stats') || 'Stats' },
  ];
  const moreGroups: NavGroup[] = [
    { label: trainingLabel, items: [workouts, cycle, events] },
    { label: libraryLabel, items: [exercises, routines, fingerboard] },
    { label: analysisLabel, items: [strongMind, fingerboardTesting, profile] },
  ];
  const tabHrefs = [dashboard.href, calendar.href, statistics.href];
  const isMoreActive = !tabHrefs.some(isActive) && !isActive(workouts.href);

  const logo = (
    <Link href="/" className="flex min-w-0 items-center gap-2.5 min-h-11">
      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-uc-primary-container text-uc-accent-text">
        <Icon name="horn" size={22} />
      </span>
      <span className="truncate font-extrabold text-uc-text">{t('app.name') || 'Unicorn Climb'}</span>
    </Link>
  );

  if (!isLoggedIn) {
    return (
      <header className="bg-uc-bg border-b border-uc-border sticky top-0 z-40">
        <div className="mx-auto max-w-[1120px] px-4 lg:px-8 h-16 flex items-center justify-between gap-3">
          {logo}
          <nav className="flex shrink-0 items-center gap-1">
            <Link
              href="/"
              aria-current={isActive('/') ? 'page' : undefined}
              className={`hidden sm:inline-flex items-center min-h-11 px-3 rounded-uc-input text-sm font-bold transition-colors ${
                isActive('/') ? 'text-uc-text' : 'text-uc-text-muted hover:text-uc-text'
              }`}
            >
              {t('nav.home') || 'Home'}
            </Link>
            <div className="flex items-center min-h-11 px-1 sm:px-2">
              <LanguageSwitcher />
            </div>
            <Link href="/auth/signin" className={buttonClasses('primary', 'md', 'px-3 sm:px-4')}>
              {t('auth.signIn') || 'Sign In'}
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  const accountControls = (
    <div className="flex items-center gap-2">
      <NotificationBell size="md" showLabel={false} />
      <UserMenu isOnline={isOnline} />
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden bg-uc-bg/95 backdrop-blur border-b border-uc-border sticky top-0 z-40">
        <div className="px-4 h-14 flex items-center justify-between gap-3">
          {logo}
          <div className="shrink-0">{accountControls}</div>
        </div>
      </header>

      {/* Desktop top bar (right of the sidebar) */}
      <header className="hidden lg:block sticky top-0 z-30 ml-64 bg-uc-bg/95 backdrop-blur">
        <div className="mx-auto max-w-[1120px] px-8 h-16 flex items-center justify-end">{accountControls}</div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col bg-uc-surface border-r border-uc-border">
        <div className="px-4 pt-4 pb-2">{logo}</div>
        <nav aria-label={t('nav.mainNavigation') || 'Main navigation'} className="flex-1 overflow-y-auto px-3 pb-4">
          {sidebarGroups.map((group) => (
            <div key={group.label} className="mt-4">
              <Overline className="px-3 mb-1.5">{group.label}</Overline>
              <ul className="space-y-0.5">
                {group.items.map((navItem) => {
                  const active = isActive(navItem.href);
                  return (
                    <li key={navItem.href}>
                      <Link
                        href={navItem.href}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-center gap-3 min-h-11 px-3 rounded-uc-input text-[15px] transition-colors ${
                          active
                            ? 'bg-uc-primary-container text-uc-on-primary-container font-extrabold'
                            : 'text-uc-text font-semibold hover:bg-uc-elevated'
                        }`}
                      >
                        <Icon name={navItem.icon} size={22} />
                        <span>{navItem.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        {isCycleTrackingEnabled && cycleInfo && (
          <Link
            href="/cycle"
            className={`m-3 flex items-center gap-3 p-3 rounded-uc-card ${phaseBandBg[cycleInfo.phase]} hover:brightness-110 transition`}
          >
            <span
              aria-hidden
              className={`flex size-10 shrink-0 items-center justify-center rounded-full text-uc-chip-ink font-extrabold uc-num ${phaseSolidBg[cycleInfo.phase]}`}
            >
              {cycleInfo.currentDay}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-extrabold text-uc-text">
                {t(`cycle.phases.${phaseTranslationKey[cycleInfo.phase]}`)}
              </span>
              <span className="block text-[13px] font-semibold text-uc-text-muted uc-num">
                {t('nav.cycleDayOf', { day: cycleInfo.currentDay, length: cycleSettings?.cycleLength ?? 28 })}
              </span>
            </span>
          </Link>
        )}
      </aside>

      {/* Mobile floating tab bar */}
      <nav
        aria-label={t('nav.mainNavigation') || 'Main navigation'}
        className="lg:hidden fixed inset-x-3 z-40 bottom-[calc(12px+env(safe-area-inset-bottom))] bg-uc-elevated border border-uc-border shadow-uc rounded-[22px]"
      >
        <ul className="flex items-stretch justify-between px-1 py-1.5">
          {tabs.map((tab, index) => {
            const active = isActive(tab.href);
            const isCenter = index === 2;
            return (
              <li key={tab.href} className="flex-1 min-w-0">
                <Link
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className="flex flex-col items-center gap-0.5 min-h-11 px-0.5"
                >
                  {isCenter ? (
                    <span aria-hidden className="flex size-12 -mt-1 items-center justify-center rounded-[14px] bg-uc-accent text-uc-on-accent">
                      <Icon name="plus" size={26} strokeWidth={2.25} />
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className={`flex size-10 items-center justify-center rounded-xl ${active ? 'bg-uc-primary-container text-uc-on-primary-container' : 'text-uc-text-muted'}`}
                    >
                      <Icon name={tab.icon} size={24} />
                    </span>
                  )}
                  <span
                    className={`max-w-full truncate text-[11px] leading-[14px] ${
                      active ? 'font-extrabold text-uc-text' : 'font-semibold text-uc-text-muted'
                    }`}
                  >
                    {tab.name}
                  </span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setIsMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isMoreOpen}
              className="w-full flex flex-col items-center gap-0.5 min-h-11 px-0.5"
            >
              <span aria-hidden className={`flex size-10 items-center justify-center rounded-xl ${isMoreActive ? 'bg-uc-primary-container text-uc-on-primary-container' : 'text-uc-text-muted'}`}>
                <Icon name="menu" size={24} />
              </span>
              <span
                className={`max-w-full truncate text-[11px] leading-[14px] ${
                  isMoreActive ? 'font-extrabold text-uc-text' : 'font-semibold text-uc-text-muted'
                }`}
              >
                {t('common.more') || 'More'}
              </span>
            </button>
          </li>
        </ul>
      </nav>

      <BottomSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} closeLabel={t('common.close') || 'Close'}>
        <div className="space-y-4 pb-2">
          {moreGroups.map((group) => (
            <div key={group.label}>
              <Overline className="mb-2">{group.label}</Overline>
              <ul className="grid grid-cols-3 gap-2">
                {group.items.map((navItem) => {
                  const active = isActive(navItem.href);
                  return (
                    <li key={navItem.href}>
                      <Link
                        href={navItem.href}
                        onClick={() => setIsMoreOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={`flex h-full min-h-20 flex-col justify-between gap-2 p-3 rounded-uc-card border transition-colors ${
                          active
                            ? 'bg-uc-primary-container border-transparent text-uc-on-primary-container'
                            : 'bg-uc-surface border-uc-border text-uc-text hover:border-uc-primary'
                        }`}
                      >
                        <Icon name={navItem.icon} size={24} className={active ? '' : 'text-uc-primary'} />
                        <span className="text-[13px] font-bold leading-tight break-words">{navItem.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </BottomSheet>
    </>
  );
};
