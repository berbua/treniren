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

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-uc-bg flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};
