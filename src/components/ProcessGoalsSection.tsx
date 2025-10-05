'use client';

import { useState, useEffect } from 'react';
import { ProcessGoalProgress } from '@/types/workout';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProcessGoal {
  id: string
  timeframeValue: string
  timeframeUnit: string
  goalDescription: string
}

interface ProcessGoalsSectionProps {
  processGoals: ProcessGoal[];
  projectGoals: ProjectGoal[];
  onProcessGoalProgress: (goalId: string, progress: 1 | 2 | 3) => void;
  onProjectGoalCompletion: (goalId: string) => void;
  getProcessGoalProgress: (goalId: string) => 1 | 2 | 3 | undefined;
  isProjectGoalCompleted: (goalId: string) => boolean;
}

interface ProjectGoal {
  id: string
  climbingType: string
  gradeSystem: string
  routeGrade: string
  routeName: string
  sectorLocation: string
}

export const ProcessGoalsSection = ({ 
  processGoals, 
  projectGoals, 
  onProcessGoalProgress, 
  onProjectGoalCompletion,
  getProcessGoalProgress, 
  isProjectGoalCompleted 
}: ProcessGoalsSectionProps) => {
  const { t } = useLanguage();
  const [isClient, setIsClient] = useState(false);
  const [serveProcessGoals, setServeProcessGoals] = useState(false);
  const [projectGoalAchievement, setProjectGoalAchievement] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('ProcessGoalsSection - isClient:', isClient, 'processGoals:', processGoals, 'projectGoals:', projectGoals);
  }, [isClient, processGoals, projectGoals]);

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    console.log('ProcessGoalsSection - not rendering: not client yet');
    return null;
  }

  // Don't render if no goals exist at all
  if (processGoals.length === 0 && projectGoals.length === 0) {
    console.log('ProcessGoalsSection - not rendering: no goals');
    return null;
  }

  console.log('ProcessGoalsSection - RENDERING with toggles');

  return (
    <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
        🎯 {t('strongMind.processGoalsProgress') || 'Goals Progress'}
      </h4>

      {/* Toggle for Process Goals */}
      {processGoals.length > 0 && (
        <div className="mb-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={serveProcessGoals}
              onChange={(e) => setServeProcessGoals(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              🎯 Serve Process Goals
            </span>
          </label>
        </div>
      )}

      {/* Process Goals List */}
      {serveProcessGoals && processGoals.length > 0 && (
        <div className="mb-4 space-y-3">
          {processGoals.map(goal => {
            const currentProgress = getProcessGoalProgress(goal.id)
            return (
              <div key={goal.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {goal.timeframeValue} {t(`strongMind.${goal.timeframeUnit}`) || goal.timeframeUnit}: {goal.goalDescription}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  {[1, 2, 3].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => onProcessGoalProgress(goal.id, level as 1 | 2 | 3)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all ${
                        currentProgress === level
                          ? 'border-purple-500 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200'
                          : 'border-slate-300 dark:border-slate-600 hover:border-purple-300 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Toggle for Project Goals */}
      {projectGoals.length > 0 && (
        <div className="mb-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={projectGoalAchievement}
              onChange={(e) => setProjectGoalAchievement(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              🏆 Project Goal Achievement
            </span>
          </label>
        </div>
      )}

      {/* Project Goals List */}
      {projectGoalAchievement && projectGoals.length > 0 && (
        <div className="space-y-3">
          {projectGoals.map(goal => {
            const isCompleted = isProjectGoalCompleted(goal.id)
            return (
              <div key={goal.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {goal.routeGrade} {goal.routeName} - {goal.sectorLocation}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {goal.climbingType === 'route' ? '🧗‍♀️ Route' : '🧗 Boulder'} • {goal.gradeSystem}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onProjectGoalCompletion(goal.id)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-lg transition-all ${
                    isCompleted
                      ? 'border-yellow-500 bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200'
                      : 'border-slate-300 dark:border-slate-600 hover:border-yellow-300 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🏆
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
};
