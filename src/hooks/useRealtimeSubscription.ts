import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UseRealtimeSubscriptionOptions {
  table: string;
  filter?: Record<string, any>;
  onUpdate?: () => void;
}

export function useRealtimeSubscription({
  table,
  filter,
  onUpdate
}: UseRealtimeSubscriptionOptions) {
  useEffect(() => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...filter
        },
        () => {
          onUpdate?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, onUpdate]);
}