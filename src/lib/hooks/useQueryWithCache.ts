import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { fetchData, type QueryOptions, type ApiError } from '../api';

export function useQueryWithCache<T>(
  queryKey: readonly unknown[],
  table: string,
  options: QueryOptions = null,
  queryOptions: Omit<UseQueryOptions<T[], ApiError>, 'queryKey' | 'queryFn'> = {}
) {
  // Use a shorter staleTime for audit logs to make them more responsive
  const staleTime = table === 'audit_logs' ? 0 : 1000 * 60 * 5; // 0 for audit logs, 5 minutes for others

  return useQuery<T[], ApiError>({
    queryKey,
    queryFn: () => fetchData<T>(table, options),
    staleTime,
    gcTime: 1000 * 60 * 30, // 30 minutes
    ...queryOptions,
  });
}