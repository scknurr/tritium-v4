import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

export type QueryOptions = {
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  filter?: { column: string; value: any };
} | null;

export type SupabaseError = PostgrestError & {
  message: string;
};

export function useSupabaseQuery<T>(
  key: string[],
  table: string,
  options: QueryOptions = null,
  config: {
    enabled?: boolean;
    onSuccess?: (data: T[]) => void;
    onError?: (error: SupabaseError) => void;
  } = {}
) {
  const fetchData = useCallback(async () => {
    if (!options) {
      return [];
    }

    let query = supabase.from(table).select(options.select || '*');

    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? false,
      });
    }

    if (options.filter) {
      const { column, value } = options.filter;
      
      if (Array.isArray(value)) {
        query = query.in(column, value);
      } else {
        query = query.eq(column, value);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  }, [table, JSON.stringify(options)]);

  return useQuery<T[], SupabaseError>({
    queryKey: key,
    queryFn: fetchData,
    ...config,
  });
}

export function useSupabaseMutation<T>(
  table: string,
  config: {
    onSuccess?: (data: T) => void;
    onError?: (error: SupabaseError) => void;
  } = {}
) {
  const queryClient = useQueryClient();

  return useMutation<T, SupabaseError, Partial<T>>({
    mutationFn: async (data) => {
      const { id, ...rest } = data;
      let query;

      if (id) {
        const { data: result, error } = await supabase
          .from(table)
          .update(rest)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from(table)
          .insert([rest])
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [table] });
      config.onSuccess?.(data);
    },
    onError: (error) => {
      console.error(`Error in ${table} mutation:`, error);
      config.onError?.(error);
    },
  });
}

export function useSupabaseDelete(
  table: string,
  config: {
    onSuccess?: () => void;
    onError?: (error: SupabaseError) => void;
  } = {}
) {
  const queryClient = useQueryClient();

  return useMutation<void, SupabaseError, string | number>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [table] });
      config.onSuccess?.();
    },
    onError: (error) => {
      console.error(`Error deleting from ${table}:`, error);
      config.onError?.(error);
    },
  });
}