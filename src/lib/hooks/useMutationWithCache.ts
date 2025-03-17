import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { EVENT_TYPES } from '../constants';
import { useToast } from './useToast';

interface MutationConfig<T> {
  table: string;
  invalidateQueries?: string[];
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: any) => void;
}

interface EntityChanges {
  field: string;
  oldValue: any;
  newValue: any;
}

async function createAuditLog(
  eventType: keyof typeof EVENT_TYPES,
  entityId: string | number,
  changes?: Record<string, any>,
  table?: string
) {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    const userId = user.data.user.id;
    let description = '';
    let entityChanges: EntityChanges[] = [];

    if (eventType === EVENT_TYPES.UPDATE && changes) {
      // Get the current entity data
      const { data: currentData } = await supabase
        .from(table!)
        .select('*')
        .eq('id', entityId)
        .single();

      // Compare each changed field
      for (const [field, newValue] of Object.entries(changes)) {
        const oldValue = currentData?.[field];
        if (oldValue !== newValue) {
          entityChanges.push({
            field,
            oldValue,
            newValue
          });
        }
      }

      description = `Updated ${table} ${entityId}`;
    } else if (eventType === EVENT_TYPES.INSERT) {
      // Get the entity name for a more descriptive message
      const { data: entityData } = await supabase
        .from(table!)
        .select('name, first_name, last_name, email')
        .eq('id', entityId)
        .single();
      
      const entityName = entityData?.name || 
        (entityData?.first_name || entityData?.last_name ? 
          `${entityData?.first_name || ''} ${entityData?.last_name || ''}`.trim() : 
          entityData?.email || entityId);
      description = `Created ${entityName}`;
    } else if (eventType === EVENT_TYPES.DELETE) {
      description = `Deleted ${table} ${entityId}`;
    }

    await supabase
      .from('audit_logs')
      .insert([{
        event_type: eventType,
        description,
        entity_type: table,
        entity_id: String(entityId),
        user_id: userId,
        changes: entityChanges.length > 0 ? entityChanges : undefined
      }]);
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

export function useMutationWithCache<T>({
  table,
  invalidateQueries = [],
  successMessage,
  errorMessage,
  onSuccess
}: MutationConfig<T>) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const invalidateQueriesInCache = async () => {
    await Promise.all(
      invalidateQueries.map(query => 
        queryClient.invalidateQueries({ queryKey: [query] })
      )
    );
  };

  const create = useMutation({
    mutationFn: async ({ data }: { data: Partial<T> }) => {
      const { data: result, error } = await supabase
        .from(table)
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: async (result) => {
      await createAuditLog(EVENT_TYPES.INSERT, result.id, undefined, table);
      await invalidateQueriesInCache();
      if (successMessage) {
        success(successMessage);
      }
      onSuccess?.(result);
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      if (errorMessage) showError(errorMessage);
    }
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<T> }) => {
      // Get the current data before updating
      const { data: currentData, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;

      // Perform the update
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Return both the result and original data for audit logging
      return { result, originalData: currentData };
    },
    onSuccess: async (data, variables) => {
      // Extract changes by comparing original values with the update values
      const changes: EntityChanges[] = [];
      for (const [field, newValue] of Object.entries(variables.data)) {
        if (['updated_at', 'created_at'].includes(field)) continue;
        
        const oldValue = data.originalData[field];
        if (oldValue !== newValue) {
          changes.push({
            field,
            oldValue,
            newValue
          });
        }
      }
      
      // Create audit log with detailed changes
      await supabase
        .from('audit_logs')
        .insert([{
          event_type: EVENT_TYPES.UPDATE,
          description: `Updated ${table} ${variables.id}`,
          entity_type: table,
          entity_id: String(variables.id),
          user_id: (await supabase.auth.getUser()).data.user?.id,
          changes: changes.length > 0 ? changes : undefined
        }]);
        
      await invalidateQueriesInCache();
      if (successMessage) {
        success(successMessage);
      }
      onSuccess?.(data.result);
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      if (errorMessage) showError(errorMessage);
    }
  });

  const remove = useMutation({
    mutationFn: async (id: string | number) => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: async (id) => {
      await createAuditLog(EVENT_TYPES.DELETE, id, undefined, table);
      await invalidateQueriesInCache();
      if (successMessage) {
        success(successMessage);
      }
      onSuccess?.(id);
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      if (errorMessage) showError(errorMessage);
    }
  });

  return {
    create: create.mutateAsync,
    update: update.mutateAsync,
    remove: remove.mutateAsync
  };
}