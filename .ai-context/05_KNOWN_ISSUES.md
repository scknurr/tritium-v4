# 🐞 Known Issues Tracker

This document tracks specific issues in the application that need attention.

## 🚨 High Priority

### 1. Timeline vs. Applied Skills Data Inconsistency

**ID**: ISSUE-001  
**Status**: OPEN  
**Affected Components**: `CustomerDetail`, `CustomerSkillApplicationsList`, `UnifiedTimeline`

**Description**:  
Skills appear in the Timeline but not in the Applied Skills section for the same customer.

**Reproduction Steps**:
1. Navigate to http://localhost:5173/customers/1
2. Observe the Timeline section showing "shakesT" skill being applied
3. Notice that the same skill doesn't appear in the Applied Skills section above

**Root Cause**:
- Timeline pulls from `audit_logs` table via `useUnifiedTimeline` hook
- Applied Skills component pulls directly from `skill_applications` table
- Both sources should show the same data but they're out of sync

**Suggested Fix**:
- Ensure skill application events write to both tables
- Add data validation to verify consistency
- Consider a unified data source for both components

### 2. Skill Applications Not Displaying in Timeline

**ID**: ISSUE-004  
**Status**: RESOLVED  
**Affected Components**: `UnifiedTimeline`, `useUnifiedTimeline`

**Description**:  
Skill application events were not appearing in the timeline due to incomplete query parameters.

**Root Cause**:
- The timeline query was only using `entityType` and `entityId` parameters
- It was missing the `relatedEntityType` and `relatedEntityId` parameters needed to find events where the entity appears in metadata

**Fix Applied**:
- Added `relatedEntityType: 'customer'` and `relatedEntityId: id` parameters to the `useUnifiedTimeline` hook call in `CustomerDetail`

## ⚠️ Medium Priority

### 3. Unterminated String Literal in Timeline Service

**ID**: ISSUE-002  
**Status**: OPEN  
**Affected Components**: `timeline-service.ts`

**Description**:  
Unterminated string literal in `timeline-service.ts` at line 391.

**Root Cause**:
- Incomplete template string in `logger.info` statement

**Suggested Fix**:
- Add closing backtick to complete the template string

### 4. Missing Refresh Logic After Applying Skills

**ID**: ISSUE-005  
**Status**: OPEN  
**Affected Components**: `ApplySkillButton`, `CustomerDetail`

**Description**:  
When a new skill is applied, the Applied Skills list or Timeline may not refresh immediately.

**Root Cause**:
- Incomplete refresh trigger propagation between components

**Suggested Fix**:
- Ensure both `refreshAppliedSkills` and `refreshTimeline` are called after a new skill is applied
- Implement a global refresh state management approach

## 📝 Low Priority

### 5. Constant Reassignment Warnings in UnifiedTimeline

**ID**: ISSUE-003  
**Status**: OPEN  
**Affected Components**: `UnifiedTimeline.tsx`

**Description**:  
Variables declared with `const` (skillInfo, customerInfo, proficiencyInfo) being reassigned.

**Root Cause**:
- Using `const` for variables that need to be mutable

**Suggested Fix**:
- Change `const` to `let` for these variables

### 6. Timeline Event Duplicate Entries

**ID**: ISSUE-006  
**Status**: OPEN  
**Affected Components**: `UnifiedTimeline`, `useUnifiedTimeline`

**Description**:  
Timeline sometimes shows duplicate entries for the same event.

**Root Cause**:
- Query may be returning the same event from multiple sources

**Suggested Fix**:
- Add deduplication logic to filter out duplicate events based on ID or content

## 🔍 Investigation Needed

### 7. Performance Issues with Large Timeline Lists

**ID**: ISSUE-007  
**Status**: INVESTIGATING  
**Affected Components**: `UnifiedTimeline`

**Description**:  
When loading many timeline events, the UI can become slow or unresponsive.

**Areas to Investigate**:
- Pagination implementation
- Virtual scrolling
- Data fetching optimization

### 8. Inconsistent Data Refresh Patterns

**ID**: ISSUE-008  
**Status**: INVESTIGATING  
**Affected Components**: Multiple components

**Description**:  
Different components use different patterns for refreshing data, leading to inconsistent behavior.

**Areas to Investigate**:
- Standardize refresh approach across components
- Consider React Query or similar library for data fetching/caching 