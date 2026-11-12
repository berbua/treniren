import { ButtonHTMLAttributes, HTMLAttributes } from 'react'

/** Static tonal chip: tags, TR badge, small labels. Pass `color` (a CSS colour/var) for a tag dot. */
export function Chip({ color, className = '', children, ...props }: HTMLAttributes<HTMLSpanElement> & { color?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 min-h-7 px-2.5 rounded-uc-chip bg-uc-primary-container text-uc-on-primary-container text-[13px] font-bold ${className}`}
      {...props}
    >
      {color && <span aria-hidden className="size-2 rounded-full shrink-0" style={{ background: color }} />}
      {children}
    </span>
  )
}

/** Selectable chip (filters, multi-select options). 44px tap target. */
export function ChoiceChip({
  selected = false,
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={`inline-flex items-center justify-center gap-2 min-h-11 px-3.5 rounded-[14px] border text-sm font-bold transition-colors disabled:opacity-50 ${
        selected
          ? 'bg-uc-primary text-uc-on-primary border-uc-primary'
          : 'bg-uc-elevated text-uc-text border-uc-border hover:border-uc-primary'
      } ${className}`}
      {...props}
    />
  )
}
