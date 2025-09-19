'use client';

import { useState } from 'react';
import { MentalState } from '@/types/workout';
import { useLanguage } from '@/contexts/LanguageContext';

interface StrongMindSectionProps {
  mentalState: MentalState;
  onChange: (mentalState: MentalState) => void;
  workoutType: string;
}

const mentalStateLabels = {
  1: { label: 'Very Nervous', emoji: '😰', color: 'text-red-600' },
  2: { label: 'Nervous', emoji: '😟', color: 'text-orange-600' },
  3: { label: 'Neutral', emoji: '😐', color: 'text-yellow-600' },
  4: { label: 'Confident', emoji: '😊', color: 'text-blue-600' },
  5: { label: 'Very Confident', emoji: '🤩', color: 'text-green-600' },
};

export const StrongMindSection = ({ mentalState, onChange, workoutType }: StrongMindSectionProps) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const updateMentalState = (updates: Partial<MentalState>) => {
    onChange({ ...mentalState, ...updates });
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
                  <div className="text-2xl mb-1">{mentalStateLabels[value as keyof typeof mentalStateLabels].emoji}</div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {mentalStateLabels[value as keyof typeof mentalStateLabels].label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* During Climbing */}
          <div>
            <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-3">
              {t('workouts.howFeltDuring') || 'How did I feel during climbing?'}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => updateMentalState({ duringClimbing: value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    mentalState.duringClimbing === value
                      ? 'border-purple-500 bg-purple-100 dark:bg-purple-800'
                      : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{mentalStateLabels[value as keyof typeof mentalStateLabels].emoji}</div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {mentalStateLabels[value as keyof typeof mentalStateLabels].label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Falls (only for lead climbing) */}
          {isLeadClimbing && (
            <div>
              <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-3">
                {t('workouts.didTakeFalls') || 'Did I take any falls?'}
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => updateMentalState({ tookFalls: true })}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    mentalState.tookFalls === true
                      ? 'border-red-500 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-red-300'
                  }`}
                >
                  <span className="text-lg mr-2">⚠️</span>
                  {t('workouts.yes') || 'Yes'}
                </button>
                <button
                  type="button"
                  onClick={() => updateMentalState({ tookFalls: false })}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    mentalState.tookFalls === false
                      ? 'border-green-500 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
                  }`}
                >
                  <span className="text-lg mr-2">✅</span>
                  {t('workouts.no') || 'No'}
                </button>
              </div>
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
          {(mentalState.beforeClimbing || mentalState.duringClimbing || mentalState.tookFalls !== undefined) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                {t('workouts.mentalSummary') || 'Mental State Summary'}
              </h4>
              <div className="space-y-2 text-sm">
                {mentalState.beforeClimbing && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">{t('workouts.before') || 'Before'}:</span>
                    <span className={mentalStateLabels[mentalState.beforeClimbing as keyof typeof mentalStateLabels].color}>
                      {mentalStateLabels[mentalState.beforeClimbing as keyof typeof mentalStateLabels].emoji} {mentalStateLabels[mentalState.beforeClimbing as keyof typeof mentalStateLabels].label}
                    </span>
                  </div>
                )}
                {mentalState.duringClimbing && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">{t('workouts.during') || 'During'}:</span>
                    <span className={mentalStateLabels[mentalState.duringClimbing as keyof typeof mentalStateLabels].color}>
                      {mentalStateLabels[mentalState.duringClimbing as keyof typeof mentalStateLabels].emoji} {mentalStateLabels[mentalState.duringClimbing as keyof typeof mentalStateLabels].label}
                    </span>
                  </div>
                )}
                {isLeadClimbing && mentalState.tookFalls !== undefined && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">{t('workouts.falls') || 'Falls'}:</span>
                    <span className={mentalState.tookFalls ? 'text-red-600' : 'text-green-600'}>
                      {mentalState.tookFalls ? '⚠️ Yes' : '✅ No'}
                    </span>
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
