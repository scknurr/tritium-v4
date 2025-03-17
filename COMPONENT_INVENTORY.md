# Tritium v4 Component Inventory

This document provides a comprehensive inventory of all components in the Tritium v4 application, their data sources, and interactions.

## Pages

### Dashboard (`src/pages/Dashboard.tsx`)
- **Data Calls**:
  - `useSupabaseQuery('profiles')` - Fetches all user profiles
  - `useSupabaseQuery('customers')` - Fetches all customers
  - `useSupabaseQuery('skills')` - Fetches all skills
  - `useSupabaseQuery('user_customers')` - Fetches user-customer relationships
  - `useSupabaseQuery('user_skills')` - Fetches user-skill relationships
  - `useSupabaseQuery('customer_skills')` - Fetches customer-skill relationships
  - `useUnifiedTimeline()` - Fetches timeline events
- **Renders**:
  - Card components with stats
  - `UnifiedTimeline` component for recent activity
- **Links**:
  - Links to Users, Customers, Skills, and Activity pages

### Users (`src/pages/Users.tsx`)
- **Data Calls**:
  - `useQueryWithCache('profiles')` - Fetches all user profiles
  - `useRealtimeSubscription('profiles')` - Real-time updates for profiles
- **Renders**:
  - `DataTable` or `EntityGrid` based on view preference
- **Interactions**:
  - Create/edit user profiles
  - Filter users

### Customers (`src/pages/Customers.tsx`)
- **Data Calls**:
  - `useQueryWithCache('customers')` - Fetches all customers
  - `useRealtimeSubscription('customers')` - Real-time updates for customers
- **Renders**:
  - `DataTable` or `EntityGrid` based on view preference
- **Interactions**:
  - Create/edit customers
  - Filter customers

### Skills (`src/pages/Skills.tsx`)
- **Data Calls**:
  - `useQueryWithCache('skills')` - Fetches all skills
  - `useRealtimeSubscription('skills')` - Real-time updates for skills
- **Renders**:
  - `DataTable` or `EntityGrid` based on view preference
- **Interactions**:
  - Create/edit skills
  - Filter skills

### SkillApplicationsPage (`src/pages/SkillApplicationsPage.tsx`)
- **Data Calls**:
  - `getUserSkillApplications` or `getCustomerSkillApplications` - Fetches skill applications
  - `useRealtimeSubscription('skill_applications')` - Real-time updates for skill applications
- **Renders**:
  - Card grid or timeline view of skill applications
- **Interactions**:
  - Create/edit skill applications
  - Filter skill applications
  - Switch between list and timeline views

### UnifiedActivity (`src/pages/UnifiedActivity.tsx`)
- **Data Calls**:
  - `useUnifiedTimeline` - Fetches all timeline events
- **Renders**:
  - `UnifiedTimeline` component for all activity
- **Interactions**:
  - Filter activities by type/entity

## Detail Pages

### UserDetail (`src/pages/detail/UserDetail.tsx`)
- **Data Calls**:
  - `useSupabaseQuery('profiles')` - Fetches user profile
  - `useSupabaseQuery('user_skills')` - Fetches user skills
  - `useSupabaseQuery('user_customers')` - Fetches user customer assignments
  - `useSupabaseQuery('skills')` - Available skills
  - `useSupabaseQuery('customers')` - Available customers
  - `useSupabaseQuery('customer_roles')` - Available roles
  - `useUnifiedTimeline` - User activity
- **Renders**:
  - `EntityDetail` with user info
  - User skills and customers sections
  - Activity timeline
- **Interactions**:
  - Add/remove user skills
  - Add/remove customer assignments
  - Upload profile image

### CustomerDetail (`src/pages/detail/CustomerDetail.tsx`)
- **Data Calls**:
  - `useSupabaseQuery('customers')` - Fetches customer data
  - `useSupabaseQuery('user_customers')` - Fetches team members
  - `useUnifiedTimeline` - Customer activity
- **Renders**:
  - `EntityDetail` with customer info
  - `CustomerSkillApplicationsList` for skills applied at this customer
  - Team members section
  - Activity timeline
- **Interactions**:
  - Edit customer information
  - Upload customer logo
  - View team members and applied skills

### SkillDetail (`src/pages/detail/SkillDetail.tsx`)
- **Data Calls**:
  - `useSupabaseQuery('skills')` - Fetches skill data
  - `getSkillApplicationsBySkill` - Fetches users with this skill
  - `useUnifiedTimeline` - Skill activity
- **Renders**:
  - `EntityDetail` with skill info
  - Users with this skill section
  - Activity timeline
- **Interactions**:
  - Edit skill information
  - Upload SVG icon
  - View users with this skill

## Feature Components

### UserAppliedSkills (`src/components/UserAppliedSkills.tsx`)
- **Data Calls**:
  - `getUserSkillApplications` - Fetches user's applied skills
  - `useRealtimeSubscription('skill_applications')` - Real-time updates
  - `deleteSkillApplication` - Deletes skill applications
- **Renders**:
  - Card grid of applied skills
  - Delete confirmation dialog
- **Interactions**:
  - Delete skill applications
  - View skill details

### CustomerSkillApplicationsList (`src/components/CustomerSkillApplicationsList.tsx`)
- **Data Calls**:
  - `getCustomerSkillApplications` - Fetches skills applied at a customer
  - `useRealtimeSubscription('skill_applications')` - Real-time updates
- **Renders**:
  - List of skill applications at a customer
- **Interactions**:
  - Click user or skill links to navigate to details

### SkillApplicationsList (`src/components/SkillApplicationsList.tsx`)
- **Data Calls**:
  - `getUserSkillApplications` or `getCustomerSkillApplications` - Fetches skill applications
  - `useRealtimeSubscription('skill_applications')` - Real-time updates
  - `deleteSkillApplication` - Deletes skill applications
- **Renders**:
  - List of skill applications
- **Interactions**:
  - Delete skill applications
  - Filter skill applications

### ApplySkillButton (`src/components/ApplySkillButton.tsx`)
- **Data Calls**:
  - `createSkillApplication` - Creates new skill applications
- **Interactions**:
  - Select skills, customers, and proficiency levels
  - Submit new skill applications

## Form Components

### CustomerForm (`src/components/forms/CustomerForm.tsx`)
- **Data Calls**:
  - `useSupabaseQuery('industries')` - Fetches available industries
- **Interactions**:
  - Create/edit customer information

### SkillForm (`src/components/forms/SkillForm.tsx`)
- **Data Calls**:
  - `useSupabaseQuery('skill_categories')` - Fetches available skill categories
- **Interactions**:
  - Create/edit skill information
  - Add/remove proficiency levels

### SkillApplicationDialog (`src/components/dialogs/SkillApplicationDialog.tsx`)
- **Data Calls**:
  - `useSupabaseQuery('skills')` - Fetches available skills
  - `useSupabaseQuery('customers')` - Fetches available customers
  - `createSkillApplication` or `updateSkillApplication` - Create/update applications
- **Interactions**:
  - Select skill, customer, proficiency
  - Set dates and notes

## UI Components

### EntityDetail (`src/components/ui/EntityDetail.tsx`)
- **Core container component used by all detail pages**
- **Renders**:
  - Entity header with image, title, subtitle
  - Main content area
  - Related entities
  - Edit form
- **Interactions**:
  - Edit entity
  - Delete entity
  - Upload entity image

### UnifiedTimeline (`src/components/ui/UnifiedTimeline.tsx`)
- **Data Passed From**:
  - `useUnifiedTimeline` hook
- **Renders**:
  - Timeline of events with icons and entity links
- **Interactions**:
  - Refresh timeline
  - Click entity links to navigate

### DataTable (`src/components/ui/DataTable.tsx`)
- **Generic table component used by list pages**
- **Interactions**:
  - Sorting columns
  - Pagination
  - Row actions

### EntityGrid (`src/components/ui/EntityGrid.tsx`)
- **Grid layout for entities used by list pages**
- **Interactions**:
  - Click to navigate to detail view
  - Edit entity

## Data Flow Relationships

### User → Skills
- `UserDetail` → `UserAppliedSkills` → Skill entity links
- `UserDetail` → Add skill dialog → Skill selection

### User → Customers
- `UserDetail` → User customers section → Customer entity links
- `UserDetail` → Add customer assignment dialog → Customer selection

### Customer → Users
- `CustomerDetail` → Team members section → User entity links

### Customer → Skills
- `CustomerDetail` → `CustomerSkillApplicationsList` → Skill entity links

### Skill → Users
- `SkillDetail` → Users with this skill section → User entity links

## Navigation Paths

### Entity Navigation
- User entity names (throughout the app) → `UserDetail`
- Customer entity names (throughout the app) → `CustomerDetail`
- Skill entity names (throughout the app) → `SkillDetail`
- Skill application mentions → `SkillApplicationsPage` or detail pages

### Timeline Navigation
- Timeline event entities → Respective detail pages
- Timeline event actions → Action-specific views

## Consistent Patterns

### Entity Cards
- Always include entity name as primary content
- Always make entity name a clickable link to detail page
- Always include relevant metadata (dates, types, etc.)
- Use consistent icon mapping for entity types

### Data Lists
- Always implement null-safe rendering with `safeData = data || []`
- Always show loading and error states consistently
- Always include empty state messaging
- Always make entity references clickable links

### Detail Views
- Always structure with EntityDetail component
- Always include main content + related entities + timeline
- Always implement refresh methods for all data sources
- Always handle nullable values with defaults or optional chaining 