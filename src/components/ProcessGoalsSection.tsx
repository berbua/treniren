'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface ProcessGoal {
  id: string
  timeframeValue: string
  timeframeUnit: string
  goalDescription: string
}

interface ProjectGoal {
  id: string
  climbingType: string
  gradeSystem: string
  routeGrade: string
  routeName: string
  sectorLocation: string
}

// Rates progress on the goals linked to a workout. Goals are linked with the checkboxes in the
// workout form's Goals section; only the linked goals are passed in here.
interface ProcessGoalsSectionProps {
  processGoals: ProcessGoal[];
  projectGoals: ProjectGoal[];
  onProcessGoalProgress: (goalId: string, progress: 1 | 2 | 3) => void;
  onProjectGoalCompletion: (goalId: string) => void;
  getProcessGoalProgress: (goalId: string) => 1 | 2 | 3 | undefined;
  isProjectGoalCompleted: (goalId: string) => boolean;
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

  if (processGoals.length === 0 && projectGoals.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
        🎯 {t('strongMind.goalsProgress')}
      </h4>

      {/* Process goals: progress 1-3 */}
      {processGoals.length > 0 && (
        <div className="mb-4 space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('strongMind.progressHint')}
          </p>
          {processGoals.map(goal => {
            const currentProgress = getProcessGoalProgress(goal.id)
            return (
              <div key={goal.id} className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {goal.timeframeValue} {t(`strongMind.${goal.timeframeUnit}`)}: {goal.goalDescription}
                  </div>
                </div>
                <div className="flex space-x-2 shrink-0" role="radiogroup" aria-label={t('strongMind.goalsProgress')}>
                  {[1, 2, 3].map(level => (
                    <button
                      key={level}
                      type="button"
                      role="radio"
                      aria-checked={currentProgress === level}
                      title={t(`strongMind.progressLevels.${level}`)}
                      onClick={() => onProcessGoalProgress(goal.id, level as 1 | 2 | 3)}
                      className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all ${
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

      {/* Project goals: achieved on this workout */}
      {projectGoals.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('strongMind.achievedHint')}
          </p>
          {projectGoals.map(goal => {
            const isCompleted = isProjectGoalCompleted(goal.id)
            return (
              <div key={goal.id} className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {goal.routeGrade} {goal.routeName} - {goal.sectorLocation}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {goal.climbingType === 'route' ? `🧗‍♀️ ${t('strongMind.route')}` : `🧗 ${t('strongMind.boulder')}`} • {goal.gradeSystem}
                  </div>
                </div>
                <button
                  type="button"
                  aria-pressed={isCompleted}
                  title={t('strongMind.markAchieved')}
                  onClick={() => onProjectGoalCompletion(goal.id)}
                  className={`w-11 h-11 shrink-0 rounded-full border-2 flex items-center justify-center text-lg transition-all ${
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
