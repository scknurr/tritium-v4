/**
 * Console Capture Utility
 * 
 * This utility captures console output and makes it available for sharing with AI assistants.
 * It preserves the original console functionality while adding capture capability.
 */

interface LogEntry {
  type: 'log' | 'warn' | 'error' | 'debug' | 'info';
  timestamp: string;
  args: any[];
}

interface ConsoleCapture {
  logs: LogEntry[];
  originalConsole: typeof console;
  isCapturing: boolean;
  maxEntries: number;
  startCapture: () => void;
  stopCapture: () => void;
  clearLogs: () => void;
  getLogs: (count?: number) => LogEntry[];
  getLogsAsText: (count?: number) => string;
  shareWithAI: () => void;
  findLogs: (search: string) => LogEntry[];
}

// Create global console capture
export const consoleCapture: ConsoleCapture = {
  logs: [],
  originalConsole: { ...console },
  isCapturing: false,
  maxEntries: 1000,
  
  // Start capturing console output
  startCapture() {
    if (this.isCapturing) return;
    
    // Save original methods
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
      info: console.info
    };
    
    // Override console methods
    console.log = (...args: any[]) => {
      this.logs.push({ 
        type: 'log', 
        timestamp: new Date().toISOString(), 
        args 
      });
      if (this.logs.length > this.maxEntries) {
        this.logs.shift();
      }
      this.originalConsole.log(...args);
    };
    
    console.warn = (...args: any[]) => {
      this.logs.push({ 
        type: 'warn', 
        timestamp: new Date().toISOString(), 
        args 
      });
      if (this.logs.length > this.maxEntries) {
        this.logs.shift();
      }
      this.originalConsole.warn(...args);
    };
    
    console.error = (...args: any[]) => {
      this.logs.push({ 
        type: 'error', 
        timestamp: new Date().toISOString(), 
        args 
      });
      if (this.logs.length > this.maxEntries) {
        this.logs.shift();
      }
      this.originalConsole.error(...args);
    };
    
    console.debug = (...args: any[]) => {
      this.logs.push({ 
        type: 'debug', 
        timestamp: new Date().toISOString(), 
        args 
      });
      if (this.logs.length > this.maxEntries) {
        this.logs.shift();
      }
      this.originalConsole.debug(...args);
    };
    
    console.info = (...args: any[]) => {
      this.logs.push({ 
        type: 'info', 
        timestamp: new Date().toISOString(), 
        args 
      });
      if (this.logs.length > this.maxEntries) {
        this.logs.shift();
      }
      this.originalConsole.info(...args);
    };
    
    this.isCapturing = true;
    console.info('[ConsoleCapture] Started capturing console output');
  },
  
  // Stop capturing console output
  stopCapture() {
    if (!this.isCapturing) return;
    
    // Restore original methods
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;
    console.info = this.originalConsole.info;
    
    this.isCapturing = false;
    console.info('[ConsoleCapture] Stopped capturing console output');
  },
  
  // Clear captured logs
  clearLogs() {
    this.logs = [];
    console.info('[ConsoleCapture] Cleared log history');
  },
  
  // Get recent logs
  getLogs(count = 50) {
    return this.logs.slice(-count);
  },
  
  // Get logs formatted as text
  getLogsAsText(count = 50) {
    const logs = this.getLogs(count);
    let result = `=== CONSOLE LOGS (${logs.length} entries) ===\n\n`;
    
    logs.forEach((log, index) => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      result += `[${time}] [${log.type.toUpperCase()}] `;
      
      // Format arguments based on type
      log.args.forEach((arg, i) => {
        if (typeof arg === 'object') {
          try {
            result += JSON.stringify(arg, null, 2);
          } catch (e) {
            result += '[Complex Object]';
          }
        } else {
          result += String(arg);
        }
        
        if (i < log.args.length - 1) {
          result += ' ';
        }
      });
      
      result += '\n';
      
      // Add separator between logs for readability
      if (index < logs.length - 1) {
        result += '---\n';
      }
    });
    
    return result;
  },
  
  // Generate a shareable text for AI assistants
  shareWithAI() {
    const logsText = this.getLogsAsText(100);
    
    // Create a text area element
    const textarea = document.createElement('textarea');
    textarea.value = logsText;
    textarea.style.position = 'fixed';
    textarea.style.left = '0';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    
    // Select and copy the text
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    console.info('[ConsoleCapture] Copied logs to clipboard for sharing');
    
    // Also open in a new window for easy viewing/copying
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Console Logs for AI</title>
            <style>
              body { font-family: monospace; white-space: pre-wrap; padding: 20px; }
              h1 { font-size: 18px; }
              .copy-btn { 
                padding: 8px 16px;
                background: #4285f4;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <h1>Console Logs for AI</h1>
            <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('logs').textContent)">
              Copy All Logs
            </button>
            <div id="logs">${logsText}</div>
            <script>
              // Auto select text for easy copying
              const logsElement = document.getElementById('logs');
              const selection = window.getSelection();
              const range = document.createRange();
              range.selectNodeContents(logsElement);
              selection.removeAllRanges();
              selection.addRange(range);
            </script>
          </body>
        </html>
      `);
    }
    
    return logsText;
  },
  
  // Search logs for specific content
  findLogs(search: string) {
    const searchLower = search.toLowerCase();
    return this.logs.filter(log => {
      // Check each argument for match
      return log.args.some(arg => {
        if (typeof arg === 'string') {
          return arg.toLowerCase().includes(searchLower);
        } else if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg).toLowerCase().includes(searchLower);
          } catch {
            return false;
          }
        }
        return String(arg).toLowerCase().includes(searchLower);
      });
    });
  }
};

// Export utility functions
export function startConsoleCapture() {
  consoleCapture.startCapture();
}

export function stopConsoleCapture() {
  consoleCapture.stopCapture();
}

export function getConsoleLogs(count?: number) {
  return consoleCapture.getLogs(count);
}

export function shareConsoleLogsWithAI() {
  return consoleCapture.shareWithAI();
}

// Add to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).consoleCapture = consoleCapture;
  
  // Add keyboard shortcut for easy sharing (Ctrl+Alt+C or Cmd+Option+C)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'c') {
      consoleCapture.shareWithAI();
    }
  });
} 