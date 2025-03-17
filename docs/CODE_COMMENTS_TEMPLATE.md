# Code Comments Templates

This document provides standardized comment templates to use throughout the codebase for consistent documentation and to highlight critical connections between components.

## File Header Template

```typescript
/**
 * @file ComponentName.tsx
 * @description Brief description of what this component does
 * 
 * @dataSource Primary data tables this component reads from
 * @dataSink Tables this component writes to (if any)
 * @relatedComponents List of closely related components
 * @criticalNotes Any critical implementation details developers should know
 * 
 * @checkFile DEVELOPER_NOTES.md for known issues
 */
```

## Data Source Components

For components that fetch data directly:

```typescript
/**
 * @dataFlow This component fetches data from {tableName} using {queryMethod}
 * @dataConsistency This data should be consistent with {relatedComponent} which shows similar data
 * @refreshTrigger This component refreshes data when {event} occurs
 * 
 * @CRITICAL_CHECK Ensure this data matches what appears in {relatedComponent}
 * @example Test with http://localhost:5173/{route} to verify consistency
 */
```

## Data Flow Critical Points

For functions that process data between components:

```typescript
/**
 * @criticalFlow This function transforms data between {sourceComponent} and {targetComponent}
 * @dataMapping Maps fields: {sourceField} -> {targetField}
 * 
 * @consistencyGap Potential inconsistency: {details}
 * @debugTip Check console logs with: {pattern} to diagnose issues
 */
```

## Timeline Component Comments

Specific for timeline-related components:

```typescript
/**
 * @timelineSource Data for this timeline comes from {source}
 * @transformation Events are processed through {transformFunction}
 * 
 * @criticalParams Must provide both entityType/entityId AND relatedEntityType/relatedEntityId
 * @consistencyWarning Timeline events may show data not reflected in direct component queries
 * @example Compare with direct queries to {tableName} to verify consistency
 */
```

## Entity Detail Components

For detail view components:

```typescript
/**
 * @entityType This component displays details for {entityType}
 * @subComponents Contains: {list of child components}
 * 
 * @dataRefresh When data is updated, must refresh: {list of components}
 * @consistencyCheck Verify that {subComponentA} shows same data as {subComponentB}
 */
```

## Example Implementation

In `CustomerSkillApplicationsList.tsx`:

```typescript
/**
 * @file CustomerSkillApplicationsList.tsx
 * @description Displays skills applied at a specific customer
 * 
 * @dataSource skill_applications (direct Supabase query)
 * @dataSink None (read-only component)
 * @relatedComponents UnifiedTimeline (also shows skill applications)
 * @criticalNotes This component shows ONLY skills from skill_applications table,
 *                not from audit_logs like UnifiedTimeline does
 * 
 * @checkFile DEVELOPER_NOTES.md for known issues
 */

/**
 * @dataFlow This component fetches data from skill_applications using useSupabaseQuery
 * @dataConsistency This data should be consistent with UnifiedTimeline which shows similar data
 * @refreshTrigger This component refreshes data when refreshTrigger prop changes
 * 
 * @CRITICAL_CHECK Ensure this data matches what appears in Timeline events
 * @example Test with http://localhost:5173/customers/1 to verify consistency
 */
```

## In `UnifiedTimeline.tsx`:

```typescript
/**
 * @file UnifiedTimeline.tsx
 * @description Displays a timeline of activities for any entity
 * 
 * @dataSource audit_logs via useUnifiedTimeline hook
 * @dataSink None (read-only component)
 * @relatedComponents CustomerSkillApplicationsList (shows skills from direct table)
 * @criticalNotes Timeline shows events from audit_logs which may not be in sync
 *                with direct table queries
 * 
 * @checkFile DEVELOPER_NOTES.md for known issues
 */

/**
 * @timelineSource Data for this timeline comes from audit_logs table
 * @transformation Events are processed through transformRawTimelineItems
 * 
 * @criticalParams Must provide both entityType/entityId AND relatedEntityType/relatedEntityId
 * @consistencyWarning Timeline events may show data not reflected in direct component queries
 * @example Compare with direct queries to skill_applications to verify consistency
 */
```

## Usage Instructions

1. Copy the appropriate template based on the file type
2. Fill in the placeholders with the specific details
3. Place at the top of the file or function as appropriate
4. Update when significant changes are made to the component 