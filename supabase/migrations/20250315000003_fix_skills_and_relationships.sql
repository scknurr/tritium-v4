-- Add missing svg_icon column to skills table
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS svg_icon TEXT;

-- Fix skill_applications table to properly reference users
-- First ensure the relationship is properly defined
ALTER TABLE public.skill_applications 
  DROP CONSTRAINT IF EXISTS skill_applications_user_id_fkey,
  ADD CONSTRAINT skill_applications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make sure the skills table has the right structure
ALTER TABLE public.skills 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES public.skill_categories(id);

-- Refresh schema cache after all changes
SELECT pg_notify('pgrst', 'reload schema'); 