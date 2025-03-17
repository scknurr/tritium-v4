# AI Assistant Reminder

## 🚨 IMPORTANT: Always Check These Files Before Working

Before answering questions or making changes to the codebase, please check these critical files:

1. **[DEVELOPER_NOTES.md](/DEVELOPER_NOTES.md)** - Contains known issues, important patterns, and critical implementation details
2. **[context.json](/context.json)** - Structured information about project state, known issues, and data flows
3. **[README.md](/README.md)** - Project overview, architecture, and debugging tips
4. **[docs/CODE_COMMENTS_TEMPLATE.md](/docs/CODE_COMMENTS_TEMPLATE.md)** - Templates for code comments

## Common Pitfalls to Watch For

1. **DATA INCONSISTENCY ISSUES** - Always check for inconsistencies between:
   - Timeline events vs. Applied Skills section
   - Timeline events coming from audit_logs
   - Applied Skills coming from direct skill_applications table query

2. **Timeline Configuration** - For proper functionality, Timeline components need:
   - Both `entityType`/`entityId` AND `relatedEntityType`/`relatedEntityId` parameters
   - Without both sets, data will be incomplete

3. **Component Refresh Logic** - When data is updated:
   - Multiple components may need refreshing (Timeline, Applied Skills, etc.)
   - Check that all relevant data is refreshed after mutations

## Testing Critical Flows

1. **Customer Detail Page** - http://localhost:5173/customers/1
   - Verify skills in Timeline match skills in Applied Skills section
   - If inconsistent, data synchronization issue exists

2. **After Applying Skills**
   - Check that new skills appear in both Timeline and Applied Skills
   - Verify Timeline shows proper context information

## Maintaining Documentation

When making changes:

1. Update relevant sections in DEVELOPER_NOTES.md
2. Add new issues or features to context.json
3. Use the comment templates from CODE_COMMENTS_TEMPLATE.md
4. Keep this reminder file updated with new critical patterns 