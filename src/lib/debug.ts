/**
 * Debug utilities for structured console logging
 * These make it easier to identify and categorize logs in the browser console
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  component?: string;
  context?: Record<string, any>;
  timestamp?: boolean;
}

const DEFAULT_OPTIONS: LogOptions = {
  component: 'app',
  timestamp: true
};

/**
 * Creates a formatted log message with consistent styling and structure
 */
export function createLogger(baseComponent: string) {
  return {
    info: (message: string, options?: LogOptions) => logMessage('info', message, { ...DEFAULT_OPTIONS, component: baseComponent, ...options }),
    warn: (message: string, options?: LogOptions) => logMessage('warn', message, { ...DEFAULT_OPTIONS, component: baseComponent, ...options }),
    error: (message: string, error?: any, options?: LogOptions) => logMessage('error', message, { ...DEFAULT_OPTIONS, component: baseComponent, context: { ...options?.context, error }, ...options }),
    debug: (message: string, context?: any, options?: LogOptions) => logMessage('debug', message, { ...DEFAULT_OPTIONS, component: baseComponent, context: { ...options?.context, ...context }, ...options }),
    
    // Special logger for audit data
    auditData: (field: string, oldValue: any, newValue: any) => {
      console.group(`🔍 %cAUDIT DATA: ${field}`, 'background: #FFF3CD; color: #856404; padding: 2px 5px; border-radius: 3px;');
      console.log('Field:', field);
      console.log('Old Value:', oldValue, `(type: ${typeof oldValue})`);
      console.log('New Value:', newValue, `(type: ${typeof newValue})`);
      console.log('Equal?:', oldValue === newValue);
      console.log('JSON Compare:', JSON.stringify(oldValue) === JSON.stringify(newValue));
      console.groupEnd();
    }
  };
}

/**
 * Core logging function with consistent formatting
 */
function logMessage(level: LogLevel, message: string, options: LogOptions) {
  const { component, context, timestamp } = options;
  
  const styles: Record<LogLevel, string> = {
    info: 'background: #D1ECF1; color: #0C5460; padding: 2px 5px; border-radius: 3px;',
    warn: 'background: #FFF3CD; color: #856404; padding: 2px 5px; border-radius: 3px;',
    error: 'background: #F8D7DA; color: #721C24; padding: 2px 5px; border-radius: 3px;',
    debug: 'background: #E2E3E5; color: #383D41; padding: 2px 5px; border-radius: 3px;'
  };

  const icons: Record<LogLevel, string> = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '🔥',
    debug: '🔧'
  };

  const timestampStr = timestamp ? `[${new Date().toISOString()}]` : '';
  const componentStr = component ? `[${component}]` : '';
  const prefixStr = `${icons[level]} %c${timestampStr}${componentStr}`;

  if (context) {
    console.groupCollapsed(`${prefixStr} ${message}`, styles[level]);
    Object.entries(context).forEach(([key, value]) => {
      console.log(`%c${key}:`, 'font-weight: bold', value);
    });
    console.groupEnd();
  } else {
    console[level](`${prefixStr} ${message}`, styles[level]);
  }
}

// Create a root logger
export const logger = createLogger('app');

// Add to window for easy debugging
if (typeof window !== 'undefined') {
  (window as any).tritiumLogger = {
    createLogger,
    logger
  };
} 