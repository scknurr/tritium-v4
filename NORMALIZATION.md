# Tritium v4 Normalization Guide

This document outlines the standardized approach for database schema and code structure in the Tritium application.

## Database Schema

### Profiles Table
- `id`: UUID (from auth.users)
- `first_name`: TEXT
- `last_name`: TEXT 
- `email`: TEXT
- `title`: TEXT
- `bio`: TEXT
- `avatar_url`: TEXT
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

Note: The profiles table previously used a single `full_name` field, which has been replaced with separate `first_name` and `last_name` fields for better data normalization.

### Skills Table
- `id`: UUID
- `name`: TEXT
- `description`: TEXT
- `category_id`: UUID (foreign key to categories table)
- `proficiency_levels`: TEXT[]
- `svg_icon`: TEXT
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### Customers Table
- `id`: UUID
- `name`: TEXT
- `description`: TEXT
- `logo_url`: TEXT
- `website`: TEXT
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

## Code Structure

### Type Definitions
All entity types are defined in `src/types/index.ts`:

```typescript
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  title?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at?: string | null;
}
```

### Name Formatting
Name formatting should use the `formatFullName` utility function from `src/lib/utils.ts`:

```typescript
// Function overloads
export function formatFullName(profile: { first_name?: string | null; last_name?: string | null; email?: string | null }): string;
export function formatFullName(firstName: string | null | undefined, lastName: string | null | undefined, email: string | null | undefined): string;
```

### Form Components
- `UserForm.tsx`: Updated to use `first_name` and `last_name` fields instead of `full_name`
- `Auth.tsx`: Updated to collect first and last name during signup

### Page Components
- `Profile.tsx`: Complete user profile management with first/last name support
- `UserDetail.tsx`: Updated to display formatted names

### API Handling
- All profile mutations should use the updated field structure
- Upsert operations should include both first and last name fields

## Implementation Status

| Component | Updated | Notes |
|-----------|---------|-------|
| Database Schema | ✅ | Migration applied |
| Type Definitions | ✅ | Profile interface updated |
| Utilities | ✅ | Added name formatting functions |
| UserForm | ✅ | Updated form fields |
| Auth Component | ✅ | Signup collects first/last name |
| Profile Page | ✅ | Complete update with name display |
| UserDetail Page | ✅ | Updated with proper name formatting |
| Timeline Component | ✅ | Updated to use new name structure |
| Audit Logging | ✅ | Updated to capture first/last name |

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

### User Signup

The signup form has been updated to collect `first_name` and `last_name` directly:

```typescript
// In the Auth component:
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');

// In the signup form:
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label htmlFor="first_name">First Name</Label>
    <TextInput
      id="first_name"
      value={firstName}
      onChange={(e) => setFirstName(e.target.value)}
    />
  </div>
  <div>
    <Label htmlFor="last_name">Last Name</Label>
    <TextInput
      id="last_name"
      value={lastName}
      onChange={(e) => setLastName(e.target.value)}
    />
  </div>
</div>

// When submitting:
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      first_name: firstName || email.split('@')[0],
      last_name: lastName || ''
    }
  }
});
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