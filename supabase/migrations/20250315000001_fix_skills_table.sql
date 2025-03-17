-- Add missing proficiency_levels column to the skills table
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS proficiency_levels TEXT[] DEFAULT ARRAY['Beginner', 'Intermediate', 'Advanced', 'Expert'];

-- Refresh the schema cache to ensure the column is recognized
SELECT pg_notify('pgrst', 'reload schema'); 