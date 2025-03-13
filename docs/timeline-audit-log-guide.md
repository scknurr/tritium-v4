# Timeline & Audit Log Developer's Guide

This document explains how the Timeline component works with audit logs in the application and provides patterns for extending it to new entity types.

## Overview

The Timeline component displays a chronological list of events (audit logs) that have occurred in the system. Each event represents an action performed by a user on an entity, such as creating a skill, applying a skill at a customer, or assigning a user to a customer.

## Audit Log Structure

Audit logs are stored in the `audit_logs` table with the following key fields:

- `id`: Unique identifier
- `event_type`: Type of event (INSERT, UPDATE, DELETE)
- `description`: Human-readable description of the event
- `entity_type`: Type of entity involved (skill, customer, user, etc.)
- `entity_id`: ID of the entity involved
- `metadata`: JSON object containing additional information
- `created_at`: Timestamp of when the event occurred
- `user_id`: ID of the user who performed the action
- `profile`: Profile of the user who performed the action (joined from profiles table)

## Timeline Component Design Patterns

### Entity Identification Pattern

Each entity type has a consistent visual representation:

- **Users**: User icon (`<IconUser />`) with blue accent
- **Customers**: Building icon (`<IconBuilding />`) with green accent
- **Skills**: Light bulb icon (`<IconBulb />`) with violet accent
- **Default**: Document icon (`<IconFile />`) with neutral accent

### Event Type Pattern

Event types are visually distinguished:

- **INSERT**: "created" with plus icon (`<IconPlus />`)
- **UPDATE**: "updated" with edit icon (`<IconEdit />`)
- **DELETE**: "deleted" with trash icon (`<IconTrash />`)

### Link Pattern

Entity names are displayed as clickable links that navigate to the entity detail page:

- Skills: `/skills/[skill_id]` with violet text color
- Customers: `/customers/[customer_id]` with green text color
- Users: `/users/[user_id]` with blue text color

### Layout Pattern

Each timeline item follows a consistent layout:

1. Actor name (who performed the action)
2. Action verb (created, updated, deleted, applied, etc.)
3. Primary entity (with icon and link)
4. Contextual preposition (at, to, from)
5. Related entity (with icon and link) if applicable
6. Additional details (proficiency level, role, etc.)
7. Timestamp (right aligned)

### Metadata Display Pattern

For complex changes, metadata is displayed in a structured format:

- Fields are displayed in key-value pairs with proper indentation
- Large metadata changes can be expanded/collapsed
- Changed values are highlighted in a before/after format

## How to Extend the Timeline for New Entity Types

### 1. Update Entity Type Detection

In the `getEntityConfig` function in `Timeline.tsx`, add a new case for your entity type:

```typescript
case 'your_entity_type':
  return {
    icon: <YourEntityIcon className="h-4 w-4 text-your-color" />,
    iconColor: 'text-your-color',
    bgColor: 'bg-your-color/10',
    linkPrefix: '/your_entity_type/'
  };
```

### 2. Add Special Event Handling (if needed)

For special relationship events (like skill applications), add detection and rendering logic in the Timeline component:

1. Create a detection function:
   ```typescript
   const isYourSpecialEvent = (item: AuditLog) => {
     return item.entity_type === 'your_entity_type' && 
            item.description.includes('specific action phrase');
   };
   ```

2. Add rendering logic in the main component:
   ```typescript
   if (isYourSpecialEvent(item)) {
     // Extract metadata
     const metadata = item.metadata as YourMetadataType;
     
     // Render special format
     // Make sure to use the consistent layout pattern
     return (
       <div>
         {/* Render according to layout pattern */}
       </div>
     );
   }
   ```

### 3. Update Audit Log Creation

When creating audit logs for your new entity type, follow the metadata format guidelines:

```typescript
await createAuditLog({
  eventType: 'INSERT',
  description: `${user.name} performed action on ${entityName}`,
  entityType: 'your_entity_type',
  entityId: entityId,
  userId: user.id,
  metadata: {
    entity_name: entityName,
    entity_id: entityId,
    // Add other relevant fields
  }
});
```

## Examples

### Skill Application Event

```typescript
// Audit log creation
await createAuditLog({
  eventType: 'INSERT',
  description: `${user.name} applied ${skillName} at ${customerName}`,
  entityType: 'skill_application',
  entityId: applicationId,
  userId: user.id,
  metadata: {
    skill_name: skillName,
    skill_id: skillId,
    customer_name: customerName,
    customer_id: customerId,
    proficiency: proficiencyLevel
  }
});

// Timeline rendering
<span>
  {item.profile.full_name} applied{' '}
  <Link to={`/skills/${metadata.skill_id}`} className="text-violet-500 hover:underline inline-flex items-center">
    <IconBulb className="h-4 w-4 mr-1" />
    {metadata.skill_name}
  </Link>{' '}
  at{' '}
  <Link to={`/customers/${metadata.customer_id}`} className="text-green-500 hover:underline inline-flex items-center">
    <IconBuilding className="h-4 w-4 mr-1" />
    {metadata.customer_name}
  </Link>{' '}
  with {metadata.proficiency} proficiency
</span>
```

### Customer Assignment Event

```typescript
// Audit log creation
await createAuditLog({
  eventType: 'INSERT',
  description: `${user.name} assigned to ${customerName} as ${roleName}`,
  entityType: 'customer_assignment',
  entityId: assignmentId,
  userId: user.id,
  metadata: {
    customer_name: customerName,
    customer_id: customerId,
    role: roleName,
    role_id: roleId
  }
});

// Timeline rendering
<span>
  {item.profile.full_name} assigned to{' '}
  <Link to={`/customers/${metadata.customer_id}`} className="text-green-500 hover:underline inline-flex items-center">
    <IconBuilding className="h-4 w-4 mr-1" />
    {metadata.customer_name}
  </Link>{' '}
  as {metadata.role}
</span>
```

## Best Practices

1. Always include entity names AND IDs in metadata for proper linking
2. Follow the consistent layout pattern for all timeline items
3. Use the appropriate icons and colors for each entity type
4. Format descriptions consistently: "[Actor] [action verb] [primary entity] at/to/from [related entity] [additional details]"
5. For complex relationships, decide on a primary entity and related entity
6. Test your changes with various screen sizes to ensure responsive design

By following these patterns, the Timeline will maintain a consistent appearance and behavior across all entity types, improving user experience and making the codebase more maintainable. 