'use client';

import { useState, useEffect } from 'react';
import { MentalState, ClimbSection, FocusState, ComfortZone } from '@/types/workout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip } from './Tooltip';
import { CollapsibleCard, Icon, Label, SegmentedControl, Textarea } from './ui';

interface StrongMindSectionProps {
  mentalState: MentalState;
  onChange: (mentalState: MentalState) => void;
  workoutType: string;
}

// Token colour per state; full class strings so Tailwind can see them.
const focusStateLabels: Record<FocusState, { label: string; color: string }> = {
  CHOKE: { label: 'Choke', color: 'bg-uc-focus-choke' },
  DISTRACTION: { label: 'Distraction', color: 'bg-uc-focus-distraction' },
  PRESENT: { label: 'Present', color: 'bg-uc-focus-present' },
  FOCUSED: { label: 'Focused', color: 'bg-uc-focus-focused' },
  CLUTCH: { label: 'Clutch', color: 'bg-uc-focus-clutch' },
  FLOW: { label: 'Flow', color: 'bg-uc-focus-flow' },
};

const comfortZoneLabels: Record<ComfortZone, { label: string; color: string }> = {
  COMFORT: { label: 'Comfort', color: 'bg-uc-zone-comfort' },
  STRETCH1: { label: 'Stretch 1', color: 'bg-uc-zone-stretch-1' },
  STRETCH2: { label: 'Stretch 2', color: 'bg-uc-zone-stretch-2' },
  PANIC: { label: 'Panic', color: 'bg-uc-zone-panic' },
};

export const StrongMindSection = ({ mentalState, onChange, workoutType }: StrongMindSectionProps) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const updateMentalState = (updates: Partial<MentalState>) => {
    onChange({ ...mentalState, ...updates });
  };


  const addClimbSection = () => {
    const newSection: ClimbSection = {
      id: `climb-${Date.now()}`,
      focusState: undefined,
      tookFall: undefined,
      comfortZone: undefined,
      notes: ''
    };
    const updatedSections = [...(mentalState.climbSections || []), newSection];
    updateMentalState({ climbSections: updatedSections });
  };

  const updateClimbSection = (sectionId: string, updates: Partial<ClimbSection>) => {
    const updatedSections = (mentalState.climbSections || []).map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    updateMentalState({ climbSections: updatedSections });
  };

  const removeClimbSection = (sectionId: string) => {
    const updatedSections = (mentalState.climbSections || []).filter(section => section.id !== sectionId);
    updateMentalState({ climbSections: updatedSections });
  };

  const isLeadClimbing = workoutType === 'LEAD_ROCK' || workoutType === 'LEAD_ARTIFICIAL';

  const beforeLabel = (value: number) => t(`workouts.beforeClimbingLabels.${value}`);

  return (
    <CollapsibleCard
      open={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      icon={<Icon name="strong-mind" size={22} />}
      title={t('workouts.strongMind') || 'Strong Mind'}
      description={t('workouts.mentalStateTracking') || 'Track your mental state and climbing mindset'}
      summary={mentalState.beforeClimbing ? `${mentalState.beforeClimbing} · ${beforeLabel(mentalState.beforeClimbing)}` : undefined}
    >
      <div className="space-y-5">
        {/* Before Climbing */}
        <div>
          <Label id="strong-mind-before">{t('workouts.howFeltBefore') || 'How did I feel before climbing?'}</Label>
          <SegmentedControl
            ariaLabel={t('workouts.howFeltBefore') || 'How did I feel before climbing?'}
            options={(['1', '2', '3', '4', '5'] as const).map(value => ({ value, label: value }))}
            value={mentalState.beforeClimbing ? String(mentalState.beforeClimbing) as '1' : null}
            onChange={(value) => updateMentalState({ beforeClimbing: Number(value) })}
          />
          <div className="flex justify-between gap-3 mt-1.5 text-xs font-semibold text-uc-text-muted">
            <span>{beforeLabel(1)}</span>
            <span className="text-right">{beforeLabel(5)}</span>
          </div>
        </div>

        {/* Climb Sections (only for lead climbing) */}
        {isLeadClimbing && (
          <div className="space-y-3">
            {(mentalState.climbSections || []).map((section, index) => (
              <div key={section.id} className="bg-uc-elevated rounded-uc-card p-4 border border-uc-border space-y-4">
                <div className="flex items-center justify-between gap-3">
                  {/* Climb name: empty shows (and is saved as) "Climb N" */}
                  <label className="group flex min-h-11 min-w-0 flex-1 items-center gap-1.5 rounded-uc-input focus-within:ring-2 focus-within:ring-uc-primary">
                    <input
                      type="text"
                      value={section.name || ''}
                      onChange={(e) => updateClimbSection(section.id, { name: e.target.value })}
                      onBlur={(e) => updateClimbSection(section.id, { name: e.target.value.trim() || undefined })}
                      placeholder={t('workouts.climbNumber', { number: index + 1 })}
                      aria-label={t('workouts.climbName') || 'Climb name'}
                      maxLength={100}
                      className="min-w-0 flex-1 bg-transparent text-base font-bold text-uc-text placeholder:text-uc-text focus:outline-none"
                    />
                    <Icon name="edit" size={16} className="shrink-0 text-uc-text-muted group-hover:text-uc-text" />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeClimbSection(section.id)}
                    className="min-h-11 px-2 -mr-2 rounded-uc-input text-[13px] font-bold text-uc-error hover:bg-uc-error-bg transition-colors"
                  >
                    {t('workouts.removeClimb') || 'Remove'}
                  </button>
                </div>

                {/* Focus State */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Label className="mb-0">{t('workouts.focusState') || 'Focus State'}</Label>
                    <Tooltip content={t('workouts.tooltips.focusState') || 'Your mental state during climbing: Choke (panic), Distraction (unfocused), Present (aware), Focused (concentrated), Clutch (performing under pressure), Flow (optimal state).'}>
                      <span className="inline-flex size-6 cursor-help items-center justify-center text-uc-text-muted hover:text-uc-text"><Icon name="info" size={16} /></span>
                    </Tooltip>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(focusStateLabels) as [FocusState, { label: string; color: string }][]).map(([key, { label, color }]) => (
                      <StateChip
                        key={key}
                        color={color}
                        selected={section.focusState === key}
                        onClick={() => updateClimbSection(section.id, { focusState: key })}
                      >
                        {t(`workouts.focusStates.${key}`) || label}
                      </StateChip>
                    ))}
                  </div>
                </div>

                {/* Fall */}
                <div>
                  <Label>{t('workouts.didTakeFalls') || 'Did I take any falls?'}</Label>
                  <SegmentedControl
                    ariaLabel={t('workouts.didTakeFalls') || 'Did I take any falls?'}
                    options={[
                      { value: 'no', label: t('workouts.no') || 'No' },
                      { value: 'yes', label: t('workouts.yes') || 'Yes' },
                    ]}
                    value={section.tookFall === undefined ? null : section.tookFall ? 'yes' : 'no'}
                    onChange={(value) => updateClimbSection(section.id, { tookFall: value === 'yes' })}
                  />
                </div>

                {/* Comfort Zone */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Label className="mb-0">{t('workouts.comfortZone') || 'Comfort Zone'}</Label>
                    <Tooltip content={t('workouts.tooltips.comfortZone') || 'How comfortable you felt on the climb: Comfort (easy), Stretch 1 (slightly challenging), Stretch 2 (very challenging), Panic (too hard).'}>
                      <span className="inline-flex size-6 cursor-help items-center justify-center text-uc-text-muted hover:text-uc-text"><Icon name="info" size={16} /></span>
                    </Tooltip>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.entries(comfortZoneLabels) as [ComfortZone, { label: string; color: string }][]).map(([key, { label, color }]) => (
                      <StateChip
                        key={key}
                        color={color}
                        selected={section.comfortZone === key}
                        onClick={() => updateClimbSection(section.id, { comfortZone: key })}
                      >
                        {t(`workouts.comfortZones.${key}`) || label}
                      </StateChip>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor={`climb-notes-${section.id}`}>{t('workouts.climbNotes') || 'Climb Notes'}</Label>
                  <Textarea
                    id={`climb-notes-${section.id}`}
                    value={section.notes || ''}
                    onChange={(e) => updateClimbSection(section.id, { notes: e.target.value })}
                    placeholder={t('workouts.climbNotesPlaceholder') || 'Add notes about this climb section...'}
                    rows={3}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addClimbSection}
              className="w-full min-h-12 flex items-center justify-center gap-2 rounded-uc-card border border-dashed border-uc-border text-sm font-bold text-uc-primary hover:border-uc-primary transition-colors"
            >
              <span aria-hidden className="text-lg leading-none">+</span>
              {t('workouts.addClimb') || 'Add Climb'}
            </button>
          </div>
        )}

        {/* Reflections */}
        <div>
          <Label htmlFor="strong-mind-reflections">{t('workouts.otherReflections') || 'Other reflections'}</Label>
          <Textarea
            id="strong-mind-reflections"
            value={mentalState.reflections || ''}
            onChange={(e) => updateMentalState({ reflections: e.target.value })}
            placeholder={t('workouts.reflectionsPlaceholder') || 'Share your thoughts about the session, what you learned, or how you overcame challenges...'}
            rows={4}
          />
        </div>

        {/* Mental State Summary */}
        {(mentalState.beforeClimbing || (mentalState.climbSections && mentalState.climbSections.length > 0)) && (
          <div className="bg-uc-elevated rounded-uc-card p-4 border border-uc-border">
            <h4 className="text-sm font-bold mb-2">
              {t('workouts.mentalSummary') || 'Mental State Summary'}
            </h4>
            <div className="space-y-2 text-sm">
              {mentalState.beforeClimbing && (
                <div className="flex items-center gap-2">
                  <span className="text-uc-text-muted">{t('workouts.before') || 'Before'}:</span>
                  <span className="font-semibold">{beforeLabel(mentalState.beforeClimbing)}</span>
                </div>
              )}
              {isLeadClimbing && mentalState.climbSections && mentalState.climbSections.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-uc-text-muted">{t('workouts.climbs') || 'Climbs'}:</span>
                  {mentalState.climbSections.map((section, index) => (
                    <div key={section.id} className="ml-4 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-uc-text-muted">{section.name || t('workouts.climbNumber', { number: index + 1 })}:</span>
                      {section.focusState && (
                        <SummaryItem color={focusStateLabels[section.focusState].color}>
                          {t(`workouts.focusStates.${section.focusState}`) || focusStateLabels[section.focusState].label}
                        </SummaryItem>
                      )}
                      {section.tookFall !== undefined && (
                        <span className="font-semibold">
                          ({section.tookFall ? t('workouts.fell') : t('workouts.noFall')})
                        </span>
                      )}
                      {section.comfortZone && (
                        <SummaryItem color={comfortZoneLabels[section.comfortZone].color}>
                          {t(`workouts.comfortZones.${section.comfortZone}`) || comfortZoneLabels[section.comfortZone].label}
                        </SummaryItem>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
};

/** Focus state / comfort zone option: dot in the state colour; filled with that colour when selected. */
function StateChip({ color, selected, onClick, children }: {
  color: string;
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-11 min-w-0 px-2 inline-flex items-center justify-center gap-1.5 rounded-[14px] border text-[13px] font-bold transition-colors ${
        selected ? `${color} border-transparent text-uc-chip-ink` : 'bg-uc-surface border-uc-border text-uc-text hover:border-uc-text-muted'
      }`}
    >
      <span aria-hidden className={`size-2 shrink-0 rounded-full ${selected ? 'bg-uc-chip-ink opacity-55' : color}`} />
      <span className="text-center leading-tight">{children}</span>
    </button>
  );
}

function SummaryItem({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold">
      <span aria-hidden className={`size-2 rounded-full ${color}`} />
      {children}
    </span>
  );
}
