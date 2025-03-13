-- Fix Audit Logging Script
-- Run with: psql -f fix-audit-logs.sql postgresql://postgres:postgres@127.0.0.1:54322/postgres

\echo '--- Examining Audit Logs Structure ---'
\d public.audit_logs

\echo '\n--- Recent Audit Log Entries ---'
SELECT id, event_time, event_type, entity_type, entity_id, description, 
       (changes IS NOT NULL) as has_changes
FROM public.audit_logs
ORDER BY event_time DESC
LIMIT 10;

\echo '\n--- Sample Changes Column JSON Structure ---'
SELECT id, description, changes
FROM public.audit_logs
WHERE changes IS NOT NULL
ORDER BY event_time DESC
LIMIT 3;

\echo '\n--- Testing Description Field Handling ---'
SELECT public.debug_audit_log_changes('Test old description', 'Test new description');

\echo '\n--- Database Disk Usage ---'
SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;

\echo '\n--- Active Triggers ---'
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

\echo '\n--- Verifying Database Connections ---'
SELECT count(*) as connection_count
FROM pg_stat_activity
WHERE datname = current_database();

\echo '\n--- Supabase Version Information ---'
SELECT version();

\echo '\n--- Ready to apply fixes ---'
-- Apply fixes to the handle_audit_log function if needed
-- This is a placeholder for manual corrections based on findings 