-- First drop RLS policies to allow column type changes
ALTER TABLE public.skill_applications DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own skill applications" ON public.skill_applications;
DROP POLICY IF EXISTS "Users can create their own skill applications" ON public.skill_applications;
DROP POLICY IF EXISTS "Users can update their own skill applications" ON public.skill_applications;
DROP POLICY IF EXISTS "Users can delete their own skill applications" ON public.skill_applications;

-- Drop existing constraints to rebuild them properly
ALTER TABLE public.skill_applications 
  DROP CONSTRAINT IF EXISTS skill_applications_user_id_fkey,
  DROP CONSTRAINT IF EXISTS skill_applications_skill_id_fkey,
  DROP CONSTRAINT IF EXISTS skill_applications_customer_id_fkey;

-- Fix the relationship by explicitly linking to proper tables
-- Change user_id column to match auth.users type if necessary
ALTER TABLE public.skill_applications 
  ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

-- Recreate all foreign key constraints properly
ALTER TABLE public.skill_applications
  ADD CONSTRAINT skill_applications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT skill_applications_skill_id_fkey 
    FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE,
  ADD CONSTRAINT skill_applications_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- Create explicit relationship views to help with Postgrest relationships
CREATE OR REPLACE VIEW public.skill_applications_with_relations AS
SELECT 
  sa.id,
  sa.user_id,
  sa.skill_id,
  sa.customer_id,
  sa.proficiency,
  sa.start_date,
  sa.end_date,
  sa.notes,
  sa.created_at,
  sa.updated_at,
  u.email AS user_email,
  s.name AS skill_name,
  c.name AS customer_name
FROM 
  public.skill_applications sa
JOIN 
  auth.users u ON sa.user_id = u.id
JOIN 
  public.skills s ON sa.skill_id = s.id
JOIN 
  public.customers c ON sa.customer_id = c.id;

-- Re-enable RLS on the skill_applications table
ALTER TABLE public.skill_applications ENABLE ROW LEVEL SECURITY;

-- Re-create RLS policies
CREATE POLICY "Users can view their own skill applications"
  ON public.skill_applications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own skill applications"
  ON public.skill_applications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skill applications"
  ON public.skill_applications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skill applications"
  ON public.skill_applications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Refresh schema cache to apply all changes
SELECT pg_notify('pgrst', 'reload schema'); 