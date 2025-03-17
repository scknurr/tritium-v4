import { useState, useCallback } from 'react';

/**
 * Standard API response state shape
 */
export interface ApiRequestState<T> {
  /** API response data */
  data: T | null;
  /** Loading state */
  isLoading: boolean;
  /** Error information */
  error: Error | null;
}

/**
 * Standard API request hook result
 */
export interface UseApiRequestResult<T> {
  /** Current state of the API request */
  state: ApiRequestState<T>;
  /** Function to execute the API request */
  execute: () => Promise<T | null>;
  /** Function to reset the state */
  reset: () => void;
}

/**
 * Standard hook for making API requests with consistent state management
 * 
 * @example
 * ```
 * const {
 *   state: { data, isLoading, error },
 *   execute: fetchData
 * } = useApiRequest(
 *   async () => await getUserSkillApplications(userId),
 *   { data: [], isLoading: true, error: null }
 * );
 * ```
 * 
 * @param fetchFn The async function that performs the API request
 * @param initialState Initial state for the request
 * @returns Standardized state and functions
 */
export function useApiRequest<T>(
  fetchFn: () => Promise<T>,
  initialState: ApiRequestState<T> = { data: null, isLoading: false, error: null }
): UseApiRequestResult<T> {
  const [state, setState] = useState<ApiRequestState<T>>(initialState);

  const execute = useCallback(async (): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const data = await fetchFn();
      setState({ data, isLoading: false, error: null });
      return data;
    } catch (err) {
      console.error('API request failed:', err);
      
      // Standardize error format
      const error = err instanceof Error 
        ? err 
        : new Error(typeof err === 'string' ? err : 'Unknown error occurred');
      
      setState(prev => ({ ...prev, isLoading: false, error }));
      return null;
    }
  }, [fetchFn]);

  const reset = useCallback(() => {
    setState(initialState);
  }, [initialState]);

  return { state, execute, reset };
}

/**
 * A hook to handle create, update, and delete operations with parameters
 * 
 * @param requestFn Function that accepts parameters and returns Promise<T>
 * @returns Standardized API request result
 */
export function useMutation<T, P>(
  requestFn: (params: P) => Promise<T>
): {
  state: ApiRequestState<T>;
  execute: (params: P) => Promise<T | null>;
  reset: () => void;
} {
  const [state, setState] = useState<ApiRequestState<T>>({ 
    data: null, 
    isLoading: false, 
    error: null 
  });

  const execute = useCallback(async (params: P): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const data = await requestFn(params);
      setState({ data, isLoading: false, error: null });
      return data;
    } catch (err) {
      console.error('Mutation failed:', err);
      
      // Standardize error format
      const error = err instanceof Error 
        ? err 
        : new Error(typeof err === 'string' ? err : 'Unknown error occurred');
      
      setState(prev => ({ ...prev, isLoading: false, error }));
      return null;
    }
  }, [requestFn]);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return { state, execute, reset };
}

export default useApiRequest; 