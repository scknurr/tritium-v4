# Developer Notes for Tritium-v4

## 🚨 Critical Issues & Common Pitfalls

1. **DATA INCONSISTENCY ALERT**: There's frequently inconsistency between different components showing the same data:
   - Timeline shows skill applications that don't appear in the Applied Skills section
   - Example: In customer 1, "shakesT" skill appears in timeline but not in the Applied Skills list
   - Root cause: Different data sources - Timeline pulls from audit_logs, Applied Skills uses direct DB query

2. **Data Source Confusion**: 
   - Timeline component: uses `audit_logs` table via `useUnifiedTimeline` hook
   - Applied Skills component: uses direct DB query to `skill_applications` table
   - Team Members: uses `user_customers` table

3. **Timeline Configuration Issues**:
   - Must set both `entityType`/`entityId` AND `relatedEntityType`/`relatedEntityId` to get complete data
   - Without related entity params, skill applications won't show in customer timelines

## 🔄 Key Data Flows

1. **Skill Applications**:
   - When applied: Written to `skill_applications` table AND creates audit log entry
   - Display: Should appear in both Timeline and Applied Skills section
   - Timeline uses: `useUnifiedTimeline` → `timeline-service.ts` → `transformRawTimelineItems`
   - Applied Skills uses: `CustomerSkillApplicationsList` → direct Supabase query

2. **Team Members**:
   - Stored in: `user_customers` table
   - Display: In Customer Detail under Team Members section
   - Roles come from: `customer_roles` table or direct `role` field

## 🛠️ Component Dependencies

1. **CustomerDetail.tsx**:
   - Depends on: `EntityDetail`, `CustomerForm`, `UnifiedTimeline`, `CustomerSkillApplicationsList`
   - Uses hooks: `useSupabaseQuery`, `useMutationWithCache`, `useUnifiedTimeline`

2. **UnifiedTimeline.tsx**:
   - Depends on: `timeline-service.ts` for data transformation
   - Data source: `audit_logs` table via `useUnifiedTimeline` hook

3. **CustomerSkillApplicationsList.tsx**:
   - Direct query to `skill_applications` table
   - No dependency on timeline services

## 🧪 Testing Checkpoints

1. **For any customer page**:
   - Check that skills shown in timeline ALSO appear in Applied Skills section
   - Example test: http://localhost:5173/customers/1 should show same skills in both places

2. **After applying a new skill**:
   - Verify it appears in BOTH Timeline AND Applied Skills section
   - Check that metadata in audit_logs contains customer_id

## 📅 Recent Changes

1. Added `relatedEntityType` and `relatedEntityId` to `useUnifiedTimeline` hook
2. Fixed customer context in timeline display
3. Added debug functions to log detailed timeline information

## ✅ PRE-COMMIT CHECKLIST

- [ ] Verify data consistency between Timeline and Applied Skills for the same entity
- [ ] Check for null/undefined warnings in console
- [ ] Verify that all components are using the latest data after mutations
- [ ] Test all data refresh flows (create, update, delete operations) 