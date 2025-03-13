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
import type { RelationshipType } from '../ui/RelatedEntities';
import { useQueryClient } from '@tanstack/react-query';

// Define the RelatedEntity interface here so we don't need to import it
interface RelatedEntity {
  id: string | number;
  name: string;
  subtitle?: string;
  link: string;
  relationshipId?: string | number;
  relationshipData?: any;
}

// Define TimelineItem interface for type safety
interface TimelineItem {
  id: number;
  event_type: string;
  description: string;
  event_time: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
}

interface EntityDetailProps {
  entityType: 'profiles' | 'customers' | 'skills';
  entityId: string | number;
  title: string;
  icon: LucideIcon;
  form: React.ReactNode;
  mainContent: React.ReactNode;
  description?: string;
  relatedEntities: {
    title: string;
    icon: LucideIcon;
    entities: RelatedEntity[];
    loading?: boolean;
    type?: RelationshipType;
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
  description,
  relatedEntities,
  onRefresh,
  deleteInfo
}: EntityDetailProps) {
  const queryClient = useQueryClient();

  const handleTimelineUpdate = React.useCallback(async () => {
    // Invalidate both the entity and audit log queries
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.audit.list(entityType, entityId)
      }),
      queryClient.invalidateQueries({
        queryKey: [entityType, 'detail', entityId]
      })
    ]);
    // Call onRefresh to update the entity data
    await onRefresh();
  }, [queryClient, entityType, entityId, onRefresh]);

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
    onUpdate: handleTimelineUpdate // Use handleTimelineUpdate here instead of onRefresh
  });

  const { data: timeline = [], isLoading: timelineLoading } = useQueryWithCache<TimelineItem[]>(
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
      } as any) // Using any to bypass type checking for the cloned element props
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
          {description && (
            <div className="mt-2 text-gray-600 dark:text-gray-300">
              <p>{description}</p>
            </div>
          )}
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
            items={timeline as TimelineItem[]}
            loading={timelineLoading}
            entityType={entityType}
            entityId={entityId}
            onUpdate={handleTimelineUpdate}
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