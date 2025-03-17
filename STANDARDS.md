# Tritium v4 Development Standards

This document outlines the standardized patterns for API calls, components, hooks, and error handling in the Tritium v4 application.

## Type Definitions

All common types are defined in `src/types/index.ts`. These types ensure consistent data structures across the application.

### Entity Types

- `Profile`: User profile information
- `Customer`: Customer information
- `Skill`: Skill definitions

### Relationship Types

- `UserSkill`: User's skills with proficiency levels
- `UserCustomer`: User's customer assignments
- `CustomerSkill`: Skills associated with customers
- `SkillApplication`: Skills applied by users at specific customers

## API Standards

### API Function Pattern

```typescript
export const getEntityData = async (id: string | number) => {
  try {
    // Ensure proper type conversion for IDs
    const idStr = typeof id === 'number' ? id.toString() : id;
    
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('id', idStr);
    
    if (error) throw error;
    
    // Always return an array, even if data is null
    return data || [];
  } catch (err) {
    console.error('Error in getEntityData:', err);
    throw err;
  }
};
```

### API Request Hook Usage

```typescript
const {
  state: { data = [], isLoading, error },
  execute: fetchData
} = useApiRequest<DataType[]>(
  async () => await apiFunction(parameters),
  { data: initialData, isLoading: true, error: null }
);
```

## Component Standards

### Null Checking

Always use safe array handling to prevent null reference errors:

```typescript
// Create a safe array with default empty array
const safeArray = data || [];

// In JSX
{safeArray.map(item => (
  <Component key={item.id} {...item} />
))}
```

### Loading and Error States

Always handle loading and error states consistently:

```typescript
{isLoading ? (
  <LoadingSpinner centered size="md" text="Loading data..." />
) : error ? (
  <ErrorMessage 
    message={error} 
    onRetry={fetchData} 
    onDismiss={() => setError(null)} 
  />
) : safeData.length === 0 ? (
  <EmptyState message="No data found" />
) : (
  <DataDisplay data={safeData} />
)}
```

## Real-time Subscription Standards

Always use the standardized real-time subscription pattern:

```typescript
useRealtimeSubscription({
  table: 'table_name',
  filter: { id_column: id.toString() }, // Always use string IDs for RT filters
  onUpdate: (payload) => {
    console.log('[Debug] Received update:', payload);
    fetchData();
  },
  debug: process.env.NODE_ENV !== 'production'
});
```

## Error Handling Standards

Use standardized error handling across the application:

```typescript
try {
  // API call or operation
} catch (err) {
  // Log the error with context
  console.error('Operation failed:', err);
  
  // Standardize error format
  const error = err instanceof Error 
    ? err 
    : new Error(typeof err === 'string' ? err : 'Unknown error occurred');
  
  // Update error state
  setError(error.message);
}
```

## Entity Relationships

- **Users** → Skills (user_skills, skill_applications)
- **Users** → Customers (user_customers)
- **Customers** → Users (user_customers)
- **Customers** → Skills (skill_applications)
- **Skills** → Users (user_skills, skill_applications)
- **Skills** → Customers (skill_applications)

Always query these relationships using the standardized API functions. 

## Supabase Query Standards

### Standard Join Syntax

When querying relationships in Supabase, always use consistent syntax:

```typescript
// ALWAYS use this format for joins
const { data, error } = await supabase
  .from('main_table')
  .select(`
    *,
    related_table:foreign_key_column (id, name)
  `)
  .eq('some_column', value);
```

### AVOID the following syntax (causes 400 Bad Request):

```typescript
// DO NOT use this format - it's inconsistent with Supabase API
select: 'related_table:column(*)'
```

### Examples of correct foreign key relationships:

```typescript
// For skill applications with user information
.select(`
  *,
  profiles:user_id (id, full_name, email),
  skills:skill_id (id, name),
  customers:customer_id (id, name)
`)

// For skills with category information
.select(`
  *,
  category:category_id (id, name)
`)
```

Always ensure you test relationships in smaller queries before combining them in larger ones. 

## Troubleshooting Database Queries

### Fixing 400 Bad Request Errors

If you encounter a 400 Bad Request error when working with Supabase queries, these are the most common causes:

1. **Incorrect Foreign Key Relationship Syntax**
   - ❌ WRONG: `select: 'related_table:column(*)'`
   - ✅ CORRECT: `select: 'related_table:foreign_key_column(*)'`

   Example: Use `profiles:user_id(*)` instead of `user:profiles(*)`

2. **Inconsistent ID Types**
   - All string IDs must be converted to strings for filtering and real-time subscriptions
   - For real-time subscriptions, use: `.filter: { user_id: userId.toString() }`

3. **Invalid Select Statements**
   - Ensure that column names actually exist in the table
   - Check for typos in table names or column names

4. **Debugging Tips**
   - Check the Network tab in browser dev tools to see the exact URL that failed
   - Look for URL encoding issues in the parameters
   - Use the standardized query functions in `src/lib/api.ts`

Always use the `standardizedQuery` function for complex queries to avoid these issues. 