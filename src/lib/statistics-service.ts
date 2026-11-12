// Statistics service for workout analysis and insights
import { dayNumberToLocalDate, localDayNumber, storedDayNumber, toLocalDateString, toStoredDateString } from './date-utils';
import { Workout, WorkoutType, TrainingVolume, Tag } from '@/types/workout';
import { Event } from '@/types/event';
import { weeklyStreaks } from './streak';
import { deloadDayNumbers } from './deload';
import { calculateCycleInfo, CycleSettings, getPhaseRanges } from '@/lib/cycle-utils';

export type TimeFrame = '1week' | '4weeks' | '1month' | '3months' | '6months' | '1year' | 'all' | 'custom';

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface WorkoutTypeStats {
  type: WorkoutType;
  count: number;
  percentage: number;
  lastWorkout?: Date;
  frequency: number; // workouts per week
}

export interface TagStats {
  tag: Tag;
  count: number;
  percentage: number;
  frequency: number; // times per week
  lastUsed?: Date;
  associatedTypes: WorkoutType[];
}

export interface TrainingVolumeStats {
  volume: TrainingVolume;
  count: number;
  percentage: number;
}

export interface MentalSessionStats {
  totalSessions: number;
  lastSession?: Date;
  daysSinceLastSession: number;
  averageFocusLevel: number;
  practiceTypes: {
    meditation: number;
    reflecting: number;
    other: number;
  };
}

export interface FallsStats {
  totalFalls: number;
  lastFall?: Date;
  daysSinceLastFall: number;
  fallsPerSession: number;
  climbingSessionsWithFalls: number;
  totalClimbingSessions: number;
}

export interface InjuryCycleStats {
  totalInjuries: number;
  injuriesByPhase: {
    menstrual: number;
    follicular: number;
    ovulation: number;
    earlyLuteal: number;
    lateLuteal: number;
  };
  injuriesByCycleDay: Array<{
    cycleDay: number;
    count: number;
    phase: string;
  }>;
  lastInjury?: Date;
  daysSinceLastInjury: number;
  phaseWithMostInjuries?: 'menstrual' | 'follicular' | 'ovulation' | 'earlyLuteal' | 'lateLuteal';
  maxInjuriesInPhase: number;
}

export interface OverallStats {
  totalWorkouts: number;
  averageWorkoutsPerWeek: number;
  averageWorkoutsThisMonth: number;
  mostActiveDay: string;
  mostActiveTime: string;
  currentStreak: number; // weeks in a row with 3+ workouts (lib/streak)
  longestStreak: number;
  lastWorkout?: Date;
}

export interface StatisticsData {
  timeRange: TimeRange;
  overall: OverallStats;
  workoutTypes: WorkoutTypeStats[];
  tags: TagStats[];
  trainingVolumes: TrainingVolumeStats[];
  mentalSessions: MentalSessionStats;
  falls: FallsStats;
  injuryCycle: InjuryCycleStats;
}

class StatisticsService {
  /**
   * Calculate time range based on timeframe
   */
  getTimeRange(timeframe: TimeFrame, customRange?: TimeRange, workouts?: Workout[], events?: Event[]): TimeRange {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    let start: Date;

    switch (timeframe) {
      case '1week':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        break;
      case '4weeks':
        start = new Date(now);
        start.setDate(start.getDate() - 28);
        break;
      case '1month':
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        break;
      case '3months':
        start = new Date(now);
        start.setMonth(start.getMonth() - 3);
        break;
      case '6months':
        start = new Date(now);
        start.setMonth(start.getMonth() - 6);
        break;
      case '1year':
        start = new Date(now);
        start.setFullYear(start.getFullYear() - 1);
        break;
      case 'all':
        // Find the earliest date from workouts or events
        const allDates: Date[] = [];
        if (Array.isArray(workouts) && workouts.length > 0) {
          allDates.push(...workouts.map(w => new Date(w.startTime)));
        }
        if (Array.isArray(events) && events.length > 0) {
          allDates.push(...events.map(e => new Date(e.date)));
        }
        if (allDates.length > 0) {
          // Earliest stored date (UTC midnight) as a local calendar day
          start = dayNumberToLocalDate(storedDayNumber(new Date(Math.min(...allDates.map(d => d.getTime())))));
        } else {
          // Fallback to 1 year ago if no data
          start = new Date(now);
          start.setFullYear(start.getFullYear() - 1);
        }
        break;
      case 'custom':
        return customRange || { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end };
      default:
        start = new Date(now);
        start.setDate(start.getDate() - 30);
    }

    // Relative ranges include today, so start the day after "one week/month/... ago":
    // 1 week = the last 7 calendar days, not 8
    if (timeframe !== 'all') {
      start.setDate(start.getDate() + 1);
    }
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  /**
   * Filter workouts by time range
   */
  filterWorkoutsByTimeRange(workouts: Workout[], timeRange: TimeRange): Workout[] {
    return workouts.filter(workout => this.isInTimeRange(workout.startTime, timeRange));
  }

  // Stored dates (UTC midnight) compared with the range's local calendar days
  private isInTimeRange(storedDate: string | Date, timeRange: TimeRange): boolean {
    const day = storedDayNumber(storedDate);
    return day >= localDayNumber(timeRange.start) && day <= localDayNumber(timeRange.end);
  }

  // Number of weeks in a range, from its calendar days (not rounded up to whole weeks)
  // Weeks in the range, leaving out deload days (rest periods don't lower the per-week averages)
  private weeksInRange(timeRange: TimeRange, deloadDays: Set<number> = new Set()): number {
    const start = localDayNumber(timeRange.start);
    const end = localDayNumber(timeRange.end);
    let restDays = 0;
    deloadDays.forEach(day => { if (day >= start && day <= end) restDays++; });
    return Math.max(1, (end - start + 1 - restDays) / 7);
  }

  private onDeload(workout: Workout, deloadDays: Set<number>): boolean {
    return deloadDays.has(storedDayNumber(workout.startTime));
  }

  /**
   * Calculate overall statistics
   */
  calculateOverallStats(workouts: Workout[], timeRange: TimeRange, allWorkouts: Workout[] = workouts, deloadDays: Set<number> = new Set()): OverallStats {
    const totalWorkouts = workouts.length;
    
    if (totalWorkouts === 0) {
      return {
        totalWorkouts: 0,
        averageWorkoutsPerWeek: 0,
        averageWorkoutsThisMonth: 0,
        mostActiveDay: 'N/A',
        mostActiveTime: 'N/A',
        currentStreak: 0,
        longestStreak: 0,
      };
    }

    // Calculate average workouts per week (deload days and their workouts left out)
    const weeksInRange = this.weeksInRange(timeRange, deloadDays);
    const averageWorkoutsPerWeek = workouts.filter(w => !this.onDeload(w, deloadDays)).length / weeksInRange;

    // Workouts in the current calendar month - from all workouts, independent of the selected timeframe
    const thisMonthKey = toLocalDateString().slice(0, 7);
    const monthWorkouts = allWorkouts.filter(workout => toStoredDateString(workout.startTime).slice(0, 7) === thisMonthKey);
    const averageWorkoutsThisMonth = monthWorkouts.length;

    // Find most active day and time
    const dayCounts = new Map<string, number>();
    const hourCounts = new Map<string, number>();

    workouts.forEach(workout => {
      const date = new Date(workout.startTime);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();

      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
      hourCounts.set(hour.toString(), (hourCounts.get(hour.toString()) || 0) + 1);
    });

    const mostActiveDay = Array.from(dayCounts.entries()).reduce((a, b) => a[1] > b[1] ? a : b)?.[0] || 'N/A';
    const mostActiveHour = Array.from(hourCounts.entries()).reduce((a, b) => a[1] > b[1] ? a : b)?.[0] || 'N/A';
    const mostActiveTime = `${mostActiveHour}:00`;

    // Calculate streaks
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    // Streaks look at all workouts, not only the selected range
    const { currentStreak, longestStreak } = this.calculateStreaks(allWorkouts, deloadDays);

    const lastWorkout = sortedWorkouts.length > 0 ? new Date(sortedWorkouts[sortedWorkouts.length - 1].startTime) : undefined;

    return {
      totalWorkouts,
      averageWorkoutsPerWeek: Math.round(averageWorkoutsPerWeek * 10) / 10,
      averageWorkoutsThisMonth,
      mostActiveDay,
      mostActiveTime,
      currentStreak,
      longestStreak,
      lastWorkout,
    };
  }

  /**
   * Calculate workout type statistics
   */
  calculateWorkoutTypeStats(workouts: Workout[], timeRange: TimeRange, deloadDays: Set<number> = new Set()): WorkoutTypeStats[] {
    // rateCount: workouts outside deloads, for the per-week frequency
    const typeCounts = new Map<WorkoutType, { count: number; rateCount: number; lastWorkout?: Date }>();
    
    workouts.forEach(workout => {
      const existing = typeCounts.get(workout.type) || { count: 0, rateCount: 0 };
      existing.count++;
      if (!this.onDeload(workout, deloadDays)) existing.rateCount++;
      
      const workoutDate = new Date(workout.startTime);
      if (!existing.lastWorkout || workoutDate > existing.lastWorkout) {
        existing.lastWorkout = workoutDate;
      }
      
      typeCounts.set(workout.type, existing);
    });

    const totalWorkouts = workouts.length;
    const weeksInRange = this.weeksInRange(timeRange, deloadDays);

    return Array.from(typeCounts.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      percentage: totalWorkouts > 0 ? Math.round((data.count / totalWorkouts) * 100) : 0,
      lastWorkout: data.lastWorkout,
      frequency: Math.round((data.rateCount / weeksInRange) * 10) / 10,
    })).sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate tag statistics
   */
  calculateTagStats(workouts: Workout[], tags: Tag[], timeRange: TimeRange, deloadDays: Set<number> = new Set()): TagStats[] {
    const tagCounts = new Map<string, { count: number; rateCount: number; lastUsed?: Date; types: Set<WorkoutType> }>();

    workouts.forEach(workout => {
      workout.tags?.forEach(tag => {
        const existing = tagCounts.get(tag.id) || { count: 0, rateCount: 0, types: new Set<WorkoutType>() };
        existing.count++;
        if (!this.onDeload(workout, deloadDays)) existing.rateCount++;
        existing.types.add(workout.type);
        
        const workoutDate = new Date(workout.startTime);
        if (!existing.lastUsed || workoutDate > existing.lastUsed) {
          existing.lastUsed = workoutDate;
        }
        
        tagCounts.set(tag.id, existing);
      });
    });

    const totalTaggedWorkouts = workouts.filter(w => w.tags && w.tags.length > 0).length;
    const weeksInRange = this.weeksInRange(timeRange, deloadDays);

    return Array.from(tagCounts.entries())
      .map(([tagId, data]) => {
        const tag = tags.find(t => t.id === tagId);
        if (!tag) return null;

        return {
          tag,
          count: data.count,
          percentage: totalTaggedWorkouts > 0 ? Math.round((data.count / totalTaggedWorkouts) * 100) : 0,
          frequency: Math.round((data.rateCount / weeksInRange) * 10) / 10,
          lastUsed: data.lastUsed,
          associatedTypes: Array.from(data.types),
        };
      })
      .filter((stats): stats is NonNullable<typeof stats> => stats !== null)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate training volume statistics
   */
  calculateTrainingVolumeStats(workouts: Workout[]): TrainingVolumeStats[] {
    const volumeCounts = new Map<TrainingVolume, number>();

    workouts.forEach(workout => {
      if (workout.trainingVolume) {
        volumeCounts.set(workout.trainingVolume, (volumeCounts.get(workout.trainingVolume) || 0) + 1);
      }
    });

    const totalWithVolume = Array.from(volumeCounts.values()).reduce((sum, count) => sum + count, 0);

    return Array.from(volumeCounts.entries()).map(([volume, count]) => ({
      volume,
      count,
      percentage: totalWithVolume > 0 ? Math.round((count / totalWithVolume) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate mental session statistics
   */
  calculateMentalSessionStats(workouts: Workout[]): MentalSessionStats {
    const mentalWorkouts = workouts.filter(w => w.type === 'MENTAL_PRACTICE');
    
    if (mentalWorkouts.length === 0) {
      return {
        totalSessions: 0,
        daysSinceLastSession: Infinity,
        averageFocusLevel: 0,
        practiceTypes: { meditation: 0, reflecting: 0, other: 0 },
      };
    }

    const lastSession = mentalWorkouts.reduce((latest, workout) => {
      const workoutDate = new Date(workout.startTime);
      return workoutDate > latest ? workoutDate : latest;
    }, new Date(0));

    const daysSinceLastSession = localDayNumber() - storedDayNumber(lastSession);

    const totalFocusLevel = mentalWorkouts.reduce((sum, workout) => sum + (workout.focusLevel || 0), 0);
    const averageFocusLevel = mentalWorkouts.length > 0 ? totalFocusLevel / mentalWorkouts.length : 0;

    const practiceTypes = mentalWorkouts.reduce((types, workout) => {
      switch (workout.mentalPracticeType) {
        case 'MEDITATION':
          types.meditation++;
          break;
        case 'REFLECTING':
          types.reflecting++;
          break;
        default:
          types.other++;
      }
      return types;
    }, { meditation: 0, reflecting: 0, other: 0 });

    return {
      totalSessions: mentalWorkouts.length,
      lastSession,
      daysSinceLastSession,
      averageFocusLevel: Math.round(averageFocusLevel * 10) / 10,
      practiceTypes,
    };
  }

  /**
   * Calculate injury cycle statistics
   */
  calculateInjuryCycleStats(events: Event[], cycleSettings?: CycleSettings): InjuryCycleStats {
    const injuryEvents = events.filter(event => event.type === 'INJURY');
    
    if (injuryEvents.length === 0 || !cycleSettings) {
      return {
        totalInjuries: 0,
        injuriesByPhase: {
          menstrual: 0,
          follicular: 0,
          ovulation: 0,
          earlyLuteal: 0,
          lateLuteal: 0,
        },
        injuriesByCycleDay: [],
        daysSinceLastInjury: Infinity,
        phaseWithMostInjuries: undefined,
        maxInjuriesInPhase: 0,
      };
    }

    const injuriesByPhase = {
      menstrual: 0,
      follicular: 0,
      ovulation: 0,
      earlyLuteal: 0,
      lateLuteal: 0,
    };

    const injuriesByCycleDay: Array<{ cycleDay: number; count: number; phase: string }> = [];
    const cycleDayCounts = new Map<number, number>();

    let lastInjury: Date | undefined;

    injuryEvents.forEach(event => {
      const injuryDate = new Date(event.date);
      // Pass the stored date string so it's read as that calendar day
      const cycleInfo = calculateCycleInfo(cycleSettings, toStoredDateString(event.date));
      
      // Count by phase
      switch (cycleInfo.phase) {
        case 'menstrual':
          injuriesByPhase.menstrual++;
          break;
        case 'follicular':
          injuriesByPhase.follicular++;
          break;
        case 'ovulation':
          injuriesByPhase.ovulation++;
          break;
        case 'early-luteal':
          injuriesByPhase.earlyLuteal++;
          break;
        case 'late-luteal':
          injuriesByPhase.lateLuteal++;
          break;
      }

      // Count by cycle day
      const currentCount = cycleDayCounts.get(cycleInfo.currentDay) || 0;
      cycleDayCounts.set(cycleInfo.currentDay, currentCount + 1);

      // Track last injury
      if (!lastInjury || injuryDate > lastInjury) {
        lastInjury = injuryDate;
      }
    });

    // Convert cycle day counts to array
    for (let day = 1; day <= cycleSettings.cycleLength; day++) {
      const count = cycleDayCounts.get(day) || 0;
      injuriesByCycleDay.push({
        cycleDay: day,
        count,
        // Phase of that cycle day (not today's phase)
        phase: getPhaseRanges(cycleSettings.cycleLength).find(r => day >= r.start && day <= r.end)?.phase ?? 'late-luteal',
      });
    }

    const daysSinceLastInjury = lastInjury ? localDayNumber() - storedDayNumber(lastInjury) : Infinity;

    // Find phase with most injuries
    const phaseEntries = Object.entries(injuriesByPhase) as Array<[keyof typeof injuriesByPhase, number]>;
    const maxInjuries = Math.max(...phaseEntries.map(([, count]) => count));
    const phaseWithMostInjuries = maxInjuries > 0 
      ? phaseEntries.find(([, count]) => count === maxInjuries)?.[0] 
      : undefined;

    return {
      totalInjuries: injuryEvents.length,
      injuriesByPhase,
      injuriesByCycleDay,
      lastInjury,
      daysSinceLastInjury,
      phaseWithMostInjuries, // Phase with the highest number of injuries
      maxInjuriesInPhase: maxInjuries, // Number of injuries in that phase
    };
  }

  /**
   * Calculate falls statistics
   */
  calculateFallsStats(workouts: Workout[]): FallsStats {
    let totalFalls = 0;
    let climbingSessionsWithFalls = 0;
    let lastFall: Date | undefined;
    const climbingTypes: WorkoutType[] = ['BOULDERING', 'LEAD_ROCK', 'LEAD_ARTIFICIAL', 'CIRCUITS'];
    const climbingWorkouts = workouts.filter(w => climbingTypes.includes(w.type));

    climbingWorkouts.forEach(workout => {
      let sessionHadFall = false;

      // Check mental state for falls
      if (workout.mentalState?.tookFalls) {
        totalFalls++;
        sessionHadFall = true;
        const workoutDate = new Date(workout.startTime);
        if (!lastFall || workoutDate > lastFall) {
          lastFall = workoutDate;
        }
      }

      // Check climb sections for falls
      if (workout.mentalState?.climbSections) {
        workout.mentalState.climbSections.forEach(section => {
          if (section.tookFall) {
            totalFalls++;
            sessionHadFall = true;
            const workoutDate = new Date(workout.startTime);
            if (!lastFall || workoutDate > lastFall) {
              lastFall = workoutDate;
            }
          }
        });
      }

      if (sessionHadFall) {
        climbingSessionsWithFalls++;
      }
    });

    const daysSinceLastFall = lastFall ? localDayNumber() - storedDayNumber(lastFall) : Infinity;
    const fallsPerSession = climbingWorkouts.length > 0 ? Math.round((totalFalls / climbingWorkouts.length) * 10) / 10 : 0;

    return {
      totalFalls,
      lastFall,
      daysSinceLastFall,
      fallsPerSession,
      climbingSessionsWithFalls,
      totalClimbingSessions: climbingWorkouts.length,
    };
  }

  /**
   * Calculate all statistics for a given timeframe
   */
  calculateStatistics(
    workouts: Workout[], 
    tags: Tag[], 
    timeframe: TimeFrame, 
    customRange?: TimeRange,
    events?: Event[],
    cycleSettings?: CycleSettings
  ): StatisticsData {
    const timeRange = this.getTimeRange(timeframe, customRange, workouts, events);
    const filteredWorkouts = this.filterWorkoutsByTimeRange(workouts, timeRange);
    const filteredEvents = Array.isArray(events) ? events.filter(event => this.isInTimeRange(event.date, timeRange)) : [];
    // All deloads (not only those starting in the range): they pause the streak and are left out of per-week averages
    const deloadDays = deloadDayNumbers(Array.isArray(events) ? events : []);

    return {
      timeRange,
      overall: this.calculateOverallStats(filteredWorkouts, timeRange, workouts, deloadDays),
      workoutTypes: this.calculateWorkoutTypeStats(filteredWorkouts, timeRange, deloadDays),
      tags: this.calculateTagStats(filteredWorkouts, tags, timeRange, deloadDays),
      trainingVolumes: this.calculateTrainingVolumeStats(filteredWorkouts),
      mentalSessions: this.calculateMentalSessionStats(filteredWorkouts),
      falls: this.calculateFallsStats(filteredWorkouts),
      injuryCycle: this.calculateInjuryCycleStats(filteredEvents, cycleSettings),
    };
  }

  /**
   * Calculate workout streaks
   */
  private calculateStreaks(workouts: Workout[], deloadDays: Set<number> = new Set()): { currentStreak: number; longestStreak: number } {
    const { current, longest } = weeklyStreaks(workouts, undefined, undefined, deloadDays);
    return { currentStreak: current, longestStreak: longest };
  }

  /**
   * Format duration for display
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  /**
   * Format frequency for display
   * @param frequency - Frequency per week
   * @param period - Period to display (week, month, quarter, year)
   */
  formatFrequency(frequency: number, period: 'week' | 'month' | 'quarter' | 'year' = 'week'): string {
    // Convert from per week to per period
    const periodMultipliers = {
      week: 1,
      month: 4.33, // Average weeks per month
      quarter: 13, // Average weeks per quarter
      year: 52.14 // Average weeks per year
    };
    
    const periodFrequency = frequency * periodMultipliers[period];
    
    if (periodFrequency < 1) {
      return `${Math.round(periodFrequency * 10) / 10}`;
    }
    return `${Math.round(periodFrequency)}`;
  }
}

// Export singleton instance
export const statisticsService = new StatisticsService();
