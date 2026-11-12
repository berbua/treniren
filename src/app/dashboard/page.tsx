'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import CycleSetupFlow from '@/components/CycleSetupFlow'
import { useLanguage } from '@/contexts/LanguageContext'
import { useOffline } from '@/hooks/useOffline'
import { useNotifications } from '@/contexts/NotificationContext'
import { OfflineWorkoutForm } from '@/components/OfflineWorkoutForm'
import { MessagesPanel } from '@/components/MessagesPanel'
import { Event } from '@/types/event'
import { Workout } from '@/types/workout'
import AuthGuard from '@/components/AuthGuard'
import QuickLogModal, { QuickLogData } from '@/components/QuickLogModal'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import { OFFLINE_WORKOUTS_SYNCED_EVENT } from '@/lib/offline-sync'
import { localDayNumber, storedDayNumber, toLocalDateString, toStoredDateString } from '@/lib/date-utils'
import { STREAK_MIN_SESSIONS, weeklyStreaks } from '@/lib/streak'
import { currentDeload, deloadDayNumbers } from '@/lib/deload'
import { useCycle } from '@/contexts/CycleContext'
import { CyclePhase, getPhaseRanges } from '@/lib/cycle-utils'
import {
  Button, buttonClasses, Card, EmptyState, Overline, PhaseBadge, phaseBandBg, phaseSolidBg, phaseTranslationKey,
  SessionRow, Skeleton, SkeletonRows, StatTile, TrBadge, Icon, IconName, eventTypeMeta,
} from '@/components/ui'

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}

function DashboardContent() {
  const { data: session } = useSession()
  const { t, tPlural, language } = useLanguage()
  const { cycleInfo, cycleSettings, isCycleTrackingEnabled } = useCycle()
  const { isOnline, unsyncedWorkouts, storageSize } = useOffline()
  const { isMessagesPanelOpen, setIsMessagesPanelOpen } = useNotifications()
  const { getToken } = useCsrfToken()
  const [showOfflineForm, setShowOfflineForm] = useState(false)
  const [userNickname, setUserNickname] = useState<string | null>(null)
  const [upcomingTrips, setUpcomingTrips] = useState<Event[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [recentEvents, setRecentEvents] = useState<Event[]>([])
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeekWorkouts: 0,
    thisMonthWorkouts: 0,
    lastWeekWorkouts: 0,
    lastMonthWorkouts: 0,
    totalEvents: 0
  })
  const [userProfile, setUserProfile] = useState<any>(null)
  const [streak, setStreak] = useState(0)
  const [deload, setDeload] = useState<ReturnType<typeof currentDeload<Event>>>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPWAStatus, setShowPWAStatus] = useState(false)
  const [showQuickLog, setShowQuickLog] = useState(false)
  // Bumped to refetch dashboard data, e.g. after offline workouts are uploaded
  const [dataVersion, setDataVersion] = useState(0)
  const [isSubmittingQuickLog, setIsSubmittingQuickLog] = useState(false)
  

  // Auto-show PWA status ONLY if there are issues (offline or unsynced workouts)
  useEffect(() => {
    if (!isOnline || unsyncedWorkouts.length > 0) {
      setShowPWAStatus(true) // Show automatically when problems detected
    } else {
      setShowPWAStatus(false) // Hide when everything is fine
    }
  }, [isOnline, unsyncedWorkouts.length])

  useEffect(() => {
    const handleSynced = () => setDataVersion(v => v + 1)
    window.addEventListener(OFFLINE_WORKOUTS_SYNCED_EVENT, handleSynced)
    return () => window.removeEventListener(OFFLINE_WORKOUTS_SYNCED_EVENT, handleSynced)
  }, [])

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        let allEvents: Event[] = []
        
        // Fetch user data (nickname)
        const userResponse = await fetch('/api/user', { credentials: 'include' })
        if (userResponse.ok) {
          const user = await userResponse.json()
          setUserNickname(user.nickname)
        }
        
        // Fetch user profile (for goals)
        const profileResponse = await fetch('/api/user-profile', { credentials: 'include' })
        if (profileResponse.ok) {
          const profile = await profileResponse.json()
          setUserProfile(profile)
        }
        
        // Fetch trips - only get first page, we only need trips
        const tripsResponse = await fetch('/api/events?page=1&limit=50', { credentials: 'include' })
        if (tripsResponse.ok) {
          const tripsData = await tripsResponse.json()
          // Handle both new paginated format and old format
          allEvents = tripsData.events || tripsData
          const trips = allEvents.filter((event: Event) =>
            event.type === 'TRIP' &&
            event.tripStartDate &&
            event.showCountdown === true &&
            // Trips starting after today (calendar days)
            storedDayNumber(event.tripStartDate) > localDayNumber()
          )
          setUpcomingTrips(trips)
          setRecentEvents(allEvents.slice(0, 3))
          setDeload(currentDeload(allEvents))
        }

        // Fetch workouts - only get first page for recent workouts and stats
        const workoutsResponse = await fetch('/api/workouts?page=1&limit=100', { credentials: 'include' })
        if (workoutsResponse.ok) {
          const workoutsData = await workoutsResponse.json()
          // Handle both new paginated format and old format
          const workouts: Workout[] = workoutsData.workouts || workoutsData
          setRecentWorkouts(workouts.slice(0, 3))
          
          // Calculate stats on calendar days (last 7 days incl. today, and calendar months)
          const today = localDayNumber()
          const now = new Date()
          const thisMonthKey = toLocalDateString(now).slice(0, 7)
          const lastMonthKey = toLocalDateString(new Date(now.getFullYear(), now.getMonth() - 1, 1)).slice(0, 7)
          const daysAgo = (w: Workout) => today - storedDayNumber(w.startTime)
          const monthKey = (w: Workout) => toStoredDateString(w.startTime).slice(0, 7)

          const thisWeekWorkouts = workouts.filter(w => daysAgo(w) >= 0 && daysAgo(w) <= 6).length
          const lastWeekWorkouts = workouts.filter(w => daysAgo(w) >= 7 && daysAgo(w) <= 13).length
          const thisMonthWorkouts = workouts.filter(w => monthKey(w) === thisMonthKey).length
          const lastMonthWorkouts = workouts.filter(w => monthKey(w) === lastMonthKey).length

          setStats({
            // Only the newest 100 workouts are loaded; the total comes from the API
            totalWorkouts: workoutsData.pagination?.total ?? workouts.length,
            thisWeekWorkouts,
            thisMonthWorkouts,
            lastWeekWorkouts,
            lastMonthWorkouts,
            totalEvents: allEvents.length
          })
          
          // Calculate streak
          // Weeks in a row with 3+ sessions (from the newest 100 workouts loaded here)
          // Deload weeks pause the streak instead of breaking it
          setStreak(weeklyStreaks(workouts, undefined, undefined, deloadDayNumbers(allEvents)).current)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [dataVersion])

  // Calculate days until trip (calendar days, so it's right at any time of day)
  const getDaysUntilTrip = (tripStartDate: string) => storedDayNumber(tripStartDate) - localDayNumber()

  // Calculate trend percentage
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const weeklyGoal = userProfile?.weeklyWorkoutGoal || 3
  const monthlyGoal = userProfile?.useAutoMonthlyGoal !== false
    ? weeklyGoal * 4
    : (userProfile?.monthlyWorkoutGoal || 12)
  const goalPercent = (count: number, goal: number) => Math.min(Math.round((count / goal) * 100), 100)

  const trend = (current: number, previous: number) => previous > 0 && (
    <span className={`inline-flex items-center gap-0.5 ${current >= previous ? 'text-uc-success' : 'text-uc-error'}`}>
      <Icon name={current >= previous ? 'chevron-up' : 'chevron-down'} size={14} /> {Math.abs(calculateTrend(current, previous))}%
    </span>
  )

  const todayLabel = new Date().toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  const quickLogLabel = t('quickLog.button') || 'Quick Log'

  // 3×2 shortcuts (decision 12): everything that isn't already on the tab bar / "+" sheet
  const shortcuts: { href: string; icon: IconName; label: string }[] = [
    { href: '/cycle', icon: 'cycle', label: t('nav.cycle') || 'Cycle' },
    { href: '/exercises', icon: 'type-gym', label: t('nav.exercises') || 'Exercises' },
    { href: '/routines', icon: 'library', label: t('nav.routines') || 'Routines' },
    { href: '/fingerboard-protocols', icon: 'type-fingerboard', label: t('nav.fingerboardProtocols') || 'Fingerboard' },
    { href: '/strong-mind', icon: 'strong-mind', label: t('strongMind.title') || 'Strong Mind' },
    { href: '/profile', icon: 'user', label: t('nav.profile') || 'Profile' },
  ]

  const showHero = isCycleTrackingEnabled && cycleInfo
  // During a deload the "Time to train!" nudge is replaced by the deload card
  const hasSuggestion = !isLoading && recentWorkouts.length > 0 && (streak >= 2 || (streak === 0 && stats.thisWeekWorkouts === 0 && !deload))
  const hasSideCards = hasSuggestion || upcomingTrips.length > 0 || !!deload

  return (
    <div className="min-h-screen bg-uc-bg text-uc-text">
      <CycleSetupFlow />
      <main className="mx-auto max-w-[1120px] px-5 lg:px-8 pt-6 pb-8 space-y-5 lg:space-y-6">

        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <Overline className="uc-num">{todayLabel}</Overline>
            <h1 className="mt-1 text-[28px] leading-[34px] lg:text-[34px] lg:leading-[40px] font-extrabold tracking-[-0.02em] text-uc-text">
              {t('dashboard.hi') || 'Hi'} {userNickname || session?.user?.name?.split(' ')[0] || (t('dashboard.there') || 'there')}!
            </h1>
            <p className="mt-1 text-sm text-uc-text-muted">
              {t('dashboard.subtitle') || 'Track your climbing journey and stay motivated'}
            </p>
          </div>
          <Button variant="accent" size="lg" onClick={() => setShowQuickLog(true)} className="hidden lg:inline-flex shrink-0">
            <Icon name="quick-log" />
            {quickLogLabel}
          </Button>
        </div>

        {/* Phase hero + suggestion / trips */}
        <div className={`grid gap-4 ${showHero ? 'lg:grid-cols-2' : ''}`}>
          {showHero && cycleSettings && (
            <PhaseHeroCard
              phase={cycleInfo.phase}
              currentDay={cycleInfo.currentDay}
              cycleLength={cycleSettings.cycleLength}
              nextOvulationDate={cycleInfo.nextOvulationDate}
            />
          )}

          {/* Mobile: main CTA right under the hero */}
          <Button variant="accent" size="lg" onClick={() => setShowQuickLog(true)} className="lg:hidden w-full min-h-16 text-lg">
            <Icon name="quick-log" />
            {quickLogLabel}
          </Button>

          {hasSideCards && (
            <div className={`grid gap-4 content-start ${showHero ? '' : 'lg:grid-cols-2'}`}>
              {/* Deload running today */}
              {deload && (
                <Card className="flex items-start gap-3">
                  <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-uc-tag-5 bg-uc-elevated text-uc-tag-5">
                    <Icon name="event-deload" size={22} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-extrabold uc-num">
                      {t('events.types.deload')} · {t('dashboard.deloadDay', { day: deload.day, total: deload.totalDays })}
                    </h3>
                    <p className="text-[13px] text-uc-text-muted">{t('dashboard.deloadHint')}</p>
                    {deload.event.description && (
                      <p className="mt-1 text-[13px] text-uc-text line-clamp-2">{deload.event.description}</p>
                    )}
                  </div>
                </Card>
              )}

              {/* Personalized Suggestions */}
              {hasSuggestion && streak >= 2 && (
                <Card className="flex items-start gap-3">
                  <IconTile><Icon name="streak" size={22} /></IconTile>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-extrabold">{t('dashboard.greatStreak') || 'Świetna passa!'}</h3>
                    <p className="text-[13px] text-uc-text-muted">
                      {tPlural('dashboard.streakWeeksInRow', streak, { min: STREAK_MIN_SESSIONS })}
                    </p>
                  </div>
                </Card>
              )}
              {hasSuggestion && streak === 0 && stats.thisWeekWorkouts === 0 && (
                <Card className="space-y-3">
                  <div className="flex items-start gap-3">
                    <IconTile><Icon name="quick-log" size={22} /></IconTile>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-extrabold">{t('dashboard.timeToTrain') || 'Czas na trening!'}</h3>
                      <p className="text-[13px] text-uc-text-muted">
                        {t('dashboard.noWorkoutsThisWeek') || 'Nie miałaś jeszcze treningu w tym tygodniu. Dodaj szybki wpis!'}
                      </p>
                    </div>
                  </div>
                  <Button variant="accent" onClick={() => setShowQuickLog(true)} className="w-full">
                    {quickLogLabel}
                  </Button>
                </Card>
              )}

              {/* Trip Countdown - Only show when trips exist */}
              {upcomingTrips.map((trip) => {
                const daysUntil = getDaysUntilTrip(trip.tripStartDate!)
                return (
                  <Card key={trip.id} className="flex items-center gap-4">
                    <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-uc-input bg-uc-primary-container text-uc-on-primary-container">
                      <span className="text-[22px] leading-6 font-extrabold uc-num">{daysUntil}</span>
                    </div>
                    <div className="min-w-0">
                      <Overline className="flex items-center gap-1.5"><Icon name="event-trip" size={16} />{t('dashboard.upcomingTrips') || 'Upcoming Trips'}</Overline>
                      <h3 className="text-[15px] font-extrabold truncate">{trip.destination}</h3>
                      <p className="text-[13px] text-uc-text-muted">
                        {trip.climbingType === 'BOULDERING' ? 'Bouldering' : 'Sport Climbing'}
                        {' · '}
                        <span className="uc-num">{daysUntil}</span>{' '}
                        {daysUntil === 1 ? (t('dashboard.dayToGo') || 'day to go') : (t('dashboard.daysToGo') || 'days to go')}
                      </p>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {isLoading ? (
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-3" role="status" aria-busy="true">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className={`h-[118px] rounded-uc-card ${i > 3 ? 'col-span-3 lg:col-span-1' : ''}`} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
            <StatTile
              className="order-1"
              icon={<Icon name="streak" size={16} />}
              label={t('dashboard.streakLabel') || 'Streak'}
              value={streak}
              unit={tPlural('dashboard.weeksUnit', streak)}
              footer={t('dashboard.streakRule', { min: STREAK_MIN_SESSIONS })}
            />
            <StatTile
              className="order-2 lg:order-4"
              label={t('dashboard.totalWorkouts') || 'Total Workouts'}
              value={stats.totalWorkouts}
            />
            <StatTile
              className="order-3 lg:order-5"
              label={t('dashboard.events') || 'Events'}
              value={stats.totalEvents}
            />
            <StatTile
              className="order-4 lg:order-2 col-span-3 lg:col-span-1"
              label={t('dashboard.thisWeek') || 'This Week'}
              value={stats.thisWeekWorkouts}
              unit={`/ ${weeklyGoal}`}
              progress={goalPercent(stats.thisWeekWorkouts, weeklyGoal)}
              progressClassName={stats.thisWeekWorkouts >= weeklyGoal ? 'bg-uc-success' : undefined}
              footer={
                <span className="flex flex-wrap justify-between gap-x-3 uc-num">
                  <span>{t('dashboard.goal') || 'Cel'}: {weeklyGoal} · {goalPercent(stats.thisWeekWorkouts, weeklyGoal)}%</span>
                  {trend(stats.thisWeekWorkouts, stats.lastWeekWorkouts)}
                </span>
              }
            />
            <StatTile
              className="order-5 lg:order-3 col-span-3 lg:col-span-1"
              label={t('dashboard.thisMonth') || 'This Month'}
              value={stats.thisMonthWorkouts}
              unit={`/ ${monthlyGoal}`}
              progress={goalPercent(stats.thisMonthWorkouts, monthlyGoal)}
              progressClassName={stats.thisMonthWorkouts >= monthlyGoal ? 'bg-uc-success' : undefined}
              footer={
                <span className="flex flex-wrap justify-between gap-x-3 uc-num">
                  <span>{t('dashboard.goal') || 'Cel'}: {monthlyGoal} · {goalPercent(stats.thisMonthWorkouts, monthlyGoal)}%</span>
                  {trend(stats.thisMonthWorkouts, stats.lastMonthWorkouts)}
                </span>
              }
            />
          </div>
        )}

        {/* Recent workouts + events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          <section>
            <SectionHeader title={t('dashboard.recentWorkouts') || 'Recent Workouts'} href="/workouts" linkLabel={t('dashboard.viewAll') || 'View All'} />
            {isLoading ? (
              <Card><SkeletonRows rows={3} /></Card>
            ) : recentWorkouts.length > 0 ? (
              <div className="space-y-2.5">
                {recentWorkouts.map((workout) => {
                  // Get workout details summary
                  const exercisesCount = (workout as any).workoutExercises?.length || 0
                  const hangsCount = (workout as any).fingerboardHangs?.length || 0
                  const detailsText = exercisesCount > 0 ? tPlural('workouts.exercisesCount', exercisesCount)
                    : hangsCount > 0 ? tPlural('workouts.hangsCount', hangsCount)
                    : t('dashboard.quickLog') || 'Quick log'

                  return (
                    <Link key={workout.id} href="/workouts" className="block rounded-uc-card hover:brightness-110 transition">
                      <SessionRow
                        workoutType={workout.type}
                        title={t(`workouts.workoutTypes.${workout.type}`) || workout.type}
                        meta={<span className="uc-num">{new Date(workout.startTime).toLocaleDateString()} · {detailsText}</span>}
                        trailing={workout.trainingVolume && <TrBadge>{workout.trainingVolume}</TrBadge>}
                      />
                    </Link>
                  )
                })}
              </div>
            ) : (
              <Card>
                <EmptyState
                  icon={<Icon name="workouts" size={28} />}
                  title={t('dashboard.noWorkouts') || 'No workouts yet'}
                  description={t('dashboard.noWorkoutsDescription') || 'Start tracking your training sessions to see your progress and statistics here.'}
                  action={
                    <Link href="/workouts" className={buttonClasses('tonal')}>
                      <Icon name="plus" />
                      {t('dashboard.addFirst') || 'Add your first workout'}
                    </Link>
                  }
                />
              </Card>
            )}
          </section>

          <section>
            <SectionHeader title={t('dashboard.recentEvents') || 'Recent Events'} href="/calendar" linkLabel={t('dashboard.viewAll') || 'View All'} />
            {isLoading ? (
              <Card><SkeletonRows rows={3} /></Card>
            ) : recentEvents.length > 0 ? (
              <Card padded={false} className="px-4 divide-y divide-uc-border">
                {recentEvents.map((event) => (
                  <Link
                    key={event.id}
                    href="/calendar"
                    className="flex items-center gap-3 min-h-16 py-2.5 hover:opacity-80 transition-opacity"
                  >
                    <span aria-hidden className={`flex size-11 shrink-0 items-center justify-center rounded-xl border-[1.5px] bg-uc-elevated ${eventTone[event.type] ?? eventTone.OTHER}`}>
                      <Icon name={eventTypeMeta(event.type).icon} size={22} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[15px] font-extrabold truncate">
                        {event.type === 'TRIP' ? event.destination : event.type === 'DELOAD' ? t('events.types.deload') : event.title}
                      </div>
                      <div className="text-[13px] font-medium text-uc-text-muted uc-num">
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </Card>
            ) : (
              <Card className="border-dashed">
                <EmptyState
                  icon={<Icon name="calendar" size={28} />}
                  title={t('dashboard.noEvents') || 'No events yet'}
                  action={
                    <Link href="/calendar" className={buttonClasses('tonal')}>
                      <Icon name="plus" />
                      {t('dashboard.addFirst') || 'Add your first event'}
                    </Link>
                  }
                />
              </Card>
            )}
          </section>
        </div>

        {/* Shortcuts */}
        <div className="grid grid-cols-3 gap-2.5 lg:grid-cols-6">
          {shortcuts.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-[88px] flex-col justify-between gap-3 p-3 bg-uc-surface border border-uc-border rounded-uc-card hover:bg-uc-elevated transition-colors"
            >
              <Icon name={link.icon} size={24} className="text-uc-primary" />
              <span className="text-sm font-bold text-uc-text break-words">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* PWA Status - only when there are issues (offline or unsynced workouts) */}
        {(!isOnline || unsyncedWorkouts.length > 0 || showPWAStatus) && (
          <Card className="space-y-3">
            <h3 className="text-[17px] font-extrabold">{t('dashboard.appStatus') || 'App Status'}</h3>
            {(!isOnline || unsyncedWorkouts.length > 0) && (
              <div className="flex items-start gap-3 rounded-uc-input bg-uc-warning-bg px-3 py-2.5">
                <Icon name="warning" className="mt-0.5 text-uc-warning" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-extrabold text-uc-warning">
                    {!isOnline ? (t('dashboard.offlineMode') || 'Offline Mode') : (t('dashboard.unsyncedData') || 'Unsynced Data')}
                  </h4>
                  <p className="text-[13px] text-uc-text">
                    {!isOnline
                      ? (t('dashboard.offlineModeDesc') || 'You are working offline. Changes will sync when you reconnect.')
                      : `${unsyncedWorkouts.length} ${t('dashboard.workoutsWaitingSync') || 'workouts waiting to sync'}`
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowPWAStatus(!showPWAStatus)}
                  className="-my-1 min-h-11 px-2 text-sm font-bold text-uc-primary shrink-0"
                >
                  {showPWAStatus ? (t('common.hide') || 'Hide') : (t('common.showDetails') || 'Show Details')}
                </button>
              </div>
            )}

            {showPWAStatus && (
              <div className="divide-y divide-uc-border">
                {/* Connection Status */}
                <StatusRow
                  label={t('pwaStatus.online') || 'Online'}
                  value={isOnline
                    ? (t('pwaStatus.onlineDescription') || 'Connected to the internet')
                    : (t('pwaStatus.offlineDescription') || 'Working offline')}
                  dotClassName={isOnline ? 'bg-uc-success' : 'bg-uc-warning'}
                />
                {/* Storage Status */}
                <div className="py-3 space-y-2">
                  <StatusRow
                    label={t('pwaStatus.storage') || 'Storage'}
                    value={`${t('pwaStatus.used') || 'Used'} ${Math.round(storageSize.used / 1024)}KB`}
                    dotClassName="bg-uc-success"
                    className="py-0"
                  />
                  <div className="h-1.5 rounded-uc-pill bg-uc-skeleton overflow-hidden">
                    <div
                      className="h-full rounded-uc-pill bg-uc-primary transition-all duration-300"
                      style={{ width: `${Math.min((storageSize.used / storageSize.total) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                {/* Sync Status */}
                <div className="pt-3 space-y-3">
                  <StatusRow
                    label={t('pwaStatus.syncStatus') || 'Sync Status'}
                    value={unsyncedWorkouts.length > 0
                      ? `${unsyncedWorkouts.length} workout${unsyncedWorkouts.length > 1 ? 's' : ''} waiting to sync`
                      : (t('pwaStatus.allSynced') || 'All workouts are synced!')}
                    dotClassName={unsyncedWorkouts.length > 0 ? 'bg-uc-warning' : 'bg-uc-success'}
                    className="py-0"
                  />
                  <Button variant="ghost" onClick={() => setShowOfflineForm(true)} className="w-full">
                    <Icon name="offline" />
                    {t('pwaStatus.addOfflineTraining') || 'Add Offline Training'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </main>

      {showOfflineForm && (
        <OfflineWorkoutForm onClose={() => setShowOfflineForm(false)} />
      )}

      <QuickLogModal
        isOpen={showQuickLog}
        onClose={() => setShowQuickLog(false)}
        onSubmit={async (data: QuickLogData) => {
          setIsSubmittingQuickLog(true)
          try {
            const token = await getToken()
            const response = await fetch('/api/workouts', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'x-csrf-token': token,
              },
              credentials: 'include',
              body: JSON.stringify({
                type: data.type,
                date: data.date,
                trainingVolume: data.trainingVolume,
                mentalPracticeType: data.mentalPracticeType,
                timeOfDay: data.timeOfDay,
                notes: '',
                details: { 
                  quickLog: true,
                  ...(data.protocolId && { protocolId: data.protocolId })
                },
              }),
            })

            if (response.ok) {
              setShowQuickLog(false)
              // Refresh dashboard data
              window.location.reload()
            } else {
              const error = await response.json()
              alert(error.error || t('quickLog.errors.saveFailed') || 'Failed to save quick log')
            }
          } catch (error) {
            console.error('Error saving quick log:', error)
            alert(t('quickLog.errors.saveError') || 'Error saving quick log')
          } finally {
            setIsSubmittingQuickLog(false)
          }
        }}
        isSubmitting={isSubmittingQuickLog}
      />

      <MessagesPanel
        isOpen={isMessagesPanelOpen}
        onClose={() => setIsMessagesPanelOpen(false)}
      />
    </div>
  )
}

// Event marker colours (injury / physio / competition / trip)
const eventTone: Record<string, string> = {
  INJURY: 'border-uc-error text-uc-error',
  PHYSIO: 'border-uc-primary text-uc-primary',
  COMPETITION: 'border-uc-accent-text text-uc-accent-text',
  TRIP: 'border-uc-success text-uc-success',
  DELOAD: 'border-uc-tag-5 text-uc-tag-5',
  OTHER: 'border-uc-border text-uc-text-muted',
}

function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-uc-primary-container text-uc-on-primary-container">
      {children}
    </span>
  )
}

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[19px] font-extrabold text-uc-text">{title}</h2>
      <Link href={href} className="-mr-2 inline-flex min-h-11 items-center px-2 text-sm font-bold text-uc-primary hover:underline">
        {linkLabel}
      </Link>
    </div>
  )
}

function StatusRow({ label, value, dotClassName, className = 'py-3' }: { label: string; value: string; dotClassName: string; className?: string }) {
  return (
    <div className={`flex items-center justify-between gap-3 text-sm ${className}`}>
      <span className="font-semibold text-uc-text-muted">{label}</span>
      <span className="flex items-center gap-2 text-right font-bold text-uc-text uc-num">
        <span aria-hidden className={`size-2 shrink-0 rounded-full ${dotClassName}`} />
        {value}
      </span>
    </div>
  )
}

/** Today's cycle phase on its soft band: badge, day, the phase goal, a 5-segment phase strip and a link to /cycle. */
function PhaseHeroCard({ phase, currentDay, cycleLength, nextOvulationDate }: {
  phase: CyclePhase
  currentDay: number
  cycleLength: number
  nextOvulationDate: Date
}) {
  const { t, language } = useLanguage()
  const key = phaseTranslationKey[phase]
  const ranges = getPhaseRanges(cycleLength).filter(r => r.end >= r.start)
  const currentIndex = ranges.findIndex(r => r.phase === phase)
  const markerLeft = Math.min(Math.max(((currentDay - 0.5) / cycleLength) * 100, 2), 98)

  return (
    <section className={`rounded-uc-card p-5 lg:p-6 ${phaseBandBg[phase]} text-uc-text`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PhaseBadge phase={phase}>{t(`cycle.phases.${key}`)}</PhaseBadge>
        <span className="text-sm font-extrabold uc-num">
          {t('nav.cycleDayOf', { day: currentDay, length: cycleLength })}
        </span>
      </div>
      <h2 className="mt-4 text-[22px] leading-7 lg:text-[26px] lg:leading-8 font-extrabold tracking-[-0.01em]">
        {t(`cycle.phaseDetails.${key}.goal`)}
      </h2>
      <p className="mt-2 text-[15px] leading-[22px]">{t(`cycle.phaseDetails.${key}.impact`)}</p>

      {/* Phase strip with today's marker */}
      <div className="relative mt-5 flex h-2 gap-1" aria-hidden>
        {ranges.map((range, i) => (
          <span
            key={range.phase}
            className={`h-full rounded-uc-pill ${phaseSolidBg[range.phase]} ${i > currentIndex ? 'opacity-45' : ''}`}
            style={{ flexGrow: range.end - range.start + 1, flexBasis: 0 }}
          />
        ))}
        <span
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-uc-text bg-uc-bg"
          style={{ left: `${markerLeft}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="text-[13px] font-semibold text-uc-text-muted uc-num">
          {t('common.nextOvulation')} {nextOvulationDate.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-GB', { day: 'numeric', month: 'short' })}
        </span>
        <Link href="/cycle" className="-mr-2 inline-flex min-h-11 items-center gap-1 px-2 text-sm font-extrabold text-uc-text hover:underline">
          {t('dashboard.recommendations')}
          <svg aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </Link>
      </div>
    </section>
  )
}
