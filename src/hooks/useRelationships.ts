import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { createRelationshipAuditLog } from '../lib/audit';
import { EVENT_TYPES, ENTITY_TYPES, RELATIONSHIP_TYPES } from '../lib/constants';
import type { RelationshipType } from '../types';

interface UseRelationshipsProps {
  type: RelationshipType;
  userId?: string;
  customerId?: number;
  skillId?: number;
  onUpdate?: () => void;
}

export function useRelationships({
  type,
  userId,
  customerId,
  skillId,
  onUpdate
}: UseRelationshipsProps) {
  const [loading, setLoading] = useState(false);

  const getTableName = () => {
    switch (type) {
      case RELATIONSHIP_TYPES.USER_CUSTOMER:
        return 'user_customers';
      case RELATIONSHIP_TYPES.USER_SKILL:
        return 'user_skills';
      case RELATIONSHIP_TYPES.CUSTOMER_SKILL:
        return 'customer_skills';
      default:
        return '';
    }
  };

  const getEntityInfo = async () => {
    switch (type) {
      case RELATIONSHIP_TYPES.USER_CUSTOMER: {
        if (userId) {
          const { data: user } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', userId)
            .single();
          return {
            entityType: ENTITY_TYPES.USERS,
            entityId: userId,
            entityName: user?.full_name || user?.email || 'Unknown User',
            relatedEntityType: ENTITY_TYPES.CUSTOMERS
          };
        } else {
          const { data: customer } = await supabase
            .from('customers')
            .select('id, name')
            .eq('id', customerId)
            .single();
          return {
            entityType: ENTITY_TYPES.CUSTOMERS,
            entityId: customerId,
            entityName: customer?.name || 'Unknown Customer',
            relatedEntityType: ENTITY_TYPES.USERS
          };
        }
      }
      case RELATIONSHIP_TYPES.USER_SKILL: {
        if (userId) {
          const { data: user } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', userId)
            .single();
          return {
            entityType: ENTITY_TYPES.USERS,
            entityId: userId,
            entityName: user?.full_name || user?.email || 'Unknown User',
            relatedEntityType: ENTITY_TYPES.SKILLS
          };
        } else {
          const { data: skill } = await supabase
            .from('skills')
            .select('id, name')
            .eq('id', skillId)
            .single();
          return {
            entityType: ENTITY_TYPES.SKILLS,
            entityId: skillId,
            entityName: skill?.name || 'Unknown Skill',
            relatedEntityType: ENTITY_TYPES.USERS
          };
        }
      }
      case RELATIONSHIP_TYPES.CUSTOMER_SKILL: {
        if (customerId) {
          const { data: customer } = await supabase
            .from('customers')
            .select('id, name')
            .eq('id', customerId)
            .single();
          return {
            entityType: ENTITY_TYPES.CUSTOMERS,
            entityId: customerId,
            entityName: customer?.name || 'Unknown Customer',
            relatedEntityType: ENTITY_TYPES.SKILLS
          };
        } else {
          const { data: skill } = await supabase
            .from('skills')
            .select('id, name')
            .eq('id', skillId)
            .single();
          return {
            entityType: ENTITY_TYPES.SKILLS,
            entityId: skillId,
            entityName: skill?.name || 'Unknown Skill',
            relatedEntityType: ENTITY_TYPES.CUSTOMERS
          };
        }
      }
      default:
        return null;
    }
  };

  const getRelatedEntityInfo = async (data: any) => {
    switch (type) {
      case RELATIONSHIP_TYPES.USER_CUSTOMER: {
        if (userId) {
          const { data: customer } = await supabase
            .from('customers')
            .select('id, name')
            .eq('id', data.customer_id)
            .single();
          return {
            entityId: customer?.id,
            entityName: customer?.name || 'Unknown Customer'
          };
        } else {
          const { data: user } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', data.user_id)
            .single();
          return {
            entityId: user?.id,
            entityName: user?.full_name || user?.email || 'Unknown User'
          };
        }
      }
      case RELATIONSHIP_TYPES.USER_SKILL: {
        if (userId) {
          const { data: skill } = await supabase
            .from('skills')
            .select('id, name')
            .eq('id', data.skill_id)
            .single();
          return {
            entityId: skill?.id,
            entityName: skill?.name || 'Unknown Skill'
          };
        } else {
          const { data: user } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', data.user_id)
            .single();
          return {
            entityId: user?.id,
            entityName: user?.full_name || user?.email || 'Unknown User'
          };
        }
      }
      case RELATIONSHIP_TYPES.CUSTOMER_SKILL: {
        if (customerId) {
          const { data: skill } = await supabase
            .from('skills')
            .select('id, name')
            .eq('id', data.skill_id)
            .single();
          return {
            entityId: skill?.id,
            entityName: skill?.name || 'Unknown Skill'
          };
        } else {
          const { data: customer } = await supabase
            .from('customers')
            .select('id, name')
            .eq('id', data.customer_id)
            .single();
          return {
            entityId: customer?.id,
            entityName: customer?.name || 'Unknown Customer'
          };
        }
      }
      default:
        return null;
    }
  };

  const handleDelete = async (relationshipId: number) => {
    try {
      setLoading(true);

      // Get the relationship data before deleting
      const { data: relationship } = await supabase
        .from(getTableName())
        .select('*')
        .eq('id', relationshipId)
        .single();

      if (!relationship) {
        throw new Error('Relationship not found');
      }

      const { error } = await supabase
        .from(getTableName())
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const entityInfo = await getEntityInfo();
        const relatedInfo = await getRelatedEntityInfo(relationship);

        if (entityInfo && relatedInfo) {
          await createRelationshipAuditLog({
            eventType: EVENT_TYPES.DELETE,
            entityType: entityInfo.entityType,
            entityId: entityInfo.entityId,
            entityName: entityInfo.entityName,
            relatedEntityType: entityInfo.relatedEntityType,
            relatedEntityId: relatedInfo.entityId,
            relatedEntityName: relatedInfo.entityName,
            userId: user.id
          });
        }
      }

      onUpdate?.();
      return true;
    } catch (error) {
      console.error('Error deleting relationship:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from(getTableName())
        .insert([data]);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const entityInfo = await getEntityInfo();
        const relatedInfo = await getRelatedEntityInfo(data);

        if (entityInfo && relatedInfo) {
          await createRelationshipAuditLog({
            eventType: EVENT_TYPES.INSERT,
            entityType: entityInfo.entityType,
            entityId: entityInfo.entityId,
            entityName: entityInfo.entityName,
            relatedEntityType: entityInfo.relatedEntityType,
            relatedEntityId: relatedInfo.entityId,
            relatedEntityName: relatedInfo.entityName,
            userId: user.id
          });
        }
      }

      onUpdate?.();
      return true;
    } catch (error) {
      console.error('Error creating relationship:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: any, id: number) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from(getTableName())
        .update(data)
        .eq('id', id);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const entityInfo = await getEntityInfo();
        const relatedInfo = await getRelatedEntityInfo(data);

        if (entityInfo && relatedInfo) {
          await createRelationshipAuditLog({
            eventType: EVENT_TYPES.UPDATE,
            entityType: entityInfo.entityType,
            entityId: entityInfo.entityId,
            entityName: entityInfo.entityName,
            relatedEntityType: entityInfo.relatedEntityType,
            relatedEntityId: relatedInfo.entityId,
            relatedEntityName: relatedInfo.entityName,
            userId: user.id
          });
        }
      }

      onUpdate?.();
      return true;
    } catch (error) {
      console.error('Error updating relationship:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleDelete,
    handleCreate,
    handleUpdate
  };
}