import React from 'react';
import { AlertCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorMessageProps {
  /**
   * The error message to display
   */
  message: string;
  
  /**
   * The severity level of the error
   * - 'error': Critical errors (default)
   * - 'warning': Warnings that don't prevent functionality
   * - 'info': Informational messages
   */
  severity?: ErrorSeverity;
  
  /**
   * Optional retry handler
   */
  onRetry?: () => void;
  
  /**
   * Optional dismiss handler
   */
  onDismiss?: () => void;
  
  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * Error message component that displays an error with appropriate styling
 * and optional retry/dismiss actions
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  severity = 'error',
  onRetry,
  onDismiss,
  className = '',
}) => {
  const severityConfig = {
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
    },
    info: {
      icon: AlertCircle,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
    },
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = severityConfig[severity];

  return (
    <div 
      className={`${bgColor} ${borderColor} ${textColor} border rounded-md p-3 mb-4 flex items-start gap-2 ${className}`}
    >
      <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      
      <div className="flex-1">
        <p className="text-sm">{message}</p>
        
        {(onRetry || onDismiss) && (
          <div className="flex gap-3 mt-2">
            {onRetry && (
              <button 
                onClick={onRetry}
                className="inline-flex items-center text-sm font-medium hover:underline"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </button>
            )}
            
            {onDismiss && (
              <button 
                onClick={onDismiss}
                className="text-sm font-medium hover:underline"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage; 