import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Define payload type for better type safety
export interface RealtimePayload {
  commit_timestamp: string;
  eventType: string;
  new: Record<string, any> | null;
  old: Record<string, any> | null;
  schema: string;
  table: string;
  [key: string]: any;
}

export interface UseRealtimeSubscriptionOptions {
  /**
   * The table to subscribe to
   */
  table: string;
  /**
   * Filter criteria for the subscription
   * All ID values should be strings to work properly with Supabase Realtime
   */
  filter?: Record<string, string>;
  /**
   * Callback executed when data changes
   */
  onUpdate?: (payload?: RealtimePayload) => void;
  /**
   * Whether to enable debug logging
   */
  debug?: boolean;
}

/**
 * A standardized hook to subscribe to real-time changes in Supabase tables
 * 
 * @example
 * ```
 * // Basic usage
 * useRealtimeSubscription({
 *   table: 'users',
 *   onUpdate: () => refetchUsers()
 * });
 * 
 * // With filters - Always use string values for IDs in filters
 * useRealtimeSubscription({
 *   table: 'skill_applications',
 *   filter: { user_id: userId.toString() },
 *   onUpdate: fetchApplications
 * });
 * ```
 */
export function useRealtimeSubscription({
  table,
  filter,
  onUpdate,
  debug = false
}: UseRealtimeSubscriptionOptions) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!table) {
      console.error('Table name is required for real-time subscription');
      return;
    }

    try {
      // Create a unique channel ID for this subscription
      const channelId = `${table}_${Math.random().toString(36).substring(2, 9)}`;
      
      if (debug) {
        console.log(`[Realtime] Setting up subscription to ${table}`, { filter });
      }

      // Prepare the filter for Supabase realtime
      let channelFilter: any = {
        event: '*',  // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table
      };

      // Add filter as eq operators on specific columns
      if (filter && Object.keys(filter).length > 0) {
        channelFilter = {
          ...channelFilter,
          filter: Object.entries(filter).map(([column, value]) => {
            // Ensure value is a string for consistent behavior
            return {
              column,
              operator: 'eq',
              value: String(value)
            };
          })
        };
      }

      // Create and subscribe to the channel
      const channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes' as any,
          channelFilter as any,
          (payload: RealtimePayload) => {
            if (debug) {
              console.log(`[Realtime] Received change in ${table}:`, payload);
            }
            onUpdate?.(payload);
          }
        )
        .subscribe((status: string) => {
          if (debug) {
            console.log(`[Realtime] Subscription status for ${table}: ${status}`);
          }
          setIsSubscribed(status === 'SUBSCRIBED');
        });

      // Clean up on unmount
      return () => {
        if (debug) {
          console.log(`[Realtime] Cleaning up subscription to ${table}`);
        }
        supabase.removeChannel(channel);
        setIsSubscribed(false);
      };
    } catch (err) {
      console.error(`[Realtime] Error setting up subscription to ${table}:`, err);
      setError(err instanceof Error ? err : new Error('Unknown error setting up real-time subscription'));
      return () => {}; // Return empty cleanup function
    }
  }, [table, JSON.stringify(filter), onUpdate, debug]);

  return { isSubscribed, error };
}