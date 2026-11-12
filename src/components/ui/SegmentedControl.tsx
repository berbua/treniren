import { ReactNode } from 'react'

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
  /** Small second line, e.g. "hard" under "TR4". */
  caption?: ReactNode
  icon?: ReactNode
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[]
  /** One value, or several for multi-select (e.g. time of day). */
  value: T | T[] | null
  onChange: (value: T) => void
  ariaLabel?: string
  className?: string
  /** false lets each segment grow with its label (long PL labels in a 4-tab bar). */
  equalWidth?: boolean
}

export function SegmentedControl<T extends string>({ options, value, onChange, ariaLabel, className = '', equalWidth = true }: SegmentedControlProps<T>) {
  const isSelected = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v)
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex gap-1 p-1 bg-uc-surface border border-uc-border rounded-[14px] ${className}`}
    >
      {options.map((option) => {
        const selected = isSelected(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`${equalWidth ? 'flex-1 px-2' : 'flex-auto px-3'} min-w-0 min-h-11 py-1 rounded-[10px] flex flex-col items-center justify-center transition-colors ${
              selected ? 'bg-uc-primary text-uc-on-primary' : 'text-uc-text hover:bg-uc-elevated'
            }`}
          >
            <span className="flex items-center gap-1.5 text-center text-sm font-extrabold uc-num">
              {option.icon && <span aria-hidden className="inline-flex">{option.icon}</span>}
              {option.label}
            </span>
            {option.caption && (
              <span className={`text-[10px] font-semibold leading-3 ${selected ? '' : 'text-uc-text-muted'}`}>{option.caption}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
