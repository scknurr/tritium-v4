-- Fix RLS policies for profiles table
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Ensure profiles table has proper RLS policies
DROP POLICY IF EXISTS "Profiles are viewable by users who created them" ON public.profiles;
CREATE POLICY "Profiles are viewable by users who created them" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles can be inserted by anyone" ON public.profiles;
CREATE POLICY "Profiles can be inserted by anyone" 
  ON public.profiles FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Profiles can be updated by users who created them" ON public.profiles;
CREATE POLICY "Profiles can be updated by users who created them" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Fix RLS issues for skills table
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view skills
DROP POLICY IF EXISTS "Skills are viewable by everyone" ON public.skills;
CREATE POLICY "Skills are viewable by everyone" 
  ON public.skills FOR SELECT 
  USING (true);

-- Allow authenticated users to create skills 
DROP POLICY IF EXISTS "Skills can be inserted by authenticated users" ON public.skills;
CREATE POLICY "Skills can be inserted by authenticated users" 
  ON public.skills FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update skills
DROP POLICY IF EXISTS "Skills can be updated by authenticated users" ON public.skills;
CREATE POLICY "Skills can be updated by authenticated users" 
  ON public.skills FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Refresh the schema cache
SELECT pg_notify('pgrst', 'reload schema'); 