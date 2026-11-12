/** Placeholder block; give it the size and radius of the content it replaces. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`bg-uc-skeleton animate-pulse rounded-uc-chip ${className}`} />
}

/** List placeholder: icon tile + two text lines per row. */
export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  )
}
