import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `elevated` for sheets, menus and dialogs; `surface` for cards and lists. */
  tone?: 'surface' | 'elevated'
  padded?: boolean
}

export function Card({ tone = 'surface', padded = true, className = '', ...props }: CardProps) {
  const toneClass = tone === 'elevated' ? 'bg-uc-elevated shadow-uc' : 'bg-uc-surface'
  return (
    <div
      className={`${toneClass} border border-uc-border rounded-uc-card ${padded ? 'p-4' : ''} ${className}`}
      {...props}
    />
  )
}

const overline = 'text-[11px] leading-[14px] font-bold uppercase tracking-[0.08em] text-uc-text-muted'

/** Overline label: 11px, 700, uppercase, muted. `as="label"` for a form field label. */
export function Overline({
  as: Tag = 'p',
  className = '',
  ...props
}: HTMLAttributes<HTMLElement> & { as?: 'p' | 'label'; htmlFor?: string }) {
  return <Tag className={`${overline} ${className}`} {...props} />
}
