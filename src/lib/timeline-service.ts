/**
 * Timeline Service
 * 
 * This service is responsible for fetching, transforming, and managing timeline events 
 * from various sources in the application. It provides the data layer for the activity timeline.
 * 
 * Key Responsibilities:
 * 
 * 1. Event Type Mapping:
 *    - Maps raw database operations (INSERT, UPDATE, DELETE) to specific TimelineEventType values
 *    - Handles mapping based on entity type (users, customers, skills, skill_applications)
 *    - Provides fallbacks for unrecognized event types
 * 
 * 2. Data Transformation:
 *    - Converts raw database audit logs into structured TimelineEvent objects
 *    - Extracts and processes metadata from raw events
 *    - Enriches events with additional context (skill names, customer names, etc.)
 * 
 * 3. Skills Application Handling:
 *    - Special handling for skill application events
 *    - Extracts skill_id, customer_id, and proficiency from metadata
 *    - Ensures all necessary information is available for rendering
 * 
 * Implementation Notes:
 * - Database operations like INSERT on skill_applications table get mapped to SKILL_APPLIED
 * - Entity relationships are preserved through metadata
 * - Raw database field names are normalized for consistent UI rendering
 * 
 * Debugging:
 * - The service includes extensive logging to trace event mapping issues
 * - Watch for warnings about unrecognized event types in the console
 * 
 * Last Updated: March 12, 2025
 */

import { supabase } from './supabase';
import { 
  TimelineEvent, 
  TimelineEventType,
  TimelineUser,
  TimelineCustomer,
  TimelineSkill,
  TimelineMetadata
} from '../types/timeline';
import { createLogger } from './debug';

const logger = createLogger('timeline-service');

/**
 * Interface representing raw timeline items from the database
 */
interface RawTimelineItem {
  id: string;
  created_at: string;
  event_type: string;
  actor_id: string;
  entity_id: string;
  entity_type: string;
  description: string;
  metadata: any; // Optional additional data
  changes?: { field: string; oldValue: any; newValue: any; changeKey?: string }[]; // From changes column
  users: {
    id: string;
    full_name: string;
    email: string;
  };
}

// Export the interface for use in other files
export type { RawTimelineItem };

/**
 * Fetches user details for a timeline event
 */
async function fetchUserDetails(userId: string): Promise<TimelineUser | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      logger.warn(`Could not fetch user details for ID ${userId}`);
      return null;
    }
    
    return {
      id: data.id,
      name: data.first_name + ' ' + data.last_name,
      email: data.email,
      role: data.role
    };
  } catch (err) {
    logger.error('Error fetching user details', err);
    return null;
  }
}

/**
 * Fetches customer details for a timeline event
 */
async function fetchCustomerDetails(customerId: string): Promise<TimelineCustomer | null> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name')
      .eq('id', customerId)
      .single();
    
    if (error || !data) {
      logger.warn(`Could not fetch customer details for ID ${customerId}`);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name
    };
  } catch (err) {
    logger.error('Error fetching customer details', err);
    return null;
  }
}

/**
 * Fetches skill details for a timeline event
 */
async function fetchSkillDetails(skillId: string, metadata?: any): Promise<TimelineSkill | null> {
  try {
    const { data, error } = await supabase
      .from('skills')
      .select('id, name, category')
      .eq('id', skillId)
      .single();
    
    if (error || !data) {
      logger.warn(`Could not fetch skill details for ID ${skillId}`);
      return null;
    }
    
    // Extract proficiency level from metadata if available
    let proficiencyLevel: string | undefined = undefined;
    if (metadata) {
      if (metadata.proficiency_level) {
        proficiencyLevel = metadata.proficiency_level;
      } else if (metadata.changes) {
        const proficiencyChange = metadata.changes.find((c: any) => 
          c.field === 'proficiency_level' || c.field === 'level'
        );
        if (proficiencyChange) {
          proficiencyLevel = proficiencyChange.newValue || proficiencyChange.oldValue;
        }
      }
    }
    
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      proficiencyLevel
    };
  } catch (err) {
    logger.error('Error fetching skill details', err);
    return null;
  }
}

/**
 * Maps database operation types to specific TimelineEventType based on entity_type
 */
function mapDatabaseEventType(eventType: string, entityType: string, description?: string): TimelineEventType {
  // Convert to lowercase for easier comparison
  const operation = eventType.toUpperCase();
  const entity = entityType.toLowerCase();
  
  // Log more details for debugging
  logger.info(`Mapping event: operation=${operation}, entity=${entity}, description=${description || 'N/A'}`);
  
  // Check for skill applications based on entity type or description
  const isSkillApplication = 
    entity === 'skill_applications' || 
    (description && description.toLowerCase().includes('applied')) ||
    (description && description.toLowerCase().includes('skill') && description.toLowerCase().includes('at'));
  
  if (isSkillApplication) {
    logger.info(`Detected skill application event: ${description}`);
    if (operation === 'INSERT' || (description && description.toLowerCase().includes('applied'))) {
      return TimelineEventType.SKILL_APPLIED;
    }
    if (operation === 'DELETE' || 
        operation === 'UPDATE' && (
          (description && description.toLowerCase().includes('ended')) || 
          (description && description.toLowerCase().includes('removed'))
        )
       ) {
      return TimelineEventType.SKILL_REMOVED;
    }
  }
  
  // Map based on entity type and operation
  if (entity === 'users' || entity === 'profiles') {
    if (operation === 'INSERT') return TimelineEventType.USER_CREATED;
    if (operation === 'UPDATE') return TimelineEventType.USER_UPDATED;
    if (operation === 'DELETE') return TimelineEventType.USER_DELETED;
  } 
  else if (entity === 'customers') {
    if (operation === 'INSERT') return TimelineEventType.CUSTOMER_CREATED;
    if (operation === 'UPDATE') return TimelineEventType.CUSTOMER_UPDATED;
    if (operation === 'DELETE') return TimelineEventType.CUSTOMER_DELETED;
  } 
  else if (entity === 'skills') {
    if (operation === 'INSERT') return TimelineEventType.SKILL_CREATED;
    if (operation === 'UPDATE') return TimelineEventType.SKILL_UPDATED;
    if (operation === 'DELETE') return TimelineEventType.SKILL_DELETED;
  }
  else if (entity === 'user_skills') {
    if (operation === 'INSERT') return TimelineEventType.SKILL_PROFILE_ADDED;
    if (operation === 'UPDATE') return TimelineEventType.SKILL_PROFILE_UPDATED;
    if (operation === 'DELETE') return TimelineEventType.SKILL_PROFILE_REMOVED;
  }
  
  // Fallback to generic types
  if (operation === 'INSERT') return TimelineEventType.GENERIC_CREATED;
  if (operation === 'UPDATE') return TimelineEventType.GENERIC_UPDATED;
  if (operation === 'DELETE') return TimelineEventType.GENERIC_DELETED;
  
  // Default fallback
  return TimelineEventType.GENERIC_UPDATED;
}

/**
 * Transforms raw database timeline items into the unified TimelineEvent format
 */
export async function transformRawTimelineItems(rawItems: RawTimelineItem[]): Promise<TimelineEvent[]> {
  const transformedItems: TimelineEvent[] = [];
  
  for (const item of rawItems) {
    try {
      // Parse event type to ensure it's a valid TimelineEventType
      let eventType: TimelineEventType;
      
      // First check if it's already a valid TimelineEventType
      if (Object.values(TimelineEventType).includes(item.event_type as TimelineEventType)) {
        eventType = item.event_type as TimelineEventType;
      } else {
        // If not, map from database operation type to appropriate TimelineEventType
        eventType = mapDatabaseEventType(item.event_type, item.entity_type, item.description);
        logger.info(`Mapped database event ${item.event_type} on ${item.entity_type} to ${eventType}`);
      }
      
      // Create the basic user information from the joined users data
      const user: TimelineUser = {
        id: item.users.id || item.actor_id,
        name: item.users.full_name || 'Unknown User',
        email: item.users.email || ''
      };
      
      // Initialize the timeline event with metadata that includes the description and changes
      const metadata: TimelineMetadata = {
        ...item.metadata, // Start with any existing metadata
        description: item.description || '',
      };
      
      // Add changes to metadata if they exist
      if (item.changes && Array.isArray(item.changes) && item.changes.length > 0) {
        metadata.changes = item.changes.map(change => ({
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          changeKey: change.changeKey
        }));
      }
      
      // Create the timeline event
      const timelineEvent: TimelineEvent = {
        id: item.id,
        type: eventType,
        timestamp: new Date(item.created_at).toISOString(),
        user,
        metadata
      };
      
      // Extract any skill_id and customer_id from the metadata - be very thorough
      // Look in all possible places the IDs could be stored
      const skillId = item.metadata?.skill_id || 
                      (item.metadata?.metadata?.skill_id) || 
                      item.metadata?.skill?.id ||
                      item.metadata?.skillId ||
                      (item.description?.match(/skill (\d+)/) || [])[1];
                      
      const customerId = item.metadata?.customer_id || 
                         (item.metadata?.metadata?.customer_id) || 
                         item.metadata?.customer?.id ||
                         item.metadata?.customerId ||
                         (item.description?.match(/customer (\d+)/) || [])[1];
      
      // Also try to extract skill_name and customer_name directly
      const skillName = item.metadata?.skill_name || 
                       item.metadata?.skillName || 
                       (item.metadata?.skill && item.metadata.skill.name);
                       
      const customerName = item.metadata?.customer_name || 
                          item.metadata?.customerName || 
                          (item.metadata?.customer && item.metadata.customer.name);
      
      // Look for proficiency level
      const proficiencyLevel = item.metadata?.proficiency || 
                              item.metadata?.proficiency_level || 
                              item.metadata?.level;
      
      // Add these to the metadata if they exist and aren't already there
      if (skillName && !metadata.skill_name) metadata.skill_name = skillName;
      if (customerName && !metadata.customer_name) metadata.customer_name = customerName;
      if (proficiencyLevel && !metadata.proficiency) metadata.proficiency = proficiencyLevel;
      
      // Log details about the event for debugging
      logger.info(`Processing event: id=${item.id}, type=${eventType}`);
      logger.info(`Entity: ${item.entity_type}/${item.entity_id}`);
      logger.info(`Description: ${item.description}`);
      
      if (skillId) logger.info(`Found skill_id: ${skillId}`);
      if (customerId) logger.info(`Found customer_id: ${customerId}`);
      if (skillName) logger.info(`Found skill_name: ${skillName}`);
      if (customerName) logger.info(`Found customer_name: ${customerName}`);
      
      // Fetch related entity details based on the entity type
      if (item.entity_type && item.entity_id) {
        switch (item.entity_type) {
          case 'users':
          case 'profiles':
            // If the entity is a user but not the actor, fetch their details
            if (item.entity_id !== item.actor_id) {
              const otherUser = await fetchUserDetails(item.entity_id);
              if (otherUser) {
                // Add as a property to the event metadata
                timelineEvent.metadata = {
                  ...timelineEvent.metadata,
                  otherUser
                };
              }
            }
            break;
            
          case 'customers':
            const customer = await fetchCustomerDetails(item.entity_id);
            if (customer) {
              timelineEvent.customer = customer;
            }
            break;
            
          case 'skills':
            const skill = await fetchSkillDetails(item.entity_id, item.metadata);
            if (skill) {
              timelineEvent.skill = skill;
            }
            break;
            
          case 'skill_applications':
            // For skill applications, we need both skill and customer info
            if (skillId) {
              const skill = await fetchSkillDetails(String(skillId), item.metadata);
              if (skill) {
                timelineEvent.skill = skill;
                logger.info(`Added skill to event: ${skill.name}`);
              }
            } else if (skillName) {
              // If we have the name but not the ID, create a placeholder skill
              timelineEvent.skill = {
                id: 0,
                name: skillName,
                proficiencyLevel: proficiencyLevel
              };
              logger.info(`Added placeholder skill to event: ${skillName}`);
            }
            
            if (customerId) {
              const customer = await fetchCustomerDetails(String(customerId));
              if (customer) {
                timelineEvent.customer = customer;
                logger.info(`Added customer to event: ${customer.name}`);
              }
            } else if (customerName) {
              // If we have the name but not the ID, create a placeholder customer
              timelineEvent.customer = {
                id: 0,
                name: customerName
              };
              logger.info(`Added placeholder customer to event: ${customerName}`);
            }
            
            // Add event type for skill applications if not already set
            if (eventType !== TimelineEventType.SKILL_APPLIED && 
                eventType !== TimelineEventType.SKILL_REMOVED) {
              if (item.event_type === 'INSERT') {
                eventType = TimelineEventType.SKILL_APPLIED;
                timelineEvent.type = TimelineEventType.SKILL_APPLIED;
              } else if (item.event_type === 'DELETE') {
                eventType = TimelineEventType.SKILL_REMOVED;
                timelineEvent.type = TimelineEventType.SKILL_REMOVED;
              }
            }
            break;
            
          default:
            // For unknown entity types, at least store the basic info
            timelineEvent.metadata = {
              ...timelineEvent.metadata,
              entityType: item.entity_type,
              entityId: item.entity_id
            };
        }
      }
      
      // Special handling for skill application events regardless of entity_type
      if (
        (eventType === TimelineEventType.SKILL_APPLIED || 
         eventType === TimelineEventType.SKILL_REMOVED)) {
         
        // Look for skill/customer info in the description
        const desc = item.description?.toLowerCase() || '';
        
        // Try to get customer info if skill was applied at a customer
        if (!timelineEvent.customer) {
          // Try to extract from metadata
          if (customerId) {
            const customer = await fetchCustomerDetails(String(customerId));
            if (customer) {
              timelineEvent.customer = customer;
              logger.info(`Added customer from metadata: ${customer.name}`);
            }
          } else if (customerName) {
            timelineEvent.customer = { id: 0, name: customerName };
            logger.info(`Added customer from name: ${customerName}`);
          }
          // Try to extract from description
          else if (desc.includes('at ')) {
            const parts = desc.split('at ');
            if (parts.length > 1) {
              const customerName = parts[1]?.split(' ')[0];
              if (customerName) {
                logger.info(`Extracted customer name from description: ${customerName}`);
                // In a real implementation, you'd lookup the customer by name
                // For now, we're just creating a placeholder
                timelineEvent.customer = {
                  id: 0,
                  name: customerName
                };
              }
            }
          }
        }
        
        // Try to get skill info if not already fetched
        if (!timelineEvent.skill) {
          // Try to extract from metadata
          if (skillId) {
            const skill = await fetchSkillDetails(String(skillId));
            if (skill) {
              timelineEvent.skill = skill;
              logger.info(`Added skill from metadata: ${skill.name}`);
            }
          } else if (skillName) {
            timelineEvent.skill = { 
              id: 0, 
              name: skillName,
              proficiencyLevel: proficiencyLevel
            };
            logger.info(`Added skill from name: ${skillName}`);
          }
          // Try to extract from description
          else {
            let skillName = '';
            if (desc.includes('skill ')) {
              const parts = desc.split('skill ');
              if (parts.length > 1) {
                skillName = parts[1]?.split(' ')[0] || '';
              }
            } else if (desc.includes('applied ')) {
              const parts = desc.split('applied ');
              if (parts.length > 1) {
                skillName = parts[1]?.split(' ')[0] || '';
              }
            }
            
            if (skillName) {
              logger.info(`Extracted skill name from description: ${skillName}`);
              // In a real implementation, you'd lookup the skill by name
              // For now, we're just creating a placeholder
              timelineEvent.skill = {
                id: 0,
                name: skillName
              };
            }
          }
        }
      }
      
      transformedItems.push(timelineEvent);
    } catch (err) {
      logger.error(`Error transforming timeline item ${item.id}`, err);
      // Skip this item and continue with others
    }
  }
  
  return transformedItems;
}

/**
 * Records a new event in the timeline
 */
export async function recordTimelineEvent({
  eventType,
  actorId,
  entityType,
  entityId,
  metadata = {}
}: {
  eventType: TimelineEventType;
  actorId: string;
  entityType: string;
  entityId: string;
  metadata?: TimelineMetadata;
}): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase.from('timeline').insert({
      event_type: eventType,
      actor_id: actorId,
      entity_type: entityType,
      entity_id: entityId,
      metadata
    });
    
    if (error) {
      logger.error('Error recording timeline event', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (err) {
    logger.error('Exception recording timeline event', err);
    return { success: false, error: err };
  }
}