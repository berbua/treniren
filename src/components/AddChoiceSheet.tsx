'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { BottomSheet, Icon, IconName } from './ui';

export type AddChoice = 'quicklog' | 'workout' | 'event';

interface AddChoiceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onChoose: (choice: AddChoice) => void;
}

/** "What would you like to add?" — Quick log / Add workout / Add event (Workouts page and the centre "+" tab). */
export function AddChoiceSheet({ isOpen, onClose, onChoose }: AddChoiceSheetProps) {
  const { t } = useLanguage();

  const choices: { value: AddChoice; icon: IconName; label: string; tone: string }[] = [
    { value: 'quicklog', icon: 'quick-log', label: t('quickLog.button') || 'Quick Log', tone: 'bg-uc-primary-container text-uc-on-primary-container border-transparent' },
    { value: 'workout', icon: 'workouts', label: t('workouts.addNew') || 'Add Workout', tone: 'bg-uc-surface text-uc-text border-uc-border hover:border-uc-primary' },
    { value: 'event', icon: 'calendar', label: t('events.addNew') || 'Add Event', tone: 'bg-uc-surface text-uc-text border-uc-border hover:border-uc-primary' },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('common.add') || 'Add'} closeLabel={t('common.close')}>
      <p className="mb-4 text-sm text-uc-text-muted">
        {t('workouts.addChoiceDescription') || 'What would you like to add?'}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {choices.map((choice) => (
          <button
            key={choice.value}
            type="button"
            onClick={() => onChoose(choice.value)}
            className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-uc-card border p-4 text-center text-sm font-bold transition-colors ${choice.tone}`}
          >
            <Icon name={choice.icon} size={28} />
            {choice.label}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
