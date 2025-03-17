import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { TimelineEvent, TimelineEventType } from '../types/timeline';
import { transformRawTimelineItems, type RawTimelineItem } from './timeline-service';
import { createLogger } from './debug';
import { PostgrestError } from '@supabase/supabase-js';

const logger = createLogger('useUnifiedTimeline');

interface UseUnifiedTimelineProps {
  entityType?: string;
  entityId?: string | number;
  relatedEntityType?: string;
  relatedEntityId?: string | number;
  limit?: number;
}

interface UseUnifiedTimelineReturn {
  events: TimelineEvent[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for fetching timeline data with optional real-time updates
 */
export function useUnifiedTimeline({
  entityType,
  entityId,
  relatedEntityType,
  relatedEntityId,
  limit = 20
}: UseUnifiedTimelineProps): UseUnifiedTimelineReturn {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch timeline data
  const fetchTimelineData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, get timeline data from audit_logs 
      // Using only columns that we know exist in the table
      let query = supabase
        .from('audit_logs')
        .select('id, event_time, event_type, user_id, entity_id, entity_type, description, changes, metadata')
        .order('event_time', { ascending: false })
        .limit(limit);
      
      // Apply entity filters if provided
      if (entityType && entityId) {
        query = query.eq('entity_type', entityType).eq('entity_id', entityId);
      } else if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      
      const { data: timelineData, error: timelineError } = await query;
      
      if (timelineError) {
        throw new Error(`Error fetching timeline data: ${timelineError.message}`);
      }

      // Handle related entity data if needed
      let relatedData: any[] = [];
      if (relatedEntityType && relatedEntityId) {
        // This is a special query to find events where the entity appears in metadata
        // For example, find skill application events for a customer even though
        // the entity_type is 'skill_applications'
        console.log(`Fetching related timeline data for ${relatedEntityType}/${relatedEntityId}`);
        
        // First try to find events with that entity ID in metadata
        const { data: metadataEvents, error: metadataError } = await supabase
          .from('audit_logs')
          .select('id, event_time, event_type, user_id, entity_id, entity_type, description, changes, metadata')
          .or(`metadata->>${relatedEntityType}_id.eq.${relatedEntityId},metadata->>${relatedEntityType}_name.neq.null`)
          .order('event_time', { ascending: false })
          .limit(limit);
          
        if (metadataError) {
          console.warn(`Error fetching metadata events: ${metadataError.message}`);
        } else if (metadataEvents) {
          console.log(`Found ${metadataEvents.length} metadata events for ${relatedEntityType}/${relatedEntityId}`);
          relatedData = metadataEvents;
        }
        
        // Also look for skill application events specifically
        if (relatedEntityType === 'customer') {
          const { data: skillAppEvents, error: skillAppError } = await supabase
            .from('audit_logs')
            .select('id, event_time, event_type, user_id, entity_id, entity_type, description, changes, metadata')
            .eq('entity_type', 'skill_applications')
            .order('event_time', { ascending: false })
            .limit(limit);
            
          if (skillAppError) {
            console.warn(`Error fetching skill application events: ${skillAppError.message}`);
          } else if (skillAppEvents) {
            // Filter those that mention this customer in description or metadata
            const filteredEvents = skillAppEvents.filter(event => {
              // Check metadata
              if (event.metadata && 
                  ((event.metadata.customer_id && String(event.metadata.customer_id) === String(relatedEntityId)) ||
                   (event.metadata.customerId && String(event.metadata.customerId) === String(relatedEntityId)))) {
                return true;
              }
              
              // Check description 
              if (event.description && 
                  event.description.toLowerCase().includes('applied') && 
                  event.description.toLowerCase().includes('at')) {
                return true;
              }
              
              return false;
            });
            
            console.log(`Found ${filteredEvents.length} skill application events for customer ${relatedEntityId}`);
            relatedData = [...relatedData, ...filteredEvents];
          }
        }
      }
      
      // Combine regular data and related data, remove duplicates
      const combinedData = [...(timelineData || []), ...relatedData];
      const uniqueData = Array.from(new Map(combinedData.map(item => [item.id, item])).values());
      
      if (!uniqueData || uniqueData.length === 0) {
        setEvents([]);
        return;
      }
      
      console.log(`Processing ${uniqueData.length} total timeline items`);
      
      // Extract all user_ids to fetch user data separately
      const userIds = uniqueData.map(item => item.user_id).filter(Boolean);
      
      // If we have user_ids, fetch their user data
      const { data: userData, error: userError } = userIds.length > 0 
        ? await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', userIds)
        : { data: [], error: null };
      
      if (userError) {
        logger.warn(`Error fetching user data for timeline: ${userError.message}`);
      }
      
      // Process the Supabase response to match our expected RawTimelineItem structure
      const formattedData: RawTimelineItem[] = uniqueData.map(item => {
        // Find the matching user or create a default
        const user = userData?.find(u => u.id === item.user_id) || {
          id: item.user_id || '',
          first_name: 'Unknown User',
          last_name: '',
          email: ''
        };
        
        return {
          id: String(item.id || ''),
          created_at: String(item.event_time || new Date().toISOString()),
          event_type: String(item.event_type || ''),
          actor_id: String(item.user_id || ''),
          entity_id: String(item.entity_id || ''),
          entity_type: String(item.entity_type || ''),
          description: String(item.description || ''),
          metadata: item.metadata || {}, // Use actual metadata if available
          changes: item.changes || [],
          users: {
            id: String(user.id || ''),
            first_name: String(user.first_name || 'Unknown User'),
            last_name: String(user.last_name || ''),
            email: String(user.email || '')
          }
        };
      });
      
      // Transform raw timeline items to unified format
      const transformedEvents = await transformRawTimelineItems(formattedData);
      
      // Sort events by timestamp (newest first)
      transformedEvents.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });
      
      setEvents(transformedEvents);
      
    } catch (err) {
      logger.error('Error in fetchTimelineData', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, relatedEntityType, relatedEntityId, limit]);
  
  // Initial data fetch
  useEffect(() => {
    fetchTimelineData();
  }, [fetchTimelineData]);
  
  // Set up real-time subscription
  useEffect(() => {
    // Choose the appropriate channel key based on filters
    const channelKey = entityType && entityId 
      ? `audit_logs:entity_type=eq.${entityType}:entity_id=eq.${entityId}`
      : entityType 
      ? `audit_logs:entity_type=eq.${entityType}`
      : 'audit_logs';
    
    // Subscribe to timeline changes
    const subscription = supabase
      .channel(channelKey)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'audit_logs',
        filter: entityType && entityId 
          ? `entity_type=eq.${entityType}:entity_id=eq.${entityId}`
          : entityType 
          ? `entity_type=eq.${entityType}`
          : undefined
      }, (payload) => {
        logger.debug('Received real-time timeline update', payload);
        
        // Refresh the data when we get an update
        // In a more optimized version, we could merge the new data without a full refresh
        fetchTimelineData();
      })
      .subscribe((status) => {
        logger.debug(`Timeline subscription status: ${status}`);
      });
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [entityType, entityId, fetchTimelineData]);
  
  return {
    events,
    loading,
    error,
    refresh: fetchTimelineData
  };
} 