# Tritium-v4 Architecture Guide

## Core Principles

1. **Simplicity First**: Use Supabase's built-in capabilities over custom code whenever possible.
2. **Type Safety**: Maintain strong TypeScript typing for all components and database interactions.
3. **Single Source of Truth**: Store business logic in database functions where appropriate.
4. **Clear Debugging**: Use structured logging for all application components.

## Database Structure

### Key Tables

- `profiles`: User profiles linked to Supabase Auth
- `customers`: Customer organizations
- `skills`: Skills used in the system
- `skill_categories`: Categories for skills
- `industries`: Industry categories for customers
- `user_skills`: Many-to-many relationship between users and skills
- `user_customers`: Many-to-many relationship between users and customers
- `customer_skills`: Many-to-many relationship between customers and skills
- `audit_logs`: System-wide audit trail

### Database Triggers and Functions

All database functions are stored in `supabase/migrations/` and are automatically applied when:
1. Running `npx supabase db reset`
2. Pushing migrations to production with `npx supabase db push`

#### Key Functions:

- `handle_audit_log()`: Records changes to database records
- `handle_new_user()`: Creates profile entries when users sign up

## Frontend Architecture

### Component Structure

- `src/components/ui/`: Reusable UI components
- `src/components/forms/`: Form components for data entry
- `src/pages/`: Page components for routing
- `src/lib/`: Utility functions and shared code

### Data Flow

1. **Data Fetching**: 
   - Use `useQueryWithCache` for data fetching
   - Define query keys in `src/lib/queryKeys.ts`

2. **Data Mutations**:
   - Use `useMutationWithCache` for data updates
   - Handle optimistic updates where appropriate

3. **Real-time Updates**:
   - Use Supabase subscriptions for real-time data

## Debugging Tools

### Console Logging

- Use the structured logger in `src/lib/debug.ts`
- Component-specific loggers should be created with `createLogger('ComponentName')`
- View logs in browser developer console (F12)

### Database Debugging

- Use `./db-query.sh` for quick database checks
- Use Supabase Studio at http://127.0.0.1:54323 for visual database exploration
- Add temporary `RAISE NOTICE` statements to PL/pgSQL functions for debugging

## Best Practices

1. **Database Migrations**:
   - One change per migration
   - Clear comments explaining the purpose
   - Version migrations with timestamps
   - Test migrations locally before pushing

2. **Audit Logging**:
   - All data changes should be captured in audit logs
   - Use text values for human readability in logs
   - Handle special cases (foreign keys, descriptions) explicitly

3. **Error Handling**:
   - Use structured error handling with clear user messaging
   - Log errors with context
   - Provide fallbacks for failed operations

4. **React Components**:
   - Keep components small and focused
   - Use TypeScript interfaces for props
   - Implement proper memoization
   - Use custom hooks for complex logic

## Common Pitfalls

1. **JSON Handling**: When storing JSON in the database, ensure you're properly handling serialization/deserialization
2. **Type Casting**: Be careful with PostgreSQL type casting, especially with NULL values
3. **Trigger Functions**: Ensure proper error handling in trigger functions to prevent data loss
4. **React Query**: Be mindful of cache invalidation for related entities 