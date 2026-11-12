import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** Usually one accent Button. */
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center text-center px-4 py-8 ${className}`}>
      {icon && (
        <div aria-hidden className="mb-4 flex size-16 items-center justify-center rounded-uc-card bg-uc-primary-container text-uc-on-primary-container text-2xl">
          {icon}
        </div>
      )}
      <h3 className="text-[17px] font-extrabold text-uc-text">{title}</h3>
      {description && <p className="mt-1.5 max-w-xs text-sm text-uc-text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
