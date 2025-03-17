# Entity Card Standards for Tritium

## Overview

Cards are the primary UI components used to display entity information and related data throughout the Tritium application. This document defines the standards for consistent, accessible, and user-friendly entity cards used on detail pages, list pages, and other parts of the application.

## Core Card Components

### 1. DetailCard

`DetailCard` is the primary component used for showing entity information on detail pages. It provides consistent styling, layout, and behaviors based on entity type.

**Location**: `src/components/ui/DetailCard.tsx`

**Key Features**:
- Entity-specific styling (colors, borders, backgrounds)
- Built-in header with title, icon, and actions
- Empty state handling with optional action
- Loading state visualization
- Footer support for additional content

**Usage Example**:
```tsx
<DetailCard
  title="Team Members"
  entityType="user"
  icon={Users}
  actions={[
    { label: "Add Member", icon: Plus, onClick: handleAddMember }
  ]}
  emptyState={{
    message: "No team members assigned yet",
    action: { label: "Add Member", onClick: handleAddMember }
  }}
>
  {members.map(member => (
    <EntityDetailItem
      key={member.id}
      id={member.user_id}
      name={member.user.name}
      type="user"
    />
  ))}
</DetailCard>
```

### 2. EntityDetailItem

`EntityDetailItem` is used for displaying individual entity items within cards. It provides a consistent layout for showing entity information with metadata.

**Location**: `src/components/ui/EntityDetailItem.tsx`

**Key Features**:
- Consistent entity link display with proper icon
- Support for description, secondary and tertiary fields
- Date formatting
- Status indicators
- Action buttons
- Click handling

**Usage Example**:
```tsx
<EntityDetailItem
  id="123"
  name="John Doe"
  type="user"
  description="Software Engineer"
  secondaryField={{
    label: "Email",
    value: "john.doe@example.com",
    icon: Mail
  }}
  date={{
    label: "Joined",
    value: "2023-01-15"
  }}
  status={{
    value: "Active", 
    color: "green"
  }}
  actions={
    <Button size="xs" onClick={handleViewDetails}>
      View Details
    </Button>
  }
/>
```

### 3. ContentCard

`ContentCard` is a more general-purpose card component that also supports entity styling. It's used for dashboard components and simpler card layouts.

**Location**: `src/components/ui/ContentCard.tsx`

**Key Features**:
- Optional entity type styling
- Flexible content layout
- Footer support

### 4. EntityGrid

`EntityGrid` is a specialized component for displaying entities in a grid layout on list pages. It uses the `DetailCard` component to present entities in a consistent format.

**Location**: `src/components/ui/EntityGrid.tsx`

**Key Features**:
- Consistent grid layout with responsive design
- Entity-appropriate styling
- Automatic relationship fetching and display
- Loading states with skeletons
- Error handling
- Empty states

**Usage Example**:
```tsx
<EntityGrid
  data={users}
  loading={loading}
  error={error?.message}
  onEdit={handleEditUser}
  onView={handleViewUser}
  type="user"
/>
```

## Entity Type Standards

### Color and Style Standards

Each entity type has a standardized set of colors and styles:

| Entity Type | Primary Color | Background Color | Border Color | Icon |
|-------------|---------------|------------------|--------------|------|
| User        | text-blue-600 | bg-blue-50       | border-blue-200 | Users |
| Customer    | text-green-600 | bg-green-50     | border-green-200 | Building |
| Skill       | text-purple-600 | bg-purple-50   | border-purple-200 | GraduationCap |
| Application | text-indigo-600 | bg-indigo-50   | border-indigo-200 | FileText |
| Role        | text-orange-600 | bg-orange-50   | border-orange-200 | Briefcase |

### Card Structure Standards

Each entity card should follow this standard structure:

1. **Header**
   - Entity-specific icon with background
   - Title text
   - Optional action buttons

2. **Content Area**
   - For lists: EntityDetailItem components
   - For forms: Form elements
   - For details: Organized information with consistent labeling

3. **Empty State**
   - Helpful message
   - Optional action button
   - Entity-appropriate styling

4. **Loading State**
   - Consistent skeleton loader
   - Entity-appropriate styling

## Implementation Guidelines

### When to Use Each Component

- **DetailCard**: Use for primary content sections on detail pages and grid items in list pages
- **EntityDetailItem**: Use for list items within DetailCards
- **ContentCard**: Use for dashboard cards or auxiliary content
- **EntityGrid**: Use for grid views of entities on list pages

### Consistent Action Patterns

Action buttons in cards should follow these patterns:

1. **Primary Actions**
   - Use entity-specific color
   - Include relevant icon
   - Keep label concise

2. **Secondary Actions**
   - Use light/outline style
   - Smaller size than primary actions
   - Keep within the entity's context

### Form Patterns in Cards

When including forms in cards:

1. Use consistent background color (`bg-gray-50 dark:bg-gray-800`)
2. Apply rounded corners (`rounded-md`)
3. Add subtle border (`border border-gray-100 dark:border-gray-700`)
4. Use consistent vertical spacing (`space-y-3`)

## Examples by Page Type

### Detail Pages

1. **UserDetail**
   - Profile Details card (user)
   - Skills card (skill)
   - Customers card (customer)
   - Applied Skills card (application)
   - Activity Timeline card (application)

2. **CustomerDetail**
   - Customer Details card (customer)
   - Team Members card (user)
   - Skills Applied card (skill)
   - Activity Timeline card (application)

3. **SkillDetail**
   - Skill Details card (skill)
   - Users with this Skill card (user)
   - Skill Activity card (application)

### List Pages

All list pages should:
1. Use `EntityGrid` for grid view mode
2. Use `DataTable` for table view mode
3. Allow users to toggle between views with `ViewToggle`

Specific implementations:

1. **Users List Page**
   - EntityGrid with user-specific styling
   - Show email, title, relationships in cards
   - View action to navigate to detail page
   - Edit action to open form modal

2. **Customers List Page**
   - EntityGrid with customer-specific styling
   - Show website, description, status in cards
   - Show team members and required skills

3. **Skills List Page**
   - EntityGrid with skill-specific styling
   - Show category, description in cards
   - Show users with the skill and related customers

### Dashboard

Dashboard cards should use `DetailCard` with:
1. Appropriate entity styling
2. Concise statistics
3. Clear "View All" action

## Benefits of Standardization

1. **Visual Consistency**: Users can quickly identify entity types and relationships
2. **Development Efficiency**: Reusable components reduce duplication
3. **Maintainability**: Changes to styling can be made in one place
4. **Accessibility**: Consistent interaction patterns improve usability
5. **Responsive Design**: Cards adapt consistently across device sizes

## Implementation Checklist

When implementing cards:

- [ ] Choose the appropriate card component
- [ ] Set correct entity type
- [ ] Include appropriate icon
- [ ] Add clear title
- [ ] Include relevant actions
- [ ] Handle empty and loading states
- [ ] Ensure appropriate content hierarchy

## List Page Implementation Checklist

For list pages:
- [ ] Use PageHeader with entity-appropriate iconColor
- [ ] Include a toggle between grid and table view
- [ ] Implement EntityGrid with correct `type` property
- [ ] Ensure EntityGrid shows useful relationship data
- [ ] Include View and Edit actions with appropriate icons
- [ ] Use consistent loading states

## Implementation Challenges and Solutions

During the implementation of entity card standards, we encountered several technical challenges that required specific solutions:

### 1. DataTable Component Extensions

**Issue**: The DataTable component's `TableMeta` interface didn't include `onView` property, causing TypeScript errors.

**Solution**: Updated the DataTable component to include proper typing:
```tsx
interface DataTableProps<T> {
  meta?: {
    onEdit?: (entity: T) => void;
    onView?: (entity: T) => void;
  };
}
```

Also added click handling on table rows for better user experience:
```tsx
<Table.Row 
  onClick={() => meta?.onView && handleRowClick(row.original)}
  className="cursor-pointer"
>
```

### 2. EntityGrid Query Pattern Consistency

**Issue**: The EntityGrid component was using number parameters (`0`) with query keys that expected string parameters.

**Solution**: Updated all query calls to use consistent string parameters:
```tsx
// Changed from:
queryKeys.profiles.customers(0)

// To:
queryKeys.profiles.customers('all')
```

### 3. Type Safety for Array Operations

**Issue**: Array operations were causing TypeScript errors when filtering relationships.

**Solution**: Added proper null checks and array safety:
```tsx
// Changed from:
userCustomers.filter(uc => uc.user_id === id)

// To:
(userCustomers || []).filter(uc => uc.user_id === id)
```

### 4. RealtimeSubscription Type Safety

**Issue**: The RealtimeSubscription callback had type mismatches.

**Solution**: Used a wrapper function to handle the callback type conversion:
```tsx
// Changed from:
onUpdate: refetch

// To:
onUpdate: () => {
  refetch();
}
```

### 5. Asset Loading Errors

**Issue**: Using direct file paths for assets like fonts caused browser security errors.

**Solution**: 
- Use relative paths instead of direct file URLs
- Use web-compatible asset imports
- Implement proper error handling for asset loading failures

### 6. Standardized Navigation Pattern

**Issue**: Inconsistent navigation handling across components.

**Solution**: Implemented a standardized navigation pattern:
```tsx
// Add onView handler to all interactive components
onView={handleViewEntity}

// Implement handler using navigate
const handleViewEntity = (entity: T) => {
  navigate(`/${entityType}s/${entity.id}`);
};
```

## Component Inventory

All card components have been updated to use standardized patterns:

- Dashboard cards
- Detail page section cards
- Entity lists
- Timeline displays
- Quick-access information
- EntityGrid items 