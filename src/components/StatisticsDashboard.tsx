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
        }
        
        // Load tags
        const tagsResponse = await fetch('/api/tags');
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          setTags(tagsData);
        }
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
                <p className="text-slate-600 dark:text-slate-400">Loading statistics...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Overall Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {statsData.overall.totalWorkouts}
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    {t('stats.totalWorkouts') || 'Total Workouts'}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {statisticsService.formatDuration(statsData.overall.totalDuration)}
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-300">
                    {t('stats.totalDuration') || 'Total Duration'}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {statsData.overall.averageWorkoutsPerWeek}
                  </div>
                  <div className="text-sm text-purple-800 dark:text-purple-300">
                    {t('stats.avgPerWeek') || 'Avg/Week'}
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {statsData.overall.currentStreak}
                  </div>
                  <div className="text-sm text-orange-800 dark:text-orange-300">
                    {t('stats.currentStreak') || 'Current Streak'}
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
                          <span className="font-medium">{statisticsService.formatFrequency(typeStats.frequency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">{t('stats.avgDuration') || 'Avg Duration'}:</span>
                          <span className="font-medium">{statisticsService.formatDuration(typeStats.averageDuration)}</span>
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
                            <span className="font-medium">{statisticsService.formatFrequency(tagStats.frequency)}</span>
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
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {statsData.falls.totalClimbingSessions}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {t('stats.climbingSessions') || 'Climbing Sessions'}
                      </div>
                    </div>
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
              {t('stats.lastUpdated') || 'Last updated'}: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
