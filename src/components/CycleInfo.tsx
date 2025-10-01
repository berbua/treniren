'use client'

import { CycleInfo, getPhaseColor } from '@/lib/cycle-utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface CycleInfoProps {
  cycleInfo: CycleInfo
  showRecommendations?: boolean
  isSelectedDate?: boolean
}

export default function CycleInfoComponent({ cycleInfo, showRecommendations = false, isSelectedDate = false }: CycleInfoProps) {
  const { t } = useLanguage()
  const phaseColor = getPhaseColor(cycleInfo.phase)

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🌸</span>
          <span className="font-medium text-slate-900 dark:text-slate-50">
            Cycle Day {cycleInfo.currentDay}
          </span>
        </div>
        <div className="text-right">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${phaseColor}`}>
            {t(`cycle.phases.${cycleInfo.phaseDescription}`)}
          </span>
          {cycleInfo.isInFertileWindow && (
            <div className="text-xs text-pink-600 dark:text-pink-400 font-medium mt-1">
              💫 Fertile window
            </div>
          )}
        </div>
      </div>

      <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">Next period:</span>
            <br />
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][cycleInfo.nextPeriodDate.getMonth()]} {cycleInfo.nextPeriodDate.getDate()}
          </div>
          <div>
            <span className="font-medium">Next ovulation:</span>
            <br />
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][cycleInfo.nextOvulationDate.getMonth()]} {cycleInfo.nextOvulationDate.getDate()}
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

    </div>
  )
}
