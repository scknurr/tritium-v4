import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Standard table state interface
 */
export interface TableState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Query options for the useSupabaseQuery hook
 */
type QueryOptions = {
  /**
   * Columns to select, including foreign key relationships.
   * For joins, use the format "relatedTable:foreignKeyColumn(columns)".
   * Example: "*, category:category_id(id, name)"
   */
  select?: string;
  /**
   * Column to order by and direction
   */
  orderBy?: { column: string; ascending?: boolean };
  /**
   * Filter criteria. For single value use eq, for array values use in
   */
  filter?: { column: string; value: any };
} | null;

/**
 * Standardized hook for querying Supabase tables
 * 
 * @param table The table name to query
 * @param options Query options including select, orderBy, and filter
 * @returns Table state with data, loading status, error, and refresh function
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const { data, loading, error } = useSupabaseQuery('skills', {
 *   select: '*, category:category_id(id, name)',
 *   filter: { column: 'id', value: id }
 * });
 * 
 * // With ordering
 * const { data, loading, error } = useSupabaseQuery('customers', {
 *   select: '*',
 *   orderBy: { column: 'name', ascending: true }
 * });
 * ```
 */
export function useSupabaseQuery<T>(
  table: string,
  options: QueryOptions = null
): TableState<T> {
  const [state, setState] = useState<TableState<T>>({
    data: [],
    loading: Boolean(options),
    error: null,
    refresh: async () => { /* Empty initial implementation */ }
  });

  // Use refs to store the previous values for comparison
  const prevOptionsRef = useRef<string>();
  const currentOptionsString = JSON.stringify(options);

  /**
   * Executes the query against Supabase with proper error handling
   */
  const fetchData = async (): Promise<void> => {
    if (!options) {
      setState(prev => ({ ...prev, data: [], loading: false, error: null }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Create the base query with select clause
      let query = supabase.from(table).select(options.select || '*');

      // Add ordering if specified
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? false,
        });
      }

      // Add filtering if specified
      if (options.filter) {
        const { column, value } = options.filter;
        
        // Handle array of values for IN clause
        if (Array.isArray(value)) {
          query = query.in(column, value);
        } else {
          query = query.eq(column, value);
        }
      }

      // Execute the query
      const { data, error } = await query;

      if (error) {
        console.error(`useSupabaseQuery error for ${table}:`, error);
        throw error;
      }
      
      // Use type assertion to ensure compatibility
      setState(prev => ({ 
        ...prev, 
        data: (data || []) as T[], 
        loading: false, 
        error: null 
      }));
    } catch (err) {
      console.error(`useSupabaseQuery error for ${table}:`, err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      }));
    }
  };

  // Effect to fetch data when options change
  useEffect(() => {
    // Only fetch if the options have actually changed
    if (prevOptionsRef.current !== currentOptionsString) {
      prevOptionsRef.current = currentOptionsString;
      fetchData();
    }
  }, [table, currentOptionsString]);

  // Create a stable reference to the refresh function
  const stableRefresh = useCallback(fetchData, [table, currentOptionsString]);

  // Always return a consistent object with the refresh function defined
  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh: stableRefresh
  };
}