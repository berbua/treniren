import { ReactNode } from 'react'
import type { CyclePhase } from '@/lib/cycle-utils'

// Full class strings so Tailwind can see them.
export const phaseSolidBg: Record<CyclePhase, string> = {
  menstrual: 'bg-uc-phase-menstruation',
  follicular: 'bg-uc-phase-follicular',
  ovulation: 'bg-uc-phase-ovulation',
  'early-luteal': 'bg-uc-phase-early-luteal',
  'late-luteal': 'bg-uc-phase-late-luteal',
}

export const phaseBandBg: Record<CyclePhase, string> = {
  menstrual: 'bg-uc-band-menstruation',
  follicular: 'bg-uc-band-follicular',
  ovulation: 'bg-uc-band-ovulation',
  'early-luteal': 'bg-uc-band-early-luteal',
  'late-luteal': 'bg-uc-band-late-luteal',
}

interface PhaseBadgeProps {
  phase: CyclePhase
  children: ReactNode
  /** solid: phase colour + chip ink; soft: band colour + text, dot in phase colour. */
  variant?: 'solid' | 'soft'
  size?: 'md' | 'sm'
  className?: string
}

export function PhaseBadge({ phase, children, variant = 'solid', size = 'md', className = '' }: PhaseBadgeProps) {
  const sizeClass = size === 'md' ? 'min-h-8 px-3 text-[13px] font-extrabold' : 'min-h-6 px-2.5 text-xs font-bold'
  const colorClass = variant === 'solid' ? `${phaseSolidBg[phase]} text-uc-chip-ink` : `${phaseBandBg[phase]} text-uc-text`
  const dotClass = variant === 'solid' ? 'bg-uc-chip-ink opacity-55' : phaseSolidBg[phase]
  return (
    <span className={`inline-flex items-center gap-2 rounded-uc-pill uc-num ${sizeClass} ${colorClass} ${className}`}>
      <span aria-hidden className={`size-2 rounded-full shrink-0 ${dotClass}`} />
      {children}
    </span>
  )
}
