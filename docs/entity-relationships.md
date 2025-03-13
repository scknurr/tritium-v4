# Entity Relationships Implementation Guide

This document explains how entity relationships are implemented in the application, with a focus on skill applications, customer assignments, and other similar relationship patterns.

## Overview

The application manages several key entity relationships:

1. **Skill Applications**: Users apply skills at customers with a proficiency level
2. **Customer Assignments**: Users are assigned to customers with a role
3. **User Skills**: Users add skills to their profile with a proficiency level

These relationships are managed through junction tables in the database and have specific UI components for management.

## Database Schema

### Skill Applications

The `skill_applications` table connects users, skills, and customers:

```sql
CREATE TABLE skill_applications (
  id SERIAL PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  skill_id INTEGER REFERENCES skills(id),
  customer_id INTEGER REFERENCES customers(id),
  proficiency_level VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Customer Assignments

The `user_customers` table connects users and customers with roles:

```sql
CREATE TABLE user_customers (
  id SERIAL PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  customer_id INTEGER REFERENCES customers(id),
  role_id INTEGER REFERENCES roles(id),
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Skills

The `profile_skills` table connects users and skills:

```sql
CREATE TABLE profile_skills (
  id SERIAL PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  skill_id INTEGER REFERENCES skills(id),
  proficiency_level VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## UI Components

### Apply Skill Button

The `ApplySkillButton` component allows users to apply a skill at a customer:

- **Props**:
  - `userId`: The ID of the user applying the skill
  - `onSuccess`: Callback function for when the skill application is successful
  - `buttonSize`: Optional size for the button (default: 'default')
  - `variant`: Optional variant for the button styling (default: 'default')

- **Features**:
  - Opens a modal dialog for selecting skill, customer, and proficiency level
  - Validates all required fields
  - Creates both a skill application record and an audit log entry
  - Includes appropriate metadata in the audit log for timeline display

### Assign Customer Button

The `AssignCustomerButton` component allows assigning users to customers with a role:

- **Props**:
  - `userId`: The ID of the user being assigned
  - `onSuccess`: Callback function for when the assignment is successful
  - `buttonSize`: Optional size for the button
  - `variant`: Optional variant for the button styling

- **Features**:
  - Opens a modal dialog for selecting customer, role, and start/end dates
  - Validates all required fields
  - Creates both a customer assignment record and an audit log entry
  - Includes appropriate metadata in the audit log for timeline display

## Audit Logging Pattern

When creating relationship records, always follow this pattern:

1. Insert the record into the appropriate junction table
2. Create an audit log entry with appropriate metadata
3. Trigger any necessary UI refreshes

Example:

```javascript
// Insert the skill application
const { data: applicationData, error } = await supabase
  .from('skill_applications')
  .insert({
    profile_id: userId,
    skill_id: selectedSkill,
    customer_id: selectedCustomer,
    proficiency_level: proficiencyLevel
  })
  .select();

if (error) throw error;

// Create an audit log entry with metadata
await createAuditLog({
  eventType: 'INSERT',
  description: `${userName} applied ${skillName} at ${customerName}`,
  entityType: 'skill_applications',
  entityId: applicationData[0].id,
  userId: userId,
  metadata: {
    skill_name: skillName,
    skill_id: selectedSkill,
    customer_name: customerName,
    customer_id: selectedCustomer,
    proficiency: proficiencyLevel
  }
});

// Call the success callback to trigger UI refresh
if (onSuccess) onSuccess();
```

## Timeline Display

The Timeline component handles special cases for entity relationships:

1. Detects relationship events by entity type and description patterns
2. Extracts metadata for proper display
3. Renders links to related entities with appropriate icons
4. Shows additional details like proficiency level or role

See the [Timeline & Audit Log Developer's Guide](./timeline-audit-log-guide.md) for more details on how the Timeline component displays these relationships.

## Best Practices

1. Always include full metadata in audit logs for proper timeline display
2. Follow consistent naming patterns in the metadata (entity_name, entity_id)
3. Use a descriptive, consistent format for the audit log description
4. Ensure all components handle loading, error, and success states
5. Implement proper refreshing mechanisms to update UI after changes
6. Maintain consistent UI patterns across all relationship management components

## Example Implementations

For complete implementation examples, see:

- `src/components/ApplySkillButton.tsx` for skill applications
- `src/components/AssignCustomerButton.tsx` for customer assignments
- `src/components/ui/Timeline.tsx` for displaying relationship events 