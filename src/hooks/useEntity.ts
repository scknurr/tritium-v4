import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { createEntityDeletionAuditLogs } from '../lib/audit';

interface UseEntityOptions {
  entityType: 'profiles' | 'customers' | 'skills';
  entityId: string | number;
  onUpdate?: () => Promise<void>;
}

export function useEntity({ entityType, entityId, onUpdate }: UseEntityOptions) {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdate = async (data: any) => {
    try {
      const { error } = await supabase
        .from(entityType)
        .update(data)
        .eq('id', entityId);
      
      if (error) throw error;
      
      await onUpdate?.();
      setIsFormOpen(false);
    } catch (error) {
      console.error(`Error updating ${entityType}:`, error);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      await createEntityDeletionAuditLogs(entityType, entityId, user.id);

      const { error } = await supabase
        .from(entityType)
        .delete()
        .eq('id', entityId);
      
      if (error) throw error;
      
      navigate(`/${entityType}`);
    } catch (error) {
      console.error(`Error deleting ${entityType}:`, error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return {
    isFormOpen,
    setIsFormOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    handleUpdate,
    handleDelete,
  };
}