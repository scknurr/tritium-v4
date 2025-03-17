# 🚨 AI ASSISTANT: LOAD THIS FILE FIRST

This file exists to trigger context loading for AI assistants working with this codebase.

## 🔄 REQUIRED INITIALIZATION STEPS

1. **Run context loader**: `npm run load:context`
2. **Read core documentation files**:
   - [DEVELOPER_NOTES.md](/DEVELOPER_NOTES.md)
   - [context.json](/context.json)
   - [README.md](/README.md)

## 🧠 CRITICAL PATTERNS TO REMEMBER

- Timeline uses `audit_logs` table via `useUnifiedTimeline` hook
- Applied Skills uses direct query to `skill_applications` table
- Both should show the SAME data but may be inconsistent
- Must use both `entityType/entityId` AND `relatedEntityType/relatedEntityId` for complete data

## 🔍 ALWAYS CHECK FOR ISSUES

- Customer detail page at http://localhost:5173/customers/1 shows key inconsistency
- Skills appear in Timeline but may not appear in Applied Skills section
- Console logs show detailed debugging data for comparison

## 🚀 AVAILABLE HOOKS

- `useSupabaseQuery` - Standard query hook for Supabase tables
- `useMutationWithCache` - Handles mutations with cache invalidation
- `useUnifiedTimeline` - Fetches and processes timeline events

## 🛠️ AI Assistant Support Tools

This project includes several utilities to enhance AI Assistant capabilities:

1. **Context Autoloader**: `npm run ai:context`
   - Loads all context files at the start of a session
   - Provides critical reminders and recent git history

2. **Task Tracking**: `npm run ai:task`
   - Displays current active tasks
   - Reference file: `.ai-context/06_CURRENT_TASKS.md`

3. **Insight Capture**: `npm run ai:insight`
   - Interactive tool to document development insights
   - Categories: Architecture, Technical, Implementation, Debugging, Testing
   - Reference file: `.ai-context/07_INSIGHTS.md`

4. **Insight Retrieval**: `npm run ai:get-insight [search term]`
   - Lists all insights or searches for specific insights
   - Example: `npm run ai:get-insight "Timeline"`

When working with this codebase, please keep these documentation files updated
to preserve institutional knowledge across development sessions.

---

**DO NOT REMOVE THIS FILE** - It serves as a critical reminder for AI assistance 