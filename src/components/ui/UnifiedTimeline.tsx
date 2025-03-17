/**
 * UnifiedTimeline.tsx
 * 
 * A comprehensive timeline component that displays various event types in a consistent format.
 * 
 * This component handles the display of all activity events in the application including:
 * - User events (account creation, profile updates)
 * - Customer events (creation, updates)
 * - Skill events (creation, updates)
 * - Skill application events (skills applied at customers)
 * 
 * The component extracts metadata from event objects to display detailed information
 * about each event, including relationships between entities.
 * 
 * IMPORTANT IMPLEMENTATION NOTES:
 * 
 * 1. Skill Application Events:
 *    - These events must extract skill/customer info from multiple potential sources:
 *      a. Direct event.skill and event.customer objects
 *      b. Metadata fields (skill_id, skill_name, customer_id, customer_name)
 *      c. Nested metadata objects
 *    - Display includes skill name, customer name, and proficiency level
 * 
 * 2. Entity Links:
 *    - Entity links are created for users, skills, and customers when IDs are available
 *    - Fallback to plain text when only names are available
 * 
 * 3. Context Awareness:
 *    - The component is context-aware and will adapt display based on which entity page it's shown on
 *    - E.g., on a customer page, it won't redundantly show the customer name in events
 * 
 * Last Updated: March 12, 2025
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Building, GraduationCap, Clock, RefreshCw, 
  Trash, Pencil, Star, Gauge, Wrench, X, Plus 
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { 
  TimelineEvent, 
  TimelineEventType, 
  TimelineProps 
} from '../../types/timeline';
import { formatTimeAgo } from '../../lib/utils';
import { format } from 'date-fns';
import { createLogger } from '../../lib/debug';
import { EntityLink } from './EntityLink';

// Set up logger for this component
const logger = createLogger('UnifiedTimeline');

// Define icon and color mapping for different entity types
interface EntityStyleConfig {
  icon: LucideIcon;
  color: string;
}

// Map entity types to their visual representation
const entityStyles = {
  user: {
    icon: Users,
    color: 'text-blue-500'
  },
  customer: {
    icon: Building,
    color: 'text-green-500'
  },
  skill: {
    icon: GraduationCap,
    color: 'text-purple-500'
  },
  default: {
    icon: Clock,
    color: 'text-gray-500'
  }
} as const;

// Map event types to descriptive verbs and styles
interface EventStyleConfig {
  verb: string;
  icon: LucideIcon;
  color: string;
}

// Default style for unknown event types
const defaultEventStyle: EventStyleConfig = {
  verb: 'performed action',
  icon: Clock,
  color: 'text-gray-500'
};

// All event styles in a single object for safer lookup
const allEventStyles: Record<string, EventStyleConfig> = {
  // User events
  [TimelineEventType.USER_CREATED]: { 
    verb: 'created account', 
    icon: Plus, 
    color: 'text-blue-500' 
  },
  [TimelineEventType.USER_UPDATED]: { 
    verb: 'updated profile', 
    icon: Wrench, 
    color: 'text-blue-500' 
  },
  [TimelineEventType.USER_DELETED]: { 
    verb: 'deleted account', 
    icon: Trash, 
    color: 'text-red-500' 
  },
  [TimelineEventType.USER_JOINED]: { 
    verb: 'joined', 
    icon: Plus, 
    color: 'text-green-500' 
  },
  [TimelineEventType.USER_LEFT]: { 
    verb: 'left', 
    icon: X, 
    color: 'text-orange-500' 
  },

  // Customer events
  [TimelineEventType.CUSTOMER_CREATED]: { 
    verb: 'created', 
    icon: Plus, 
    color: 'text-green-500' 
  },
  [TimelineEventType.CUSTOMER_UPDATED]: { 
    verb: 'updated', 
    icon: Wrench, 
    color: 'text-green-500' 
  },
  [TimelineEventType.CUSTOMER_DELETED]: { 
    verb: 'deleted', 
    icon: Trash, 
    color: 'text-red-500' 
  },

  // Skill events
  [TimelineEventType.SKILL_CREATED]: { 
    verb: 'added skill', 
    icon: Plus, 
    color: 'text-purple-500' 
  },
  [TimelineEventType.SKILL_UPDATED]: { 
    verb: 'updated skill', 
    icon: Wrench, 
    color: 'text-purple-500' 
  },
  [TimelineEventType.SKILL_DELETED]: { 
    verb: 'deleted skill', 
    icon: Trash, 
    color: 'text-red-500' 
  },

  // Skill application events
  [TimelineEventType.SKILL_APPLIED]: { 
    verb: 'applied', 
    icon: Star, 
    color: 'text-teal-500' 
  },
  [TimelineEventType.SKILL_REMOVED]: { 
    verb: 'removed', 
    icon: X, 
    color: 'text-red-500' 
  },

  // Skill profile events
  [TimelineEventType.SKILL_PROFILE_ADDED]: { 
    verb: 'added skill', 
    icon: Plus, 
    color: 'text-purple-500' 
  },
  [TimelineEventType.SKILL_PROFILE_UPDATED]: { 
    verb: 'updated skill', 
    icon: Wrench, 
    color: 'text-purple-500' 
  },
  [TimelineEventType.SKILL_PROFILE_REMOVED]: { 
    verb: 'removed skill', 
    icon: X, 
    color: 'text-red-500' 
  },

  // Generic events (fallbacks)
  [TimelineEventType.GENERIC_CREATED]: { 
    verb: 'created', 
    icon: Plus, 
    color: 'text-blue-500' 
  },
  [TimelineEventType.GENERIC_UPDATED]: { 
    verb: 'updated', 
    icon: Wrench, 
    color: 'text-blue-500' 
  },
  [TimelineEventType.GENERIC_DELETED]: { 
    verb: 'deleted', 
    icon: Trash, 
    color: 'text-red-500' 
  }
};

/**
 * Helper function to get event style safely
 */
function getEventStyle(type: TimelineEventType): EventStyleConfig {
  return allEventStyles[type] || defaultEventStyle;
}

/**
 * Helper to format proficiency level display
 */
function formatProficiencyLevel(proficiency: string | number | undefined): string {
  if (proficiency === undefined || proficiency === null) return '';
  
  // Convert to string first
  const level = String(proficiency).toLowerCase();
  
  // Handle numeric levels
  if (['1', '2', '3', '4', '5'].includes(level)) {
    return `Level ${level}`;
  }
  
  // Handle alphabetic levels
  if (['b', 'i', 'a', 'e'].includes(level)) {
    if (level === 'b') return 'Novice';
    if (level === 'i') return 'Intermediate';
    if (level === 'a') return 'Advanced';
    if (level === 'e') return 'Expert';
  }
  
  // Handle text levels
  if (level === 'beginner' || level === 'basic' || level === 'novice') return 'Novice';
  if (level === 'intermediate') return 'Intermediate';
  if (level === 'advanced') return 'Advanced';
  if (level === 'expert') return 'Expert';
  
  // If it doesn't match any pattern, just capitalize it
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/**
 * Formatted display component for changes (old value -> new value)
 */
function ChangesDisplay({ changes }: { changes: Array<{ field: string; oldValue: any; newValue: any }> }) {
  // Skip ID fields and empty changes
  const filteredChanges = changes.filter(change => 
    change && 
    change.field && 
    !change.field.toLowerCase().includes('id') && 
    change.oldValue !== change.newValue
  );
  
  if (filteredChanges.length === 0) return null;
  
  return (
    <div className="ml-6 mt-1 text-sm p-2">
      {filteredChanges.map((change, index) => {
        // Format field name to be more readable
        const fieldName = change.field
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
          
        // Format values, handling objects specially
        const formatValue = (value: any) => {
          if (value === null || value === undefined) return 'None';
          if (typeof value === 'object') {
            if (value.name) return value.name;
            return JSON.stringify(value);
          }
          return String(value);
        };
        
        return (
          <div key={index} className="text-gray-500 dark:text-gray-400">
            {`${fieldName}: ${formatValue(change.oldValue)} → ${formatValue(change.newValue)}`}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Format timestamp to display as "Month DD, YYYY at h:mm A"
 */
function formatTimestamp(timestamp: string): string {
  try {
    return format(new Date(timestamp), "MMMM d, yyyy 'at' h:mm a");
  } catch (e) {
    return timestamp;
  }
}

/**
 * Generates text content for a timeline event
 */
function getEventText(event: TimelineEvent, contextType?: string): React.ReactNode {
  const style = getEventStyle(event.type);
  
  // Extract entity information from the event
  const skill = event.skill || (event.metadata?.skill_id ? {
    id: event.metadata.skill_id,
    name: event.metadata.skill_name || 'Unknown Skill',
    proficiencyLevel: event.metadata.proficiency || event.metadata.proficiency_level
  } : null);
  
  const customer = event.customer || (event.metadata?.customer_id ? {
    id: event.metadata.customer_id,
    name: event.metadata.customer_name || 'Unknown Customer'
  } : null);
  
  const user = event.user || (event.metadata?.user_id ? {
    id: event.metadata.user_id,
    name: event.metadata.user_name || event.metadata.user_email || 'Unknown User'
  } : null);
  
  // Function to determine if we should show entity based on context
  const shouldShowEntity = (entityType: string): boolean => {
    if (!contextType) return true;
    return contextType !== entityType;
  };

  // Based on event type, render the appropriate message
  switch (event.type) {
    // User events
    case TimelineEventType.USER_CREATED:
    case TimelineEventType.USER_UPDATED:
    case TimelineEventType.USER_DELETED: {
      if (!user || !shouldShowEntity('user')) {
        return <span>{style.verb}</span>;
      }
      
      return (
        <>
          <span>{style.verb}</span>
          {shouldShowEntity('user') && (
            <>
              <Users className="w-4 h-4 text-blue-500" />
              <EntityLink
                type="user"
                id={user.id}
                name={user.name}
              />
            </>
          )}
        </>
      );
    }
    
    // Customer events
    case TimelineEventType.CUSTOMER_CREATED:
    case TimelineEventType.CUSTOMER_UPDATED:
    case TimelineEventType.CUSTOMER_DELETED: {
      if (!customer || !shouldShowEntity('customer')) {
        return <span>{style.verb}</span>;
      }
      
      return (
        <>
          <span>{style.verb}</span>
          {shouldShowEntity('customer') && (
            <>
              <Building className="w-4 h-4 text-green-500" />
              <EntityLink
                type="customer"
                id={customer.id}
                name={customer.name}
              />
            </>
          )}
        </>
      );
    }
    
    // Skill events
    case TimelineEventType.SKILL_CREATED:
    case TimelineEventType.SKILL_UPDATED:
    case TimelineEventType.SKILL_DELETED: {
      if (!skill || !shouldShowEntity('skill')) {
        return <span>{style.verb}</span>;
      }
      
      return (
        <>
          <span>{style.verb}</span>
          {shouldShowEntity('skill') && (
            <>
              <GraduationCap className="w-4 h-4 text-purple-500" />
              <EntityLink
                type="skill"
                id={skill.id}
                name={skill.name}
              />
            </>
          )}
        </>
      );
    }
    
    // Skill application events
    case TimelineEventType.SKILL_APPLIED:
    case TimelineEventType.SKILL_REMOVED: {
      if (!skill && !customer) {
        return <span>{style.verb} a skill at a customer</span>;
      }
      
      if (contextType === 'customer') {
        // On customer page, focus on the skill
        if (!skill) return <span>{style.verb} a skill</span>;
        
        return (
          <>
            <span>{style.verb} skill</span>
            <GraduationCap className="w-4 h-4 text-purple-500" />
            <EntityLink 
              type="skill" 
              id={skill.id} 
              name={skill.name} 
            />
            {skill.proficiencyLevel && (
              <span> at <span className="font-medium">{formatProficiencyLevel(skill.proficiencyLevel)}</span></span>
            )}
          </>
        );
      }
      
      if (contextType === 'skill') {
        // On skill page, focus on the customer
        if (!customer) return <span>{style.verb} this skill at a customer</span>;
        
        return (
          <>
            <span>{style.verb} this skill at</span>
            <Building className="w-4 h-4 text-green-500" />
            <EntityLink 
              type="customer" 
              id={customer.id} 
              name={customer.name} 
            />
            {skill?.proficiencyLevel && (
              <span> at <span className="font-medium">{formatProficiencyLevel(skill.proficiencyLevel)}</span></span>
            )}
          </>
        );
      }
      
      // Full context with both skill and customer
      return (
        <>
          <span>{style.verb}</span>
          {skill && (
            <>
              <GraduationCap className="w-4 h-4 text-purple-500 ml-1" />
              <EntityLink 
                type="skill" 
                id={skill.id} 
                name={skill.name}
                className="ml-1" 
              />
            </>
          )}
          {customer && (
            <>
              <span> at </span>
              <Building className="w-4 h-4 text-green-500" />
              <EntityLink 
                type="customer" 
                id={customer.id} 
                name={customer.name} 
              />
            </>
          )}
          {skill?.proficiencyLevel && (
            <span> ({formatProficiencyLevel(skill.proficiencyLevel)})</span>
          )}
        </>
      );
    }
    
    // Skill profile events
    case TimelineEventType.SKILL_PROFILE_ADDED:
    case TimelineEventType.SKILL_PROFILE_UPDATED:
    case TimelineEventType.SKILL_PROFILE_REMOVED: {
      if (!skill) return <span>{style.verb}</span>;
      
      // Skip showing skill if it's the context
      if (contextType === 'skill') {
        return <span>{style.verb}</span>;
      }
      
      return (
        <>
          <span>{style.verb}</span>
          <GraduationCap className="w-4 h-4 text-purple-500" />
          <EntityLink 
            type="skill" 
            id={skill.id} 
            name={skill.name} 
          />
        </>
      );
    }
    
    // Generic fallbacks
    default:
      return <span>{style.verb}</span>;
  }
}

/**
 * Renders a single timeline event with consistent formatting
 * 
 * This component is responsible for extracting and displaying all relevant information
 * for a single timeline event, including proper formatting for different event types.
 * 
 * Special handling is provided for skill application events to ensure all metadata
 * is displayed consistently.
 */
function TimelineEventItem({ 
  event, 
  contextType 
}: { 
  event: TimelineEvent; 
  contextType?: string;
}) {
  // Enhanced debugging information specifically for customer contexts
  if (contextType === 'customers') {
    console.log('Customer Timeline Event:', {
      id: event.id,
      type: event.type,
      entity_type: event.entity_type,
      description: event.description,
      metadata: event.metadata,
      user: event.user,
      skill: event.skill,
      customer: event.customer
    });
  }
  
  // Debug console log for all timeline events
  console.log('TimelineEventItem rendering:', {
    id: event.id,
    type: event.type,
    contextType,
    metadata: event.metadata,
    description: event.description
  });
  
  const { type, user, timestamp, metadata } = event;
  const style = getEventStyle(type);
  
  // IMPROVED: More comprehensive detection for skill application events
  const isSkillApplication = 
    // Check event type - more comprehensive check including description patterns
    (type === TimelineEventType.SKILL_APPLIED || 
     type === TimelineEventType.SKILL_REMOVED ||
     (event.entity_type === 'skill_applications') ||
     (metadata?.type === TimelineEventType.SKILL_APPLIED) ||
     (event.original?.event_type === 'SKILL_APPLIED') ||
     ((event as any).event_type === 'SKILL_APPLIED') ||
     (event.description && (
       (event.description.toLowerCase().includes('applied') && 
        (event.description.toLowerCase().includes('skill') || 
         event.description.toLowerCase().includes('at'))) ||
       event.description.toLowerCase().includes('with') && 
       event.description.toLowerCase().includes('proficiency')
     )) ||
     (metadata && (
       metadata.skill_id || 
       metadata.skill_name || 
       metadata.skillName ||
       metadata.skill ||
       metadata.proficiency ||
       (metadata.customer_id && metadata.user_id) || // Likely a skill application if it has both
       metadata.application_id  // From ApplySkillButton
     )));

  // Log skill applications for debugging
  if (isSkillApplication) {
    console.log('Found skill application event:', {
      id: event.id,
      type: event.type,
      entity_type: event.entity_type,
      description: event.description,
      isCustomerContext: contextType === 'customers',
      metadata: metadata,
      user: event.user,
      skill: event.skill,
      customer: event.customer
    });
  }
  
  // Extract skill and customer information from the event
  let extractedSkillInfo: { id?: number; name: string } | null = null;
  let extractedCustomerInfo: { id?: number; name: string } | null = null;
  let extractedProficiencyInfo: string | null = null;
  
  // First try to get info from event properties (most reliable)
  if (event.skill) {
    extractedSkillInfo = {
      id: typeof event.skill.id === 'number' ? event.skill.id : undefined,
      name: event.skill.name
    };
  }
  
  if (event.customer) {
    extractedCustomerInfo = {
      id: typeof event.customer.id === 'number' ? event.customer.id : undefined,
      name: event.customer.name
    };
  }
  
  // Then try to get from metadata (may be more detailed or have proficiency)
  if (metadata) {
    // Extract proficiency (check all possible locations)
    if (!extractedProficiencyInfo) {
      extractedProficiencyInfo = 
        metadata.proficiency || 
        metadata.proficiencyLevel || 
        event.skill?.proficiencyLevel ||
        (metadata.metadata?.proficiency) || 
        null;
    }
    
    // Extract skill info if not already found
    if (!extractedSkillInfo) {
      const skillId = 
        metadata.skill_id || 
        metadata.skillId || 
        (metadata.skill?.id) || 
        (metadata.metadata?.skill_id);
        
      const skillName = 
        metadata.skill_name || 
        metadata.skillName || 
        (metadata.skill?.name) || 
        (metadata.metadata?.skill_name) ||
        'Unknown Skill';
        
      if (skillName || skillId) {
        extractedSkillInfo = {
          id: typeof skillId === 'number' ? skillId : undefined,
          name: skillName
        };
      }
    }
    
    // Extract customer info if not already found
    if (!extractedCustomerInfo) {
      const customerId = 
        metadata.customer_id || 
        metadata.customerId || 
        (metadata.customer?.id) || 
        (metadata.metadata?.customer_id);
        
      const customerName = 
        metadata.customer_name || 
        metadata.customerName || 
        (metadata.customer?.name) || 
        (metadata.metadata?.customer_name) ||
        'Unknown Customer';
        
      if (customerName || customerId) {
        extractedCustomerInfo = {
          id: typeof customerId === 'number' ? customerId : undefined,
          name: customerName
        };
      }
    }
  }
  
  // IMPROVED: Safer extraction from description with better parsing and error handling
  if (isSkillApplication && event.description) {
    // Log the description for debugging
    console.log('Trying to extract skill/customer from description:', event.description);
    
    const desc = event.description.toLowerCase();
    // Look for "Applied X at Y" pattern
    if (desc.includes('applied') && desc.includes('at')) {
      // Try several regex patterns to handle different description formats
      let match = event.description.match(/Applied\s+([^\s][^(at)]+?)\s+at\s+([^\s].+?)(?:\s+with|\s*$)/i);
      
      if (!match || match.length < 3) {
        // Try alternative pattern
        match = event.description.match(/Applied\s+"?([^"]+)"?\s+at\s+"?([^"]+)"?/i);
      }
      
      if (match && match.length >= 3) {
        console.log('Extracted from description:', { skill: match[1], customer: match[2] });
        
        // Extract skill info if needed
        if (!extractedSkillInfo && match[1]) {
          const skillName = match[1]?.trim() || '';
          // Only use this if we don't have better info
          if (skillName) {
            extractedSkillInfo = {
              name: skillName
            };
            console.log('Setting skill info from description:', { name: skillName });
          }
        }
        
        // Extract customer info if needed
        if (!extractedCustomerInfo && match[2]) {
          const customerName = match[2]?.trim() || '';
          // Only use this if we don't have better info
          if (customerName) {
            extractedCustomerInfo = {
              name: customerName
            };
            console.log('Setting customer info from description:', { name: customerName });
          }
        }
      }
      
      // Try to extract proficiency from description if not already found
      if (!extractedProficiencyInfo) {
        // Look for different proficiency patterns
        let profMatch = event.description.match(/with\s+(\w+)\s+proficiency/i);
        if (!profMatch) {
          profMatch = event.description.match(/\((\w+)\)/i); // Look for (EXPERT) pattern
        }
        
        if (profMatch && profMatch[1]) {
          extractedProficiencyInfo = profMatch[1];
          console.log('Extracted proficiency from description:', profMatch[1]);
        }
      }
    }
  }
  
  // Special handling for customer context - don't repeat the customer info
  if (contextType === 'customers' && extractedCustomerInfo) {
    console.log('In customer context - will hide customer name in display');
    // We're in a customer page, so we'll modify how we display
    // Don't show the customer name again, but keep the info for other uses
  }
  
  // IMPROVED: Enhanced display for all event types
  return (
    <div className="text-base font-normal text-gray-600 dark:text-gray-300 my-1">
      <div className="flex flex-col">
        {/* Main timeline entry showing actor and action */}
        <span className="flex items-center gap-1 flex-wrap">
          {/* Actor (user) */}
          <Users className="w-4 h-4 text-blue-500" />
          <EntityLink type="user" id={user.id} name={user.name} />
          
          {/* Action indicator - IMPROVED with clearer action verbs */}
          <span className={`ml-1 font-medium text-${style.color}`}>
            {isSkillApplication 
              ? (type === TimelineEventType.SKILL_REMOVED ? 'removed' : 'applied') 
              : style.verb}
          </span>
          
          {/* IMPROVED: Always show skill info for skill applications */}
          {isSkillApplication && extractedSkillInfo && (
            <>
              <GraduationCap className="w-4 h-4 text-purple-500 ml-1" />
              {extractedSkillInfo.id ? (
                <EntityLink type="skill" id={extractedSkillInfo.id} name={extractedSkillInfo.name} />
              ) : (
                <span className="text-purple-500 font-medium">{extractedSkillInfo.name}</span>
              )}
            </>
          )}
          
          {/* IMPROVED: Show customer info for skill applications only if not in customer context */}
          {isSkillApplication && extractedCustomerInfo && (contextType !== 'customers') && (
            <>
              <span className="ml-1">at</span>
              <Building className="w-4 h-4 text-green-500 ml-1" />
              {extractedCustomerInfo.id ? (
                <EntityLink type="customer" id={extractedCustomerInfo.id} name={extractedCustomerInfo.name} />
              ) : (
                <span className="text-green-500 font-medium">{extractedCustomerInfo.name}</span>
              )}
            </>
          )}
          
          {/* For customer context, just say "here" instead of repeating the customer name */}
          {isSkillApplication && extractedCustomerInfo && (contextType === 'customers') && (
            <span className="ml-1">at this customer</span>
          )}
          
          {/* For non-skill application events */}
          {!isSkillApplication && getEventText(event, contextType)}
        </span>
        
        {/* SIMPLIFIED: Compact display for skill applications matching the style of other entries */}
        {isSkillApplication && (
          <div className="text-xs text-gray-600 mt-1 ml-6">
            {extractedProficiencyInfo && (
              <span className="font-medium">Proficiency: {formatProficiencyLevel(extractedProficiencyInfo)}</span>
            )}
            
            {metadata?.notes && extractedProficiencyInfo && (
              <span className="mx-1">•</span>
            )}
            
            {metadata?.notes && (
              <span>Notes: {metadata.notes}</span>
            )}
          </div>
        )}
        
        {/* Notes display for non-skill application events */}
        {!isSkillApplication && metadata?.notes && (
          <div className="ml-6 mt-1 text-sm">
            <span className="font-medium">Notes:</span> {metadata.notes}
          </div>
        )}
        
        {/* Changes display if available */}
        {metadata?.changes && metadata.changes.length > 0 && (
          <ChangesDisplay changes={metadata.changes} />
        )}
        
        {/* IMPROVED: More prominent timestamp */}
        <span className="ml-6 text-xs text-gray-400 mt-1">
          {formatTimestamp(timestamp)}
        </span>
      </div>
    </div>
  );
}

/**
 * Unified Timeline component that renders all event types consistently
 */
export function UnifiedTimeline({
  title,
  icon,
  events = [],
  loading = false,
  error = null,
  emptyMessage = 'No activity yet',
  showHeader = true,
  entityType,
  entityId,
  onRefresh,
  onEventClick
}: {
  title: string;
  icon?: LucideIcon;  // Make icon optional
  events?: TimelineEvent[];
  loading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  showHeader?: boolean;
  entityType?: string;
  entityId?: string | number;
  onRefresh?: () => void;
  onEventClick?: (event: TimelineEvent) => void;
}) {
  // Log important state changes for debugging
  useEffect(() => {
    if (error) {
      logger.error('Timeline encountered an error', { error, entityType, entityId });
    }
  }, [error, entityType, entityId]);

  // Determine the context type for rendering events
  const contextType = entityType === 'profiles' ? 'user' : 
                      entityType === 'customers' ? 'customer' : 
                      entityType === 'skills' ? 'skill' : undefined;
  
  // Render the timeline
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-6">
      <div className="flex flex-col">
        {/* Title Bar */}
        {showHeader && (
          <h2 className="text-2xl font-bold mb-4">
            {title} <span className="text-blue-500">★ Updated ★</span>
          </h2>
        )}
        
        {/* Error State */}
        {error && (
          <div className="text-red-500 mb-4">
            Error loading timeline: {error.message}
          </div>
        )}
        
        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : events.length === 0 ? (
          // Empty State
          <div className="text-gray-500 py-6 text-center">{emptyMessage}</div>
        ) : (
          // Timeline List
          <ol className="relative border-l border-gray-200 dark:border-gray-700">
            {events.map(event => (
              <li 
                key={`${event.id}-${event.timestamp}`} 
                className="mb-6 ml-4"
                onClick={onEventClick ? () => onEventClick(event) : undefined}
              >
                <div className="absolute w-3 h-3 bg-blue-500 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900"></div>
                <TimelineEventItem event={event} contextType={contextType} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
} 