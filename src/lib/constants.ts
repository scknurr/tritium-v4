// Entity Types
export const ENTITY_TYPES = {
  USERS: 'profiles',
  CUSTOMERS: 'customers',
  SKILLS: 'skills'
} as const;

// Relationship Types
export const RELATIONSHIP_TYPES = {
  USER_CUSTOMER: 'user-customer',
  USER_SKILL: 'user-skill',
  CUSTOMER_SKILL: 'customer-skill'
} as const;

// Event Types
export const EVENT_TYPES = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE'
} as const;

// Proficiency Levels
export const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' }
] as const;

// Utilization Levels
export const UTILIZATION_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
] as const;

// Customer Status
export const CUSTOMER_STATUS = {
  ACTIVE: 'active',
  HISTORICAL: 'historical'
} as const;