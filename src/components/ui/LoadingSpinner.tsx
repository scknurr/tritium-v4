import React from 'react';
import { Spinner } from 'flowbite-react';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

export function LoadingSpinner({ fullScreen = false }: LoadingSpinnerProps) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center min-h-[200px]';

  return (
    <div className={containerClasses}>
      <Spinner size="xl" />
    </div>
  );
}