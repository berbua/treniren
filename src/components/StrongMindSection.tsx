'use client';

import { useState, useEffect } from 'react';
import { MentalState, ClimbSection, FocusState, ComfortZone } from '@/types/workout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip } from './Tooltip';

interface StrongMindSectionProps {
  mentalState: MentalState;
  onChange: (mentalState: MentalState) => void;
  workoutType: string;
}

const mentalStateLabels = {
  1: { label: 'Very Nervous', color: 'text-red-600' },
  2: { label: 'Nervous', color: 'text-orange-600' },
  3: { label: 'Neutral', color: 'text-yellow-600' },
  4: { label: 'Confident', color: 'text-blue-600' },
  5: { label: 'Very Confident', color: 'text-green-600' },
};

const focusStateLabels = {
  CHOKE: { label: 'Choke', color: 'text-red-600' },
  DISTRACTION: { label: 'Distraction', color: 'text-orange-600' },
  PRESENT: { label: 'Present', color: 'text-yellow-600' },
  FOCUSED: { label: 'Focused', color: 'text-blue-600' },
  CLUTCH: { label: 'Clutch', color: 'text-green-600' },
  FLOW: { label: 'Flow', color: 'text-purple-600' },
};

const comfortZoneLabels = {
  COMFORT: { label: 'Comfort', color: 'text-green-600' },
  STRETCH1: { label: 'Stretch 1', color: 'text-yellow-600' },
  STRETCH2: { label: 'Stretch 2', color: 'text-orange-600' },
  PANIC: { label: 'Panic', color: 'text-red-600' },
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

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🧠</span>
          <div>
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
              {t('workouts.strongMind') || 'Strong Mind'}
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              {t('workouts.mentalStateTracking') || 'Track your mental state and climbing mindset'}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-6">
          {/* Before Climbing */}
          <div>
            <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-3">
              {t('workouts.howFeltBefore') || 'How did I feel before climbing?'}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => updateMentalState({ beforeClimbing: value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    mentalState.beforeClimbing === value
                      ? 'border-purple-500 bg-purple-100 dark:bg-purple-800'
                      : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {mentalStateLabels[value as keyof typeof mentalStateLabels].label}
                  </div>
                </button>
              ))}
            </div>
          </div>


          {/* Climb Sections (only for lead climbing) */}
          {isLeadClimbing && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-100">
                  {t('workouts.climbs') || 'Climbs'}
                </label>
                <button
                  type="button"
                  onClick={addClimbSection}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {t('workouts.addClimb') || 'Add Climb'}
                </button>
              </div>
              
              {(mentalState.climbSections || []).map((section, index) => (
                <div key={section.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                      Climb {index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeClimbSection(section.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {t('workouts.removeClimb') || 'Remove'}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Focus State */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        {t('workouts.focusState') || 'Focus State'}
                        <Tooltip content={t('workouts.tooltips.focusState') || 'Your mental state during climbing: Choke (panic), Distraction (unfocused), Present (aware), Focused (concentrated), Clutch (performing under pressure), Flow (optimal state).'}>
                          <span className="text-gray-500 dark:text-gray-400 cursor-help">ℹ️</span>
                        </Tooltip>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(focusStateLabels).map(([key, { label, color }]) => (
                          <button
                            type="button"
                            key={key}
                            onClick={() => updateClimbSection(section.id, { focusState: key as FocusState })}
                            className={`p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                              section.focusState === key
                                ? 'border-purple-500 bg-purple-100 dark:bg-purple-800'
                                : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                            }`}
                          >
                            <span className={color}>
                              {t(`workouts.focusStates.${key}`) || label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Fall */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('workouts.didTakeFalls') || 'Did I take any falls?'}
                      </label>
                      <div className="flex space-x-4">
                        <button
                          type="button"
                          onClick={() => updateClimbSection(section.id, { tookFall: true })}
                          className={`px-4 py-2 rounded-lg border-2 transition-all ${
                            section.tookFall === true
                              ? 'border-pink-500 bg-pink-100 dark:bg-pink-800 text-pink-700 dark:text-pink-300'
                              : 'border-gray-200 dark:border-gray-600 hover:border-pink-300'
                          }`}
                        >
                          {t('workouts.yes') || 'Yes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateClimbSection(section.id, { tookFall: false })}
                          className={`px-4 py-2 rounded-lg border-2 transition-all ${
                            section.tookFall === false
                              ? 'border-green-500 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                              : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
                          }`}
                        >
                          {t('workouts.no') || 'No'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Comfort Zone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        {t('workouts.comfortZone') || 'Comfort Zone'}
                        <Tooltip content={t('workouts.tooltips.comfortZone') || 'How comfortable you felt on the climb: Comfort (easy), Stretch 1 (slightly challenging), Stretch 2 (very challenging), Panic (too hard).'}>
                          <span className="text-gray-500 dark:text-gray-400 cursor-help">ℹ️</span>
                        </Tooltip>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(comfortZoneLabels).map(([key, { label, color }]) => (
                          <button
                            type="button"
                            key={key}
                            onClick={() => updateClimbSection(section.id, { comfortZone: key as ComfortZone })}
                            className={`p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                              section.comfortZone === key
                                ? 'border-purple-500 bg-purple-100 dark:bg-purple-800'
                                : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                            }`}
                          >
                            <span className={color}>
                              {t(`workouts.comfortZones.${key}`) || label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('workouts.climbNotes') || 'Climb Notes'}
                      </label>
                      <textarea
                        value={section.notes || ''}
                        onChange={(e) => updateClimbSection(section.id, { notes: e.target.value })}
                        placeholder={t('workouts.climbNotesPlaceholder') || 'Add notes about this climb section...'}
                        rows={3}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}


          {/* Reflections */}
          <div>
            <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
              {t('workouts.otherReflections') || 'Other reflections'}
            </label>
            <textarea
              value={mentalState.reflections || ''}
              onChange={(e) => updateMentalState({ reflections: e.target.value })}
              placeholder={t('workouts.reflectionsPlaceholder') || 'Share your thoughts about the session, what you learned, or how you overcame challenges...'}
              rows={4}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Mental State Summary */}
          {(mentalState.beforeClimbing || (mentalState.climbSections && mentalState.climbSections.length > 0)) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                {t('workouts.mentalSummary') || 'Mental State Summary'}
              </h4>
              <div className="space-y-2 text-sm">
                {mentalState.beforeClimbing && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">{t('workouts.before') || 'Before'}:</span>
                    <span className={mentalStateLabels[mentalState.beforeClimbing as keyof typeof mentalStateLabels].color}>
                      {mentalStateLabels[mentalState.beforeClimbing as keyof typeof mentalStateLabels].label}
                    </span>
                  </div>
                )}
                {isLeadClimbing && mentalState.climbSections && mentalState.climbSections.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-gray-600 dark:text-gray-400">{t('workouts.climbs') || 'Climbs'}:</span>
                    {mentalState.climbSections.map((section, index) => (
                      <div key={section.id} className="ml-4 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Climb {index + 1}:</span>
                        {section.focusState && (
                          <span className={`ml-2 ${focusStateLabels[section.focusState].color}`}>
                            {t(`workouts.focusStates.${section.focusState}`) || focusStateLabels[section.focusState].label}
                          </span>
                        )}
                        {section.tookFall !== undefined && (
                          <span className={`ml-2 ${section.tookFall ? 'text-pink-600' : 'text-green-600'}`}>
                            ({section.tookFall ? 'Fell' : 'No fall'})
                          </span>
                        )}
                        {section.comfortZone && (
                          <span className={`ml-2 ${comfortZoneLabels[section.comfortZone].color}`}>
                            - {t(`workouts.comfortZones.${section.comfortZone}`) || comfortZoneLabels[section.comfortZone].label}
                          </span>
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
    </div>
  );
};
