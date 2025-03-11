import { useState, useCallback } from 'react';
import { Alert } from 'flowbite-react';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const ToastContainer = () => {
    if (toasts.length === 0) return null;

    return createPortal(
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Alert
            key={toast.id}
            color={toast.type}
            onDismiss={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          >
            {toast.message}
          </Alert>
        ))}
      </div>,
      document.body
    );
  };

  return {
    success: (message: string) => show('success', message),
    error: (message: string) => show('error', message),
    info: (message: string) => show('info', message),
    warning: (message: string) => show('warning', message),
    ToastContainer
  };
}