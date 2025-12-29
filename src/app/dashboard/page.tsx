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
  const [isLoading, setIsLoading] = useState(true)
  const [showPWAStatus, setShowPWAStatus] = useState(false)
  
  // Show PWA status by default if there are issues (offline or unsynced workouts)
  useEffect(() => {
    if (!isOnline || unsyncedWorkouts.length > 0) {
      setShowPWAStatus(true)
    }
  }, [isOnline, unsyncedWorkouts.length])

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        let allEvents: Event[] = []
        
        // Fetch user data (nickname)
        const userResponse = await fetch('/api/user')
        if (userResponse.ok) {
          const user = await userResponse.json()
          setUserNickname(user.nickname)
        }
        
        // Fetch trips
        const tripsResponse = await fetch('/api/events')
        if (tripsResponse.ok) {
          allEvents = await tripsResponse.json()
          const trips = allEvents.filter(event =>
            event.type === 'TRIP' &&
            event.tripStartDate &&
            event.showCountdown === true &&
            new Date(event.tripStartDate) > new Date()
          )
          setUpcomingTrips(trips)
          setRecentEvents(allEvents.slice(0, 3))
        }

        // Fetch workouts
        const workoutsResponse = await fetch('/api/workouts')
        if (workoutsResponse.ok) {
          const workouts: Workout[] = await workoutsResponse.json()
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
          <h1 className="text-3xl font-bold text-uc-text-light mb-2">
            {t('dashboard.hi') || 'Hi'} {userNickname || session?.user?.name?.split(' ')[0] || (t('dashboard.there') || 'there')}! 🦄
          </h1>
          <p className="text-uc-text-muted">
            {t('dashboard.subtitle') || 'Track your climbing journey and stay motivated'}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="mb-8">
          {/* Row 1: Most Used */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <Link
              href="/workouts"
              className="flex flex-col items-center p-3 bg-uc-dark-bg rounded-lg shadow-md border border-uc-purple/20 hover:shadow-lg hover:border-uc-purple/40 transition-all relative"
            >
              <span className="text-xl mb-1.5">🏋️</span>
              <span className="text-sm font-medium text-uc-text-light">{t('nav.workouts') || 'Workouts'}</span>
              <span className="absolute top-1.5 right-1.5 text-xs bg-uc-mustard text-uc-black rounded-full w-4 h-4 flex items-center justify-center font-bold">+</span>
            </Link>
            <Link
              href="/calendar"
              className="flex flex-col items-center p-3 bg-uc-dark-bg rounded-lg shadow-md border border-uc-purple/20 hover:shadow-lg hover:border-uc-purple/40 transition-all"
            >
              <span className="text-xl mb-1.5">📅</span>
              <span className="text-sm font-medium text-uc-text-light">{t('nav.calendar') || 'Calendar'}</span>
            </Link>
            <Link
              href="/statistics"
              className="flex flex-col items-center p-3 bg-uc-dark-bg rounded-lg shadow-md border border-uc-purple/20 hover:shadow-lg hover:border-uc-purple/40 transition-all"
            >
              <span className="text-xl mb-1.5">📊</span>
              <span className="text-sm font-medium text-uc-text-light">{t('nav.statistics') || 'Statistics'}</span>
            </Link>
            <Link
              href="/strong-mind"
              className="flex flex-col items-center p-3 bg-uc-dark-bg rounded-lg shadow-md border border-uc-purple/20 hover:shadow-lg hover:border-uc-purple/40 transition-all"
            >
              <span className="text-xl mb-1.5">🧠</span>
              <span className="text-sm font-medium text-uc-text-light">{t('strongMind.title') || 'Strong Mind'}</span>
            </Link>
          </div>
          
          {/* Row 2: Library/Setup */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/exercises"
              className="flex flex-col items-center p-3 bg-uc-dark-bg rounded-lg shadow-md border border-uc-purple/20 hover:shadow-lg hover:border-uc-purple/40 transition-all"
            >
              <span className="text-xl mb-1.5">💪</span>
              <span className="text-sm font-medium text-uc-text-light">{t('nav.exercises') || 'Exercises'}</span>
            </Link>
            <Link
              href="/routines"
              className="flex flex-col items-center p-3 bg-uc-dark-bg rounded-lg shadow-md border border-uc-purple/20 hover:shadow-lg hover:border-uc-purple/40 transition-all"
            >
              <span className="text-xl mb-1.5">👯</span>
              <span className="text-sm font-medium text-uc-text-light">{t('nav.routines') || 'Routines'}</span>
            </Link>
            <Link
              href="/fingerboard-protocols"
              className="flex flex-col items-center p-3 bg-uc-dark-bg rounded-lg shadow-md border border-uc-purple/20 hover:shadow-lg hover:border-uc-purple/40 transition-all"
            >
              <span className="text-xl mb-1.5">🖐️</span>
              <span className="text-sm font-medium text-uc-text-light">{t('nav.fingerboardProtocols') || 'Fingerboard'}</span>
            </Link>
            <Link
              href="/profile"
              className="flex flex-col items-center p-3 bg-uc-dark-bg rounded-lg shadow-md border border-uc-purple/20 hover:shadow-lg hover:border-uc-purple/40 transition-all"
            >
              <span className="text-xl mb-1.5">👤</span>
              <span className="text-sm font-medium text-uc-text-light">{t('nav.profile') || 'Profile'}</span>
            </Link>
          </div>
        </div>

        {/* Trip Countdown */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-uc-purple/20 to-uc-mustard/20 border border-uc-purple/30 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-uc-text-light mb-4">
              ✈️ {t('dashboard.upcomingTrips') || 'Upcoming Trips'}
            </h3>
            {!isLoading && upcomingTrips.length > 0 ? (
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
                  {isLoading ? (t('dashboard.loadingTrips') || 'Loading trips...') : (t('dashboard.noUpcomingTrips') || 'No upcoming trips with countdown')}
                </p>
                <p className="text-sm text-uc-text-muted mt-2 mb-4">
                  {t('dashboard.noUpcomingTripsDescription') || 'Create a trip event and enable the "Show countdown on homepage" option'}
                </p>
                <Link
                  href="/calendar"
                  className="inline-flex items-center space-x-2 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
                >
                  <span>✈️</span>
                  <span>{t('dashboard.addTrip') || 'Add Trip'}</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            // Loading skeletons
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-uc-dark-bg p-4 rounded-xl shadow-lg border border-uc-purple/20 animate-pulse">
                  <div className="h-8 bg-uc-black/50 rounded mb-2"></div>
                  <div className="h-4 bg-uc-black/30 rounded w-2/3"></div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="bg-uc-dark-bg p-4 rounded-xl shadow-lg border border-uc-purple/20 hover:border-uc-purple/40 transition-all cursor-pointer">
                <div className="text-2xl font-bold text-uc-mustard">{stats.totalWorkouts}</div>
                <div className="text-sm text-uc-text-muted">{t('dashboard.totalWorkouts') || 'Total Workouts'}</div>
              </div>
              <div className="bg-uc-dark-bg p-4 rounded-xl shadow-lg border border-uc-purple/20 hover:border-uc-purple/40 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-uc-success">{stats.thisWeekWorkouts}</div>
                  {stats.lastWeekWorkouts > 0 && (
                    <span className={`text-xs font-medium ${
                      stats.thisWeekWorkouts >= stats.lastWeekWorkouts ? 'text-uc-success' : 'text-red-400'
                    }`}>
                      {stats.thisWeekWorkouts >= stats.lastWeekWorkouts ? '↑' : '↓'} {Math.abs(calculateTrend(stats.thisWeekWorkouts, stats.lastWeekWorkouts))}%
                    </span>
                  )}
                </div>
                <div className="text-sm text-uc-text-muted">{t('dashboard.thisWeek') || 'This Week'}</div>
              </div>
              <div className="bg-uc-dark-bg p-4 rounded-xl shadow-lg border border-uc-purple/20 hover:border-uc-purple/40 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-uc-purple">{stats.thisMonthWorkouts}</div>
                  {stats.lastMonthWorkouts > 0 && (
                    <span className={`text-xs font-medium ${
                      stats.thisMonthWorkouts >= stats.lastMonthWorkouts ? 'text-uc-success' : 'text-red-400'
                    }`}>
                      {stats.thisMonthWorkouts >= stats.lastMonthWorkouts ? '↑' : '↓'} {Math.abs(calculateTrend(stats.thisMonthWorkouts, stats.lastMonthWorkouts))}%
                    </span>
                  )}
                </div>
                <div className="text-sm text-uc-text-muted">{t('dashboard.thisMonth') || 'This Month'}</div>
              </div>
              <div className="bg-uc-dark-bg p-4 rounded-xl shadow-lg border border-uc-purple/20 hover:border-uc-purple/40 transition-all cursor-pointer">
                <div className="text-2xl font-bold text-uc-mustard">{stats.totalEvents}</div>
                <div className="text-sm text-uc-text-muted">{t('dashboard.events') || 'Events'}</div>
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
                recentWorkouts.map((workout) => (
                  <Link
                    key={workout.id}
                    href={`/workouts`}
                    className="flex items-center space-x-3 p-3 bg-uc-black/50 rounded-xl hover:bg-uc-black/70 transition-colors"
                  >
                    <span className="text-lg">{getWorkoutTypeEmoji(workout.type)}</span>
                    <div className="flex-1">
                      <div className="font-medium text-uc-text-light">
                        {t(`workoutTypes.${workout.type.toLowerCase()}`) || workout.type}
                      </div>
                      <div className="text-sm text-uc-text-muted">
                        {new Date(workout.startTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm text-uc-text-muted">
                      {workout.trainingVolume}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🏋️</div>
                  <p className="text-uc-text-muted mb-4">{t('dashboard.noWorkouts') || 'No workouts yet'}</p>
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

        {/* PWA Status Cards */}
        <div className="mb-8">
          <button
            onClick={() => setShowPWAStatus(!showPWAStatus)}
            className="flex items-center justify-between w-full mb-4 text-left"
          >
            <h3 className="text-lg font-semibold text-uc-text-light">
              📱 {t('dashboard.appStatus') || 'App Status'}
            </h3>
            <svg
              className={`w-5 h-5 text-uc-text-muted transition-transform ${showPWAStatus ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
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


      </main>

      {showOfflineForm && (
        <OfflineWorkoutForm onClose={() => setShowOfflineForm(false)} />
      )}

      <MessagesPanel
        isOpen={isMessagesPanelOpen}
        onClose={() => setIsMessagesPanelOpen(false)}
      />
    </div>
  )
}
