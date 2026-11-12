'use client'

import { WorkoutType, TrainingVolume, MentalState, Tag } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, Chip, Icon, IconName, Spinner, WorkoutIconTile } from '@/components/ui'

interface WorkoutCardProps {
  workout: {
    id: string
    type: WorkoutType
    startTime: string
    trainingVolume?: TrainingVolume
    notes?: string
    preSessionFeel?: number
    dayAfterTiredness?: number
    focusLevel?: number
    mentalState?: MentalState
    sector?: string
    mentalPracticeType?: string
    timeOfDay?: string[]
    gratitude?: string
    improvements?: string
    tags?: Tag[]
    workoutTags?: { tag: Tag }[]
    workoutExercises?: unknown[]
    details?: any
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  isDeleting?: boolean
}

const getTrainingTypeLabel = (type: WorkoutType, t: (key: string) => string) =>
  t(`workouts.workoutTypes.${type}`) || t(`workoutTypes.${type.toLowerCase()}`) || type

// Text colours for the Strong Mind recap (full class strings so Tailwind can see them)
const focusText: Record<string, string> = {
  CHOKE: 'text-uc-focus-choke',
  DISTRACTION: 'text-uc-focus-distraction',
  PRESENT: 'text-uc-focus-present',
  FOCUSED: 'text-uc-focus-focused',
  CLUTCH: 'text-uc-focus-clutch',
  FLOW: 'text-uc-focus-flow',
}

const zoneText: Record<string, string> = {
  COMFORT: 'text-uc-zone-comfort',
  STRETCH1: 'text-uc-zone-stretch-1',
  STRETCH2: 'text-uc-zone-stretch-2',
  PANIC: 'text-uc-zone-panic',
}

const beforeText: Record<number, string> = {
  1: 'text-uc-zone-panic',
  2: 'text-uc-zone-stretch-2',
  3: 'text-uc-zone-stretch-1',
  4: 'text-uc-focus-focused',
  5: 'text-uc-zone-comfort',
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

/** Label + five read-only dots. */
function DotsRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="min-w-0 flex-1 text-[13px] font-semibold text-uc-text-muted">{label}</span>
      <span className="flex shrink-0 gap-1" aria-label={`${value}/5`}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <span
            key={rating}
            aria-hidden
            className={`size-2.5 rounded-full ${rating <= value ? 'bg-uc-primary' : 'border border-uc-text-muted'}`}
          />
        ))}
      </span>
    </div>
  )
}

const iconButton =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-uc-text-muted hover:text-uc-text hover:bg-uc-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

export default function WorkoutCard({ workout, onEdit, onDelete, isDeleting = false }: WorkoutCardProps) {
  const { t, tPlural } = useLanguage()
  // List endpoints return tags as workoutTags join rows
  const tags = workout.tags ?? workout.workoutTags?.map(wt => wt.tag) ?? []
  const details = workout.details as any
  const isMental = workout.type === 'MENTAL_PRACTICE'
  const exercisesCount = workout.type === 'GYM' ? workout.workoutExercises?.length ?? 0 : 0
  const isLead = workout.type === 'LEAD_ROCK' || workout.type === 'LEAD_ARTIFICIAL'
  const mentalState = workout.mentalState
  const hasMentalState = !!mentalState && (!!mentalState.beforeClimbing || (mentalState.climbSections?.length ?? 0) > 0)
  const timeLabel = (time: string) =>
    time === 'MORNING'
      ? (t('workouts.timeOfDayOptions.MORNING') || 'Morning')
      : time === 'MIDDAY'
      ? (t('workouts.timeOfDayOptions.MIDDAY') || 'Midday')
      : (t('workouts.timeOfDayOptions.EVENING') || 'Evening')
  const timeIcon = (time: string): IconName => (time === 'MORNING' ? 'morning' : time === 'MIDDAY' ? 'midday' : 'evening')

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <WorkoutIconTile workoutType={workout.type} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-[17px] font-extrabold text-uc-text">{getTrainingTypeLabel(workout.type, t)}</h3>
            {details?.quickLog && (
              <span className="inline-flex items-center gap-1 min-h-6 px-2 rounded-uc-chip bg-uc-primary-container text-uc-on-primary-container text-xs font-bold">
                <Icon name="quick-log" size={14} />
                {t('quickLog.quickLogBadge') || 'Quick'}
              </span>
            )}
          </div>
          <p className="text-[13px] font-medium text-uc-text-muted uc-num">{formatDate(workout.startTime)}</p>
        </div>
        <div className="-mr-2 -mt-1 flex shrink-0">
          {onEdit && (
            <button type="button" onClick={() => onEdit(workout.id)} className={iconButton} title={t('workouts.editWorkout')} aria-label={t('workouts.editWorkout')}>
              <Icon name="edit" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(workout.id)}
              disabled={isDeleting}
              className={iconButton}
              title={isDeleting ? t('workouts.deleting') : t('workouts.deleteWorkout')}
              aria-label={isDeleting ? t('workouts.deleting') : t('workouts.deleteWorkout')}
            >
              {isDeleting ? <Spinner className="size-4 text-uc-error" /> : <Icon name="delete" />}
            </button>
          )}
        </div>
      </div>

      {(workout.trainingVolume || exercisesCount > 0 || details?.routineVariation || details?.routeName || details?.wallAngle || details?.climbStyle || workout.sector || (isMental && (workout.mentalPracticeType || (workout.timeOfDay?.length ?? 0) > 0)) || tags.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {workout.trainingVolume && (
            <Chip title={t('workouts.trainingVolume')} className="uc-num">{workout.trainingVolume}</Chip>
          )}
          {exercisesCount > 0 && (
            <Chip className="uc-num">{tPlural('workouts.exercisesCount', exercisesCount)}</Chip>
          )}
          {workout.type === 'GYM' && details?.routineVariation && (
            <Chip title={t('workouts.labels.variation')}>
              <Icon name="library" size={16} />
              {details.routineVariation.routineName} – {details.routineVariation.variationName}
            </Chip>
          )}
          {details?.routeName && (
            <Chip title={t('workouts.routeName')}>{details.routeName}</Chip>
          )}
          {workout.sector && (
            <Chip>{t('workouts.sector')}: {workout.sector}</Chip>
          )}
          {details?.wallAngle && (
            <Chip title={t('workouts.wallAngle')}>{t(`workouts.wallAngles.${details.wallAngle}`)}</Chip>
          )}
          {details?.climbStyle && (
            <Chip title={t('workouts.climbStyle')}>{t(`workouts.climbStyles.${details.climbStyle}`)}</Chip>
          )}
          {isMental && workout.mentalPracticeType && (
            <Chip title={t('common.practiceType') || 'Practice type:'}>
              <Icon name="type-mental" size={16} />
              {t(`workouts.mentalPracticeTypes.${workout.mentalPracticeType.toLowerCase()}`)}
            </Chip>
          )}
          {isMental && workout.timeOfDay?.map((time, index) => (
            <Chip key={index} title={t('common.timeOfDay') || 'Time of day:'}>
              <Icon name={timeIcon(time)} size={16} />
              {timeLabel(time)}
            </Chip>
          ))}
          {tags.map((tag) => (
            <Chip key={tag.id} color={tag.color}>{tag.name}</Chip>
          ))}
        </div>
      )}

      {((!isMental && (workout.preSessionFeel || workout.dayAfterTiredness)) || (isMental && workout.focusLevel)) && (
        <div className="space-y-1.5">
          {!isMental && workout.preSessionFeel && <DotsRow label="Pre-session feel" value={workout.preSessionFeel} />}
          {isMental && workout.focusLevel && (
            <DotsRow label={(t('common.focusLevel') || 'Focus level:').replace(/:$/, '')} value={workout.focusLevel} />
          )}
          {!isMental && workout.dayAfterTiredness && (
            <DotsRow label={(t('common.dayAfterTiredness') || 'Day after tiredness:').replace(/:$/, '')} value={workout.dayAfterTiredness} />
          )}
        </div>
      )}

      {workout.notes && <p className="text-sm text-uc-text whitespace-pre-line">{workout.notes}</p>}

      {(hasMentalState || workout.gratitude || workout.improvements) && (
        <div className="space-y-1 rounded-xl bg-uc-elevated px-3 py-2.5 text-[13px]">
          {hasMentalState && mentalState && (
            <>
              <p className="flex items-center gap-1.5 font-bold text-uc-primary">
                <Icon name="strong-mind" size={16} />
                {t('workouts.strongMind')}
              </p>
              {mentalState.beforeClimbing && (
                <p className="font-semibold text-uc-text">
                  {t('workouts.before')}:{' '}
                  <span className={`font-bold ${beforeText[mentalState.beforeClimbing] ?? ''}`}>
                    {t(`workouts.beforeClimbingLabels.${mentalState.beforeClimbing}`)}
                  </span>
                </p>
              )}
              {isLead && mentalState.climbSections && mentalState.climbSections.length > 0 && (
                <>
                  <p className="sr-only">{t('workouts.climbs')}</p>
                  {mentalState.climbSections.map((section, index) => (
                    <p key={section.id} className="font-semibold text-uc-text">
                      {section.name || t('workouts.climbNumber', { number: index + 1 })}:{' '}
                      {[
                        section.focusState && (
                          <span key="focus" className={`font-bold ${focusText[section.focusState] ?? ''}`}>
                            {t(`workouts.focusStates.${section.focusState}`)}
                          </span>
                        ),
                        section.comfortZone && (
                          <span key="zone" className={zoneText[section.comfortZone] ?? ''}>
                            {t(`workouts.comfortZones.${section.comfortZone}`)}
                          </span>
                        ),
                        section.tookFall !== undefined && (
                          <span key="fall">{section.tookFall ? t('workouts.fell') : t('workouts.noFall')}</span>
                        ),
                      ]
                        .filter(Boolean)
                        .map((part, i) => (
                          <span key={i}>
                            {i > 0 && <span className="text-uc-text-muted"> · </span>}
                            {part}
                          </span>
                        ))}
                    </p>
                  ))}
                </>
              )}
              {mentalState.reflections && (
                <p className="italic text-uc-text-muted">&ldquo;{mentalState.reflections}&rdquo;</p>
              )}
            </>
          )}
          {workout.gratitude && (
            <p className="flex gap-1.5 text-uc-text-muted">
              <Icon name="gratitude" size={16} className="mt-0.5" />
              <span>
              <span className="font-bold text-uc-text">Gratitude:</span> {workout.gratitude}
              </span>
            </p>
          )}
          {workout.improvements && (
            <p className="flex gap-1.5 text-uc-text-muted">
              <Icon name="improve" size={16} className="mt-0.5" />
              <span>
              <span className="font-bold text-uc-text">Improvements:</span> {workout.improvements}
              </span>
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
