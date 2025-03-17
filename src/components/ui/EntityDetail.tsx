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
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

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
  subtitle?: string;
  icon: LucideIcon;
  form: React.ReactNode;
  mainContent: React.ReactNode;
  description?: string;
  imageUrl?: string;
  onImageUpload?: (file: File) => Promise<void>;
  tags?: Array<{label: string; color?: string}>;
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
  hideOldTimeline?: boolean; // Added parameter to control visibility of old timeline
}

export function EntityDetail({
  entityType,
  entityId,
  title,
  subtitle,
  icon: Icon,
  form,
  mainContent,
  description,
  imageUrl,
  onImageUpload,
  tags = [],
  relatedEntities,
  onRefresh,
  deleteInfo,
  hideOldTimeline = false // Default to showing old timeline for backward compatibility
}: EntityDetailProps) {
  const queryClient = useQueryClient();

  // Set up real-time subscription to the entity table
  useRealtimeSubscription({
    table: entityType,
    filter: { id: entityId },
    onUpdate: async () => {
      // Invalidate entity query when data changes
      await queryClient.invalidateQueries({
        queryKey: [entityType, 'detail', entityId]
      });
      // Call onRefresh to update the entity data
      await onRefresh();
    }
  });

  // Set up real-time subscription to audit_logs for this entity
  useRealtimeSubscription({
    table: 'audit_logs',
    filter: { 
      entity_type: entityType,
      entity_id: entityId
    },
    onUpdate: async () => {
      // Invalidate audit logs query when data changes
      await queryClient.invalidateQueries({
        queryKey: queryKeys.audit.list(entityType, entityId)
      });
    }
  });

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

  // Translate entityType to the EntityHeader format
  const getEntityHeaderType = (): 'user' | 'customer' | 'skill' => {
    switch(entityType) {
      case 'profiles': return 'user';
      case 'customers': return 'customer';
      case 'skills': return 'skill';
      default: return 'user';
    }
  };

  return (
    <div className="space-y-8">
      <Card className="overflow-visible">
        <EntityHeader
          title={title}
          subtitle={subtitle}
          description={description}
          onEdit={() => setIsFormOpen(true)}
          onDelete={() => setIsDeleteModalOpen(true)}
          entityType={getEntityHeaderType()}
          imageUrl={imageUrl}
          onImageUpload={onImageUpload}
          tags={tags}
        />
        
        <div className="mt-8">
          {mainContent}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Related entities column - takes up 1/3 of the space on large screens */}
        {relatedEntities.length > 0 && (
          <div className="lg:col-span-1 space-y-6">
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
        )}

        {/* Main timeline or content column - takes up 2/3 of the space on large screens */}
        <div className={`lg:col-span-${relatedEntities.length > 0 ? '2' : '3'}`}>
          {/* Only render the old Timeline component if hideOldTimeline is false */}
          {!hideOldTimeline && (
            <Card>
              <Timeline
                title="Activity Timeline"
                icon={Icon}
                items={timeline as unknown as TimelineItem[]}
                loading={timelineLoading}
                entityType={entityType}
                entityId={entityId}
                onUpdate={handleTimelineUpdate}
              />
            </Card>
          )}
        </div>
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