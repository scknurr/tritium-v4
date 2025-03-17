# 🧰 Hooks and Functions Reference

A reference guide to commonly used hooks and utility functions in the project.

## 📊 Data Query Hooks

### `useSupabaseQuery`

The primary hook for querying data from Supabase.

```typescript
function useSupabaseQuery<T>(
  table: string,
  options: {
    select?: string;
    filter?: { column: string; value: any; operator?: string };
    additionalFilters?: Array<{ column: string; value: any; operator?: string }>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
  }
): {
  data: T[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}
```

**Example Usage:**
```typescript
const { data: customers, loading, refresh } = useSupabaseQuery<Customer>(
  'customers',
  {
    select: '*, industry:industries(*)',
    filter: { column: 'id', value: id }
  }
);
```

### `useMutationWithCache`

Hook for performing data mutations with automatic cache invalidation.

```typescript
function useMutationWithCache<T>({
  table,
  invalidateQueries,
  successMessage
}: {
  table: string;
  invalidateQueries: string[];
  successMessage: string;
}): {
  create: (data: Partial<T>) => Promise<T>;
  update: ({ id, data }: { id: number; data: Partial<T> }) => Promise<T>;
  remove: (id: number) => Promise<void>;
  loading: boolean;
  error: Error | null;
}
```

**Example Usage:**
```typescript
const { update } = useMutationWithCache<Customer>({
  table: 'customers',
  invalidateQueries: [
    `customers:detail:${id}`,
    'customers:list',
    `audit:customers:${id}`
  ],
  successMessage: 'Customer updated successfully'
});

// Later in code:
await update({ id: Number(id), data: formData });
```

### `useUnifiedTimeline`

Hook for fetching and processing timeline events.

```typescript
function useUnifiedTimeline({
  entityType,
  entityId,
  relatedEntityType,
  relatedEntityId,
  limit = 10
}: UseUnifiedTimelineProps): {
  events: TimelineEvent[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}
```

**Example Usage:**
```typescript
const { 
  events: timelineEvents, 
  loading: timelineLoading,
  refresh: refreshTimeline 
} = useUnifiedTimeline({
  entityType: 'customers',
  entityId: id,
  relatedEntityType: 'customer',
  relatedEntityId: id,
  limit: 50
});
```

## 🔧 Utility Functions

### `transformRawTimelineItems`

Transforms raw timeline data from the database into structured timeline events.

```typescript
function transformRawTimelineItems(
  items: RawTimelineItem[]
): TimelineEvent[]
```

### `createAuditLog`

Creates a new audit log entry in the database.

```typescript
async function createAuditLog({
  type,
  description,
  entityType,
  entityId,
  userId,
  metadata
}: {
  type: string;
  description: string;
  entityType: string;
  entityId: string | number;
  userId?: string;
  metadata?: Record<string, any>;
}): Promise<void>
```

### `formatTimestamp`

Formats a timestamp string for display.

```typescript
function formatTimestamp(timestamp: string): string
```

## 🧪 Testing Functions

### `getUserSkillApplications`

Gets skill applications for a specific user.

```typescript
async function getUserSkillApplications(userId: string): Promise<SkillApplication[]>
```

### `getCustomerSkillApplications`

Gets skill applications for a specific customer.

```typescript
async function getCustomerSkillApplications(customerId: number): Promise<SkillApplication[]>
```

### `applySkill`

Applies a skill to a customer for a specific user.

```typescript
async function applySkill({
  userId,
  skillId,
  customerId,
  proficiency,
  startDate,
  notes
}: {
  userId: string;
  skillId: number;
  customerId: number;
  proficiency: string;
  startDate?: string;
  notes?: string;
}): Promise<SkillApplication>
```

### `deleteSkillApplication`

Deletes a skill application.

```typescript
async function deleteSkillApplication(id: number): Promise<void>
``` 