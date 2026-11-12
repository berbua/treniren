'use client';

import { useState, useEffect, useMemo, ReactNode } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { statisticsService, StatisticsData, TimeFrame } from '@/lib/statistics-service';
import { Workout, Tag, WorkoutType } from '@/types/workout';
import { Event } from '@/types/event';
import { useCycle } from '@/contexts/CycleContext';
import { CyclePhase, getPhaseDisplayName, getPhaseDayRange } from '@/lib/cycle-utils';
import { useNotifications } from '@/contexts/NotificationContext';
import { STREAK_MIN_SESSIONS } from '@/lib/streak';
import { WeeklyVolumeChart } from './WeeklyVolumeChart';
import { StatsFingerboardTests } from './StatsFingerboardTests';
import {
  Button, Card, EmptyState, Icon, Overline, SegmentedControl, SkeletonRows, StatTile, WorkoutIconTile,
  buttonClasses, phaseBandBg, phaseTranslationKey, workoutBg,
} from '@/components/ui';

type FrequencyPeriod = 'week' | 'month' | 'quarter' | 'year';

const typeLabelKey: Record<WorkoutType, string> = {
  GYM: 'gym',
  BOULDERING: 'bouldering',
  CIRCUITS: 'circuits',
  LEAD_ROCK: 'leadRock',
  LEAD_ARTIFICIAL: 'leadArtificial',
  MENTAL_PRACTICE: 'mentalPractice',
  FINGERBOARD: 'fingerboard',
};

// Range segments from the mockup (decision 42): 4W / 3M / 6M / 1Y
const timeframes: { value: TimeFrame; key: string; short: string }[] = [
  { value: '4weeks', key: '4weeks', short: '4W' },
  { value: '3months', key: '3months', short: '3M' },
  { value: '6months', key: '6months', short: '6M' },
  { value: '1year', key: '1year', short: '1Y' },
];

const phases: CyclePhase[] = ['menstrual', 'follicular', 'ovulation', 'early-luteal', 'late-luteal'];

/** Card with a 17px section title and optional line under it. */
const Section = ({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children: ReactNode }) => (
  <Card className="p-5">
    <h2 className="text-[17px] font-extrabold text-uc-text">{title}</h2>
    {subtitle && <p className="mt-0.5 text-[13px] font-semibold text-uc-text-muted">{subtitle}</p>}
    <div className="mt-4">{children}</div>
  </Card>
);

const Bar = ({ percent, className }: { percent: number; className: string }) => (
  <div className="h-2 rounded-uc-pill bg-uc-skeleton overflow-hidden">
    <div className={`h-full rounded-uc-pill ${className}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
  </div>
);

export const StatisticsContent = () => {
  const { t, tPlural, language } = useLanguage();
  const locale = language === 'pl' ? 'pl-PL' : 'en-GB';
  const { cycleSettings, isCycleTrackingEnabled } = useCycle();
  const { settings: notificationSettings, updateSettings } = useNotifications();
  const [timeframe, setTimeframe] = useState<TimeFrame>('4weeks');
  const [isEnablingNotification, setIsEnablingNotification] = useState(false);
  const [statsData, setStatsData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [gratitudeFilter, setGratitudeFilter] = useState<'all' | 'gratitude' | 'improvements'>('all');
  const [variationFrequencyPeriod, setVariationFrequencyPeriod] = useState<FrequencyPeriod>('month');
  
  // Calculate variation frequency for GYM workouts
  const gymVariationFrequency = useMemo(() => {
    const gymWorkouts = workouts.filter(w => w.type === 'GYM' && w.details?.routineVariation);
    if (gymWorkouts.length === 0) return null;
    
    // Group by variation
    const variationCounts = new Map<string, number>();
    gymWorkouts.forEach(workout => {
      const variation = workout.details?.routineVariation;
      if (variation?.variationName) {
        const key = `${variation.routineName || 'Unknown'} - ${variation.variationName}`;
        variationCounts.set(key, (variationCounts.get(key) || 0) + 1);
      }
    });
    
    // Get time range for the selected period
    const now = new Date();
    const periodStart = new Date(now);
    switch (variationFrequencyPeriod) {
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        periodStart.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    // Filter workouts within period
    const periodWorkouts = gymWorkouts.filter(w => new Date(w.startTime) >= periodStart);
    const periodDays = Math.max(1, (now.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000));
    
    // Calculate frequency per period
    const variationFreq: Array<{ name: string; frequency: number }> = [];
    variationCounts.forEach((count, name) => {
      const periodCount = periodWorkouts.filter(w => {
        const v = w.details?.routineVariation;
        return v?.variationName && `${v.routineName || 'Unknown'} - ${v.variationName}` === name;
      }).length;
      // Calculate frequency: count per period, normalized to the period unit
      const frequency = (periodCount / periodDays) * (variationFrequencyPeriod === 'week' ? 7 : variationFrequencyPeriod === 'month' ? 30 : variationFrequencyPeriod === 'quarter' ? 90 : 365);
      variationFreq.push({ name, frequency });
    });
    
    return variationFreq.sort((a, b) => b.frequency - a.frequency);
  }, [workouts, variationFrequencyPeriod]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load workouts - statistics needs all data, so use a large limit
        const workoutsResponse = await fetch('/api/workouts?page=1&limit=1000', { credentials: 'include' });
        if (workoutsResponse.ok) {
          const workoutsData = await workoutsResponse.json();
          // Handle both new paginated format and old format
          setWorkouts(workoutsData.workouts || workoutsData);
        } else if (workoutsResponse.status === 401) {
          // User is not authenticated, this is expected for protected components
        }
        
        // Load events - statistics needs all data, so use a large limit
        const eventsResponse = await fetch('/api/events?page=1&limit=1000', { credentials: 'include' });
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          // Handle both new paginated format and old format
          setEvents(eventsData.events || eventsData);
        } else if (eventsResponse.status === 401) {
          // User is not authenticated, this is expected for protected components
        }
        
        // Load tags
        const tagsResponse = await fetch('/api/tags', { credentials: 'include' });
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          setTags(tagsData);
        } else if (tagsResponse.status === 401) {
          // User is not authenticated, this is expected for protected components
        }
        
        // Set last updated time on client side only
        setLastUpdated(new Date());
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

  // Workouts in the stats range (weekly volume chart)
  const workoutsInRange = useMemo(() => {
    if (!statsData) return [];
    const { start, end } = statsData.timeRange;
    return workouts.filter(workout => {
      const date = new Date(workout.startTime);
      return date >= start && date <= end;
    });
  }, [workouts, statsData]);

  // Filter workouts with gratitude/improvements based on timeframe
  const filteredGratitudeWorkouts = useMemo(() => {
    if (!statsData) return [];
    
    const timeRange = statisticsService.getTimeRange(timeframe);
    const workoutsInRange = workouts.filter(workout => {
      const workoutDate = new Date(workout.startTime);
      return workoutDate >= timeRange.start && workoutDate <= timeRange.end;
    });

    const workoutsWithGratitude = workoutsInRange
      .filter((w: Workout) => w.gratitude || w.improvements)
      .sort((a: Workout, b: Workout) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    if (gratitudeFilter === 'gratitude') {
      return workoutsWithGratitude.filter(w => w.gratitude);
    }
    if (gratitudeFilter === 'improvements') {
      return workoutsWithGratitude.filter(w => w.improvements);
    }
    return workoutsWithGratitude;
  }, [workouts, timeframe, statsData, gratitudeFilter]);



  const periodLabel = t(`stats.frequencyPeriod.${variationFrequencyPeriod}`) || variationFrequencyPeriod;
  const formatFrequency = (frequency: number) =>
    `${statisticsService.formatFrequency(frequency, variationFrequencyPeriod)}/${periodLabel}`;
  const formatShortDate = (date: Date, withYear = false) =>
    date.toLocaleDateString(locale, { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
  const getTrainingTypeLabel = (type: WorkoutType) => t(`training.types.${typeLabelKey[type]}`) || type;

  const handleEnableInjuryNotification = async () => {
    if (!statsData) return;
    setIsEnablingNotification(true);
    try {
      // Enable injury phase notification
      if (!statsData.injuryCycle.phaseWithMostInjuries) {
        throw new Error('No phase with most injuries found');
      }

      // Save notification preference
      const currentSettings = notificationSettings || {};
      updateSettings({
        ...currentSettings,
        injuryPhaseNotificationEnabled: true,
        injuryPhaseNotificationPhase: statsData.injuryCycle.phaseWithMostInjuries,
      });

      // Show success message
      alert(t('stats.injuryPhaseNotificationEnabled') || 'Notification enabled! You will receive a reminder 1 day before this phase starts.');
    } catch (error) {
      console.error('Error enabling notification:', error);
      alert(t('stats.injuryPhaseNotificationError') || 'Failed to enable notification. Please try again.');
    } finally {
      setIsEnablingNotification(false);
    }
  };

  const cycleLength = cycleSettings?.cycleLength || 28;
  const injuryCycle = statsData?.injuryCycle;
  const injuriesByPhase = injuryCycle
    ? (Object.values(injuryCycle.injuriesByPhase) as number[])
    : [];
  const mostInjuriesPhase = injuryCycle?.phaseWithMostInjuries && injuryCycle.maxInjuriesInPhase > 0
    ? getPhaseDisplayName(injuryCycle.phaseWithMostInjuries)
    : null;
  const notificationEnabled = notificationSettings?.injuryPhaseNotificationEnabled === true;

  // One row per note; a workout with both shows two rows
  const gratitudeRows = filteredGratitudeWorkouts.flatMap((workout) => [
    ...(gratitudeFilter !== 'improvements' && workout.gratitude
      ? [{ id: `gratitude-${workout.id}`, kind: 'gratitude' as const, text: workout.gratitude, workout }]
      : []),
    ...(gratitudeFilter !== 'gratitude' && workout.improvements
      ? [{ id: `improvements-${workout.id}`, kind: 'improvements' as const, text: workout.improvements, workout }]
      : []),
  ]);

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="space-y-4 lg:grid lg:grid-cols-[3fr_2fr] lg:gap-4 lg:space-y-0">
        <div>
          <Overline className="mb-2 flex items-center gap-2">
            {t('stats.timeframe')}
            {loading && <span aria-hidden className="size-3 animate-spin rounded-full border-2 border-uc-primary border-t-transparent" />}
          </Overline>
          <SegmentedControl
            ariaLabel={t('stats.timeframe')}
            value={timeframe}
            onChange={setTimeframe}
            options={timeframes.map((tf) => ({
              value: tf.value,
              label: (
                <>
                  <span aria-hidden>{t(`stats.short.${tf.key}`) || tf.short}</span>
                  <span className="sr-only">{t(`stats.${tf.key}`)}</span>
                </>
              ),
            }))}
          />
        </div>
        <div>
          <Overline className="mb-2">{t('stats.showFrequencyPer') || 'Show frequency per'}</Overline>
          <SegmentedControl
            ariaLabel={t('stats.showFrequencyPer') || 'Show frequency per'}
            value={variationFrequencyPeriod}
            onChange={setVariationFrequencyPeriod}
            options={(['week', 'month', 'quarter', 'year'] as const).map((period) => ({
              value: period,
              label: <span className="first-letter:uppercase">{t(`stats.frequencyPeriod.${period}`) || period}</span>,
            }))}
          />
        </div>
      </div>

      {!statsData ? (
        <Card>
          <SkeletonRows />
          <p className="sr-only">{t('common.loadingStatistics') || 'Loading statistics...'}</p>
        </Card>
      ) : statsData.overall.totalWorkouts === 0 ? (
        <Card>
          <EmptyState
            icon={<Icon name="stats" size={28} />}
            title={t('stats.noData') || 'No statistics available yet'}
            description={t('stats.noDataDescription') || 'Start logging workouts to see detailed statistics about your training progress, volume, and performance over time.'}
            action={
              <Link href="/workouts" className={buttonClasses('accent', 'lg')}>
                <Icon name="plus" /> {t('stats.logFirstWorkout') || 'Log Your First Workout'}
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {/* Overall Stats */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label={t('stats.totalWorkouts')} value={statsData.overall.totalWorkouts} />
            <StatTile label={t('stats.thisMonth') || 'This month'} value={statsData.overall.averageWorkoutsThisMonth} />
            <StatTile label={t('stats.avgPerWeek')} value={statsData.overall.averageWorkoutsPerWeek} />
            <StatTile
              label={t('stats.currentStreak')}
              value={statsData.overall.currentStreak}
              unit={tPlural('dashboard.weeksUnit', statsData.overall.currentStreak)}
              footer={t('dashboard.streakRule', { min: STREAK_MIN_SESSIONS })}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            {/* Workout Types */}
            <section className="space-y-3">
              <h2 className="pt-2 text-[22px] font-extrabold text-uc-text">{t('stats.workoutTypes')}</h2>
              {statsData.workoutTypes.map((typeStats) => (
                <Card key={typeStats.type}>
                  <div className="flex items-center gap-3">
                    <WorkoutIconTile workoutType={typeStats.type} />
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-uc-text">{getTrainingTypeLabel(typeStats.type)}</p>
                      <p className="text-[13px] font-semibold text-uc-text-muted uc-num">
                        {t('stats.count')}: {typeStats.count} · {formatFrequency(typeStats.frequency)}
                      </p>
                    </div>
                    <span className="text-xl font-extrabold text-uc-text uc-num">{typeStats.percentage}%</span>
                  </div>
                  <div className="mt-3">
                    <Bar percent={typeStats.percentage} className={workoutBg[typeStats.type]} />
                  </div>
                  {/* Variation frequency for GYM workouts */}
                  {typeStats.type === 'GYM' && gymVariationFrequency && gymVariationFrequency.length > 0 && (
                    <div className="mt-3">
                      <Overline className="mb-2">
                        {t('stats.variationFrequency') || 'Variation Frequency'} ({periodLabel})
                      </Overline>
                      <div className="flex flex-wrap gap-2">
                        {gymVariationFrequency.slice(0, 3).map((vf) => (
                          <span
                            key={vf.name}
                            className="inline-flex min-h-8 items-center gap-1.5 rounded-[10px] border border-uc-border px-2.5 text-xs font-bold text-uc-text"
                          >
                            {vf.name}
                            <span className="text-uc-text-muted uc-num">{vf.frequency.toFixed(1)}/{periodLabel}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </section>

            <div className="space-y-4 lg:pt-12">
              {/* Tags */}
              {statsData.tags.length > 0 && (
                <Section title={t('stats.tags')}>
                  <ul className="space-y-3">
                    {statsData.tags.map((tagStats) => (
                      <li key={tagStats.tag.id} className="flex items-center gap-3">
                        <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: tagStats.tag.color }} />
                        <span className="min-w-0 flex-1 truncate font-bold text-uc-text">{tagStats.tag.name}</span>
                        <span className="text-[13px] font-semibold text-uc-text-muted uc-num">
                          {tagStats.count} · {formatFrequency(tagStats.frequency)}
                        </span>
                        <span className="w-11 text-right text-sm font-extrabold text-uc-text uc-num">{tagStats.percentage}%</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Training Volumes */}
              {statsData.trainingVolumes.length > 0 && (
                <Section title={t('stats.trainingVolumes')}>
                  <ul className="space-y-3">
                    {statsData.trainingVolumes.map((volumeStats) => (
                      <li key={volumeStats.volume} className="flex items-center gap-3">
                        <span className="w-9 text-sm font-extrabold text-uc-text uc-num">{volumeStats.volume}</span>
                        <div className="flex-1">
                          <Bar percent={volumeStats.percentage} className="bg-uc-primary" />
                        </div>
                        <span className="w-8 text-right text-[13px] font-semibold text-uc-text-muted uc-num">{volumeStats.count}</span>
                        <span className="w-11 text-right text-sm font-extrabold text-uc-text uc-num">{volumeStats.percentage}%</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Mental & Falls Statistics Info */}
              <Card className="flex items-center gap-3">
                <Icon name="strong-mind" size={24} className="text-uc-primary" />
                <p className="text-sm text-uc-text-muted">
                  {t('stats.mentalFallsStatsInfo') || 'Mental practice statistics and falls tracking are available in the Strong Mind section.'}{' '}
                  <Link href="/strong-mind" className="font-bold text-uc-primary hover:underline">
                    {t('stats.goToStrongMind') || 'Go to Strong Mind →'}
                  </Link>
                </p>
              </Card>
            </div>
          </div>

          {/* Weekly volume in TR points (decision 43) and fingerboard tests (decision 45) */}
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <Section
              title={t('stats.weeklyVolume') || 'Weekly volume'}
              subtitle={t('stats.weeklyVolumeSubtitle') || 'TR points per week: TR1 = 1 … TR5 = 5'}
            >
              <WeeklyVolumeChart workouts={workoutsInRange} start={statsData.timeRange.start} end={statsData.timeRange.end} />
            </Section>
            <StatsFingerboardTests
              renderSection={(title, subtitle, body) => <Section title={title} subtitle={subtitle}>{body}</Section>}
            />
          </div>

          {/* Injury Cycle Analysis */}
          {isCycleTrackingEnabled && injuryCycle && (
            <Section title={t('stats.injuriesByPhase') || 'Injuries by cycle phase'}>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <InjuryTile value={injuryCycle.totalInjuries} label={t('stats.totalInjuries') || 'Injuries'} />
                {injuryCycle.totalInjuries > 0 ? (
                  <>
                    <InjuryTile value={injuryCycle.daysSinceLastInjury} label={t('stats.daysSinceLast')} />
                    <InjuryTile value={Math.max(...injuriesByPhase)} label={t('stats.maxInPhase') || 'Max in one phase'} />
                    <InjuryTile value={injuriesByPhase.filter((count) => count > 0).length} label={t('stats.phasesAffected') || 'Phases affected'} />
                  </>
                ) : (
                  <p className="flex items-center text-sm text-uc-text-muted lg:col-span-3">
                    {t('stats.noRecentInjuries') || 'No injuries recently'}
                  </p>
                )}
              </div>

              {/* Cycle Phase Breakdown */}
              {injuryCycle.totalInjuries > 0 && (
                <>
                  <Overline className="mt-5 mb-2">{t('stats.injuriesPerPhase') || 'Injuries in each cycle phase'}</Overline>
                  <div className="grid grid-cols-5 gap-1.5">
                    {phases.map((phase) => {
                      const key = phaseTranslationKey[phase] as keyof typeof injuryCycle.injuriesByPhase;
                      const isMost = phase === mostInjuriesPhase;
                      return (
                        <div
                          key={phase}
                          className={`flex flex-col items-center rounded-xl px-1 py-2.5 text-center ${phaseBandBg[phase]} ${
                            isMost ? 'ring-2 ring-inset ring-uc-warning' : ''
                          }`}
                        >
                          <span className="text-[22px] font-extrabold leading-7 text-uc-text uc-num">{injuryCycle.injuriesByPhase[key]}</span>
                          <span className="mt-1 text-[11px] font-bold leading-tight text-uc-text break-words hyphens-auto">
                            {t(`cycle.phases.${phaseTranslationKey[phase]}`)}
                          </span>
                          <span className="mt-0.5 text-[10px] font-semibold text-uc-text-muted uc-num">
                            {t('stats.daysRange', { range: getPhaseDayRange(phase, cycleLength) })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-uc-text-muted">
                    {t('stats.injuryPhaseDescription') || 'Each phase shows the number of injuries in the specified cycle day range'}
                  </p>

                  {/* Most injuries phase notification */}
                  {mostInjuriesPhase && injuryCycle.phaseWithMostInjuries && (
                    <div className="mt-4 rounded-uc-card bg-uc-warning-bg p-4 text-uc-text">
                      <div className="flex items-start gap-3">
                        <Icon name="injury-risk" size={24} className="text-uc-warning" />
                        <div className="min-w-0">
                          <h3 className="font-extrabold">
                            {t('stats.mostInjuriesPhaseTitle') || 'Most injuries in a phase'}:{' '}
                            {t(`cycle.phases.${injuryCycle.phaseWithMostInjuries}`)}
                          </h3>
                          <p className="mt-1 text-sm">
                            {(t('stats.mostInjuriesPhaseMessage') || 'Most injuries ({count}) occurred during cycle days {dayRange}.')
                              .replace('{count}', injuryCycle.maxInjuriesInPhase.toString())
                              .replace('{dayRange}', getPhaseDayRange(mostInjuriesPhase, cycleLength))}
                          </p>
                          <p className="mt-1 text-sm text-uc-text-muted">
                            {t('stats.injuryPhaseNotificationHint') || 'Would you like to receive a push notification 1 day before this phase starts to be aware of the increased injury risk?'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={notificationEnabled ? 'tonal' : 'primary'}
                        className="mt-4 w-full"
                        onClick={handleEnableInjuryNotification}
                        isLoading={isEnablingNotification}
                        disabled={notificationEnabled}
                      >
                        <Icon name={notificationEnabled ? 'success' : 'bell'} />
                        {notificationEnabled
                          ? (t('stats.injuryPhaseNotificationAlreadyEnabled') || 'Notification already enabled')
                          : (t('stats.enableInjuryPhaseNotification') || 'Enable notification')}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Section>
          )}

          {/* Gratitude & Improvements */}
          {filteredGratitudeWorkouts.length > 0 && (
            <Section
              title={t('strongMind.gratitudeAndImprovements') || 'Gratitude & Improvements'}
              subtitle={t('strongMind.gratitudeAndImprovementsDescription') || 'Reflect on your recent workouts and what you\'re grateful for, and what you want to improve.'}
            >
              <SegmentedControl
                ariaLabel={t('strongMind.gratitudeAndImprovements') || 'Gratitude & Improvements'}
                value={gratitudeFilter}
                onChange={setGratitudeFilter}
                options={[
                  { value: 'all', label: t('common.all') || 'All' },
                  { value: 'gratitude', label: t('strongMind.gratitude') || 'Gratitude' },
                  { value: 'improvements', label: t('stats.improvementsShort') || 'Improvements' },
                ]}
              />
              {gratitudeRows.length === 0 ? (
                <EmptyState
                  icon={<Icon name={gratitudeFilter === 'improvements' ? 'improve' : 'gratitude'} size={28} />}
                  title={gratitudeFilter === 'improvements'
                    ? (t('strongMind.noImprovements') || 'No improvement notes yet')
                    : (t('strongMind.noGratitude') || 'No gratitude entries yet')}
                  description={gratitudeFilter === 'improvements'
                    ? (t('strongMind.noImprovementsDescription') || 'Track what you\'re working on improving in your workouts. Add improvement notes to see your progress over time.')
                    : (t('strongMind.noGratitudeDescription') || 'Start adding gratitude notes to your workouts to reflect on what you\'re thankful for in your training journey.')}
                />
              ) : (
                <ul className="mt-2 divide-y divide-uc-border">
                  {gratitudeRows.map((row) => (
                    <li key={row.id} className="flex gap-3 py-3">
                      <span
                        aria-label={row.kind === 'gratitude'
                          ? (t('strongMind.gratefulFor') || 'Gratitude')
                          : (t('strongMind.improvements') || 'Improvements')}
                        role="img"
                        className={`flex h-6 shrink-0 items-center ${row.kind === 'gratitude' ? 'text-uc-accent-text' : 'text-uc-primary'}`}
                      >
                        <Icon name={row.kind === 'gratitude' ? 'gratitude' : 'improve'} />
                      </span>
                      <div className="min-w-0">
                        <p className="whitespace-pre-wrap text-[15px] font-semibold text-uc-text">{row.text}</p>
                        <p className="mt-0.5 text-[13px] font-semibold text-uc-text-muted">
                          {getTrainingTypeLabel(row.workout.type)}
                          {row.workout.sector && <> · <Icon name="event-trip" size={14} className="inline -mt-0.5" /> {row.workout.sector}</>}
                          {' · '}
                          {formatShortDate(new Date(row.workout.startTime), true)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}
        </>
      )}

      {/* Footer */}
      {statsData && (
        <p className="pt-2 text-center text-[13px] font-semibold text-uc-text-muted uc-num">
          {formatShortDate(statsData.timeRange.start)} – {formatShortDate(statsData.timeRange.end, true)}
          {lastUpdated && (
            <> · {t('stats.lastUpdated')} {formatShortDate(lastUpdated)}, {lastUpdated.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</>
          )}
        </p>
      )}
    </div>
  );
};

const InjuryTile = ({ value, label }: { value: number; label: ReactNode }) => (
  <div className="rounded-xl bg-uc-elevated p-3">
    <p className="text-[22px] font-extrabold leading-7 text-uc-text uc-num">{value}</p>
    <p className="text-[13px] font-semibold text-uc-text-muted">{label}</p>
  </div>
);
