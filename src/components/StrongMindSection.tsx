'use client';

import { useState, useEffect } from 'react';
import { MentalState, ClimbSection, SendStyle, FocusState, ComfortZone } from '@/types/workout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip } from './Tooltip';
import { ChoiceChip, CollapsibleCard, Icon, Input, Label, SegmentedControl, Select, Textarea } from './ui';
import {
  SEND_STYLES, FIRST_TRY_STYLES, GradeSystem, climbKindFor, getLastGradeSystem, gradeOptions, gradeSystemsFor,
  setLastGradeSystem,
} from '@/lib/grades';

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


  const climbKind = climbKindFor(workoutType);
  // Onsight is a route style; boulders are flashed
  const sendStyles = climbKind === 'boulder' ? SEND_STYLES.filter(style => style !== 'ONSIGHT') : SEND_STYLES;

  const addClimbSection = () => {
    const sections = mentalState.climbSections || [];
    const newSection: ClimbSection = {
      id: `climb-${Date.now()}`,
      // Same system as the climb before, else the one picked last time
      gradeSystem: sections[sections.length - 1]?.gradeSystem || getLastGradeSystem(climbKind),
      focusState: undefined,
      tookFall: undefined,
      comfortZone: undefined,
      notes: ''
    };
    const updatedSections = [...sections, newSection];
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
  const hasClimbList = isLeadClimbing || workoutType === 'BOULDERING';
  const climbPlaceholder = (index: number) =>
    t(climbKind === 'boulder' ? 'workouts.boulderNumber' : 'workouts.climbNumber', { number: index + 1 });

  const gradeSystemLabel = (system: GradeSystem) =>
    system === 'polish'
      ? t('strongMind.polishGrades') || 'Polish (VI.1, VI.2, etc.)'
      : system === 'american'
      ? climbKind === 'boulder'
        ? t('strongMind.americanBoulderGrades') || 'American (V0, V8, etc.)'
        : t('strongMind.americanRouteGrades') || 'American (5.10a, 5.12b, etc.)'
      : t('strongMind.frenchGrades') || 'French (6a, 7b, etc.)';

  const setStyle = (section: ClimbSection, style: SendStyle) =>
    updateClimbSection(section.id, FIRST_TRY_STYLES.includes(style) ? { style, tries: 1 } : { style });

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

        {/* Climb Sections (lead climbing and bouldering) */}
        {hasClimbList && (
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
                      placeholder={climbPlaceholder(index)}
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

                {/* Grade */}
                <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-3">
                  <div>
                    <Label htmlFor={`climb-system-${section.id}`}>{t('strongMind.gradeSystem') || 'Grade System'}</Label>
                    <Select
                      id={`climb-system-${section.id}`}
                      value={section.gradeSystem || 'french'}
                      onChange={(e) => {
                        const system = e.target.value as GradeSystem;
                        setLastGradeSystem(climbKind, system);
                        // The grade belongs to the old system
                        updateClimbSection(section.id, { gradeSystem: system, grade: undefined });
                      }}
                    >
                      {gradeSystemsFor(climbKind).map(system => (
                        <option key={system} value={system}>{gradeSystemLabel(system)}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`climb-grade-${section.id}`}>{t('strongMind.grade') || 'Grade'}</Label>
                    <Select
                      id={`climb-grade-${section.id}`}
                      value={section.grade || ''}
                      onChange={(e) => updateClimbSection(section.id, { grade: e.target.value || undefined })}
                      className="uc-num"
                    >
                      <option value="">{t('strongMind.selectGrade') || 'Select grade...'}</option>
                      {gradeOptions(section.gradeSystem || 'french', climbKind).map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Style + tries */}
                <div>
                  <Label id={`climb-style-${section.id}`}>{t('workouts.sendStyle') || 'Send style'}</Label>
                  <div role="group" aria-labelledby={`climb-style-${section.id}`} className="flex flex-wrap gap-2">
                    {sendStyles.map(style => (
                      <ChoiceChip
                        key={style}
                        selected={section.style === style}
                        onClick={() => setStyle(section, style)}
                      >
                        {t(`workouts.sendStyles.${style}`)}
                      </ChoiceChip>
                    ))}
                  </div>
                </div>
                {!(section.style && FIRST_TRY_STYLES.includes(section.style)) && (
                  <div className="max-w-40">
                    <Label htmlFor={`climb-tries-${section.id}`}>{t('workouts.climbTries') || 'Tries'}</Label>
                    <Input
                      id={`climb-tries-${section.id}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={999}
                      value={section.tries ?? ''}
                      onChange={(e) => {
                        const tries = parseInt(e.target.value, 10);
                        updateClimbSection(section.id, { tries: tries > 0 ? Math.min(tries, 999) : undefined });
                      }}
                      className="uc-num"
                    />
                  </div>
                )}

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
              {hasClimbList && mentalState.climbSections && mentalState.climbSections.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-uc-text-muted">{t('workouts.climbs') || 'Climbs'}:</span>
                  {mentalState.climbSections.map((section, index) => (
                    <div key={section.id} className="ml-4 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-uc-text-muted">{section.name || climbPlaceholder(index)}:</span>
                      {section.grade && <span className="font-bold uc-num">{section.grade}</span>}
                      {section.style && <span className="font-semibold">{t(`workouts.sendStyles.${section.style}`)}</span>}
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
