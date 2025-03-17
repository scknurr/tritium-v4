/**
 * Type definitions for the Tritium application
 * This file contains standardized type definitions used across the application
 */

/**
 * Basic entity types
 */
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  title: string | null;
  bio: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Customer {
  id: number;
  name: string;
  description: string | null;
  website: string | null;
  industry_id: number | null;
  status: 'active' | 'inactive';
  logo_url?: string | null;
  created_at: string;
  updated_at?: string;
  industry?: {
    id: number;
    name: string;
  };
}

export interface CustomerRole {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Skill {
  id: number;
  name: string;
  description: string | null;
  category_id: number | null;
  svg_icon?: string | null;
  proficiency_levels?: string[];
  created_at: string;
  updated_at?: string;
  category?: {
    id: number;
    name: string;
  };
}

/**
 * Relationship types
 */
export interface UserSkill {
  id: number;
  user_id: string;
  skill_id: number;
  proficiency_level: string;
  created_at: string;
  updated_at?: string;
  skill?: Skill;
  user?: Profile;
}

export interface UserCustomer {
  id: number;
  user_id: string;
  customer_id: number;
  role_id: number | null;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at?: string;
  customer?: Customer;
  user?: Profile;
  customer_role?: {
    id: number;
    name: string;
  };
}

export interface CustomerSkill {
  id: number;
  customer_id: number;
  skill_id: number;
  utilization_level: string;
  created_at: string;
  updated_at?: string;
  customer?: Customer;
  skill?: Skill;
}

/**
 * Skill application type - central to the application
 */
export interface SkillApplication {
  id: number;
  user_id: string;
  skill_id: number;
  customer_id: number;
  proficiency: string;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
  
  // These are added by the API for convenience
  skill_name?: string;
  user_name?: string;
  customer_name?: string;
  
  // Nested objects from joins
  skills?: Skill;
  profiles?: Profile;
  customers?: Customer;
}

// Alias for backward compatibility
export type CustomerSkillApplication = SkillApplication;

/**
 * API types
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

/**
 * UI types
 */
export type ErrorSeverity = 'info' | 'warning' | 'error';

export interface TimelineItem {
  id: number | string;
  timestamp: string;
  type: string;
  description: string;
  entity_type?: string;
  entity_id?: string | number;
  metadata?: any;
  user?: Profile;
  customer?: Customer;
  skill?: Skill;
}

export interface RawTimelineItem {
  id: string;
  created_at: string;
  event_type: string;
  actor_id: string;
  entity_id: string;
  entity_type: string;
  description: string;
  metadata: any;
  changes?: any;
  users: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}