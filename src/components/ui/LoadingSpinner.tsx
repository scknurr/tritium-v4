import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  /**
   * The size of the spinner
   * - 'sm': Small (h-4 w-4)
   * - 'md': Medium (h-6 w-6)
   * - 'lg': Large (h-8 w-8)
   * - 'xl': Extra Large (h-12 w-12)
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Whether to center the spinner with flex
   */
  centered?: boolean;
  
  /**
   * Optional text to display below the spinner
   */
  text?: string;
  
  /**
   * Optional CSS class to apply to the spinner
   */
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  centered = false,
  text,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const containerClasses = centered 
    ? 'flex flex-col items-center justify-center py-6'
    : '';

  return (
    <div className={containerClasses}>
      <Loader2 
        className={`animate-spin text-primary ${sizeClasses[size]} ${className}`} 
      />
      {text && (
        <span className="mt-2 text-sm text-gray-500">{text}</span>
      )}
    </div>
  );
};

/**
 * A centered loading spinner with "Loading..." text - useful for full page or section loading states
 */
export const FullPageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <LoadingSpinner size="lg" centered text="Loading..." />
  </div>
);

export default LoadingSpinner;