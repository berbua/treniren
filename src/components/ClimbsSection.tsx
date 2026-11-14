'use client';

import { useState, useEffect } from 'react';
import { MentalState, ClimbSection, SendStyle, FocusState, ComfortZone } from '@/types/workout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStrongMindSetting } from '@/hooks/useStrongMindSetting';
import { Tooltip } from './Tooltip';
import { Button, ChoiceChip, Icon, Input, Label, SegmentedControl, Select, Textarea, WorkoutIconTile } from './ui';
import type { WorkoutTypeKey } from './ui/WorkoutTypeChip';
import {
  SEND_STYLES, FIRST_TRY_STYLES, GradeSystem, climbKindFor, getLastGradeSystem, gradeOptions, gradeSystemsFor,
  setLastGradeSystem,
} from '@/lib/grades';

interface ClimbsSectionProps {
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

// Light purple panel around the Strong Mind fields
const strongMindPanel = 'rounded-uc-card border border-uc-primary/30 bg-uc-primary-container/40 p-4';

/**
 * Climbs (lead) or boulders logged in a workout: grade, style, tries and notes per climb. The Strong Mind fields
 * (before climbing, focus, falls, comfort zone, reflections) are added on lead workouts when the Profile setting is on;
 * lead workouts ask once whether to turn it on.
 */
export const ClimbsSection = ({ mentalState, onChange, workoutType }: ClimbsSectionProps) => {
  const { t } = useLanguage();
  const strongMindSetting = useStrongMindSetting();
  const climbKind = climbKindFor(workoutType);
  const isLead = workoutType === 'LEAD_ROCK' || workoutType === 'LEAD_ARTIFICIAL';
  const showStrongMind = isLead && strongMindSetting.enabled;
  const showPrompt = isLead && strongMindSetting.loaded && !strongMindSetting.enabled && !strongMindSetting.answered;
  const sections = mentalState.climbSections || [];

  // Saved climbs start collapsed; a new one opens
  const [openId, setOpenId] = useState<string | null>(null);
  const [showEnabledNote, setShowEnabledNote] = useState(false);
  const [gradeSystem, setGradeSystem] = useState<GradeSystem>('french');

  // Same system as the last climb, else the one picked last time (read on the client: localStorage)
  useEffect(() => {
    const last = sections[sections.length - 1]?.gradeSystem as GradeSystem | undefined;
    setGradeSystem(last && gradeSystemsFor(climbKind).includes(last) ? last : getLastGradeSystem(climbKind));
    // Only when the kind changes; picking a system later is handled in changeGradeSystem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [climbKind]);

  const updateMentalState = (updates: Partial<MentalState>) => {
    onChange({ ...mentalState, ...updates });
  };

  // Onsight is a route style; boulders are flashed
  const sendStyles = climbKind === 'boulder' ? SEND_STYLES.filter(style => style !== 'ONSIGHT') : SEND_STYLES;

  const addClimbSection = () => {
    const newSection: ClimbSection = {
      id: `climb-${Date.now()}`,
      gradeSystem,
      focusState: undefined,
      tookFall: undefined,
      comfortZone: undefined,
      notes: ''
    };
    updateMentalState({ climbSections: [...sections, newSection] });
    setOpenId(newSection.id);
  };

  const updateClimbSection = (sectionId: string, updates: Partial<ClimbSection>) => {
    updateMentalState({
      climbSections: sections.map(section => section.id === sectionId ? { ...section, ...updates } : section),
    });
  };

  const removeClimbSection = (sectionId: string) => {
    updateMentalState({ climbSections: sections.filter(section => section.id !== sectionId) });
  };

  // Applies to new climbs and climbs without a grade; graded climbs keep the system their grade belongs to
  const changeGradeSystem = (system: GradeSystem) => {
    setGradeSystem(system);
    setLastGradeSystem(climbKind, system);
    if (sections.some(section => !section.grade)) {
      updateMentalState({
        climbSections: sections.map(section => section.grade ? section : { ...section, gradeSystem: system }),
      });
    }
  };

  const climbPlaceholder = (index: number) =>
    t(climbKind === 'boulder' ? 'workouts.boulderNumber' : 'workouts.climbNumber', { number: index + 1 });

  const gradeSystemLabel = (system: GradeSystem) =>
    t(`workouts.climbsSection.gradeSystems.${climbKind}.${system}`);

  const setStyle = (section: ClimbSection, style: SendStyle) =>
    updateClimbSection(section.id, FIRST_TRY_STYLES.includes(style) ? { style, tries: 1 } : { style });

  const beforeLabel = (value: number) => t(`workouts.beforeClimbingLabels.${value}`);

  const turnOn = () => {
    strongMindSetting.setEnabled(true);
    setShowEnabledNote(true);
  };

  return (
    <section aria-labelledby="climbs-section-title" className="space-y-3">
      {/* Header: title with count + grade system */}
      <div className="flex items-center gap-3">
        <WorkoutIconTile workoutType={workoutType as WorkoutTypeKey} className="size-9 rounded-lg" />
        <h3 id="climbs-section-title" className="flex-1 min-w-0 text-lg font-bold text-uc-text">
          {t(climbKind === 'boulder' ? 'workouts.climbsSection.boulders' : 'workouts.climbsSection.climbs', { count: sections.length })}
        </h3>
        <Select
          aria-label={t('strongMind.gradeSystem') || 'Grade System'}
          value={gradeSystem}
          onChange={(e) => changeGradeSystem(e.target.value as GradeSystem)}
          className="shrink-0"
        >
          {gradeSystemsFor(climbKind).map(system => (
            <option key={system} value={system}>{gradeSystemLabel(system)}</option>
          ))}
        </Select>
      </div>

      {/* One-time question on lead */}
      {showPrompt && (
        <div className="rounded-uc-card border border-uc-primary bg-uc-surface p-4 space-y-3">
          <div className="flex gap-3">
            <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-uc-primary-container text-uc-on-primary-container">
              <Icon name="strong-mind" size={22} />
            </span>
            <div className="min-w-0">
              <h4 className="text-base font-bold text-uc-text">{t('workouts.strongMindPrompt.title')}</h4>
              <p className="mt-0.5 text-[13px] text-uc-text-muted">{t('workouts.strongMindPrompt.body')}</p>
              <div aria-hidden className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-uc-text">
                <SummaryItem color={focusStateLabels.FOCUSED.color}>{t('workouts.focusStates.FOCUSED')}</SummaryItem>
                <span>{t('workouts.noFall')}</span>
                <SummaryItem color={comfortZoneLabels.STRETCH1.color}>{t('workouts.comfortZones.STRETCH1')}</SummaryItem>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="tonal" onClick={strongMindSetting.dismissPrompt}>{t('workouts.strongMindPrompt.notNow')}</Button>
            <Button variant="primary" onClick={turnOn}>{t('workouts.strongMindPrompt.turnOn')}</Button>
          </div>
          <p className="text-xs text-uc-text-muted">{t('workouts.strongMindPrompt.askedOnce')}</p>
        </div>
      )}

      {showStrongMind && showEnabledNote && (
        <div role="status" className="flex items-center gap-3 rounded-uc-card bg-uc-primary-container px-4 py-2 text-[13px] font-bold text-uc-on-primary-container">
          <Icon name="success" size={18} className="shrink-0" />
          <span className="flex-1">{t('workouts.strongMindPrompt.enabled')}</span>
          <button
            type="button"
            onClick={() => setShowEnabledNote(false)}
            aria-label={t('common.close') || 'Close'}
            className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      {/* Before climbing */}
      {showStrongMind && (
        <div className={strongMindPanel}>
          <StrongMindOverline>{t('workouts.strongMind') || 'Strong Mind'}</StrongMindOverline>
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <Label id="strong-mind-before" className="mb-0">{t('workouts.howFeltBefore') || 'How did I feel before climbing?'}</Label>
            {mentalState.beforeClimbing && (
              <span className="shrink-0 text-xs font-semibold text-uc-text-muted uc-num">
                {mentalState.beforeClimbing} · {beforeLabel(mentalState.beforeClimbing)}
              </span>
            )}
          </div>
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
      )}

      {/* Climbs */}
      {sections.map((section, index) => {
        const name = section.name || climbPlaceholder(index);
        if (openId !== section.id) {
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setOpenId(section.id)}
              aria-expanded={false}
              aria-label={`${name}${section.grade ? ` · ${section.grade}` : ''}`}
              className="w-full min-h-14 flex items-center gap-3 rounded-uc-card border border-uc-border bg-uc-surface px-4 py-2.5 text-left hover:border-uc-text-muted transition-colors"
            >
              <NumberBadge>{index + 1}</NumberBadge>
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="font-bold text-uc-text uc-num">{section.grade || name}</span>
                {section.style && (
                  <span className="text-xs font-semibold text-uc-text-muted">{t(`workouts.sendStyles.${section.style}`)}</span>
                )}
                {showStrongMind && section.focusState && (
                  <SummaryItem color={focusStateLabels[section.focusState].color} small>
                    {t(`workouts.focusStates.${section.focusState}`) || focusStateLabels[section.focusState].label}
                  </SummaryItem>
                )}
                {showStrongMind && section.comfortZone && (
                  <SummaryItem color={comfortZoneLabels[section.comfortZone].color} small>
                    {t(`workouts.comfortZones.${section.comfortZone}`) || comfortZoneLabels[section.comfortZone].label}
                  </SummaryItem>
                )}
                {showStrongMind && section.tookFall !== undefined && (
                  <span className="text-xs font-semibold text-uc-text-muted">
                    {section.tookFall ? t('workouts.fell') : t('workouts.noFall')}
                  </span>
                )}
                {section.notes?.trim() && (
                  <span className="text-xs font-semibold text-uc-text-muted">{t('workouts.climbsSection.note')}</span>
                )}
              </span>
              <Icon name="chevron-down" size={20} className="shrink-0 text-uc-text-muted" />
            </button>
          );
        }

        return (
          <div key={section.id} className="bg-uc-surface rounded-uc-card p-4 border border-uc-border space-y-4">
            <div className="flex items-center gap-2">
              <NumberBadge>{index + 1}</NumberBadge>
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
                aria-label={t('workouts.removeClimb') || 'Remove'}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-uc-text-muted hover:bg-uc-error-bg hover:text-uc-error transition-colors"
              >
                <Icon name="delete" size={18} />
              </button>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                aria-expanded
                aria-label={t('workouts.climbsSection.collapse')}
                className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-uc-text-muted hover:text-uc-text"
              >
                <Icon name="chevron-up" size={20} />
              </button>
            </div>

            {/* Grade: a graded climb keeps its own system, an ungraded one follows the header */}
            <div className="max-w-48">
              <Label htmlFor={`climb-grade-${section.id}`}>{t('strongMind.grade') || 'Grade'}</Label>
              <Select
                id={`climb-grade-${section.id}`}
                value={section.grade || ''}
                onChange={(e) => {
                  const system = section.grade ? section.gradeSystem || 'french' : gradeSystem;
                  updateClimbSection(section.id, { gradeSystem: system, grade: e.target.value || undefined });
                }}
                className="uc-num"
              >
                <option value="">{t('strongMind.selectGrade') || 'Select grade...'}</option>
                {gradeOptions(section.grade ? section.gradeSystem || 'french' : gradeSystem, climbKind).map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </Select>
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

            {showStrongMind && (
              <div className={`${strongMindPanel} space-y-4`}>
                <StrongMindOverline>{t('workouts.strongMind') || 'Strong Mind'}</StrongMindOverline>

                {/* Focus State */}
                <div className="!mt-0">
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
              </div>
            )}

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
        );
      })}

      <button
        type="button"
        onClick={addClimbSection}
        className="w-full min-h-12 flex items-center justify-center gap-2 rounded-uc-card border border-dashed border-uc-border text-sm font-bold text-uc-primary hover:border-uc-primary transition-colors"
      >
        <span aria-hidden className="text-lg leading-none">+</span>
        {climbKind === 'boulder' ? t('workouts.climbsSection.addBoulder') : t('workouts.climbsSection.addClimb')}
      </button>

      {/* After the session */}
      {showStrongMind && (
        <div className={`${strongMindPanel} space-y-4`}>
          <StrongMindOverline>{t('workouts.climbsSection.afterSession')}</StrongMindOverline>
          <div className="!mt-0">
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
          {(mentalState.beforeClimbing || sections.length > 0) && (
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
                {sections.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-uc-text-muted">{t('workouts.climbs') || 'Climbs'}:</span>
                    {sections.map((section, index) => (
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
      )}
    </section>
  );
};

function StrongMindOverline({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-uc-primary">
      <Icon name="strong-mind" size={14} />
      {children}
    </p>
  );
}

function NumberBadge({ children }: { children: React.ReactNode }) {
  return (
    <span aria-hidden className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-uc-primary-container text-xs font-bold text-uc-on-primary-container uc-num">
      {children}
    </span>
  );
}

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

function SummaryItem({ color, small, children }: { color: string; small?: boolean; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold ${small ? 'text-xs text-uc-text-muted' : ''}`}>
      <span aria-hidden className={`size-2 rounded-full ${color}`} />
      {children}
    </span>
  );
}
