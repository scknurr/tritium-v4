import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

interface UseFilteredDataOptions {
  table: string;
  filter: string;
  select?: string;
}

export function useFilteredData<T>({
  table,
  filter,
  select = '*'
}: UseFilteredDataOptions) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let query = supabase.from(table).select(select);

        // Apply filters
        switch (filter) {
          // Name filters
          case 'name_asc':
            if (table === 'profiles') {
              query = query.order('full_name', { ascending: true });
            } else {
              query = query.order('name', { ascending: true });
            }
            break;
          case 'name_desc':
            if (table === 'profiles') {
              query = query.order('full_name', { ascending: false });
            } else {
              query = query.order('name', { ascending: false });
            }
            break;

          // Date filters
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'oldest':
            query = query.order('created_at', { ascending: true });
            break;

          // Relationship count filters
          case 'most_customers':
          case 'fewest_customers':
          case 'most_skills':
          case 'fewest_skills':
          case 'most_users':
          case 'fewest_users':
          case 'largest_team':
          case 'smallest_team': {
            let relationTable, joinColumn;

            switch (filter) {
              case 'most_customers':
              case 'fewest_customers':
                relationTable = 'user_customers';
                joinColumn = table === 'profiles' ? 'user_id' : 'customer_id';
                break;
              case 'most_skills':
              case 'fewest_skills':
                relationTable = 'user_skills';
                joinColumn = table === 'profiles' ? 'user_id' : 'skill_id';
                break;
              case 'largest_team':
              case 'smallest_team':
                relationTable = 'user_customers';
                joinColumn = 'customer_id';
                break;
              case 'most_users':
              case 'fewest_users':
                relationTable = 'user_skills';
                joinColumn = 'skill_id';
                break;
            }

            // First get all items
            const { data: items } = await query;
            if (!items) break;

            // Then get the counts for each item
            const counts = await Promise.all(
              items.map(async (item: any) => {
                const { count } = await supabase
                  .from(relationTable)
                  .select('*', { count: 'exact', head: true })
                  .eq(joinColumn, item.id);
                
                return {
                  item,
                  count: count || 0
                };
              })
            );

            // Sort items by their counts
            const sortedItems = counts
              .sort((a, b) => {
                return filter.includes('most') || filter.includes('largest')
                  ? b.count - a.count
                  : a.count - b.count;
              })
              .map(({ item }) => item);

            setData(sortedItems);
            return;
          }

          default:
            query = query.order('created_at', { ascending: false });
        }

        const { data: items, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setData(items || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [table, filter, select]);

  const refresh = async () => {
    queryClient.invalidateQueries([table]);
    const fetchData = async () => {
      try {
        const { data: items, error: fetchError } = await supabase
          .from(table)
          .select(select)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setData(items || []);
      } catch (err) {
        console.error('Error refreshing data:', err);
      }
    };
    await fetchData();
  };

  return { data, isLoading, error, refresh };
}