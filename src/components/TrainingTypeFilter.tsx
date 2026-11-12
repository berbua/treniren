'use client';

import { WorkoutType } from '@/types/workout';
import { useLanguage } from '@/contexts/LanguageContext';

interface TrainingTypeFilterProps {
  selectedTypes: WorkoutType[];
  onTypesChange: (types: WorkoutType[]) => void;
}

const workoutTypeConfig = {
  GYM: { labelKey: 'training.types.gym', emoji: '🏋️', color: 'bg-training-gym' },
  BOULDERING: { labelKey: 'training.types.bouldering', emoji: '🧗', color: 'bg-training-bouldering' },
  CIRCUITS: { labelKey: 'training.types.circuits', emoji: '🔄', color: 'bg-training-circuits' },
  LEAD_ROCK: { labelKey: 'training.types.leadRock', emoji: '🏔️', color: 'bg-training-leadRock' },
  LEAD_ARTIFICIAL: { labelKey: 'training.types.leadArtificial', emoji: '🧗‍♀️', color: 'bg-training-leadArtificial' },
  MENTAL_PRACTICE: { labelKey: 'training.types.mentalPractice', emoji: '🧘', color: 'bg-training-mentalPractice' },
  FINGERBOARD: { labelKey: 'training.types.fingerboard', emoji: '🖐️', color: 'bg-training-fingerboard' },
};

export default function TrainingTypeFilter({ selectedTypes, onTypesChange }: TrainingTypeFilterProps) {
  const { t } = useLanguage();
  const handleTypeToggle = (type: WorkoutType) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const handleSelectAll = () => {
    const allTypes = Object.keys(workoutTypeConfig) as WorkoutType[];
    onTypesChange(allTypes);
  };

  const handleSelectNone = () => {
    onTypesChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          🔍 {t('calendar.filterByTrainingType')}
        </label>
        <div className="flex space-x-2">
          <button
            onClick={handleSelectAll}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('calendar.filterAll')}
          </button>
          <button
            onClick={handleSelectNone}
            className="text-xs text-slate-600 dark:text-slate-400 hover:underline"
          >
            {t('calendar.filterNone')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Object.entries(workoutTypeConfig).map(([type, config]) => {
          const isSelected = selectedTypes.includes(type as WorkoutType);
          return (
            <button
              key={type}
              onClick={() => handleTypeToggle(type as WorkoutType)}
              className={`flex items-center space-x-2 p-2 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${config.color}`} />
              <span className="text-sm">{config.emoji}</span>
              <span className="text-xs font-medium text-slate-900 dark:text-slate-50">
                {t(config.labelKey)}
              </span>
            </button>
          );
        })}
      </div>

      {selectedTypes.length === 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('calendar.noTrainingTypesSelected')}
        </p>
      )}
    </div>
  );
}
