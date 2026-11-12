'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Workout {
  id: string;
  startTime: string;
  type: string;
  mentalState?: {
    processGoals?: Array<{ goalId: string; progress: 1 | 2 | 3 }>;
    projectGoals?: Array<{ goalId: string; completed: boolean }>;
  };
}

interface GoalProgressDisplayProps {
  goalId: string;
  goalType: 'process' | 'project';
  goalName: string;
}

const typeLabelKey: Record<string, string> = {
  GYM: 'gym',
  BOULDERING: 'bouldering',
  CIRCUITS: 'circuits',
  LEAD_ROCK: 'leadRock',
  LEAD_ARTIFICIAL: 'leadArtificial',
  MENTAL_PRACTICE: 'mentalPractice',
  FINGERBOARD: 'fingerboard',
};

export const GoalProgressDisplay = ({ goalId, goalType }: GoalProgressDisplayProps) => {
  const { t, language } = useLanguage();
  const locale = language === 'pl' ? 'pl-PL' : 'en-GB';
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        // Fetch all workouts for goal progress (use large limit)
        const response = await fetch('/api/workouts?page=1&limit=1000', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          // Handle both new paginated format and old format
          const workoutsData = Array.isArray(data) ? data : (data.workouts || []);
          setWorkouts(workoutsData);
        } else if (response.status === 401) {
          // User is not authenticated, this is expected for protected components
        }
      } catch (error) {
        console.error('Error fetching workouts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  if (isLoading) {
    return (
      <p className="mt-3 text-[13px] text-uc-text-muted">{t('common.loadingProgress') || 'Loading progress...'}</p>
    );
  }

  // Filter workouts that have progress/achievements for this goal
  const relevantWorkouts = workouts.filter(workout => {
    if (goalType === 'process') {
      return workout.mentalState?.processGoals?.some(pg => pg.goalId === goalId);
    } else {
      return workout.mentalState?.projectGoals?.some(pg => pg.goalId === goalId && pg.completed);
    }
  });

  if (relevantWorkouts.length === 0) {
    return (
      <p className="mt-3 text-[13px] text-uc-text-muted">
        {goalType === 'process'
          ? (t('strongMind.noProgressYet') || 'No progress recorded yet')
          : (t('strongMind.notAchievedYet') || 'Not achieved yet')}
      </p>
    );
  }

  // Sort workouts by date (newest first)
  const sortedWorkouts = [...relevantWorkouts].sort((a, b) =>
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  const getWorkoutTypeEmoji = (type: string) => {
    const emojiMap: { [key: string]: string } = {
      'GYM': '🏋️',
      'BOULDERING': '🧗',
      'CIRCUITS': '🔄',
      'LEAD_ROCK': '🏔️',
      'LEAD_ARTIFICIAL': '🧗‍♀️',
      'MENTAL_PRACTICE': '🧘',
      'FINGERBOARD': '🖐️',
    };
    return emojiMap[type] || '💪';
  };

  const typeLabel = (type: string) =>
    typeLabelKey[type] ? t(`training.types.${typeLabelKey[type]}`) || type : type;
  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });

  if (goalType === 'project') {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {sortedWorkouts.map(workout => (
          <span
            key={workout.id}
            className="inline-flex min-h-7 items-center gap-1.5 rounded-uc-chip bg-uc-success-bg px-2.5 text-[13px] font-bold text-uc-success"
          >
            <span aria-hidden>🏆</span>
            {t('strongMind.achieved') || 'Achieved!'} <span className="uc-num">{formatDate(workout.startTime)}</span>
            <span className="sr-only"> · {typeLabel(workout.type)}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-uc-border pt-3">
      <p className="mb-1 text-[11px] font-bold uppercase leading-[14px] tracking-[0.08em] text-uc-text-muted">
        {t('strongMind.linkedWorkouts') || 'Linked Workouts'} <span className="uc-num">({sortedWorkouts.length})</span>
      </p>
      <ul>
        {sortedWorkouts.map(workout => {
          const progress = workout.mentalState?.processGoals?.find(pg => pg.goalId === goalId)?.progress ?? 0;
          return (
            <li key={workout.id} className="flex items-center gap-2 py-1.5">
              <span aria-hidden className="text-sm">{getWorkoutTypeEmoji(workout.type)}</span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-uc-text">
                <span className="uc-num">{formatDate(workout.startTime)}</span>
                <span className="text-uc-text-muted"> · {typeLabel(workout.type)}</span>
              </span>
              <span
                className="flex shrink-0 items-center gap-1"
                role="img"
                aria-label={`${t('strongMind.progress') || 'Progress'}: ${progress}/3`}
              >
                {[1, 2, 3].map(level => (
                  <span
                    key={level}
                    className={`size-2.5 rounded-full border-[1.5px] border-uc-primary ${progress >= level ? 'bg-uc-primary' : ''}`}
                  />
                ))}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
