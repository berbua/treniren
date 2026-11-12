import { ReactNode } from 'react'

interface CollapsibleCardProps {
  open: boolean
  onToggle: () => void
  title: ReactNode
  /** 24px icon slot; keeps the current emoji until the custom SVGs arrive. */
  icon?: ReactNode
  /** Small muted line under the title. */
  description?: ReactNode
  /** Right-aligned summary shown in the header, e.g. "Follicular · day 9" or "1 linked". */
  summary?: ReactNode
  /** Background/border override, e.g. a phase band colour. Defaults to the surface card. */
  className?: string
  children: ReactNode
}

/** Card with a full-width header button that shows or hides its body (form sections). */
export function CollapsibleCard({ open, onToggle, title, icon, description, summary, className, children }: CollapsibleCardProps) {
  return (
    <div className={`rounded-uc-card border ${className ?? 'bg-uc-surface border-uc-border'}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full min-h-14 flex items-center gap-3 px-4 py-3 text-left"
      >
        {icon && (
          <span aria-hidden className="inline-flex size-6 shrink-0 items-center justify-center text-lg leading-none">
            {icon}
          </span>
        )}
        <span className="flex-1 min-w-0">
          <span className="block text-base font-bold text-uc-text">{title}</span>
          {description && <span className="block text-[13px] font-medium text-uc-text-muted">{description}</span>}
        </span>
        {summary && <span className="shrink-0 text-[13px] font-semibold text-uc-text-muted uc-num">{summary}</span>}
        <svg
          aria-hidden
          className={`size-5 shrink-0 text-uc-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}
