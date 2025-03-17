# 📊 Type Reference Guide

This file documents key types used throughout the application for quick reference.

## 🧩 Core Entity Types

### Customer

```typescript
interface Customer {
  id: number;
  name: string;
  description: string | null;
  website: string | null;
  industry_id: number | null;
  created_at: string;
  updated_at: string;
  industry?: {
    id: number;
    name: string;
  };
}
```

### Skill

```typescript
interface Skill {
  id: number;
  name: string;
  description: string | null;
  category_id: number | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
  };
}
```

### User/Profile

```typescript
interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
```

## 🔗 Relationship Types

### UserCustomer (Team Member)

```typescript
interface UserCustomer {
  id: number;
  user_id: string;
  customer_id: number;
  role_id: number | null;
  role: string | null;
  start_date: string;
  end_date: string | null;
  user?: {
    id: string;
    full_name: string | null;
    email: string;
    title: string | null;
  };
  customer_roles?: {
    id?: number;
    name?: string;
  };
}
```

### SkillApplication

```typescript
interface SkillApplication {
  id: number;
  user_id: string;
  skill_id: number;
  customer_id: number;
  proficiency: string;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  skill_name?: string;
  customer_name?: string;
  user_name?: string;
  
  // Full relations
  skills?: Skill;
  users?: Profile;
  customers?: Customer;
}
```

### CustomerSkillApplication (as used in CustomerSkillApplicationsList)

```typescript
interface CustomerSkillApplication {
  id: number;
  user_id: string;
  skill_id: number;
  customer_id: number;
  proficiency: string;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  skill_name?: string;
  user_name?: string;
  
  skills?: {
    name: string;
  };
  users?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}
```

## ⏱️ Timeline Types

### TimelineEvent

```typescript
interface TimelineEvent {
  id: number;
  type: string;
  description: string;
  entity_type: string;
  entity_id: string | number;
  user_id: string | null;
  metadata: Record<string, any> | null;
  timestamp: string;
  
  // Enhanced fields after transformation
  user?: {
    id: string;
    name: string;
  };
  skill?: {
    id: number;
    name: string;
  };
  customer?: {
    id: number;
    name: string;
  };
}
```

### Timeline Query Params

```typescript
interface UseUnifiedTimelineProps {
  entityType: string;
  entityId: string | number;
  relatedEntityType?: string;
  relatedEntityId?: string | number;
  limit?: number;
}
```

## 📚 Component Props

### EntityDetail Props

```typescript
interface EntityDetailProps {
  entityType: string;
  entityId: number;
  title: string;
  description?: string;
  icon: LucideIcon;
  form: React.ReactNode;
  mainContent: React.ReactNode;
  relatedEntities?: React.ReactNode[];
  onRefresh?: () => Promise<void>;
  deleteInfo?: {
    entityName: string;
    relatedDataDescription: string;
  };
  hideOldTimeline?: boolean;
}
```

### UnifiedTimeline Props

```typescript
interface UnifiedTimelineProps {
  title?: string;
  events: TimelineEvent[];
  loading: boolean;
  error: Error | null;
  showHeader?: boolean;
  entityType?: string;
  entityId?: string | number;
  onRefresh?: () => void;
  emptyMessage?: string;
}
``` 