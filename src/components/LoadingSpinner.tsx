'use client';


interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingSpinner = ({ message, size = 'md', fullScreen = false }: LoadingSpinnerProps) => {

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`animate-spin rounded-full border-2 border-uc-primary border-r-transparent ${sizeClasses[size]}`}></div>
      {message && (
        <p className="text-uc-text-muted text-sm font-semibold">{message}</p>
      )}
    </div>
  );

  // Brand tile + indeterminate bar, as in the app's launch screen
  if (fullScreen) {
    return (
      <div role="status" className="min-h-screen bg-uc-bg flex flex-col items-center justify-center gap-5 px-4">
        <span aria-hidden className="flex size-16 items-center justify-center rounded-uc-card bg-uc-primary-container text-3xl">
          🦄
        </span>
        <span aria-hidden className="block h-1 w-24 overflow-hidden rounded-uc-pill bg-uc-skeleton">
          <span className="block h-full w-2/5 rounded-uc-pill bg-uc-primary animate-uc-indeterminate" />
        </span>
        {message && <p className="text-uc-text-muted text-sm font-semibold text-center">{message}</p>}
      </div>
    );
  }

  return spinner;
};
