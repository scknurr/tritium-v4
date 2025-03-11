import React from 'react';
import { Modal, Button } from 'flowbite-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  entityName: string;
  entityType: string;
  relatedDataDescription?: string;
}

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  entityName,
  entityType,
  relatedDataDescription = 'related data',
}: DeleteModalProps) {
  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>Delete {entityType}</Modal.Header>
      <Modal.Body>
        <div className="space-y-6">
          <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
            Are you sure you want to delete {entityName}? This action cannot be undone.
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            All {relatedDataDescription} will also be deleted.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          color="failure"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Yes, delete'}
        </Button>
        <Button
          color="gray"
          onClick={onClose}
          disabled={isDeleting}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}