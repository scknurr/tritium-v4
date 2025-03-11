import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { fetchData, type QueryOptions, type ApiError } from '../api';

export function useQueryWithCache<T>(
  queryKey: readonly unknown[],
  table: string,
  options: QueryOptions = null,
  queryOptions: Omit<UseQueryOptions<T[], ApiError>, 'queryKey' | 'queryFn'> = {}
) {
  return useQuery<T[], ApiError>({
    queryKey,
    queryFn: () => fetchData<T>(table, options),
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    ...queryOptions,
  });
}