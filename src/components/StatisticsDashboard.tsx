'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { statisticsService, StatisticsData, TimeFrame } from '@/lib/statistics-service';
import { Workout, Tag } from '@/types/workout';

interface StatisticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatisticsDashboard = ({ isOpen, onClose }: StatisticsDashboardProps) => {
  const { t } = useLanguage();
  const [timeframe, setTimeframe] = useState<TimeFrame>('1month');
  const [statsData, setStatsData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load workouts - statistics needs all data, so use a large limit
        const workoutsResponse = await fetch('/api/workouts?page=1&limit=1000', { credentials: 'include' });
        if (workoutsResponse.ok) {
          const data = await workoutsResponse.json();
          // Handle both new paginated format and old format
          const workoutsData = Array.isArray(data) ? data : (data.workouts || []);
          setWorkouts(workoutsData);
        } else if (workoutsResponse.status === 401) {
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

    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Calculate statistics when data or timeframe changes
  useEffect(() => {
    if (workouts.length > 0) {
      const stats = statisticsService.calculateStatistics(workouts, tags, timeframe);
      setStatsData(stats);
    }
  }, [workouts, tags, timeframe]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              📊 {t('stats.title') || 'Statistics'}
            </h2>
            {loading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            )}
          </div>
          
          {/* Timeframe Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('stats.timeframe') || 'Timeframe'}:
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as TimeFrame)}
              className="border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
            >
              <option value="1week">{t('stats.1week') || '1 Week'}</option>
              <option value="1month">{t('stats.1month') || '1 Month'}</option>
              <option value="3months">{t('stats.3months') || '3 Months'}</option>
              <option value="6months">{t('stats.6months') || '6 Months'}</option>
              <option value="1year">{t('stats.1year') || '1 Year'}</option>
              <option value="all">{t('stats.allTime') || 'All Time'}</option>
            </select>
          </div>
          
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[75vh] p-6">
          {!statsData ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">{t('common.loadingStatistics') || 'Loading statistics...'}</p>
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
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  🏋️ {t('stats.workoutTypes') || 'Workout Types'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statsData.workoutTypes.map((typeStats) => (
                    <div key={typeStats.type} className="bg-white dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{getWorkoutTypeIcon(typeStats.type)}</span>
                          <span className="font-medium text-slate-900 dark:text-slate-50">
                            {getWorkoutTypeName(typeStats.type)}
                          </span>
                        </div>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {typeStats.percentage}%
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">{t('stats.count') || 'Count'}:</span>
                          <span className="font-medium">{typeStats.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">{t('stats.frequency') || 'Frequency'}:</span>
                          <span className="font-medium">{statisticsService.formatFrequency(typeStats.frequency, 'week')}/{t('stats.frequencyPeriod.week') || 'week'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {statsData.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                    🏷️ {t('stats.tags') || 'Tags'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {statsData.tags.map((tagStats) => (
                      <div key={tagStats.tag.id} className="bg-white dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: tagStats.tag.color }}
                            ></div>
                            <span className="font-medium text-slate-900 dark:text-slate-50">
                              {tagStats.tag.name}
                            </span>
                          </div>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {tagStats.percentage}%
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">{t('stats.count') || 'Count'}:</span>
                            <span className="font-medium">{tagStats.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">{t('stats.frequency') || 'Frequency'}:</span>
                            <span className="font-medium">{statisticsService.formatFrequency(tagStats.frequency, 'week')}/{t('stats.frequencyPeriod.week') || 'week'}</span>
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
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                    📈 {t('stats.trainingVolumes') || 'Training Volumes'}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {statsData.trainingVolumes.map((volumeStats) => (
                      <div key={volumeStats.volume} className="bg-white dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600 text-center">
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                          {volumeStats.count}
                        </div>
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                          {getVolumeName(volumeStats.volume)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          {volumeStats.percentage}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mental Sessions */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  🧘 {t('stats.mentalSessions') || 'Mental Practice'}
                </h3>
                <div className="bg-white dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {statsData.mentalSessions.totalSessions}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {t('stats.totalSessions') || 'Total Sessions'}
                      </div>
                    </div>
                    {statsData.mentalSessions.totalSessions > 0 && (
                      <>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            {statsData.mentalSessions.averageFocusLevel}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {t('stats.avgFocusLevel') || 'Avg Focus Level'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            {statsData.mentalSessions.daysSinceLastSession}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {t('stats.daysSinceLast') || 'Days Since Last'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            {statsData.mentalSessions.practiceTypes.meditation}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {t('stats.meditation') || 'Meditation'}
                          </div>
                        </div>
                      </>
                    )}
                    {statsData.mentalSessions.totalSessions === 0 && (
                      <div className="col-span-3 flex items-center justify-center">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          Brak sesji mentalnych w tym okresie
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Falls Tracking */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  🧗‍♀️ {t('stats.fallsTracking') || 'Falls Tracking'}
                </h3>
                <div className="bg-white dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {statsData.falls.totalFalls}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {t('stats.totalFalls') || 'Total Falls'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {statsData.falls.totalClimbingSessions}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {t('stats.climbingSessions') || 'Climbing Sessions'}
                      </div>
                    </div>
                    {statsData.falls.totalFalls > 0 && (
                      <>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            {statsData.falls.fallsPerSession}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {t('stats.fallsPerSession') || 'Falls/Session'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            {statsData.falls.daysSinceLastFall}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {t('stats.daysSinceLastFall') || 'Days Since Last Fall'}
                          </div>
                        </div>
                      </>
                    )}
                    {statsData.falls.totalFalls === 0 && (
                      <div className="col-span-2 flex items-center justify-center">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          Brak upadków w tym okresie
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>
              {statsData && `${statsData.timeRange.start.toLocaleDateString()} - ${statsData.timeRange.end.toLocaleDateString()}`}
            </span>
            <span>
              {t('stats.lastUpdated') || 'Last updated'}: {lastUpdated}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
