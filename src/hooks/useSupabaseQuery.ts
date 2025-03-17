import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { TableState } from '../types';

type QueryOptions = {
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  filter?: { column: string; value: any };
} | null;

export function useSupabaseQuery<T>(
  table: string,
  options: QueryOptions = null
): TableState<T> {
  const [state, setState] = useState<TableState<T>>({
    data: [],
    loading: Boolean(options),
    error: null,
  });

  // Use refs to store the previous values for comparison
  const prevOptionsRef = useRef<string>();
  const currentOptionsString = JSON.stringify(options);

  const fetchData = async () => {
    if (!options) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      let query = supabase.from(table).select(options.select || '*');

      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? false,
        });
      }

      if (options.filter) {
        const { column, value } = options.filter;
        
        // Handle array of values for IN clause
        if (Array.isArray(value)) {
          query = query.in(column, value);
        } else {
          query = query.eq(column, value);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setState({ data: data || [], loading: false, error: null });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      }));
    }
  };

  useEffect(() => {
    // Only fetch if the options have actually changed
    if (prevOptionsRef.current !== currentOptionsString) {
      prevOptionsRef.current = currentOptionsString;
      fetchData();
    }
  }, [table, currentOptionsString]);

  return {
    ...state,
    refresh: fetchData,
  };
}