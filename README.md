# Tritium v4: Skill-Customer Management System

A comprehensive system for managing skills, customers, and their relationships. Track which skills are being applied at which customers, manage team members, and view activity timelines.

## 📋 Quick Links

- 🏠 [Production](#) (TBD)
- 🧪 [Local Development](http://localhost:5173)
- 📊 [Supabase Dashboard](#) (TBD)
- 📝 [Developer Notes](./DEVELOPER_NOTES.md)
- 🔄 [Development Context](./context.json)

## 🚀 Getting Started

```bash
# Clone the repository
git clone [repository-url]

# Navigate to the project directory
cd tritium-v4

# Install dependencies
npm install

# Start the Supabase local development environment
npx supabase start

# Reset the database (optional)
npx supabase db reset

# Start the development server
npm run dev
```

## 🏗️ Architecture

### Front-end

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **State Management**: React Hooks + Context
- **API Queries**: Supabase JavaScript client
- **UI Components**: Custom components with Tailwind CSS

### Back-end

- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Realtime**: Supabase Realtime for live updates

### Key Components

1. **EntityDetail**: Base component for detail views (Customers, Skills)
2. **UnifiedTimeline**: Shows activity timeline for any entity
3. **Form Components**: For creating and editing entities
4. **ApplySkillButton**: For applying skills to customers

## 📊 Data Model

### Core Tables

- `customers`: Customer organizations
- `industries`: Industries for categorization
- `skills`: Available skills in the system
- `profiles`: User profiles
- `user_customers`: User-customer relationships (team members)
- `user_skills`: User-skill relationships
- `skill_applications`: Skills applied at customers
- `customer_roles`: Roles users can have at customers
- `audit_logs`: System activity logs

### Data Flow

```
┌────────────┐         ┌────────────┐         ┌────────────┐
│            │         │            │         │            │
│   Users    │◄────────│   Skills   │─────────►  Customers │
│            │         │            │         │            │
└─────┬──────┘         └─────┬──────┘         └──────┬─────┘
      │                      │                       │
      │                      │                       │
      │                      ▼                       │
      │               ┌────────────┐                 │
      └───────────────►   Skill    │◄────────────────┘
                      │Applications│
                      └─────┬──────┘
                            │
                            │
                            ▼
                     ┌────────────┐
                     │            │
                     │ Audit Logs │
                     │            │
                     └────────────┘
```

## 🔍 Key Features

1. **Customer Management**:
   - Create, update, and delete customers
   - Associate with industries
   - View and manage team members

2. **Skill Management**:
   - Create, update, and delete skills
   - Track where skills are being applied

3. **Skill Applications**:
   - Apply skills to customers with proficiency levels
   - Track history of skill applications

4. **Activity Timeline**:
   - View activity for any entity (customer, skill, user)
   - Filter by activity type

## 🐞 Debugging Tips

### 1. Data Inconsistency Issues

When you notice data inconsistency (like skills showing in timeline but not in Applied Skills):

1. Check browser console logs to see what data was retrieved
2. Compare direct skill_applications query vs timeline events
3. Verify metadata in audit_logs entries
4. Check timestamps to ensure latest data is being displayed

### 2. Timeline Issues

If timeline events aren't appearing correctly:

1. Ensure both `entityType`/`entityId` AND `relatedEntityType`/`relatedEntityId` are set
2. Check audit_logs table for the expected entries
3. Review `useUnifiedTimeline` hook configuration
4. Verify event transformations in `timeline-service.ts`

### 3. Component Loading States

If components are stuck in loading:

1. Check for Supabase connection issues
2. Verify query parameters are correct
3. Check for null/undefined IDs in queries
4. Ensure proper error handling

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── forms/            # Form components
│   ├── ui/               # UI components like Timeline, EntityDetail
│   └── ...
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and services
│   ├── supabase.ts       # Supabase client
│   ├── hooks/            # Framework-specific hooks
│   └── timeline-service.ts # Timeline processing
├── pages/                # Page components
│   ├── detail/           # Entity detail pages
│   └── ...
├── types/                # TypeScript type definitions
├── routes.tsx            # Application routes
└── App.tsx               # Main application component
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run specific test file
npm test -- MyComponent.test.tsx
```

## 📝 Code Conventions

- Use functional components with hooks
- TypeScript interfaces for all props and data structures
- Consistent error handling
- Comprehensive logging for debugging

## 🤝 Contributing

1. Always review DEVELOPER_NOTES.md for current issues and patterns
2. Check context.json for latest project state
3. Follow data flow conventions for consistency
4. Run comprehensive tests before committing