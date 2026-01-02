'use client';

import { Component, ReactNode } from 'react';

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

      return (
        <div className="min-h-screen bg-uc-black flex items-center justify-center p-4">
          <div className="bg-uc-dark-bg rounded-2xl shadow-xl p-8 max-w-md w-full border border-uc-purple/20 text-center">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-2xl font-bold text-uc-text-light mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-uc-text-muted mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-4 py-2 rounded-xl font-medium transition-colors shadow-lg"
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="w-full bg-uc-dark-bg hover:bg-uc-black text-uc-text-light px-4 py-2 rounded-xl font-medium transition-colors border border-uc-purple/20"
              >
                🔙 Try Again
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-uc-text-muted hover:text-uc-text-light">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-red-400 bg-red-900/20 p-2 rounded overflow-auto border border-red-500/20">
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
