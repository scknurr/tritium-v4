import React, { useState } from 'react';
import { Button, Card } from 'flowbite-react';
import { Plus, Trash2 } from 'lucide-react';
import { UserCustomerForm } from '../forms/UserCustomerForm';
import { UserSkillForm } from '../forms/UserSkillForm';
import { CustomerSkillForm } from '../forms/CustomerSkillForm';
import { supabase } from '../../lib/supabase';

interface RelationshipManagerProps {
  type: 'user-customer' | 'user-skill' | 'customer-skill';
  userId?: string;
  customerId?: number;
  skillId?: number;
  onUpdate: () => void;
  relationships: any[];
}

export function RelationshipManager({ 
  type, 
  userId, 
  customerId, 
  skillId,
  onUpdate,
  relationships
}: RelationshipManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const getTableName = () => {
    switch (type) {
      case 'user-customer':
        return 'user_customers';
      case 'user-skill':
        return 'user_skills';
      case 'customer-skill':
        return 'customer_skills';
    }
  };

  const getEntityType = () => {
    switch (type) {
      case 'user-customer':
        return userId ? 'customers' : 'profiles';
      case 'user-skill':
        return userId ? 'skills' : 'profiles';
      case 'customer-skill':
        return customerId ? 'skills' : 'customers';
    }
  };

  const getEntityId = () => {
    switch (type) {
      case 'user-customer':
        return userId ? customerId : userId;
      case 'user-skill':
        return userId ? skillId : userId;
      case 'customer-skill':
        return customerId ? skillId : customerId;
    }
  };

  const createAuditLog = async (eventType: string, description: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const entityType = getEntityType();
      const entityId = getEntityId();

      if (!entityType || !entityId) return;

      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          event_type: eventType,
          description,
          entity_type: entityType,
          entity_id: entityId,
          user_id: user.id
        }]);

      if (error) {
        console.error('Error creating audit log:', error);
      }
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  };

  const handleDelete = async (relationshipId: number, name: string) => {
    try {
      const { error } = await supabase
        .from(getTableName())
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;

      await createAuditLog(
        'DELETE',
        `Removed from ${name}`
      );

      onUpdate();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error deleting relationship:', error);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const { error } = await supabase
        .from(getTableName())
        .insert([data]);

      if (error) throw error;

      // Get the names of both entities involved
      let description = '';
      switch (type) {
        case 'user-customer': {
          const { data: customer } = await supabase
            .from('customers')
            .select('name')
            .eq('id', data.customer_id)
            .single();
          description = `Added to ${customer?.name}`;
          break;
        }
        case 'user-skill': {
          const { data: skill } = await supabase
            .from('skills')
            .select('name')
            .eq('id', data.skill_id)
            .single();
          description = `Added to ${skill?.name}`;
          break;
        }
        case 'customer-skill': {
          const { data: skill } = await supabase
            .from('skills')
            .select('name')
            .eq('id', data.skill_id)
            .single();
          description = `Added to ${skill?.name}`;
          break;
        }
      }

      await createAuditLog('INSERT', description);

      onUpdate();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error creating relationship:', error);
    }
  };

  const getForm = () => {
    switch (type) {
      case 'user-customer':
        return (
          <UserCustomerForm
            userId={userId}
            customerId={customerId}
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSubmit={handleSubmit}
          />
        );
      case 'user-skill':
        return (
          <UserSkillForm
            userId={userId}
            skillId={skillId}
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSubmit={handleSubmit}
          />
        );
      case 'customer-skill':
        return (
          <CustomerSkillForm
            customerId={customerId}
            skillId={skillId}
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSubmit={handleSubmit}
          />
        );
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Manage Relationships</h3>
        <Button size="sm" onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      <div className="space-y-2">
        {relationships.map((rel) => (
          <div
            key={rel.id}
            className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
          >
            <span>{rel.name}</span>
            <Button
              size="sm"
              color="failure"
              onClick={() => handleDelete(rel.id, rel.name)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {relationships.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No relationships found
          </p>
        )}
      </div>

      {getForm()}
    </Card>
  );
}