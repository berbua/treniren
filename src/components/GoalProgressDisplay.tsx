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

  return (
    <div className="mt-2 p-2 bg-uc-black/20 rounded-lg">
      <div className="text-xs text-uc-text-muted mb-2">
        {goalType === 'process' ? 'Progress History:' : 'Achievement History:'}
      </div>
      <div className="space-y-1">
        {relevantWorkouts.map(workout => {
          const date = new Date(workout.startTime).toLocaleDateString();
          
          if (goalType === 'process') {
            const progress = workout.mentalState?.processGoals?.find(pg => pg.goalId === goalId)?.progress;
            return (
              <div key={workout.id} className="flex items-center justify-between text-xs">
                <span className="text-uc-text-light">{date}</span>
                <div className="flex space-x-1">
                  {[1, 2, 3].map(level => (
                    <div
                      key={level}
                      className={`w-4 h-4 rounded-full border text-xs flex items-center justify-center ${
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
              <div key={workout.id} className="flex items-center space-x-2 text-xs">
                <span className="text-uc-text-light">{date}</span>
                <span className="text-yellow-500">🏆</span>
                <span className="text-uc-text-muted">Achieved!</span>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};
