'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { statisticsService, StatisticsData, TimeFrame } from '@/lib/statistics-service';
import { Workout, Tag } from '@/types/workout';
import { Event } from '@/types/event';
import { useCycle } from '@/contexts/CycleContext';
import { calculateCycleInfo } from '@/lib/cycle-utils';

export const StatisticsContent = () => {
  const { t } = useLanguage();
  const { cycleSettings, isCycleTrackingEnabled } = useCycle();
  const [timeframe, setTimeframe] = useState<TimeFrame>('1month');
  const [statsData, setStatsData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load workouts
        const workoutsResponse = await fetch('/api/workouts');
        if (workoutsResponse.ok) {
          const workoutsData = await workoutsResponse.json();
          setWorkouts(workoutsData);
        } else if (workoutsResponse.status === 401) {
          // User is not authenticated, this is expected for protected components
        }
        
        // Load events
        const eventsResponse = await fetch('/api/events');
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setEvents(eventsData);
        } else if (eventsResponse.status === 401) {
          // User is not authenticated, this is expected for protected components
        }
        
        // Load tags
        const tagsResponse = await fetch('/api/tags');
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          setTags(tagsData);
        } else if (tagsResponse.status === 401) {
          // User is not authenticated, this is expected for protected components
        }
        
        // Set last updated time on client side only
        setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
      } catch (error) {
        console.error('Error loading statistics data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate statistics when data or timeframe changes
  useEffect(() => {
    if (workouts.length > 0) {
      const stats = statisticsService.calculateStatistics(
        workouts, 
        tags, 
        timeframe, 
        undefined, 
        events, 
        isCycleTrackingEnabled && cycleSettings ? cycleSettings : undefined
      );
      setStatsData(stats);
    }
  }, [workouts, tags, timeframe, events, isCycleTrackingEnabled, cycleSettings]);

  const getWorkoutTypeIcon = (type: string) => {
    switch (type) {
      case 'GYM': return '🏋️';
      case 'BOULDERING': return '🧗';
      case 'CIRCUITS': return '🔄';
      case 'LEAD_ROCK': return '🏔️';
      case 'LEAD_ARTIFICIAL': return '🧗‍♀️';
      case 'MENTAL_PRACTICE': return '🧘';
      default: return '📊';
    }
  };

  const getWorkoutTypeName = (type: string) => {
    switch (type) {
      case 'GYM': return 'Gym';
      case 'BOULDERING': return 'Bouldering';
      case 'CIRCUITS': return 'Circuits';
      case 'LEAD_ROCK': return 'Lead Rock';
      case 'LEAD_ARTIFICIAL': return 'Lead Artificial';
      case 'MENTAL_PRACTICE': return 'Mental Practice';
      default: return type;
    }
  };

  const getVolumeName = (volume: string) => {
    return volume.replace('TR', 'TR ');
  };

  return (
    <div className="bg-uc-dark-bg rounded-2xl shadow-lg border border-uc-purple/20">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-uc-purple/20">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold text-uc-text-light">
            📊 {t('stats.title')}
          </h2>
          {loading && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-uc-mustard"></div>
          )}
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-uc-text-light">
            {t('stats.timeframe')}:
          </label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as TimeFrame)}
            className="border border-uc-purple/20 rounded-xl px-3 py-1 text-sm bg-uc-black text-uc-text-light focus:border-uc-purple focus:outline-none"
          >
            <option value="1week">{t('stats.1week') || '1 Week'}</option>
            <option value="1month">{t('stats.1month') || '1 Month'}</option>
            <option value="3months">{t('stats.3months') || '3 Months'}</option>
            <option value="6months">{t('stats.6months') || '6 Months'}</option>
            <option value="1year">{t('stats.1year') || '1 Year'}</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!statsData ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-uc-mustard mx-auto mb-4"></div>
              <p className="text-uc-text-muted">Ładowanie statystyk...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overall Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-uc-purple/20 p-4 rounded-xl border border-uc-purple/30">
                <div className="text-2xl font-bold text-uc-purple">
                  {statsData.overall.totalWorkouts}
                </div>
                <div className="text-sm text-uc-text-muted">
                  {t('stats.totalWorkouts')}
                </div>
              </div>
              <div className="bg-uc-mustard/20 p-4 rounded-xl border border-uc-mustard/30">
                <div className="text-2xl font-bold text-uc-mustard">
                  {statsData.overall.averageWorkoutsThisMonth}
                </div>
                <div className="text-sm text-uc-text-muted">
                  Ten Miesiąc
                </div>
              </div>
              <div className="bg-uc-success/20 p-4 rounded-xl border border-uc-success/30">
                <div className="text-2xl font-bold text-uc-success">
                  {statsData.overall.averageWorkoutsPerWeek}
                </div>
                <div className="text-sm text-uc-text-muted">
                  {t('stats.avgPerWeek')}
                </div>
              </div>
              <div className="bg-uc-alert/20 p-4 rounded-xl border border-uc-alert/30">
                <div className="text-2xl font-bold text-uc-alert">
                  {statsData.overall.currentStreak}
                </div>
                <div className="text-sm text-uc-text-muted">
                  {t('stats.currentStreak')}
                </div>
              </div>
            </div>

            {/* Workout Types */}
            <div>
              <h3 className="text-lg font-semibold text-uc-text-light mb-4">
                🏋️ {t('stats.workoutTypes')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statsData.workoutTypes.map((typeStats) => (
                  <div key={typeStats.type} className="bg-uc-black/50 p-4 rounded-xl border border-uc-purple/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getWorkoutTypeIcon(typeStats.type)}</span>
                        <span className="font-medium text-uc-text-light">
                          {getWorkoutTypeName(typeStats.type)}
                        </span>
                      </div>
                      <span className="text-sm text-uc-text-muted">
                        {typeStats.percentage}%
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-uc-text-muted">{t('stats.count')}:</span>
                        <span className="font-medium text-uc-text-light">{typeStats.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-uc-text-muted">{t('stats.frequency')}:</span>
                        <span className="font-medium text-uc-text-light">{statisticsService.formatFrequency(typeStats.frequency)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            {statsData.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-uc-text-light mb-4">
                  🏷️ {t('stats.tags')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statsData.tags.map((tagStats) => (
                    <div key={tagStats.tag.id} className="bg-uc-black/50 p-4 rounded-xl border border-uc-purple/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: tagStats.tag.color }}
                          ></div>
                          <span className="font-medium text-uc-text-light">
                            {tagStats.tag.name}
                          </span>
                        </div>
                        <span className="text-sm text-uc-text-muted">
                          {tagStats.percentage}%
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-uc-text-muted">{t('stats.count')}:</span>
                          <span className="font-medium text-uc-text-light">{tagStats.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-uc-text-muted">{t('stats.frequency')}:</span>
                          <span className="font-medium text-uc-text-light">{statisticsService.formatFrequency(tagStats.frequency)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Training Volumes */}
            {statsData.trainingVolumes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-uc-text-light mb-4">
                  📈 {t('stats.trainingVolumes')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {statsData.trainingVolumes.map((volumeStats) => (
                    <div key={volumeStats.volume} className="bg-uc-black/50 p-4 rounded-xl border border-uc-purple/20 text-center">
                      <div className="text-2xl font-bold text-uc-text-light mb-1">
                        {volumeStats.count}
                      </div>
                      <div className="text-sm font-medium text-uc-text-muted mb-1">
                        {getVolumeName(volumeStats.volume)}
                      </div>
                      <div className="text-xs text-uc-text-muted">
                        {volumeStats.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mental Sessions */}
            <div>
              <h3 className="text-lg font-semibold text-uc-text-light mb-4">
                🧘 {t('stats.mentalSessions')}
              </h3>
              <div className="bg-uc-black/50 p-4 rounded-xl border border-uc-purple/20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-uc-text-light">
                      {statsData.mentalSessions.totalSessions}
                    </div>
                    <div className="text-sm text-uc-text-muted">
                      {t('stats.totalSessions')}
                    </div>
                  </div>
                  {statsData.mentalSessions.totalSessions > 0 && (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-uc-text-light">
                          {statsData.mentalSessions.averageFocusLevel}
                        </div>
                        <div className="text-sm text-uc-text-muted">
                          {t('stats.avgFocusLevel')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-uc-text-light">
                          {statsData.mentalSessions.daysSinceLastSession}
                        </div>
                        <div className="text-sm text-uc-text-muted">
                          {t('stats.daysSinceLast')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-uc-text-light">
                          {statsData.mentalSessions.practiceTypes.meditation}
                        </div>
                        <div className="text-sm text-uc-text-muted">
                          {t('stats.meditation')}
                        </div>
                      </div>
                    </>
                  )}
                  {statsData.mentalSessions.totalSessions === 0 && (
                    <div className="col-span-3 flex items-center justify-center">
                      <p className="text-uc-text-muted text-sm">
                        Brak sesji mentalnych w tym okresie
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Falls Tracking */}
            <div>
              <h3 className="text-lg font-semibold text-uc-text-light mb-4">
                🧗‍♀️ {t('stats.fallsTracking')}
              </h3>
              <div className="bg-uc-black/50 p-4 rounded-xl border border-uc-purple/20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-uc-text-light">
                      {statsData.falls.totalFalls}
                    </div>
                    <div className="text-sm text-uc-text-muted">
                      {t('stats.totalFalls')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-uc-text-light">
                      {statsData.falls.totalClimbingSessions}
                    </div>
                    <div className="text-sm text-uc-text-muted">
                      {t('stats.climbingSessions')}
                    </div>
                  </div>
                  {statsData.falls.totalFalls > 0 && (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-uc-text-light">
                          {statsData.falls.fallsPerSession}
                        </div>
                        <div className="text-sm text-uc-text-muted">
                          {t('stats.fallsPerSession')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-uc-text-light">
                          {statsData.falls.daysSinceLastFall}
                        </div>
                        <div className="text-sm text-uc-text-muted">
                          {t('stats.daysSinceLastFall')}
                        </div>
                      </div>
                    </>
                  )}
                  {statsData.falls.totalFalls === 0 && (
                    <div className="col-span-2 flex items-center justify-center">
                      <p className="text-uc-text-muted text-sm">
                        Brak upadków w tym okresie
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Injury Cycle Analysis */}
            {isCycleTrackingEnabled && (
              <div>
                <h3 className="text-lg font-semibold text-uc-text-light mb-4">
                  🤕 Kontuzje według Fazy Cyklu
                </h3>
                <div className="bg-uc-black/50 p-4 rounded-xl border border-uc-purple/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-uc-text-light">
                        {statsData.injuryCycle.totalInjuries}
                      </div>
                      <div className="text-sm text-uc-text-muted">
                        Łącznie Kontuzji
                      </div>
                    </div>
                    {statsData.injuryCycle.totalInjuries > 0 && (
                      <>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-uc-text-light">
                            {statsData.injuryCycle.daysSinceLastInjury}
                          </div>
                          <div className="text-sm text-uc-text-muted">
                            Dni Od Ostatniej
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-uc-text-light">
                            {Math.max(...Object.values(statsData.injuryCycle.injuriesByPhase) as number[])}
                          </div>
                          <div className="text-sm text-uc-text-muted">
                            Najwięcej w Fazie
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-uc-text-light">
                            {(Object.values(statsData.injuryCycle.injuriesByPhase) as number[]).filter(count => count > 0).length}
                          </div>
                          <div className="text-sm text-uc-text-muted">
                            Fazy z Kontuzjami
                          </div>
                        </div>
                      </>
                    )}
                    {statsData.injuryCycle.totalInjuries === 0 && (
                      <div className="col-span-3 flex items-center justify-center">
                        <p className="text-uc-text-muted text-sm">
                          0 kontuzji ostatnio
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Cycle Phase Breakdown */}
                  {statsData.injuryCycle.totalInjuries > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-uc-text-light mb-4">
                        Liczba kontuzji w każdej fazie cyklu
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-red-500/20 rounded-xl border-2 border-red-500/30 hover:bg-red-500/30 transition-colors">
                          <div className="text-3xl font-bold text-red-400 mb-2">
                            {statsData.injuryCycle.injuriesByPhase.menstrual}
                          </div>
                          <div className="text-sm font-medium text-uc-text-light mb-1">
                            Miesiączka
                          </div>
                          <div className="text-xs text-uc-text-muted">
                            Dni 1-7
                          </div>
                        </div>
                        <div className="text-center p-4 bg-green-500/20 rounded-xl border-2 border-green-500/30 hover:bg-green-500/30 transition-colors">
                          <div className="text-3xl font-bold text-green-400 mb-2">
                            {statsData.injuryCycle.injuriesByPhase.follicular}
                          </div>
                          <div className="text-sm font-medium text-uc-text-light mb-1">
                            Folikularna
                          </div>
                          <div className="text-xs text-uc-text-muted">
                            Dni 8-12
                          </div>
                        </div>
                        <div className="text-center p-4 bg-yellow-500/20 rounded-xl border-2 border-yellow-500/30 hover:bg-yellow-500/30 transition-colors">
                          <div className="text-3xl font-bold text-yellow-400 mb-2">
                            {statsData.injuryCycle.injuriesByPhase.ovulation}
                          </div>
                          <div className="text-sm font-medium text-uc-text-light mb-1">
                            Owulacja
                          </div>
                          <div className="text-xs text-uc-text-muted">
                            Dni 13-16
                          </div>
                        </div>
                        <div className="text-center p-4 bg-blue-500/20 rounded-xl border-2 border-blue-500/30 hover:bg-blue-500/30 transition-colors">
                          <div className="text-3xl font-bold text-blue-400 mb-2">
                            {statsData.injuryCycle.injuriesByPhase.earlyLuteal}
                          </div>
                          <div className="text-sm font-medium text-uc-text-light mb-1">
                            Wczesna Lutealna
                          </div>
                          <div className="text-xs text-uc-text-muted">
                            Dni 17-20
                          </div>
                        </div>
                        <div className="text-center p-4 bg-purple-500/20 rounded-xl border-2 border-purple-500/30 hover:bg-purple-500/30 transition-colors">
                          <div className="text-3xl font-bold text-purple-400 mb-2">
                            {statsData.injuryCycle.injuriesByPhase.lateLuteal}
                          </div>
                          <div className="text-sm font-medium text-uc-text-light mb-1">
                            Późna Lutealna
                          </div>
                          <div className="text-xs text-uc-text-muted">
                            Dni 21-28
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-uc-text-muted text-center">
                        Każda faza pokazuje liczbę kontuzji w określonym zakresie dni cyklu
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-uc-purple/20 bg-uc-black/30">
        <div className="flex items-center justify-between text-sm text-uc-text-muted">
          <span>
            {statsData && `${statsData.timeRange.start.toLocaleDateString()} - ${statsData.timeRange.end.toLocaleDateString()}`}
          </span>
          <span>
            {t('stats.lastUpdated')}: {lastUpdated}
          </span>
        </div>
      </div>
    </div>
  );
};
