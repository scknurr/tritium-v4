import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface QueryOptions {
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  filter?: { column: string; value: any };
}

export function useQueryWithCache<T>(
  queryKey: readonly unknown[],
  table: string,
  options: QueryOptions | null = null
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!options) return [];

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
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });
}