import { forwardRef, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const control =
  'w-full min-h-11 bg-uc-surface text-uc-text placeholder:text-uc-text-muted border border-uc-border rounded-uc-input ' +
  'px-3 text-[15px] font-medium transition-colors focus:outline-none focus:border-uc-primary focus:ring-1 focus:ring-uc-primary ' +
  'disabled:opacity-50 aria-[invalid=true]:border-uc-error aria-[invalid=true]:ring-uc-error'

export function inputClasses(className = '') {
  return `${control} ${className}`
}

export function Label({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`block mb-1.5 text-[13px] font-semibold text-uc-text-muted ${className}`} {...props} />
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null
  return <p className="mt-1.5 text-[13px] font-semibold text-uc-error">{children}</p>
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = '', ...props },
  ref,
) {
  return <input ref={ref} className={inputClasses(className)} {...props} />
})

/** Number input with a muted unit suffix ("kg", "s", "mm"). */
export const UnitInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { unit: string }>(
  function UnitInput({ unit, className = '', ...props }, ref) {
    return (
      <div className={`relative ${className}`}>
        <input ref={ref} type="number" className={inputClasses('pr-12 uc-num')} {...props} />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[13px] font-semibold text-uc-text-muted">
          {unit}
        </span>
      </div>
    )
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = '', children, ...props },
  ref,
) {
  return (
    <div className={`relative ${className}`}>
      <select ref={ref} className={inputClasses('appearance-none pr-10 cursor-pointer')} {...props}>
        {children}
      </select>
      <svg
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-5 text-uc-text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className = '', rows = 3, ...props },
  ref,
) {
  return <textarea ref={ref} rows={rows} className={inputClasses(`py-2.5 resize-y ${className}`)} {...props} />
})
