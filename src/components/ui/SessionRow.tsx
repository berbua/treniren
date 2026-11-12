import { ReactNode } from 'react'
import { WorkoutIconTile, WorkoutTypeKey } from './WorkoutTypeChip'

interface SessionRowProps {
  workoutType: WorkoutTypeKey
  icon?: ReactNode
  title: ReactNode
  meta?: ReactNode
  /** Right side, e.g. a TR badge. */
  trailing?: ReactNode
  onClick?: () => void
  className?: string
}

export function SessionRow({ workoutType, icon, title, meta, trailing, onClick, className = '' }: SessionRowProps) {
  const content = (
    <>
      <WorkoutIconTile workoutType={workoutType} icon={icon} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-extrabold text-uc-text truncate">{title}</p>
        {meta && <p className="text-[13px] font-medium text-uc-text-muted truncate">{meta}</p>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </>
  )
  const classes = `flex w-full items-center gap-3 min-h-16 px-3 py-2.5 bg-uc-surface border border-uc-border rounded-uc-card text-left ${className}`
  return onClick ? (
    <button type="button" onClick={onClick} className={`${classes} hover:bg-uc-elevated transition-colors`}>
      {content}
    </button>
  ) : (
    <div className={classes}>{content}</div>
  )
}

/** TR1–TR5 badge. */
export function TrBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center min-h-7 px-2.5 rounded-uc-chip bg-uc-primary-container text-uc-on-primary-container text-[13px] font-extrabold uc-num">
      {children}
    </span>
  )
}
