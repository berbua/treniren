import { ButtonHTMLAttributes, ReactNode } from 'react'

export type WorkoutTypeKey =
  | 'GYM'
  | 'BOULDERING'
  | 'CIRCUITS'
  | 'LEAD_ROCK'
  | 'LEAD_ARTIFICIAL'
  | 'MENTAL_PRACTICE'
  | 'FINGERBOARD'

// Full class strings so Tailwind can see them.
export const workoutBg: Record<WorkoutTypeKey, string> = {
  GYM: 'bg-uc-workout-gym',
  BOULDERING: 'bg-uc-workout-bouldering',
  CIRCUITS: 'bg-uc-workout-circuits',
  LEAD_ROCK: 'bg-uc-workout-lead-rock',
  LEAD_ARTIFICIAL: 'bg-uc-workout-lead-wall',
  MENTAL_PRACTICE: 'bg-uc-workout-mental',
  FINGERBOARD: 'bg-uc-workout-fingerboard',
}

export const workoutText: Record<WorkoutTypeKey, string> = {
  GYM: 'text-uc-workout-gym',
  BOULDERING: 'text-uc-workout-bouldering',
  CIRCUITS: 'text-uc-workout-circuits',
  LEAD_ROCK: 'text-uc-workout-lead-rock',
  LEAD_ARTIFICIAL: 'text-uc-workout-lead-wall',
  MENTAL_PRACTICE: 'text-uc-workout-mental',
  FINGERBOARD: 'text-uc-workout-fingerboard',
}

interface WorkoutTypeChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  workoutType: WorkoutTypeKey
  selected?: boolean
  /** 24px icon slot; keeps the current emoji until the custom SVGs arrive. */
  icon?: ReactNode
}

export function WorkoutTypeChip({
  workoutType,
  selected = false,
  icon,
  className = '',
  type = 'button',
  children,
  ...props
}: WorkoutTypeChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={`inline-flex items-center gap-2 min-h-11 px-3.5 rounded-[14px] border text-sm font-bold transition-colors disabled:opacity-50 ${
        selected
          ? `${workoutBg[workoutType]} border-transparent text-uc-chip-ink`
          : 'bg-uc-elevated border-uc-border text-uc-text hover:border-uc-text-muted'
      } ${className}`}
      {...props}
    >
      {icon && (
        <span aria-hidden className={`inline-flex size-6 items-center justify-center ${selected ? '' : workoutText[workoutType]}`}>
          {icon}
        </span>
      )}
      {children}
    </button>
  )
}

/** 44px rounded tile in the workout colour with the icon in chip ink (session rows, lists). */
export function WorkoutIconTile({ workoutType, icon, className = '' }: { workoutType: WorkoutTypeKey; icon?: ReactNode; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-uc-chip-ink ${workoutBg[workoutType]} ${className}`}
    >
      {icon}
    </span>
  )
}
