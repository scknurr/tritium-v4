# Entity Linking Standards

This document outlines the standards for entity linking in the Tritium v4 application. Entity linking is a critical aspect of our UI that enables consistent navigation between related entities throughout the application.

## Overview

The Tritium application revolves around three primary entity types: Users, Customers, and Skills. The relationships between these entities are displayed in various contexts:

- Detail pages (User, Customer, Skill)
- List pages
- Dashboard cards
- Timeline events
- Entity grids and cards

To ensure consistency in how we link between entities, we've implemented a standardized `EntityLink` component that should be used for all entity references.

## EntityLink Component

### Location
```
src/components/ui/EntityLink.tsx
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| type | 'user' \| 'customer' \| 'skill' \| 'application' \| 'role' | Yes | The type of entity being linked |
| id | string \| number | Yes | The unique identifier of the entity |
| name | string | Yes | The display name for the entity |
| className | string | No | Additional CSS classes to apply |
| showIcon | boolean | No | Whether to show the entity type icon (default: false) |
| customPath | string | No | Custom path if not using standard entity paths |
| size | 'sm' \| 'md' \| 'lg' | No | Size variant of the link (default: 'md') |

### Usage Examples

```tsx
// Basic usage
<EntityLink 
  type="user"
  id="abc123"
  name="John Doe"
/>

// With icon and custom class
<EntityLink 
  type="skill"
  id={skill.id}
  name={skill.name}
  showIcon={true}
  className="font-bold"
/>

// Small size with fallback for null name
<EntityLink 
  type="customer"
  id={customer?.id}
  name={customer?.name || 'Unknown Customer'}
  size="sm"
/>
```

## Styling Standards

The `EntityLink` component applies consistent styling based on entity type:

| Entity Type | Icon | Color Class |
|-------------|------|-------------|
| user | Users | text-blue-600 |
| customer | Building | text-green-600 |
| skill | GraduationCap | text-purple-600 |
| application | FileText | text-indigo-600 |
| role | Briefcase | text-orange-600 |

## Implementation Guidelines

### Where to Use EntityLink

- **Detail Pages**: For all references to related entities
- **List Views**: In DataTable and EntityGrid components
- **Timeline Events**: For any entity mentioned in activity timeline
- **Forms**: In select dropdowns that reference entities
- **Dashboard**: For entity links on dashboards and summary cards

### Null/Undefined Handling

The `EntityLink` component has built-in null handling:

```tsx
// This is safe even if customer is null/undefined
<EntityLink
  type="customer"
  id={customer?.id}
  name={customer?.name || 'Unknown Customer'}
/>
```

### Browser Navigation

EntityLink should preserve browser navigation behavior:

- Middle-click should open in new tab
- Right-click should show context menu
- Standard link behavior should apply

## Components Using EntityLink

The following components have been updated to use the standardized EntityLink:

- [x] UserDetail
- [x] CustomerDetail
- [x] SkillDetail
- [x] CustomerSkillApplicationsList
- [x] UserAppliedSkills
- [x] UnifiedTimeline
- [x] DataTable
- [x] EntityGrid
- [x] Dashboard

## Benefits

Standardizing entity linking provides several benefits:

1. **Consistency**: All entity links share the same visual styling and behavior
2. **Maintainability**: Changes to link styling can be made in one place
3. **Type Safety**: Improved TypeScript checks for entity links
4. **User Experience**: Consistent interface for navigating between entities
5. **Accessibility**: Standardized visual indicators for different entity types

## Testing

When testing entity linking, verify:

1. Links navigate to the correct entity pages
2. Styling is consistent with entity type standards
3. Null/undefined values are handled gracefully
4. Icons display correctly when enabled
5. Links are keyboard navigable and work with screen readers

## Future Enhancements

Planned enhancements for entity linking:

1. Entity preview on hover
2. Enhanced iconography for entity status
3. Support for batch actions on entity links
4. Integration with browser history for improved back/forward navigation 