-- Add changes column to audit_logs table
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS changes JSONB;

-- Update entity_id to be TEXT to support both numeric and UUID IDs
ALTER TABLE public.audit_logs ALTER COLUMN entity_id TYPE TEXT USING entity_id::TEXT; 