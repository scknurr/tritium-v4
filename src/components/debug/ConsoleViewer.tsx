import React, { useEffect, useState } from 'react';
import { consoleCapture, startConsoleCapture } from '../../lib/consoleCapture';

interface ConsoleViewerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function ConsoleViewer({ isOpen = false, onClose }: ConsoleViewerProps) {
  const [logs, setLogs] = useState('');
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [filter, setFilter] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  // Start capturing on mount
  useEffect(() => {
    if (!consoleCapture.isCapturing) {
      startConsoleCapture();
      setIsCapturing(true);
    } else {
      setIsCapturing(true);
    }

    // Set up refresh interval
    const refreshInterval = setInterval(() => {
      setRefreshCount(prev => prev + 1);
    }, 2000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // Update logs when refreshCount changes
  useEffect(() => {
    if (isVisible && !isMinimized) {
      updateLogs();
    }
  }, [refreshCount, isVisible, isMinimized, filter]);

  // Update state based on props
  useEffect(() => {
    setIsVisible(isOpen);
  }, [isOpen]);

  const updateLogs = () => {
    if (filter) {
      const filteredLogs = consoleCapture.findLogs(filter);
      const logsText = filteredLogs.map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        let content = '';
        
        log.args.forEach((arg, i) => {
          if (typeof arg === 'object') {
            try {
              content += JSON.stringify(arg, null, 2);
            } catch (e) {
              content += '[Complex Object]';
            }
          } else {
            content += String(arg);
          }
          
          if (i < log.args.length - 1) {
            content += ' ';
          }
        });
        
        return `[${time}] [${log.type.toUpperCase()}] ${content}`;
      }).join('\n---\n');
      
      setLogs(logsText || 'No matching logs');
    } else {
      setLogs(consoleCapture.getLogsAsText(100));
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleClear = () => {
    consoleCapture.clearLogs();
    updateLogs();
  };

  const handleShare = () => {
    consoleCapture.shareWithAI();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded shadow-lg z-50"
      >
        Show Console
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-1/2 lg:w-1/3 bg-gray-900 text-white z-50 flex flex-col shadow-lg rounded-t-lg">
      <div className="p-2 bg-gray-800 flex justify-between items-center rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="font-bold">Console Viewer</span>
          <span className={`inline-block w-3 h-3 rounded-full ${isCapturing ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleMinimize}
            className="p-1 text-xs bg-gray-700 rounded"
          >
            {isMinimized ? 'Expand' : 'Minimize'}
          </button>
          <button 
            onClick={handleClear}
            className="p-1 text-xs bg-gray-700 rounded"
          >
            Clear
          </button>
          <button 
            onClick={handleShare}
            className="p-1 text-xs bg-blue-600 rounded"
          >
            Copy for AI
          </button>
          <button 
            onClick={handleClose}
            className="p-1 text-xs bg-red-600 rounded"
          >
            Close
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <>
          <div className="p-2 bg-gray-800">
            <input
              type="text"
              placeholder="Filter logs..."
              value={filter}
              onChange={handleFilterChange}
              className="w-full p-1 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          <div className="overflow-auto h-64 p-2 font-mono text-sm whitespace-pre-wrap">
            {logs || 'No logs yet'}
          </div>
        </>
      )}
    </div>
  );
} 