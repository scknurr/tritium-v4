import React, { cloneElement, isValidElement } from 'react';
import { Card } from 'flowbite-react';
import { Timeline } from './Timeline';
import { RelatedEntities } from './RelatedEntities';
import { EntityHeader } from './EntityHeader';
import { DeleteModal } from './DeleteModal';
import { useEntity } from '../../hooks/useEntity';
import { useQueryWithCache } from '../../lib/hooks/useQueryWithCache';
import { queryKeys } from '../../lib/queryKeys';
import type { LucideIcon } from 'lucide-react';
import type { RelatedEntity } from '../../types';

interface EntityDetailProps {
  entityType: 'profiles' | 'customers' | 'skills';
  entityId: string | number;
  title: string;
  icon: LucideIcon;
  form: React.ReactNode;
  mainContent: React.ReactNode;
  relatedEntities: {
    title: string;
    icon: LucideIcon;
    entities: RelatedEntity[];
    loading?: boolean;
    type?: string;
    onUpdate?: () => void;
  }[];
  onRefresh: () => Promise<void>;
  deleteInfo: {
    entityName: string;
    relatedDataDescription: string;
  };
}

export function EntityDetail({
  entityType,
  entityId,
  title,
  icon: Icon,
  form,
  mainContent,
  relatedEntities,
  onRefresh,
  deleteInfo
}: EntityDetailProps) {
  const {
    isFormOpen,
    setIsFormOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    handleDelete
  } = useEntity({
    entityType,
    entityId,
    onUpdate: onRefresh
  });

  const { data: timeline = [], isLoading: timelineLoading } = useQueryWithCache(
    queryKeys.audit.list(entityType, entityId),
    'audit_logs',
    {
      filter: { column: 'entity_id', value: entityId },
      orderBy: { column: 'event_time', ascending: false }
    }
  );

  // Clone the form element with updated props
  const formElement = isValidElement(form)
    ? cloneElement(form, {
        isOpen: isFormOpen,
        onClose: () => setIsFormOpen(false)
      })
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-4">
          <EntityHeader
            title={title}
            onEdit={() => setIsFormOpen(true)}
            onDelete={() => setIsDeleteModalOpen(true)}
          />
          {mainContent}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {relatedEntities.map((related, index) => (
            <RelatedEntities
              key={index}
              title={related.title}
              icon={related.icon}
              entities={related.entities}
              loading={related.loading}
              type={related.type}
              userId={entityType === 'profiles' ? entityId as string : undefined}
              customerId={entityType === 'customers' ? entityId as number : undefined}
              skillId={entityType === 'skills' ? entityId as number : undefined}
              onUpdate={related.onUpdate}
            />
          ))}
        </div>

        <Card>
          <Timeline
            title="Activity Timeline"
            icon={Icon}
            items={timeline}
            loading={timelineLoading}
            entityType={entityType}
            entityId={entityId}
            onUpdate={onRefresh}
          />
        </Card>
      </div>

      {formElement}

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        entityName={deleteInfo.entityName}
        entityType={entityType === 'profiles' ? 'User' : entityType === 'customers' ? 'Customer' : 'Skill'}
        relatedDataDescription={deleteInfo.relatedDataDescription}
      />
    </div>
  );
}