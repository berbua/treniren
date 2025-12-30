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

export const GoalProgressDisplay = ({ goalId, goalType, goalName }: GoalProgressDisplayProps) => {
  const { t } = useLanguage();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const response = await fetch('/api/workouts', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setWorkouts(data);
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
      <div className="mt-2 p-2 bg-uc-black/20 rounded-lg">
        <div className="text-xs text-uc-text-muted">{t('common.loadingProgress') || 'Loading progress...'}</div>
      </div>
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
      <div className="mt-2 p-2 bg-uc-black/20 rounded-lg">
        <div className="text-xs text-uc-text-muted">
          {goalType === 'process' ? 'No progress recorded yet' : 'Not achieved yet'}
        </div>
      </div>
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

  return (
    <div className="mt-3 p-3 bg-uc-black/20 rounded-lg border border-uc-purple/20">
      <div className="text-xs font-medium text-uc-text-light mb-3">
        {goalType === 'process' 
          ? (t('strongMind.linkedWorkouts') || 'Linked Workouts') 
          : (t('strongMind.achievementHistory') || 'Achievement History')}
        <span className="ml-2 text-uc-text-muted">({sortedWorkouts.length})</span>
      </div>
      <div className="space-y-2">
        {sortedWorkouts.map(workout => {
          const date = new Date(workout.startTime);
          const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          
          if (goalType === 'process') {
            const progress = workout.mentalState?.processGoals?.find(pg => pg.goalId === goalId)?.progress;
            return (
              <div key={workout.id} className="flex items-center justify-between p-2 bg-uc-black/30 rounded border border-uc-purple/10">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{getWorkoutTypeEmoji(workout.type)}</span>
                  <div>
                    <div className="text-xs font-medium text-uc-text-light">{formattedDate}</div>
                    <div className="text-xs text-uc-text-muted">{workout.type}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-uc-text-muted mr-2">{t('strongMind.progress') || 'Progress'}:</span>
                  {[1, 2, 3].map(level => (
                    <div
                      key={level}
                      className={`w-5 h-5 rounded-full border text-xs flex items-center justify-center font-medium ${
                        progress && progress >= level
                          ? 'border-purple-500 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200'
                          : 'border-slate-300 dark:border-slate-600 text-slate-400'
                      }`}
                    >
                      {level}
                    </div>
                  ))}
                </div>
              </div>
            );
          } else {
            return (
              <div key={workout.id} className="flex items-center justify-between p-2 bg-uc-black/30 rounded border border-yellow-500/20">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{getWorkoutTypeEmoji(workout.type)}</span>
                  <div>
                    <div className="text-xs font-medium text-uc-text-light">{formattedDate}</div>
                    <div className="text-xs text-uc-text-muted">{workout.type}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🏆</span>
                  <span className="text-xs text-yellow-500 font-medium">{t('strongMind.achieved') || 'Achieved!'}</span>
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};
