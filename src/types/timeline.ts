import type { LucideIcon } from 'lucide-react';

/**
 * Defines all possible event types in a timeline.
 * Using uppercase naming convention with underscores for consistency.
 */
export enum TimelineEventType {
  // User events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_JOINED = 'USER_JOINED', // User joined a customer
  USER_LEFT = 'USER_LEFT',     // User left a customer
  
  // Customer events
  CUSTOMER_CREATED = 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED = 'CUSTOMER_UPDATED',
  CUSTOMER_DELETED = 'CUSTOMER_DELETED',
  
  // Skill events
  SKILL_CREATED = 'SKILL_CREATED',
  SKILL_UPDATED = 'SKILL_UPDATED',
  SKILL_DELETED = 'SKILL_DELETED',
  
  // Skill application events
  SKILL_APPLIED = 'SKILL_APPLIED',     // Skill applied at a customer
  SKILL_REMOVED = 'SKILL_REMOVED',     // Skill removed from a customer
  
  // Skill profile events
  SKILL_PROFILE_ADDED = 'SKILL_PROFILE_ADDED',       // User added a skill to their profile
  SKILL_PROFILE_UPDATED = 'SKILL_PROFILE_UPDATED',   // User updated skill proficiency
  SKILL_PROFILE_REMOVED = 'SKILL_PROFILE_REMOVED',   // User removed a skill from profile
  
  // Generic events
  GENERIC_CREATED = 'GENERIC_CREATED',
  GENERIC_UPDATED = 'GENERIC_UPDATED',
  GENERIC_DELETED = 'GENERIC_DELETED',
}

/**
 * Represents a user in a timeline event.
 */
export interface TimelineUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

/**
 * Represents a customer in a timeline event.
 */
export interface TimelineCustomer {
  id: number | string;
  name: string;
}

/**
 * Represents a skill in a timeline event.
 */
export interface TimelineSkill {
  id: number | string;
  name: string;
  category?: string;
  proficiencyLevel?: number | string;
}

/**
 * Represents metadata for timeline events.
 */
export interface TimelineMetadata {
  notes?: string;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  [key: string]: any; // Allow for additional metadata properties
}

/**
 * The unified timeline event model that encompasses all possible
 * event types and entities.
 */
export interface TimelineEvent {
  id: string | number;
  type: TimelineEventType;
  user: {
    id: string | number;
    name: string;
    role?: string;
  };
  timestamp: string;
  skill?: {
    id: string | number;
    name: string;
    proficiencyLevel?: string | number;
  };
  customer?: {
    id: string | number;
    name: string;
  };
  metadata?: any;
  description?: string;
  entity_type?: string;
  entity_id?: string | number;
  
  // Original data from the database (for backward compatibility)
  original?: {
    event_type: string; // 'INSERT', 'UPDATE', 'DELETE'
    entity_type: string;
    entity_id: string;
    description?: string;
    metadata?: any;
    changes?: any[];
  };
}

/**
 * Props for the unified Timeline component.
 */
export interface TimelineProps {
  // Core properties
  title: string;
  icon?: LucideIcon;
  events?: TimelineEvent[];
  
  // Optional properties
  loading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  showHeader?: boolean;
  
  // Context filters
  entityType?: string;
  entityId?: string | number;
  
  // Callbacks
  onRefresh?: () => void;
  onEventClick?: (event: TimelineEvent) => void;
}

/**
 * Original TimelineItem format from the database/API.
 * Used when fetching raw data before converting to the unified TimelineEvent format.
 */
export interface TimelineItem {
  id: number;
  event_type: string; // 'INSERT', 'UPDATE', 'DELETE'
  description: string;
  event_time: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  changes?: { field: string; oldValue: any; newValue: any; changeKey?: string }[];
  role?: string;
  metadata?: { 
    role?: string;
    role_id?: number;
    position?: string;
    job_title?: string;
    skill_name?: string;
    customer_name?: string;
    proficiency?: string;
    skill_id?: number;
    customer_id?: number;
    notes?: string;
    [key: string]: any;
  };
} 