# Database and Code Normalization

This document outlines the standardized approach for database schema and code structure in the Tritium application. The goal is to ensure consistency and robustness across the entire system.

## Profile Name Handling

### Database Schema

The `profiles` table now uses separate `first_name` and `last_name` fields instead of the previous `full_name` field:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  ...
);
```

### Type Definitions

All type definitions should follow this structure:

```typescript
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  // other fields...
}
```

### Utilities

To standardize name handling, use these utility functions:

```typescript
// Format a full name from components
export function formatFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined, 
  email: string | null | undefined
): string {
  const fullName = [firstName, lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  
  return fullName || email || 'Unknown User';
}

// Parse a full name into components
export function parseFullNameToFirstLast(
  fullName: string = ''
): { firstName: string, lastName: string } {
  if (!fullName || fullName.trim() === '') {
    return { firstName: '', lastName: '' };
  }
  
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0] || '', lastName: '' };
  }
  
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ');
  
  return { firstName, lastName };
}
```

### UI Components

When displaying user names in UI components:

```tsx
import { formatFullName } from '@/lib/utils';

// Instead of:
// <span>{user.full_name || user.email}</span>

// Use:
<span>{formatFullName(user.first_name, user.last_name, user.email)}</span>
```

### Forms

When creating or editing user information:

```tsx
// Instead of:
<TextInput
  id="full_name"
  value={formData.full_name || ''}
  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
/>

// Use:
<TextInput
  id="first_name"
  value={formData.first_name || ''}
  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
/>
<TextInput
  id="last_name"
  value={formData.last_name || ''}
  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
/>
```

### Database Queries

When querying and displaying profile information:

```typescript
// Order by first name (instead of full_name)
const { data: users } = useSupabaseQuery<Profile>('profiles', {
  orderBy: { column: 'first_name', ascending: true }
});

// When displaying in select inputs:
<Select>
  {users.map((user) => (
    <option key={user.id} value={user.id}>
      {formatFullName(user.first_name, user.last_name, user.email)}
    </option>
  ))}
</Select>
```

### Database Functions

When handling user creation and updates in triggers:

```sql
-- For user creation triggers
INSERT INTO public.profiles (id, email, first_name, last_name)
VALUES (
  new.id,
  new.email,
  COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
  COALESCE(new.raw_user_meta_data->>'last_name', '')
);

-- When concatenating names in views
CONCAT_WS(' ', p.first_name, p.last_name) AS user_name
```

## Entity Handling Patterns

All entities should follow consistent patterns:

1. Database tables use singular naming: `profile`, `customer`, `skill`
2. Type definitions match database schema
3. UI components use formatters for derived values
4. Backend functions should handle nullable fields properly
5. All entities must have created_at and updated_at timestamps

## Schema Migration Principles

When migrating schema:

1. Always use non-destructive migrations when possible
2. Include proper column defaults
3. Create temporary columns during transitions
4. Apply proper RLS (Row-Level Security) policies
5. Document the migration clearly with comments

By following these standards, we ensure consistency, maintainability, and robustness across the application. 