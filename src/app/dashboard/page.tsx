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

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}

function DashboardContent() {
  const { data: session } = useSession()
  const { t } = useLanguage()
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
  const [isLoading, setIsLoading] = useState(true)
  const [showPWAStatus, setShowPWAStatus] = useState(false)
  const [showQuickLog, setShowQuickLog] = useState(false)
  const [isSubmittingQuickLog, setIsSubmittingQuickLog] = useState(false)
  
  // Calculate workout streak
  const calculateStreak = (workouts: Workout[]) => {
    if (workouts.length === 0) return 0
    
    // Sort workouts by date (most recent first)
    const sortedWorkouts = [...workouts].sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )
    
    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get unique workout dates
    const workoutDates = new Set(
      sortedWorkouts.map(w => new Date(w.startTime).toISOString().split('T')[0])
    )
    
    // Check if there's a workout today or yesterday to start counting
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const todayStr = today.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    let checkDate = new Date(today)
    if (!workoutDates.has(todayStr)) {
      // If no workout today, start from yesterday
      if (!workoutDates.has(yesterdayStr)) {
        return 0 // No recent workouts
      }
      checkDate = new Date(yesterday)
    }
    
    // Count consecutive days with workouts
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (workoutDates.has(dateStr)) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return currentStreak
  }

  // Auto-show PWA status ONLY if there are issues (offline or unsynced workouts)
  useEffect(() => {
    if (!isOnline || unsyncedWorkouts.length > 0) {
      setShowPWAStatus(true) // Show automatically when problems detected
    } else {
      setShowPWAStatus(false) // Hide when everything is fine
    }
  }, [isOnline, unsyncedWorkouts.length])

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
            new Date(event.tripStartDate) > new Date()
          )
          setUpcomingTrips(trips)
          setRecentEvents(allEvents.slice(0, 3))
        }

        // Fetch workouts - only get first page for recent workouts and stats
        const workoutsResponse = await fetch('/api/workouts?page=1&limit=100', { credentials: 'include' })
        if (workoutsResponse.ok) {
          const workoutsData = await workoutsResponse.json()
          // Handle both new paginated format and old format
          const workouts: Workout[] = workoutsData.workouts || workoutsData
          setRecentWorkouts(workouts.slice(0, 3))
          
          // Calculate stats
          const now = new Date()
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
          const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1) // First day of current month
          const lastMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1) // First day of last month
          
          const thisWeekWorkouts = workouts.filter(w => 
            new Date(w.startTime) >= weekAgo
          ).length
          
          const lastWeekWorkouts = workouts.filter(w => {
            const workoutDate = new Date(w.startTime)
            return workoutDate >= twoWeeksAgo && workoutDate < weekAgo
          }).length
          
          const thisMonthWorkouts = workouts.filter(w => 
            new Date(w.startTime) >= monthAgo
          ).length
          
          const lastMonthWorkouts = workouts.filter(w => {
            const workoutDate = new Date(w.startTime)
            return workoutDate >= lastMonthAgo && workoutDate < monthAgo
          }).length

          setStats({
            totalWorkouts: workouts.length,
            thisWeekWorkouts,
            thisMonthWorkouts,
            lastWeekWorkouts,
            lastMonthWorkouts,
            totalEvents: allEvents.length
          })
          
          // Calculate streak
          setStreak(calculateStreak(workouts))
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Calculate days until trip
  const getDaysUntilTrip = (tripStartDate: string) => {
    const today = new Date()
    const tripDate = new Date(tripStartDate)
    const diffTime = tripDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getWorkoutTypeEmoji = (type: string) => {
    const emojis: { [key: string]: string } = {
      'GYM': '🏋️',
      'BOULDERING': '🧗',
      'CIRCUITS': '🔄',
      'LEAD_ROCK': '🧗‍♀️',
      'LEAD_ARTIFICIAL': '🧗‍♂️',
      'MENTAL_PRACTICE': '🧘'
    }
    return emojis[type] || '🏃'
  }

  const getEventTypeEmoji = (type: string) => {
    const emojis: { [key: string]: string } = {
      'INJURY': '🤕',
      'PHYSIO': '🏥',
      'COMPETITION': '🏆',
      'TRIP': '✈️',
      'OTHER': '📅'
    }
    return emojis[type] || '📅'
  }

  // Calculate trend percentage
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  return (
    <div className="min-h-screen bg-uc-black">
      <CycleSetupFlow />
      <main className="container mx-auto px-4 py-8">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold text-uc-text-light mb-2">
                {t('dashboard.hi') || 'Hi'} {userNickname || session?.user?.name?.split(' ')[0] || (t('dashboard.there') || 'there')}! 🦄
              </h1>
              <p className="text-uc-text-muted">
                {t('dashboard.subtitle') || 'Track your climbing journey and stay motivated'}
              </p>
            </div>
            {streak > 0 && (
              <div className="flex items-center space-x-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/40 rounded-2xl px-5 py-3 shadow-lg animate-pulse">
                <span className="text-3xl">🔥</span>
                <div>
                  <div className="text-2xl font-bold text-orange-400">{streak}</div>
                  <div className="text-xs text-uc-text-muted uppercase tracking-wide">
                    {streak === 1 ? (t('dashboard.dayStreak') || 'day streak') : (t('dashboard.daysStreak') || 'days streak')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hero CTA - Quick Log */}
        <div className="mb-6">
          <button
            onClick={() => setShowQuickLog(true)}
            className="w-full group relative overflow-hidden bg-gradient-to-br from-uc-purple/40 to-uc-mustard/40 rounded-2xl shadow-xl border-2 border-uc-purple/50 hover:border-uc-mustard/70 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-uc-purple/20 to-uc-mustard/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-uc-mustard/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">⚡</span>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-uc-text-light mb-1">
                    {t('quickLog.button') || 'Quick Log'}
                  </h3>
                  <p className="text-sm text-uc-text-muted">
                    {t('quickLog.description') || 'Quickly log a workout. You can add details later.'}
                  </p>
                </div>
              </div>
              <svg className="w-8 h-8 text-uc-mustard group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        </div>

        {/* Quick Actions - Categorized */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Training Category */}
          <div className="bg-uc-dark-bg/50 rounded-2xl p-5 border border-uc-purple/20">
            <h3 className="text-sm font-semibold text-uc-text-muted mb-3 uppercase tracking-wide">
              🏋️ {t('dashboard.categories.training') || 'Trening'}
            </h3>
            <div className="space-y-2">
              <Link
                href="/workouts"
                className="flex items-center justify-between p-3 bg-uc-black/50 rounded-xl hover:bg-uc-black/70 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🏋️</span>
                  <span className="text-sm font-medium text-uc-text-light">{t('nav.workouts') || 'Workouts'}</span>
                </div>
                <svg className="w-4 h-4 text-uc-text-muted group-hover:text-uc-mustard group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/calendar"
                className="flex items-center justify-between p-3 bg-uc-black/50 rounded-xl hover:bg-uc-black/70 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">📅</span>
                  <span className="text-sm font-medium text-uc-text-light">{t('nav.calendar') || 'Calendar'}</span>
                </div>
                <svg className="w-4 h-4 text-uc-text-muted group-hover:text-uc-mustard group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/cycle"
                className="flex items-center justify-between p-3 bg-uc-black/50 rounded-xl hover:bg-uc-black/70 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium text-uc-text-light">{t('nav.cycle') || 'Cycle'}</span>
                </div>
                <svg className="w-4 h-4 text-uc-text-muted group-hover:text-uc-mustard group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Library Category */}
          <div className="bg-uc-dark-bg/50 rounded-2xl p-5 border border-uc-purple/20">
            <h3 className="text-sm font-semibold text-uc-text-muted mb-3 uppercase tracking-wide">
              📚 {t('dashboard.categories.library') || 'Biblioteka'}
            </h3>
            <div className="space-y-2">
              <Link
                href="/exercises"
                className="flex items-center justify-between p-3 bg-uc-black/50 rounded-xl hover:bg-uc-black/70 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">💪</span>
                  <span className="text-sm font-medium text-uc-text-light">{t('nav.exercises') || 'Exercises'}</span>
                </div>
                <svg className="w-4 h-4 text-uc-text-muted group-hover:text-uc-mustard group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/routines"
                className="flex items-center justify-between p-3 bg-uc-black/50 rounded-xl hover:bg-uc-black/70 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">👯</span>
                  <span className="text-sm font-medium text-uc-text-light">{t('nav.routines') || 'Routines'}</span>
                </div>
                <svg className="w-4 h-4 text-uc-text-muted group-hover:text-uc-mustard group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/fingerboard-protocols"
                className="flex items-center justify-between p-3 bg-uc-black/50 rounded-xl hover:bg-uc-black/70 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🖐️</span>
                  <span className="text-sm font-medium text-uc-text-light">{t('nav.fingerboardProtocols') || 'Fingerboard'}</span>
                </div>
                <svg className="w-4 h-4 text-uc-text-muted group-hover:text-uc-mustard group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Analysis Category */}
          <div className="bg-uc-dark-bg/50 rounded-2xl p-5 border border-uc-purple/20">
            <h3 className="text-sm font-semibold text-uc-text-muted mb-3 uppercase tracking-wide">
              📊 {t('dashboard.categories.analysis') || 'Analiza'}
            </h3>
            <div className="space-y-2">
              <Link
                href="/statistics"
                className="flex items-center justify-between p-3 bg-uc-black/50 rounded-xl hover:bg-uc-black/70 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">📊</span>
                  <span className="text-sm font-medium text-uc-text-light">{t('nav.statistics') || 'Statistics'}</span>
                </div>
                <svg className="w-4 h-4 text-uc-text-muted group-hover:text-uc-mustard group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/strong-mind"
                className="flex items-center justify-between p-3 bg-uc-black/50 rounded-xl hover:bg-uc-black/70 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🧠</span>
                  <span className="text-sm font-medium text-uc-text-light">{t('strongMind.title') || 'Strong Mind'}</span>
                </div>
                <svg className="w-4 h-4 text-uc-text-muted group-hover:text-uc-mustard group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/profile"
                className="flex items-center justify-between p-3 bg-uc-black/50 rounded-xl hover:bg-uc-black/70 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">👤</span>
                  <span className="text-sm font-medium text-uc-text-light">{t('nav.profile') || 'Profile'}</span>
                </div>
                <svg className="w-4 h-4 text-uc-text-muted group-hover:text-uc-mustard group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Personalized Suggestions */}
        {!isLoading && recentWorkouts.length > 0 && (
          <div className="mb-8">
            {streak >= 3 && (
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-5 flex items-start space-x-4">
                <span className="text-3xl">💪</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-400 mb-1">
                    {t('dashboard.greatStreak') || 'Świetna passa!'}
                  </h4>
                  <p className="text-sm text-uc-text-muted">
                    {t('dashboard.keepGoing') || `Masz ${streak} dni z rzędu! Nie przerywaj swojego streaku 🔥`}
                  </p>
                </div>
              </div>
            )}
            {streak === 0 && stats.thisWeekWorkouts === 0 && (
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-5 flex items-start space-x-4">
                <span className="text-3xl">👋</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-400 mb-1">
                    {t('dashboard.timeToTrain') || 'Czas na trening!'}
                  </h4>
                  <p className="text-sm text-uc-text-muted">
                    {t('dashboard.noWorkoutsThisWeek') || 'Nie miałaś jeszcze treningu w tym tygodniu. Dodaj szybki wpis!'}
                  </p>
                </div>
                <button
                  onClick={() => setShowQuickLog(true)}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-xl transition-colors font-medium text-sm whitespace-nowrap"
                >
                  {t('quickLog.button') || 'Quick Log'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Trip Countdown - Only show when trips exist */}
        {upcomingTrips.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-uc-purple/20 to-uc-mustard/20 border border-uc-purple/30 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-uc-text-light mb-4">
                ✈️ {t('dashboard.upcomingTrips') || 'Upcoming Trips'}
              </h3>
              {!isLoading ? (
                <div className="space-y-3">
                  {upcomingTrips.map((trip) => {
                    const daysUntil = getDaysUntilTrip(trip.tripStartDate!)
                    return (
                      <div key={trip.id} className="flex items-center justify-between p-4 bg-uc-dark-bg rounded-xl border border-uc-purple/20">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-uc-purple/20 rounded-full flex items-center justify-center">
                            <span className="text-lg">✈️</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-uc-text-light">
                              {trip.destination}
                            </h4>
                            <p className="text-sm text-uc-text-muted">
                              {trip.climbingType === 'BOULDERING' ? '🧗 Bouldering' : '🧗‍♀️ Sport Climbing'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-uc-mustard">
                            {daysUntil}
                          </div>
                          <div className="text-sm text-uc-text-muted">
                            {daysUntil === 1 ? (t('dashboard.dayToGo') || 'day to go') : (t('dashboard.daysToGo') || 'days to go')}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">✈️</div>
                  <p className="text-uc-text-muted">
                    {t('dashboard.loadingTrips') || 'Loading trips...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats - Enhanced with Progress */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            // Loading skeletons
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-uc-dark-bg p-5 rounded-xl shadow-lg border border-uc-purple/20 animate-pulse">
                  <div className="h-8 bg-uc-black/50 rounded mb-2"></div>
                  <div className="h-4 bg-uc-black/30 rounded w-2/3"></div>
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Total Workouts */}
              <div className="bg-uc-dark-bg p-5 rounded-xl shadow-lg border border-uc-purple/20 hover:border-uc-purple/40 transition-all group">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-10 h-10 bg-uc-mustard/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">🏋️</span>
                  </div>
                  <div className="text-3xl font-bold text-uc-mustard">{stats.totalWorkouts}</div>
                </div>
                <div className="text-sm text-uc-text-muted font-medium">{t('dashboard.totalWorkouts') || 'Total Workouts'}</div>
              </div>

              {/* This Week with Goal */}
              <div className="bg-uc-dark-bg p-5 rounded-xl shadow-lg border border-uc-purple/20 hover:border-uc-purple/40 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-xl">📈</span>
                    </div>
                    <div className="text-3xl font-bold text-uc-success">{stats.thisWeekWorkouts}</div>
                  </div>
                  {stats.lastWeekWorkouts > 0 && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      stats.thisWeekWorkouts >= stats.lastWeekWorkouts 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {stats.thisWeekWorkouts >= stats.lastWeekWorkouts ? '↑' : '↓'} {Math.abs(calculateTrend(stats.thisWeekWorkouts, stats.lastWeekWorkouts))}%
                    </span>
                  )}
                </div>
                <div className="text-sm text-uc-text-muted font-medium mb-2">{t('dashboard.thisWeek') || 'This Week'}</div>
                {/* Weekly Goal Progress */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-uc-text-muted mb-1">
                    <span>
                      {t('dashboard.goal') || 'Cel'}: {userProfile?.weeklyWorkoutGoal || 3}
                    </span>
                    <span>{Math.min(Math.round((stats.thisWeekWorkouts / (userProfile?.weeklyWorkoutGoal || 3)) * 100), 100)}%</span>
                  </div>
                  <div className="w-full bg-uc-black/50 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        stats.thisWeekWorkouts >= (userProfile?.weeklyWorkoutGoal || 3) ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min((stats.thisWeekWorkouts / (userProfile?.weeklyWorkoutGoal || 3)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* This Month with Goal */}
              <div className="bg-uc-dark-bg p-5 rounded-xl shadow-lg border border-uc-purple/20 hover:border-uc-purple/40 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-uc-purple/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-xl">📅</span>
                    </div>
                    <div className="text-3xl font-bold text-uc-purple">{stats.thisMonthWorkouts}</div>
                  </div>
                  {stats.lastMonthWorkouts > 0 && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      stats.thisMonthWorkouts >= stats.lastMonthWorkouts 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {stats.thisMonthWorkouts >= stats.lastMonthWorkouts ? '↑' : '↓'} {Math.abs(calculateTrend(stats.thisMonthWorkouts, stats.lastMonthWorkouts))}%
                    </span>
                  )}
                </div>
                <div className="text-sm text-uc-text-muted font-medium mb-2">{t('dashboard.thisMonth') || 'This Month'}</div>
                {/* Monthly Goal Progress */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-uc-text-muted mb-1">
                    <span>
                      {t('dashboard.goal') || 'Cel'}: {
                        userProfile?.useAutoMonthlyGoal !== false 
                          ? (userProfile?.weeklyWorkoutGoal || 3) * 4
                          : (userProfile?.monthlyWorkoutGoal || 12)
                      }
                    </span>
                    <span>
                      {Math.min(Math.round((stats.thisMonthWorkouts / (
                        userProfile?.useAutoMonthlyGoal !== false 
                          ? (userProfile?.weeklyWorkoutGoal || 3) * 4
                          : (userProfile?.monthlyWorkoutGoal || 12)
                      )) * 100), 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-uc-black/50 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        stats.thisMonthWorkouts >= (
                          userProfile?.useAutoMonthlyGoal !== false 
                            ? (userProfile?.weeklyWorkoutGoal || 3) * 4
                            : (userProfile?.monthlyWorkoutGoal || 12)
                        ) ? 'bg-uc-purple' : 'bg-yellow-500'
                      }`}
                      style={{ 
                        width: `${Math.min((stats.thisMonthWorkouts / (
                          userProfile?.useAutoMonthlyGoal !== false 
                            ? (userProfile?.weeklyWorkoutGoal || 3) * 4
                            : (userProfile?.monthlyWorkoutGoal || 12)
                        )) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Events */}
              <div className="bg-uc-dark-bg p-5 rounded-xl shadow-lg border border-uc-purple/20 hover:border-uc-purple/40 transition-all group">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">📆</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-400">{stats.totalEvents}</div>
                </div>
                <div className="text-sm text-uc-text-muted font-medium">{t('dashboard.events') || 'Events'}</div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Recent Workouts */}
          <div className="bg-uc-dark-bg p-6 rounded-2xl shadow-lg border border-uc-purple/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-uc-text-light">
                {t('dashboard.recentWorkouts') || 'Recent Workouts'}
              </h3>
              <Link 
                href="/workouts"
                className="text-uc-mustard hover:text-uc-mustard/80 text-sm font-medium transition-colors"
              >
                {t('dashboard.viewAll') || 'View All'}
              </Link>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                // Loading skeleton
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-uc-black/50 rounded-xl animate-pulse">
                      <div className="w-6 h-6 bg-uc-black/50 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-uc-black/50 rounded mb-2"></div>
                        <div className="h-3 bg-uc-black/30 rounded w-2/3"></div>
                      </div>
                      <div className="h-3 bg-uc-black/30 rounded w-12"></div>
                    </div>
                  ))}
                </>
              ) : recentWorkouts.length > 0 ? (
                recentWorkouts.map((workout) => {
                  // Get workout details summary
                  const exercisesCount = (workout as any).workoutExercises?.length || 0
                  const hangsCount = (workout as any).fingerboardHangs?.length || 0
                  const detailsText = exercisesCount > 0 ? `${exercisesCount} ${t('dashboard.exercises') || 'exercises'}` 
                    : hangsCount > 0 ? `${hangsCount} hangs` 
                    : t('dashboard.quickLog') || 'Quick log'
                  
                  return (
                    <div
                      key={workout.id}
                      className="group relative p-3 bg-uc-black/50 rounded-xl hover:bg-uc-black/70 transition-all border border-transparent hover:border-uc-purple/30"
                    >
                      <Link href={`/workouts`} className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-uc-purple/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="text-xl">{getWorkoutTypeEmoji(workout.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="font-semibold text-uc-text-light truncate">
                              {t(`workoutTypes.${workout.type.toLowerCase()}`) || workout.type}
                            </div>
                            {workout.trainingVolume && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-uc-purple/20 text-uc-purple">
                                {workout.trainingVolume}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-uc-text-muted">
                            <span>📅 {new Date(workout.startTime).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{detailsText}</span>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-uc-text-muted group-hover:text-uc-mustard group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )
                })
              ) : (
                <div className="bg-uc-dark-bg rounded-xl p-12 text-center border border-uc-purple/20">
                  <div className="text-6xl mb-4">🏋️</div>
                  <h3 className="text-lg font-semibold text-uc-text-light mb-2">
                    {t('dashboard.noWorkouts') || 'No workouts yet'}
                  </h3>
                  <p className="text-uc-text-muted mb-6 max-w-md mx-auto">
                    {t('dashboard.noWorkoutsDescription') || 'Start tracking your training sessions to see your progress and statistics here.'}
                  </p>
                  <Link 
                    href="/workouts"
                    className="inline-flex items-center space-x-2 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
                  >
                    <span>➕</span>
                    <span>{t('dashboard.addFirst') || 'Add your first workout'}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-uc-dark-bg p-6 rounded-2xl shadow-lg border border-uc-purple/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-uc-text-light">
                {t('dashboard.recentEvents') || 'Recent Events'}
              </h3>
              <Link 
                href="/calendar"
                className="text-uc-mustard hover:text-uc-mustard/80 text-sm font-medium transition-colors"
              >
                {t('dashboard.viewAll') || 'View All'}
              </Link>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                // Loading skeleton
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-uc-black/50 rounded-xl animate-pulse">
                      <div className="w-6 h-6 bg-uc-black/50 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-uc-black/50 rounded mb-2"></div>
                        <div className="h-3 bg-uc-black/30 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </>
              ) : recentEvents.length > 0 ? (
                recentEvents.map((event) => (
                  <Link
                    key={event.id}
                    href="/calendar"
                    className="flex items-center space-x-3 p-3 bg-uc-black/50 rounded-xl hover:bg-uc-black/70 transition-colors"
                  >
                    <span className="text-lg">{getEventTypeEmoji(event.type)}</span>
                    <div className="flex-1">
                      <div className="font-medium text-uc-text-light">
                        {event.type === 'TRIP' ? event.destination : event.title}
                      </div>
                      <div className="text-sm text-uc-text-muted">
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-uc-text-muted mb-4">{t('dashboard.noEvents') || 'No events yet'}</p>
                  <Link 
                    href="/calendar"
                    className="inline-flex items-center space-x-2 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
                  >
                    <span>➕</span>
                    <span>{t('dashboard.addFirst') || 'Add your first event'}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PWA Status Cards - Only show toggle if there are no issues */}
        {(!isOnline || unsyncedWorkouts.length > 0 || showPWAStatus) && (
          <div className="mb-8">
            {/* Show alert header if there are issues */}
            {(!isOnline || unsyncedWorkouts.length > 0) && (
              <div className="bg-orange-500/10 border-2 border-orange-500/30 rounded-xl p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h4 className="font-semibold text-orange-400">
                      {!isOnline ? (t('dashboard.offlineMode') || 'Offline Mode') : (t('dashboard.unsyncedData') || 'Unsynced Data')}
                    </h4>
                    <p className="text-sm text-uc-text-muted">
                      {!isOnline 
                        ? (t('dashboard.offlineModeDesc') || 'You are working offline. Changes will sync when you reconnect.')
                        : `${unsyncedWorkouts.length} ${t('dashboard.workoutsWaitingSync') || 'workouts waiting to sync'}`
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPWAStatus(!showPWAStatus)}
                  className="text-uc-mustard hover:text-uc-mustard/80 text-sm font-medium"
                >
                  {showPWAStatus ? (t('common.hide') || 'Hide') : (t('common.showDetails') || 'Show Details')}
                </button>
              </div>
            )}
            
            {showPWAStatus && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Connection Status */}
              <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                isOnline
                  ? 'bg-uc-success/20 border-uc-success/30'
                  : 'bg-uc-mustard/20 border-uc-mustard/30'
              }`}>
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isOnline ? 'bg-uc-success/20' : 'bg-uc-mustard/20'
                }`}>
                  <span className="text-sm">{isOnline ? '🟢' : '🟠'}</span>
                </div>
                <h4 className="font-semibold text-uc-text-light">
                  {t('pwaStatus.online') || 'Online'}
                </h4>
              </div>
              <p className="text-sm text-uc-text-muted">
                {isOnline
                  ? (t('pwaStatus.onlineDescription') || 'Connected to the internet')
                  : (t('pwaStatus.offlineDescription') || 'Working offline')
                }
              </p>
            </div>

            {/* Storage Status */}
            <div className="p-4 rounded-xl border-2 border-uc-purple/30 bg-uc-purple/20">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-6 h-6 bg-uc-purple/20 rounded-full flex items-center justify-center">
                  <span className="text-sm">💾</span>
                </div>
                <h4 className="font-semibold text-uc-text-light">
                  {t('pwaStatus.storage') || 'Storage'}
                </h4>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-uc-text-muted">{t('pwaStatus.used') || 'Used'}</span>
                  <span className="font-medium text-uc-text-light">
                    {Math.round(storageSize.used / 1024)}KB
                  </span>
                </div>
                <div className="w-full bg-uc-black/50 rounded-full h-1">
                  <div
                    className="bg-uc-purple h-1 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((storageSize.used / storageSize.total) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Sync Status */}
            <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              unsyncedWorkouts.length > 0
                ? 'bg-uc-mustard/20 border-uc-mustard/30'
                : 'bg-uc-success/20 border-uc-success/30'
            }`}>
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  unsyncedWorkouts.length > 0 ? 'bg-uc-mustard/20' : 'bg-uc-success/20'
                }`}>
                  <span className="text-sm">{unsyncedWorkouts.length > 0 ? '⏳' : '✅'}</span>
                </div>
                <h4 className="font-semibold text-uc-text-light">
                  {t('pwaStatus.syncStatus') || 'Sync Status'}
                </h4>
              </div>
              <p className="text-sm text-uc-text-muted mb-2">
                {unsyncedWorkouts.length > 0
                  ? `${unsyncedWorkouts.length} workout${unsyncedWorkouts.length > 1 ? 's' : ''} waiting to sync`
                  : (t('pwaStatus.allSynced') || 'All workouts are synced!')
                }
              </p>
              <button
                onClick={() => setShowOfflineForm(true)}
                className="w-full bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black py-2 px-3 rounded-xl transition-colors font-medium text-sm shadow-lg"
              >
                📱 {t('pwaStatus.addOfflineTraining') || 'Add Offline Training'}
              </button>
            </div>
          </div>
          )}
          </div>
        )}


      </main>

      {/* Mobile FAB - Floating Action Button for Quick Log */}
      <button
        onClick={() => setShowQuickLog(true)}
        className="md:hidden fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-uc-purple to-uc-mustard rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 active:scale-95 transition-transform duration-200"
        aria-label="Quick Log"
      >
        <span className="text-3xl">⚡</span>
      </button>

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
