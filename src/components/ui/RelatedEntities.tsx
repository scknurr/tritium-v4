import React, { useState } from 'react';
import { Card, Button } from 'flowbite-react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CustomerUserForm } from '../forms/CustomerUserForm';
import { UserSkillForm } from '../forms/UserSkillForm';
import { CustomerSkillForm } from '../forms/CustomerSkillForm';
import { useRelationships } from '../../hooks/useRelationships';
import type { LucideIcon } from 'lucide-react';

export type RelationshipType = 'user-customer' | 'user-skill' | 'customer-skill';

export interface RelatedEntity {
  id: string | number;
  name: string;
  subtitle?: string;
  link: string;
  relationshipId?: string | number;
  relationshipData?: any;
}

interface RelatedEntitiesProps {
  title: string;
  icon: LucideIcon;
  entities: RelatedEntity[];
  loading?: boolean;
  type?: RelationshipType;
  userId?: string;
  customerId?: number;
  skillId?: number;
  onUpdate?: () => void;
  'data-related-type'?: string;
}

export function RelatedEntities({ 
  title, 
  icon: Icon, 
  entities, 
  loading = false,
  type,
  userId,
  customerId,
  skillId,
  onUpdate,
  'data-related-type': dataRelatedType
}: RelatedEntitiesProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const { loading: relationshipLoading, handleDelete, handleCreate, handleUpdate } = useRelationships({
    type,
    userId,
    customerId,
    skillId,
    onUpdate
  });

  const handleEdit = (entity: RelatedEntity) => {
    setEditData(entity.relationshipData);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: any) => {
    const success = editData 
      ? await handleUpdate(data, editData.id)
      : await handleCreate(data);

    if (success) {
      setIsFormOpen(false);
      setEditData(null);
    }
  };

  const handleDeleteEntity = (id: string | number, name: string) => {
    handleDelete(typeof id === 'string' ? parseInt(id, 10) : id);
  };

  const getForm = () => {
    const formProps = {
      isOpen: isFormOpen,
      onClose: () => {
        setIsFormOpen(false);
        setEditData(null);
      },
      onSubmit: handleSubmit,
      userId,
      customerId,
      skillId,
      editData
    };

    switch (type) {
      case 'user-customer':
        return <CustomerUserForm {...formProps} />;
      case 'user-skill':
        return <UserSkillForm {...formProps} />;
      case 'customer-skill':
        return <CustomerSkillForm {...formProps} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-4 h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card data-related-type={dataRelatedType || type}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title}
        </h2>
        {type && (
          <Button 
            size="sm" 
            onClick={() => setIsFormOpen(true)}
            data-action="add-related"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {title.slice(0, -1)}
          </Button>
        )}
      </div>

      {entities.length > 0 ? (
        <div className="space-y-2">
          {entities.map((entity) => (
            <div
              key={entity.id}
              className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Link to={entity.link} className="flex-1">
                <div className="flex flex-col">
                  <span className="font-medium">{entity.name}</span>
                  {entity.subtitle && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {entity.subtitle}
                    </span>
                  )}
                </div>
              </Link>
              {type && entity.relationshipId && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="gray"
                    onClick={() => handleEdit(entity)}
                    disabled={relationshipLoading}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    color="failure"
                    onClick={() => handleDeleteEntity(entity.relationshipId!, entity.name)}
                    disabled={relationshipLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          No related {title.toLowerCase()} found
        </p>
      )}

      {getForm()}
    </Card>
  );
}