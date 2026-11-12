'use client';

import { WorkoutType } from '@/types/workout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Overline, WorkoutTypeChip } from '@/components/ui';

interface TrainingTypeFilterProps {
  selectedTypes: WorkoutType[];
  onTypesChange: (types: WorkoutType[]) => void;
}

const workoutTypeConfig = {
  BOULDERING: { labelKey: 'training.types.bouldering' },
  LEAD_ARTIFICIAL: { labelKey: 'training.types.leadArtificial' },
  LEAD_ROCK: { labelKey: 'training.types.leadRock' },
  CIRCUITS: { labelKey: 'training.types.circuits' },
  GYM: { labelKey: 'training.types.gym' },
  FINGERBOARD: { labelKey: 'training.types.fingerboard' },
  MENTAL_PRACTICE: { labelKey: 'training.types.mentalPractice' },
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
      <div className="flex items-center justify-between gap-3">
        <Overline>{t('calendar.filterByTrainingType')}</Overline>
        <div className="flex shrink-0">
          <button
            type="button"
            onClick={handleSelectAll}
            className="min-h-11 px-2 text-sm font-bold text-uc-primary hover:underline"
          >
            {t('calendar.filterAll')}
          </button>
          <button
            type="button"
            onClick={handleSelectNone}
            className="min-h-11 px-2 text-sm font-bold text-uc-primary hover:underline"
          >
            {t('calendar.filterNone')}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(workoutTypeConfig).map(([type, config]) => (
          <WorkoutTypeChip
            key={type}
            workoutType={type as WorkoutType}
            selected={selectedTypes.includes(type as WorkoutType)}
            onClick={() => handleTypeToggle(type as WorkoutType)}
          >
            {t(config.labelKey)}
          </WorkoutTypeChip>
        ))}
      </div>

      {selectedTypes.length === 0 && (
        <p className="text-[13px] text-uc-text-muted">
          {t('calendar.noTrainingTypesSelected')}
        </p>
      )}
    </div>
  );
}
