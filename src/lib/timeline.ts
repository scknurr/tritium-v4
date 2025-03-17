import { 
  TimelineEvent, 
  TimelineEventType, 
  TimelineItem, 
  TimelineUser,
  TimelineCustomer,
  TimelineSkill
} from '../types/timeline';
import { formatDateTime, formatTimeAgo } from './utils';
import { createLogger } from './debug';
import { supabase } from './supabase';

// Create a logger for timeline utilities
const logger = createLogger('timeline');

/**
 * Maps raw database event types to our standardized TimelineEventType enum.
 * This function determines the specific event type based on various properties
 * of the original timeline item.
 */
export function mapToEventType(item: TimelineItem): TimelineEventType {
  const { event_type, entity_type, description = '', metadata = {} } = item;
  
  // Check for skill application events first (most specialized)
  if (
    entity_type === 'skill_applications' || 
    (description.toLowerCase().includes('applied') && description.toLowerCase().includes('at')) ||
    (metadata && typeof metadata === 'object' && metadata.skill_name && metadata.customer_name)
  ) {
    if (event_type === 'INSERT') return TimelineEventType.SKILL_APPLIED;
    if (event_type === 'UPDATE') return TimelineEventType.SKILL_APPLIED; // Usually updates to skill applications still count as applications
    if (event_type === 'DELETE') return TimelineEventType.SKILL_REMOVED;
    // Default for skill applications
    return TimelineEventType.SKILL_APPLIED;
  }
  
  // Check for user-customer relationships
  if (entity_type === 'user_customers' || entity_type === 'customer_profiles') {
    if (event_type === 'INSERT') return TimelineEventType.USER_JOINED;
    if (event_type === 'DELETE') return TimelineEventType.USER_LEFT;
  }
  
  // Check for user-skill relationships (profile skills)
  if (entity_type === 'profile_skills' || entity_type === 'user_skills') {
    if (event_type === 'INSERT') return TimelineEventType.SKILL_PROFILE_ADDED;
    if (event_type === 'UPDATE') return TimelineEventType.SKILL_PROFILE_UPDATED;
    if (event_type === 'DELETE') return TimelineEventType.SKILL_PROFILE_REMOVED;
  }
  
  // Handle core entity events
  if (entity_type === 'profiles' || entity_type === 'users') {
    if (event_type === 'INSERT') return TimelineEventType.USER_CREATED;
    if (event_type === 'UPDATE') return TimelineEventType.USER_UPDATED;
    if (event_type === 'DELETE') return TimelineEventType.USER_DELETED;
  }
  
  if (entity_type === 'customers') {
    if (event_type === 'INSERT') return TimelineEventType.CUSTOMER_CREATED;
    if (event_type === 'UPDATE') return TimelineEventType.CUSTOMER_UPDATED;
    if (event_type === 'DELETE') return TimelineEventType.CUSTOMER_DELETED;
  }
  
  if (entity_type === 'skills') {
    if (event_type === 'INSERT') return TimelineEventType.SKILL_CREATED;
    if (event_type === 'UPDATE') return TimelineEventType.SKILL_UPDATED;
    if (event_type === 'DELETE') return TimelineEventType.SKILL_DELETED;
  }
  
  // Default generic fallbacks
  if (event_type === 'INSERT') return TimelineEventType.GENERIC_CREATED;
  if (event_type === 'UPDATE') return TimelineEventType.GENERIC_UPDATED;
  if (event_type === 'DELETE') return TimelineEventType.GENERIC_DELETED;
  
  // Ultimate fallback
  return TimelineEventType.GENERIC_UPDATED;
}

/**
 * Extracts a user object from a timeline item and related user data.
 */
export function extractUser(
  item: TimelineItem, 
  users: Array<{id: string; first_name?: string; last_name?: string; email?: string}>
): TimelineUser {
  const userId = item.user_id;
  const user = users.find(u => u.id === userId);
  
  // Extract role information from either metadata or the role field
  let role = '';
  if (item.metadata && typeof item.metadata === 'object') {
    role = item.metadata.role || '';
    // If there's a role_id but no role name, try to extract from metadata
    if (!role && item.metadata.role_id) {
      role = String(item.metadata.role_id);
    }
  } else if (item.role) {
    role = item.role;
  }
  
  return {
    id: userId,
    name: user ? `${user.first_name} ${user.last_name}`.trim() || user.email || 'Unknown User' : 'Unknown User',
    email: user?.email,
    role
  };
}

/**
 * Extracts a customer object from a timeline item and related customer data.
 */
export function extractCustomer(
  item: TimelineItem, 
  customers: Array<{id: number | string; name: string}>
): TimelineCustomer | undefined {
  // If this is a customer entity itself
  if (item.entity_type === 'customers') {
    const customer = customers.find(c => String(c.id) === item.entity_id);
    if (customer) {
      return {
        id: customer.id,
        name: customer.name
      };
    }
    // Fallback to just the ID if we can't find the customer
    return {
      id: item.entity_id,
      name: `Customer #${item.entity_id}`
    };
  }
  
  // Check metadata for customer info
  if (item.metadata && typeof item.metadata === 'object') {
    if (item.metadata.customer_id || item.metadata.customer_name) {
      const customerId = item.metadata.customer_id;
      const customerName = item.metadata.customer_name;
      
      // If we have an ID, try to find the customer in our data
      if (customerId) {
        const customer = customers.find(c => String(c.id) === String(customerId));
        if (customer) {
          return {
            id: customer.id,
            name: customer.name
          };
        }
      }
      
      // If we have a name but no matching ID, return with the name only
      if (customerName) {
        return {
          id: customerId || 0,
          name: customerName
        };
      }
    }
  }
  
  // Check if user-customer relationship
  if (item.entity_type === 'user_customers' || item.entity_type === 'customer_profiles') {
    // The entity_id may be the customer_id in this case
    const customer = customers.find(c => String(c.id) === item.entity_id);
    if (customer) {
      return {
        id: customer.id,
        name: customer.name
      };
    }
  }
  
  return undefined;
}

/**
 * Extracts a skill object from a timeline item and related skill data.
 */
export function extractSkill(
  item: TimelineItem, 
  skills: Array<{id: number | string; name: string}>
): TimelineSkill | undefined {
  // If this is a skill entity itself
  if (item.entity_type === 'skills') {
    const skill = skills.find(s => String(s.id) === item.entity_id);
    if (skill) {
      return {
        id: skill.id,
        name: skill.name
      };
    }
    // Fallback to just the ID if we can't find the skill
    return {
      id: item.entity_id,
      name: `Skill #${item.entity_id}`
    };
  }
  
  // Check metadata for skill info
  if (item.metadata && typeof item.metadata === 'object') {
    const skillId = item.metadata.skill_id;
    const skillName = item.metadata.skill_name;
    const proficiency = item.metadata.proficiency;
    
    // If we have an ID, try to find the skill in our data
    if (skillId) {
      const skill = skills.find(s => String(s.id) === String(skillId));
      if (skill) {
        return {
          id: skill.id,
          name: skill.name,
          proficiencyLevel: proficiency
        };
      }
    }
    
    // If we have a name but no matching ID, return with the name only
    if (skillName) {
      return {
        id: skillId || 0,
        name: skillName,
        proficiencyLevel: proficiency
      };
    }
  }
  
  // Check for skill in the changes (e.g., for profile_skills or customer_skills)
  if (item.changes && Array.isArray(item.changes)) {
    const skillIdChange = item.changes.find(change => change.field === 'skill_id');
    if (skillIdChange) {
      const skillId = skillIdChange.newValue || skillIdChange.oldValue;
      const skill = skills.find(s => String(s.id) === String(skillId));
      if (skill) {
        // Look for proficiency in changes too
        const proficiencyChange = item.changes.find(
          change => ['proficiency', 'level', 'proficiency_level'].includes(change.field)
        );
        
        return {
          id: skill.id,
          name: skill.name,
          proficiencyLevel: proficiencyChange ? proficiencyChange.newValue : undefined
        };
      }
    }
  }
  
  return undefined;
}

/**
 * Transforms a raw TimelineItem from the database into our standardized TimelineEvent format.
 */
export function transformTimelineItem(
  item: TimelineItem,
  users: Array<{id: string; full_name?: string; email?: string}> = [],
  customers: Array<{id: number | string; name: string}> = [],
  skills: Array<{id: number | string; name: string}> = []
): TimelineEvent {
  try {
    // Map the event type
    const eventType = mapToEventType(item);
    
    // Extract the user/actor
    const user = extractUser(item, users);
    
    // Extract customer if relevant
    const customer = extractCustomer(item, customers);
    
    // Extract skill if relevant
    const skill = extractSkill(item, skills);
    
    // Build metadata
    const metadata: any = {
      notes: (item.metadata && typeof item.metadata === 'object') ? item.metadata.notes : undefined,
    };
    
    // Add changes if they exist
    if (item.changes && Array.isArray(item.changes) && item.changes.length > 0) {
      metadata.changes = item.changes.map(change => ({
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue
      }));
    }
    
    // Create the final event
    const event: TimelineEvent = {
      id: item.id,
      type: eventType,
      timestamp: item.event_time,
      user,
      original: {
        event_type: item.event_type,
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        description: item.description,
        metadata: item.metadata,
        changes: item.changes
      },
      metadata
    };
    
    // Add entities if they exist
    if (customer) {
      event.customer = customer;
    }
    
    if (skill) {
      event.skill = skill;
    }
    
    return event;
  } catch (error) {
    logger.error('Error transforming timeline item', { error, item });
    
    // Return a minimal valid event in case of error
    return {
      id: item.id,
      type: TimelineEventType.GENERIC_UPDATED,
      timestamp: item.event_time,
      user: {
        id: item.user_id,
        name: 'Unknown User'
      },
      original: {
        event_type: item.event_type,
        entity_type: item.entity_type,
        entity_id: item.entity_id
      }
    };
  }
}

/**
 * Utility to format a timestamp in a consistent way across the application.
 * This handles both relative (e.g., "2 minutes ago") and absolute formats.
 */
export function formatEventTime(timestamp: string, useRelative = true): string {
  if (!timestamp) return '';
  
  if (useRelative) {
    return formatTimeAgo(timestamp);
  }
  
  return formatDateTime(timestamp);
}

/**
 * Batch transform multiple timeline items into standardized events.
 */
export function transformTimelineItems(
  items: TimelineItem[],
  users: Array<{id: string; full_name?: string; email?: string}> = [],
  customers: Array<{id: number | string; name: string}> = [],
  skills: Array<{id: number | string; name: string}> = []
): TimelineEvent[] {
  return items
    .map(item => transformTimelineItem(item, users, customers, skills))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Builds timeline events specifically for a customer.
 */
export function buildCustomerTimelineEvents(
  customerId: string | number,
  auditLogs: TimelineItem[],
  users: Array<{id: string; full_name?: string; email?: string}> = [],
  skills: Array<{id: number | string; name: string}> = []
): TimelineEvent[] {
  // Filter logs related to this customer
  const customerLogs = auditLogs.filter(log => {
    // Direct customer events
    if (log.entity_type === 'customers' && log.entity_id === String(customerId)) {
      return true;
    }
    
    // User-customer relationships
    if ((log.entity_type === 'user_customers' || log.entity_type === 'customer_profiles') && 
        log.entity_id === String(customerId)) {
      return true;
    }
    
    // Skill applications at this customer
    if (log.entity_type === 'skill_applications' && 
        log.metadata && 
        typeof log.metadata === 'object' && 
        String(log.metadata.customer_id) === String(customerId)) {
      return true;
    }
    
    // Generic logs mentioning this customer
    if (log.metadata && 
        typeof log.metadata === 'object' && 
        String(log.metadata.customer_id) === String(customerId)) {
      return true;
    }
    
    return false;
  });
  
  // Transform logs to events
  const customer = { id: customerId, name: `Customer ${customerId}` };
  return transformTimelineItems(customerLogs, users, [customer], skills);
}

/**
 * Builds timeline events specifically for a skill.
 */
export function buildSkillTimelineEvents(
  skillId: string | number,
  auditLogs: TimelineItem[],
  users: Array<{id: string; full_name?: string; email?: string}> = [],
  customers: Array<{id: number | string; name: string}> = []
): TimelineEvent[] {
  // Filter logs related to this skill
  const skillLogs = auditLogs.filter(log => {
    // Direct skill events
    if (log.entity_type === 'skills' && log.entity_id === String(skillId)) {
      return true;
    }
    
    // Profile-skill relationships (users having this skill)
    if ((log.entity_type === 'profile_skills' || log.entity_type === 'user_skills') && 
        log.metadata && 
        typeof log.metadata === 'object' && 
        String(log.metadata.skill_id) === String(skillId)) {
      return true;
    }
    
    // Skill applications of this skill
    if (log.entity_type === 'skill_applications' && 
        log.metadata && 
        typeof log.metadata === 'object' && 
        String(log.metadata.skill_id) === String(skillId)) {
      return true;
    }
    
    // Look in changes for this skill
    if (log.changes && Array.isArray(log.changes)) {
      return log.changes.some(change => 
        change.field === 'skill_id' && 
        (String(change.oldValue) === String(skillId) || String(change.newValue) === String(skillId))
      );
    }
    
    return false;
  });
  
  // Transform logs to events
  const skill = { id: skillId, name: `Skill ${skillId}` };
  return transformTimelineItems(skillLogs, users, customers, [skill]);
}

/**
 * Builds timeline events specifically for a user/profile.
 */
export function buildUserTimelineEvents(
  userId: string,
  auditLogs: TimelineItem[],
  customers: Array<{id: number | string; name: string}> = [],
  skills: Array<{id: number | string; name: string}> = []
): TimelineEvent[] {
  // Filter logs related to this user
  const userLogs = auditLogs.filter(log => {
    // Events performed by this user
    if (log.user_id === userId) {
      return true;
    }
    
    // Direct user events
    if ((log.entity_type === 'profiles' || log.entity_type === 'users') && 
        log.entity_id === userId) {
      return true;
    }
    
    // User-customer relationships
    if ((log.entity_type === 'user_customers' || log.entity_type === 'customer_profiles') && 
        (log.user_id === userId || 
         (log.metadata && typeof log.metadata === 'object' && log.metadata.user_id === userId))) {
      return true;
    }
    
    // User-skill relationships
    if ((log.entity_type === 'profile_skills' || log.entity_type === 'user_skills') && 
        (log.user_id === userId || 
         (log.metadata && typeof log.metadata === 'object' && log.metadata.user_id === userId))) {
      return true;
    }
    
    // Skill applications by this user
    if (log.entity_type === 'skill_applications' && log.user_id === userId) {
      return true;
    }
    
    return false;
  });
  
  // Transform logs to events
  const user = { id: userId, full_name: `User ${userId}` };
  return transformTimelineItems(userLogs, [user], customers, skills);
}

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
  metadata: any;
  users: {
    id: string;
    full_name: string;
    email: string;
  };
}

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
      logger.warn(`Could not fetch user details for ID ${userId}`, error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.first_name + ' ' + data.last_name || data.email || 'Unknown User',
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
      .select('id, name, industry, description')
      .eq('id', customerId)
      .single();
    
    if (error || !data) {
      logger.warn(`Could not fetch customer details for ID ${customerId}`, error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      industry: data.industry,
      description: data.description
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
      .select('id, name, category, description')
      .eq('id', skillId)
      .single();
    
    if (error || !data) {
      logger.warn(`Could not fetch skill details for ID ${skillId}`, error);
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
      description: data.description,
      proficiencyLevel
    };
  } catch (err) {
    logger.error('Error fetching skill details', err);
    return null;
  }
}

/**
 * Transforms raw database timeline items into the unified TimelineEvent format
 */
export async function transformTimelineItems(rawItems: RawTimelineItem[]): Promise<TimelineEvent[]> {
  const transformedItems: TimelineEvent[] = [];
  
  for (const item of rawItems) {
    try {
      // Parse event type to ensure it's a valid TimelineEventType
      let eventType: TimelineEventType;
      try {
        eventType = item.event_type as TimelineEventType;
        // Fallback for unknown event types
        if (!Object.values(TimelineEventType).includes(eventType)) {
          logger.warn(`Unknown event type: ${item.event_type}, using GENERIC_UPDATED`);
          eventType = TimelineEventType.GENERIC_UPDATED;
        }
      } catch (e) {
        logger.warn(`Invalid event type: ${item.event_type}, using GENERIC_UPDATED`);
        eventType = TimelineEventType.GENERIC_UPDATED;
      }
      
      // Create the basic user information from the joined users data
      const user: TimelineUser = {
        id: item.users.id || item.actor_id,
        name: item.users.full_name || 'Unknown User',
        email: item.users.email || ''
      };
      
      // Initialize the timeline event
      const timelineEvent: TimelineEvent = {
        id: item.id,
        type: eventType,
        timestamp: new Date(item.created_at).toISOString(),
        user,
        metadata: item.metadata || {}
      };
      
      // Fetch related entity details based on the entity type
      if (item.entity_type && item.entity_id) {
        switch (item.entity_type) {
          case 'users':
          case 'profiles':
            if (item.entity_id !== item.actor_id) {
              const targetUser = await fetchUserDetails(item.entity_id);
              if (targetUser) {
                timelineEvent.targetUser = targetUser;
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
            
          default:
            // For unknown entity types, at least store the basic info
            timelineEvent.entityType = item.entity_type;
            timelineEvent.entityId = item.entity_id;
        }
      }
      
      // Handle special cases and enrichment based on event type
      // Skill applications require both skill and customer info
      if (
        (eventType === TimelineEventType.SKILL_APPLIED || 
         eventType === TimelineEventType.SKILL_REMOVED) && 
        item.metadata
      ) {
        // Try to get customer info if skill was applied at a customer
        if (item.metadata.customer_id && !timelineEvent.customer) {
          const customer = await fetchCustomerDetails(item.metadata.customer_id);
          if (customer) {
            timelineEvent.customer = customer;
          }
        }
        
        // Try to get skill info if not already fetched
        if (item.metadata.skill_id && !timelineEvent.skill) {
          const skill = await fetchSkillDetails(item.metadata.skill_id, item.metadata);
          if (skill) {
            timelineEvent.skill = skill;
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