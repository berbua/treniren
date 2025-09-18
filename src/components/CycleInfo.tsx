'use client'

import { CycleInfo, getPhaseColor } from '@/lib/cycle-utils'

interface CycleInfoProps {
  cycleInfo: CycleInfo
  showRecommendations?: boolean
  isSelectedDate?: boolean
}

export default function CycleInfoComponent({ cycleInfo, showRecommendations = false, isSelectedDate = false }: CycleInfoProps) {
  const phaseColor = getPhaseColor(cycleInfo.phase)

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🌸</span>
          <span className="font-medium text-slate-900 dark:text-slate-50">
            {isSelectedDate ? 'Selected Date: ' : ''}Cycle Day {cycleInfo.currentDay}
          </span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${phaseColor}`}>
          {cycleInfo.phaseDescription}
        </span>
      </div>

      <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">Next period:</span>
            <br />
            {cycleInfo.nextPeriodDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
          <div>
            <span className="font-medium">Next ovulation:</span>
            <br />
            {cycleInfo.nextOvulationDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {showRecommendations && (
        <div className="mt-3">
          <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2">
            Training Recommendations:
          </h4>
          <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
            {cycleInfo.trainingRecommendations.slice(0, 3).map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <span className="text-pink-500 mr-2 mt-0.5">•</span>
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {cycleInfo.isInFertileWindow && (
        <div className="mt-2 text-xs text-pink-600 dark:text-pink-400 font-medium">
          💫 Fertile window
        </div>
      )}
    </div>
  )
}
