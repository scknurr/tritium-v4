import React, { Component, ErrorInfo } from 'react';
import { Alert } from 'flowbite-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Alert color="failure">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm font-medium text-red-800 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
            >
              Try reloading the page
            </button>
          </Alert>
        )
      );
    }

    return this.props.children;
  }
}