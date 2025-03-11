import { useState, useCallback } from 'react';
import { Modal, Button } from 'flowbite-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'failure' | 'success' | 'warning';
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setOptions(options);
    setIsOpen(true);
    return new Promise<boolean>(resolve => {
      setResolve(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolve?.(true);
    setIsOpen(false);
  }, [resolve]);

  const handleCancel = useCallback(() => {
    resolve?.(false);
    setIsOpen(false);
  }, [resolve]);

  const ConfirmDialog = () => {
    if (!options) return null;

    return (
      <Modal show={isOpen} onClose={handleCancel}>
        <Modal.Header>{options.title || 'Confirm'}</Modal.Header>
        <Modal.Body>
          <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
            {options.message}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color={options.confirmColor || 'failure'}
            onClick={handleConfirm}
          >
            {options.confirmText || 'Yes'}
          </Button>
          <Button
            color="gray"
            onClick={handleCancel}
          >
            {options.cancelText || 'Cancel'}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return {
    confirm,
    ConfirmDialog
  };
}