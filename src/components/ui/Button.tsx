import { ButtonHTMLAttributes, forwardRef } from 'react'

export type ButtonVariant = 'accent' | 'primary' | 'tonal' | 'ghost' | 'destructive'
export type ButtonSize = 'md' | 'lg' | 'icon'

const base =
  'inline-flex items-center justify-center gap-2 font-bold transition-colors select-none ' +
  'disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-uc-primary'

const variants: Record<ButtonVariant, string> = {
  // Main CTA — one per screen
  accent: 'bg-uc-accent text-uc-on-accent hover:brightness-105',
  primary: 'bg-uc-primary text-uc-on-primary hover:brightness-110',
  tonal: 'bg-uc-primary-container text-uc-on-primary-container hover:brightness-110',
  ghost: 'bg-transparent text-uc-text border border-uc-border hover:bg-uc-elevated',
  destructive: 'bg-uc-error text-uc-chip-ink hover:brightness-110',
}

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-sm rounded-uc-input',
  lg: 'min-h-14 px-6 text-base rounded-uc-card',
  icon: 'size-11 shrink-0 rounded-uc-input',
}

/** Classes for a button-looking element (e.g. a next/link). */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', isLoading = false, className = '', disabled, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  )
})

export function Spinner({ className = 'size-4' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  )
}
