import { supabase } from './supabase';
import { EVENT_TYPES } from './constants';

interface AuditLogParams {
  eventType: keyof typeof EVENT_TYPES;
  description: string;
  entityType: string;
  entityId: string | number;
  userId: string;
}

interface EntityChangeParams {
  eventType: keyof typeof EVENT_TYPES;
  entityType: string;
  entityId: string | number;
  userId: string;
  changes?: { field: string; oldValue: any; newValue: any }[];
  entityName?: string;
}

async function getEntityName(type: string, id: string | number): Promise<string> {
  try {
    switch (type) {
      case 'profiles': {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', id)
          .single();
        return data?.full_name || data?.email || String(id);
      }
      case 'customers': {
        const { data } = await supabase
          .from('customers')
          .select('name')
          .eq('id', id)
          .single();
        return data?.name || String(id);
      }
      case 'skills': {
        const { data } = await supabase
          .from('skills')
          .select('name')
          .eq('id', id)
          .single();
        return data?.name || String(id);
      }
      default:
        return String(id);
    }
  } catch (error) {
    console.error('Error getting entity name:', error);
    return String(id);
  }
}

async function getUserName(userId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();
    return data?.full_name || data?.email || userId;
  } catch (error) {
    console.error('Error getting user name:', error);
    return userId;
  }
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return 'empty';
  if (typeof value === 'object') {
    if ('name' in value) return value.name;
    if ('full_name' in value) return value.full_name;
    return JSON.stringify(value);
  }
  return String(value);
}

export async function createAuditLog({
  eventType,
  description,
  entityType,
  entityId,
  userId
}: AuditLogParams) {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        event_type: eventType,
        description,
        entity_type: entityType,
        entity_id: String(entityId),
        user_id: userId
      }]);

    if (error) {
      console.error('Error creating audit log:', error);
    }
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

export async function createEntityChangeLog({
  eventType,
  entityType,
  entityId,
  userId,
  changes,
  entityName: providedEntityName
}: EntityChangeParams) {
  try {
    const [userName, entityName] = await Promise.all([
      getUserName(userId),
      providedEntityName || getEntityName(entityType, entityId)
    ]);

    let description: string;
    
    switch (eventType) {
      case EVENT_TYPES.INSERT:
        description = `${userName} created ${entityType} "${entityName}"`;
        break;
      
      case EVENT_TYPES.DELETE:
        description = `${userName} deleted ${entityType} "${entityName}"`;
        break;
      
      case EVENT_TYPES.UPDATE:
        if (changes && changes.length > 0) {
          const changeDescriptions = changes.map(({ field, oldValue, newValue }) => 
            `${field} from "${formatValue(oldValue)}" to "${formatValue(newValue)}"`
          );
          
          if (changeDescriptions.length === 1) {
            description = `${userName} updated ${changeDescriptions[0]} for ${entityType} "${entityName}"`;
          } else {
            description = `${userName} updated ${entityType} "${entityName}": ${changeDescriptions.join(', ')}`;
          }
        } else {
          description = `${userName} updated ${entityType} "${entityName}"`;
        }
        break;
      
      default:
        description = `${userName} performed ${eventType} on ${entityType} "${entityName}"`;
    }

    await createAuditLog({
      eventType,
      description,
      entityType,
      entityId,
      userId
    });
  } catch (error) {
    console.error('Error creating entity change log:', error);
  }
}

export async function createEntityDeletionAuditLogs(
  entityType: string,
  entityId: string | number,
  userId: string
) {
  try {
    const entityName = await getEntityName(entityType, entityId);

    // Create the main deletion log
    await createEntityChangeLog({
      eventType: EVENT_TYPES.DELETE,
      entityType,
      entityId,
      userId,
      entityName
    });

    // Handle related records based on entity type
    switch (entityType) {
      case 'profiles': {
        // Get related customer assignments
        const { data: customerAssignments } = await supabase
          .from('user_customers')
          .select('*, customer:customers(name)')
          .eq('user_id', entityId);

        if (customerAssignments) {
          for (const assignment of customerAssignments) {
            await createEntityChangeLog({
              eventType: EVENT_TYPES.DELETE,
              entityType: 'customers',
              entityId: assignment.customer_id,
              userId,
              entityName: assignment.customer?.name,
              changes: [{
                field: 'team member',
                oldValue: entityName,
                newValue: null
              }]
            });
          }
        }

        // Get related skill assignments
        const { data: skillAssignments } = await supabase
          .from('user_skills')
          .select('*, skill:skills(name)')
          .eq('user_id', entityId);

        if (skillAssignments) {
          for (const assignment of skillAssignments) {
            await createEntityChangeLog({
              eventType: EVENT_TYPES.DELETE,
              entityType: 'skills',
              entityId: assignment.skill_id,
              userId,
              entityName: assignment.skill?.name,
              changes: [{
                field: 'user',
                oldValue: entityName,
                newValue: null
              }]
            });
          }
        }
        break;
      }

      case 'customers': {
        // Get related user assignments
        const { data: userAssignments } = await supabase
          .from('user_customers')
          .select('*, user:profiles(full_name, email)')
          .eq('customer_id', entityId);

        if (userAssignments) {
          for (const assignment of userAssignments) {
            const userName = assignment.user?.full_name || assignment.user?.email;
            await createEntityChangeLog({
              eventType: EVENT_TYPES.DELETE,
              entityType: 'profiles',
              entityId: assignment.user_id,
              userId,
              entityName: userName,
              changes: [{
                field: 'customer assignment',
                oldValue: entityName,
                newValue: null
              }]
            });
          }
        }

        // Get related skill requirements
        const { data: skillRequirements } = await supabase
          .from('customer_skills')
          .select('*, skill:skills(name)')
          .eq('customer_id', entityId);

        if (skillRequirements) {
          for (const requirement of skillRequirements) {
            await createEntityChangeLog({
              eventType: EVENT_TYPES.DELETE,
              entityType: 'skills',
              entityId: requirement.skill_id,
              userId,
              entityName: requirement.skill?.name,
              changes: [{
                field: 'customer requirement',
                oldValue: entityName,
                newValue: null
              }]
            });
          }
        }
        break;
      }

      case 'skills': {
        // Get related user proficiencies
        const { data: userProficiencies } = await supabase
          .from('user_skills')
          .select('*, user:profiles(full_name, email)')
          .eq('skill_id', entityId);

        if (userProficiencies) {
          for (const proficiency of userProficiencies) {
            const userName = proficiency.user?.full_name || proficiency.user?.email;
            await createEntityChangeLog({
              eventType: EVENT_TYPES.DELETE,
              entityType: 'profiles',
              entityId: proficiency.user_id,
              userId,
              entityName: userName,
              changes: [{
                field: 'skill',
                oldValue: entityName,
                newValue: null
              }]
            });
          }
        }

        // Get related customer requirements
        const { data: customerRequirements } = await supabase
          .from('customer_skills')
          .select('*, customer:customers(name)')
          .eq('skill_id', entityId);

        if (customerRequirements) {
          for (const requirement of customerRequirements) {
            await createEntityChangeLog({
              eventType: EVENT_TYPES.DELETE,
              entityType: 'customers',
              entityId: requirement.customer_id,
              userId,
              entityName: requirement.customer?.name,
              changes: [{
                field: 'skill requirement',
                oldValue: entityName,
                newValue: null
              }]
            });
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error('Error creating deletion audit logs:', error);
  }
}

export async function createRelationshipAuditLog({
  eventType,
  entityType,
  entityId,
  userId,
  entityName,
  relatedEntityType,
  relatedEntityId,
  relatedEntityName,
  details = {}
}: Omit<AuditLogParams, 'description'> & {
  entityName: string;
  relatedEntityType: string;
  relatedEntityId: string | number;
  relatedEntityName: string;
  details?: Record<string, any>;
}) {
  try {
    const userName = await getUserName(userId);
    let description = '';

    // Get role name if it exists
    let roleName = '';
    if (details.role_id) {
      const { data: role } = await supabase
        .from('customer_roles')
        .select('name')
        .eq('id', details.role_id)
        .single();
      if (role) {
        roleName = role.name;
      }
    }

    switch (eventType) {
      case EVENT_TYPES.INSERT:
        switch (`${entityType}-${relatedEntityType}`) {
          case 'profiles-customers':
            description = `${userName} assigned ${entityName} to ${relatedEntityName}${roleName ? ` as ${roleName}` : ''}`;
            break;
          case 'profiles-skills':
            description = `${userName} added skill "${relatedEntityName}" to ${entityName}${details.proficiency_level ? ` at ${details.proficiency_level} level` : ''}`;
            break;
          case 'customers-skills':
            description = `${userName} added skill requirement "${relatedEntityName}" to ${entityName}${details.utilization_level ? ` at ${details.utilization_level} utilization` : ''}`;
            break;
        }
        break;

      case EVENT_TYPES.UPDATE:
        switch (`${entityType}-${relatedEntityType}`) {
          case 'profiles-customers':
            description = `${userName} updated ${entityName}'s role at ${relatedEntityName} to ${roleName}`;
            break;
          case 'profiles-skills':
            description = `${userName} updated ${entityName}'s proficiency in ${relatedEntityName} to ${details.proficiency_level}`;
            break;
          case 'customers-skills':
            description = `${userName} updated ${entityName}'s requirement for ${relatedEntityName} to ${details.utilization_level} utilization`;
            break;
        }
        break;

      case EVENT_TYPES.DELETE:
        switch (`${entityType}-${relatedEntityType}`) {
          case 'profiles-customers':
            description = `${userName} removed ${entityName} from ${relatedEntityName}`;
            break;
          case 'profiles-skills':
            description = `${userName} removed skill "${relatedEntityName}" from ${entityName}`;
            break;
          case 'customers-skills':
            description = `${userName} removed skill requirement "${relatedEntityName}" from ${entityName}`;
            break;
        }
        break;
    }

    // Create audit logs for both entities
    await Promise.all([
      createAuditLog({
        eventType,
        description,
        entityType,
        entityId,
        userId
      }),
      createAuditLog({
        eventType,
        description,
        entityType: relatedEntityType,
        entityId: relatedEntityId,
        userId
      })
    ]);
  } catch (error) {
    console.error('Error creating relationship audit log:', error);
  }
}