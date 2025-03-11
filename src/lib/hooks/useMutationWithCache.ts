import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createData, updateData, deleteData, type ApiError } from '../api';
import { useToast } from './useToast';
import { supabase } from '../supabase';
import { EVENT_TYPES } from '../constants';

interface MutationConfig<T> {
  table: string;
  invalidateQueries?: string[];
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: T) => void;
}

export function useMutationWithCache<T>({
  table,
  invalidateQueries = [],
  successMessage,
  errorMessage,
  onSuccess,
}: MutationConfig<T>) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const createAuditLog = async (
    eventType: keyof typeof EVENT_TYPES,
    entityId: string | number,
    changes?: { field: string; oldValue: any; newValue: any }[]
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the user's name
      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      const userName = userData?.full_name || userData?.email || user.id;

      // Get the entity name
      let entityName = '';
      switch (table) {
        case 'profiles': {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', entityId)
            .single();
          entityName = data?.full_name || data?.email || String(entityId);
          break;
        }
        case 'customers': {
          const { data } = await supabase
            .from('customers')
            .select('name')
            .eq('id', entityId)
            .single();
          entityName = data?.name || String(entityId);
          break;
        }
        case 'skills': {
          const { data } = await supabase
            .from('skills')
            .select('name')
            .eq('id', entityId)
            .single();
          entityName = data?.name || String(entityId);
          break;
        }
      }

      // Create description based on event type and changes
      let description = '';
      switch (eventType) {
        case EVENT_TYPES.INSERT:
          description = `${userName} created ${entityName}`;
          break;
        case EVENT_TYPES.UPDATE:
          if (changes && changes.length > 0) {
            const changeDescriptions = changes.map(({ field, oldValue, newValue }) => 
              `${field}: ${oldValue} → ${newValue}`
            );
            description = `${userName} updated ${entityName} (${changeDescriptions.join(', ')})`;
          } else {
            description = `${userName} updated ${entityName}`;
          }
          break;
        case EVENT_TYPES.DELETE:
          description = `${userName} deleted ${entityName}`;
          break;
      }

      await supabase
        .from('audit_logs')
        .insert([{
          event_type: eventType,
          description,
          entity_type: table,
          entity_id: String(entityId),
          user_id: user.id
        }]);
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  };

  const createMutation = useMutation<T, ApiError, Partial<T>>({
    mutationFn: async (data) => {
      const result = await createData<T>(table, data);
      await createAuditLog(EVENT_TYPES.INSERT, result.id);
      return result;
    },
    onSuccess: (data) => {
      invalidateQueries.forEach(query => {
        queryClient.invalidateQueries({ queryKey: [query] });
      });
      if (successMessage) {
        success(successMessage);
      }
      onSuccess?.(data);
    },
    onError: (err) => {
      showError(errorMessage || err.message);
    },
  });

  const updateMutation = useMutation<T, ApiError, { id: string | number; data: Partial<T> }>({
    mutationFn: async ({ id, data }) => {
      // Get current data for comparison
      const { data: currentData } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      // Perform the update
      const result = await updateData<T>(table, id, data);

      // Create audit log with changes
      const changes = Object.entries(data)
        .filter(([key, value]) => {
          if (['updated_at', 'created_at'].includes(key)) return false;
          return currentData[key] !== value;
        })
        .map(([key, value]) => ({
          field: key,
          oldValue: currentData[key],
          newValue: value
        }));

      await createAuditLog(EVENT_TYPES.UPDATE, id, changes);
      return result;
    },
    onSuccess: (data) => {
      invalidateQueries.forEach(query => {
        queryClient.invalidateQueries({ queryKey: [query] });
      });
      if (successMessage) {
        success(successMessage);
      }
      onSuccess?.(data);
    },
    onError: (err) => {
      showError(errorMessage || err.message);
    },
  });

  const deleteMutation = useMutation<void, ApiError, string | number>({
    mutationFn: async (id) => {
      await createAuditLog(EVENT_TYPES.DELETE, id);
      return deleteData(table, id);
    },
    onSuccess: () => {
      invalidateQueries.forEach(query => {
        queryClient.invalidateQueries({ queryKey: [query] });
      });
      if (successMessage) {
        success(successMessage);
      }
    },
    onError: (err) => {
      showError(errorMessage || err.message);
    },
  });

  return {
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isLoading: createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading,
  };
}