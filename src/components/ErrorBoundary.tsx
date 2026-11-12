'use client';

import { Component, ReactNode } from 'react';
import { Icon, buttonClasses } from '@/components/ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Sits outside the language provider, so the texts stay English
      return (
        <div className="min-h-screen bg-uc-bg flex items-center justify-center p-4">
          <div className="bg-uc-surface rounded-uc-sheet shadow-uc p-8 max-w-md w-full border border-uc-border text-center">
            <div aria-hidden className="mx-auto mb-5 flex size-16 items-center justify-center rounded-uc-card bg-uc-error-bg text-uc-error"><Icon name="error" size={32} /></div>
            <h2 className="text-[22px] font-extrabold text-uc-text mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-[15px] text-uc-text-muted mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className={buttonClasses('accent', 'lg', 'w-full')}
              >
                <Icon name="cycle" />
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className={buttonClasses('ghost', 'lg', 'w-full')}
              >
                <Icon name="chevron-left" />
                Try Again
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-semibold text-uc-text-muted hover:text-uc-text">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-uc-error bg-uc-error-bg p-2 rounded-uc-input overflow-auto border border-uc-error/30">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
