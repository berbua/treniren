import { ReactNode } from 'react'
import { Card, Overline } from './Card'

interface StatTileProps {
  label: ReactNode
  value: ReactNode
  unit?: ReactNode
  /** Line under the value (trend, "Since 6 Nov"). */
  footer?: ReactNode
  /** 0–100; shows an 8px progress bar under the value. */
  progress?: number
  icon?: ReactNode
  className?: string
}

export function StatTile({ label, value, unit, footer, progress, icon, className = '' }: StatTileProps) {
  return (
    <Card className={`flex flex-col gap-2 ${className}`}>
      <Overline className="flex items-center gap-1.5">
        {icon && <span aria-hidden className="text-uc-accent-text">{icon}</span>}
        {label}
      </Overline>
      <p className="flex items-baseline gap-1.5">
        <span className="text-[34px] leading-[38px] font-extrabold tracking-[-0.02em] uc-num">{value}</span>
        {unit && <span className="text-[13px] font-semibold text-uc-text-muted">{unit}</span>}
      </p>
      {progress !== undefined && (
        <div className="h-2 rounded-uc-pill bg-uc-skeleton overflow-hidden">
          <div className="h-full rounded-uc-pill bg-uc-primary" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}
      {footer && <div className="text-[13px] font-semibold text-uc-text-muted">{footer}</div>}
    </Card>
  )
}
