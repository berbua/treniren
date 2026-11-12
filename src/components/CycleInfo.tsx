'use client'

import { CycleInfo } from '@/lib/cycle-utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { PhaseBadge, phaseSolidBg } from './ui'

interface CycleInfoProps {
  cycleInfo: CycleInfo
  showRecommendations?: boolean
  isSelectedDate?: boolean
}

/** Cycle day, phase, next dates and recommendations. No card of its own: callers put it on a phase band. */
export default function CycleInfoComponent({ cycleInfo, showRecommendations = false }: CycleInfoProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-3 text-uc-text">
      <div className="flex items-start justify-between gap-3">
        <span className="font-bold uc-num">
          <span aria-hidden>🌸 </span>
          {t('cycle.day') || 'Cycle Day'} {cycleInfo.currentDay}
        </span>
        <div className="flex flex-col items-end gap-1">
          <PhaseBadge phase={cycleInfo.phase} size="sm">
            {t(`cycle.phases.${cycleInfo.phaseDescription}`)}
          </PhaseBadge>
          {cycleInfo.isInFertileWindow && (
            <span className="text-xs font-semibold text-uc-text-muted">
              💫 {t('cycle.fertileWindow') || 'Fertile window'}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-[13px] font-semibold text-uc-text-muted">{t('common.nextPeriod') || 'Next period:'}</div>
          <div className="font-bold uc-num">
            {cycleInfo.nextPeriodDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div>
          <div className="text-[13px] font-semibold text-uc-text-muted">{t('common.nextOvulation') || 'Next ovulation:'}</div>
          <div className="font-bold uc-num">
            {cycleInfo.nextOvulationDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      {showRecommendations && (
        <div>
          <h4 className="text-sm font-bold mb-1.5">
            {t('cycle.trainingRecommendations') || 'Training Recommendations:'}
          </h4>
          <ul className="text-sm space-y-1">
            {cycleInfo.trainingRecommendations.slice(0, 3).map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <span aria-hidden className={`mt-1.5 size-1.5 shrink-0 rounded-full ${phaseSolidBg[cycleInfo.phase]}`} />
                {t(recommendation) || recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
