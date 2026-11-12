'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Icon, WorkoutIcon } from './ui';

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
  onProcessGoalAchieved: (goalId: string) => void;
  onProjectGoalCompletion: (goalId: string) => void;
  getProcessGoalProgress: (goalId: string) => 1 | 2 | 3 | undefined;
  isProcessGoalAchieved: (goalId: string) => boolean;
  isProjectGoalCompleted: (goalId: string) => boolean;
}

const AchievedButton = ({ pressed, label, onClick }: { pressed: boolean; label: string; onClick: () => void }) => (
  <button
    type="button"
    aria-pressed={pressed}
    title={label}
    aria-label={label}
    onClick={onClick}
    className={`size-11 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
      pressed
        ? 'border-uc-accent bg-uc-accent text-uc-on-accent'
        : 'border-uc-border hover:border-uc-accent'
    }`}
  >
    <Icon name="achieved" />
  </button>
)

export const ProcessGoalsSection = ({
  processGoals,
  projectGoals,
  onProcessGoalProgress,
  onProcessGoalAchieved,
  onProjectGoalCompletion,
  getProcessGoalProgress,
  isProcessGoalAchieved,
  isProjectGoalCompleted
}: ProcessGoalsSectionProps) => {
  const { t } = useLanguage();

  if (processGoals.length === 0 && projectGoals.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-uc-elevated rounded-uc-card border border-uc-border">
      <h4 className="flex items-center gap-2 text-sm font-bold mb-3">
        <Icon name="goal" className="text-uc-primary" /> {t('strongMind.goalsProgress')}
      </h4>

      {/* Process goals: progress 1-3, and achieved on this workout */}
      {processGoals.length > 0 && (
        <div className="mb-4 space-y-3">
          <p className="text-xs text-uc-text-muted">
            {t('strongMind.progressHint')} {t('strongMind.processAchievedHint')}
          </p>
          {processGoals.map(goal => {
            const currentProgress = getProcessGoalProgress(goal.id)
            return (
              <div key={goal.id} className="p-3 bg-uc-surface rounded-uc-input border border-uc-border">
                <div className="text-sm font-semibold mb-2">
                  {goal.timeframeValue} {t(`strongMind.${goal.timeframeUnit}`)}: {goal.goalDescription}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-1.5 shrink-0" role="radiogroup" aria-label={t('strongMind.goalsProgress')}>
                    {[1, 2, 3].map(level => (
                      <button
                        key={level}
                        type="button"
                        role="radio"
                        aria-checked={currentProgress === level}
                        title={t(`strongMind.progressLevels.${level}`)}
                        onClick={() => onProcessGoalProgress(goal.id, level as 1 | 2 | 3)}
                        className={`size-11 rounded-full border flex items-center justify-center text-sm font-extrabold uc-num transition-colors ${
                          currentProgress === level
                            ? 'border-uc-primary bg-uc-primary text-uc-on-primary'
                            : 'border-uc-border text-uc-text hover:border-uc-primary'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <AchievedButton
                    pressed={isProcessGoalAchieved(goal.id)}
                    label={t('strongMind.markGoalAchieved')}
                    onClick={() => onProcessGoalAchieved(goal.id)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Project goals: achieved on this workout */}
      {projectGoals.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-uc-text-muted">
            {t('strongMind.achievedHint')}
          </p>
          {projectGoals.map(goal => {
            const isCompleted = isProjectGoalCompleted(goal.id)
            return (
              <div key={goal.id} className="flex items-center justify-between gap-3 p-3 bg-uc-surface rounded-uc-input border border-uc-border">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">
                    {goal.routeGrade} {goal.routeName} - {goal.sectorLocation}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-uc-text-muted">
                    <WorkoutIcon workoutType={goal.climbingType === 'route' ? 'LEAD_ROCK' : 'BOULDERING'} size={16} />
                    {goal.climbingType === 'route' ? t('strongMind.route') : t('strongMind.boulder')} • {goal.gradeSystem}
                  </div>
                </div>
                <AchievedButton
                  pressed={isCompleted}
                  label={t('strongMind.markAchieved')}
                  onClick={() => onProjectGoalCompletion(goal.id)}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
};
