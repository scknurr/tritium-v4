# 🧩 Component Reference Guide

This document outlines key components, their purposes, and relationships.

## 🔍 Core Page Components

### `CustomerDetail`

**Location**: `src/pages/detail/CustomerDetail.tsx`

**Purpose**: Displays detailed information about a customer, including:
- Basic customer info (name, description, website, industry)
- Team members (from `user_customers` table)
- Applied skills (from `skill_applications` table)
- Activity timeline (from `audit_logs` table)

**Data Flow**:
- Uses `useSupabaseQuery` to fetch customer data and team members
- Uses `useMutationWithCache` for updating customer data
- Uses `useUnifiedTimeline` to fetch timeline events
- Embeds `CustomerSkillApplicationsList` to show applied skills
- Embeds `UnifiedTimeline` to show activity

**Critical Configuration**:
```typescript
const { 
  events: timelineEvents, 
  loading: timelineLoading, 
  error: timelineError,
  refresh: refreshTimeline 
} = useUnifiedTimeline({
  entityType: 'customers',
  entityId: id,
  relatedEntityType: 'customer',
  relatedEntityId: id,
  limit: 50
});
```

### `SkillDetail`

**Location**: `src/pages/detail/SkillDetail.tsx`

**Purpose**: Displays detailed information about a skill and where it's being applied.

**Data Flow**:
- Uses `useSupabaseQuery` to fetch skill data
- Uses `useMutationWithCache` for updating skill data
- Uses `useUnifiedTimeline` to fetch skill-related events

### `UserProfile`

**Location**: `src/pages/UserProfile.tsx`

**Purpose**: Displays user profile and their skills/assignments.

**Data Flow**:
- Uses `useSupabaseQuery` to fetch user data
- Includes `UserSkillApplications` component

## 🧱 Reusable Components

### `EntityDetail`

**Location**: `src/components/ui/EntityDetail.tsx`

**Purpose**: Base component for entity detail pages (customers, skills)

**Props**:
- `entityType`: Type of entity ('customers', 'skills', etc.)
- `entityId`: ID of the entity
- `title`: Display title
- `description`: Optional description
- `icon`: Icon component
- `form`: Form component for editing
- `mainContent`: Main content area
- `relatedEntities`: Additional related entity content
- `hideOldTimeline`: Whether to hide the old timeline component

### `UnifiedTimeline`

**Location**: `src/components/ui/UnifiedTimeline.tsx`

**Purpose**: Displays a timeline of activities related to an entity

**Data Source**: `audit_logs` table via `useUnifiedTimeline` hook

**Props**:
- `title`: Optional title
- `events`: Timeline events array
- `loading`: Loading state
- `error`: Error state
- `showHeader`: Whether to show header
- `entityType`: Type of entity (for context)
- `entityId`: ID of entity (for context)
- `onRefresh`: Function to refresh data
- `emptyMessage`: Message to show when no events

### `CustomerSkillApplicationsList`

**Location**: `src/components/CustomerSkillApplicationsList.tsx`

**Purpose**: Displays skills applied at a specific customer

**Data Source**: Direct query to `skill_applications` table

**Props**:
- `customerId`: ID of the customer
- `refreshTrigger`: Value that when changed triggers refresh

**Inconsistency Risk**: 
⚠️ This component queries the `skill_applications` table directly, while the UnifiedTimeline shows skill applications from the `audit_logs` table. These can become out of sync.

### `UserSkillApplications`

**Location**: `src/components/UserSkillApplications.tsx`

**Purpose**: Displays skills a user has applied across customers

**Data Source**: `skill_applications` table filtered by user_id

**Props**:
- `userId`: ID of the user
- `initialApplications`: Optional initial data
- `hideTitle`: Whether to hide component title

## 📊 Form Components

### `CustomerForm`

**Location**: `src/components/forms/CustomerForm.tsx`

**Purpose**: Form for creating/editing customer information

### `SkillForm`

**Location**: `src/components/forms/SkillForm.tsx`

**Purpose**: Form for creating/editing skill information

### `ApplySkillButton`

**Location**: `src/components/ApplySkillButton.tsx`

**Purpose**: Button that opens a dialog to apply a skill at a customer

**Critical Flow**:
- When a skill is applied:
  1. Entry is created in `skill_applications` table
  2. Audit log entry is created in `audit_logs`
  3. Both `CustomerSkillApplicationsList` and `UnifiedTimeline` should update

## 🔄 Data Flow Relationships

### Skill Application Flow

```
ApplySkillButton
    ↓
applySkill() function
    ↓
┌───────────────┐     ┌────────────┐
│ Insert into   │     │ Create     │
│ skill_appli-  │────→│ audit_log  │
│ cations table │     │ entry      │
└───────────────┘     └────────────┘
    ↓                      ↓
┌───────────────┐     ┌────────────┐
│ CustomerSkill │     │ Unified    │
│ Applications  │     │ Timeline   │
│ List          │     │            │
└───────────────┘     └────────────┘
```

### Team Member Flow

```
┌───────────────┐
│ user_customers│
│ table         │
└───────────────┘
        ↓
┌───────────────┐
│ CustomerDetail│
│ Team Members  │
│ Section       │
└───────────────┘
```

## ❓ Common Problems and Solutions

### Timeline Events Not Showing

If timeline events aren't appearing in `UnifiedTimeline`:
1. Check that both `entityType`/`entityId` AND `relatedEntityType`/`relatedEntityId` are set
2. Verify the events exist in `audit_logs` table
3. Check the console logs for event data and filtering

### Applied Skills Inconsistency

If skills appear in timeline but not in Applied Skills section:
1. Check `skill_applications` table directly to see if entries exist
2. Compare with data in `audit_logs` table
3. Check if `end_date` is not null (only active applications are shown)
4. Verify that refresh triggers are properly updating both components 