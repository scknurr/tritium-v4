-- This migration consolidates all database schema requirements to ensure we have a complete and working set of tables

-- ==================== PROFILES TABLE ======================
-- Ensure profiles table has all required columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS extended_data JSONB DEFAULT '{}'::jsonb;

-- ==================== SKILLS TABLE ======================
-- Ensure skills table has all required columns
ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category_id BIGINT,
  ADD COLUMN IF NOT EXISTS proficiency_levels TEXT[] DEFAULT ARRAY['beginner', 'intermediate', 'advanced', 'expert'],
  ADD COLUMN IF NOT EXISTS svg_icon TEXT;

-- ==================== CUSTOMERS TABLE ======================
-- Ensure customers table has all required columns
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS industry_id BIGINT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- ==================== USER_SKILLS TABLE ======================
-- Ensure user_skills table exists
CREATE TABLE IF NOT EXISTS public.user_skills (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id BIGINT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency_level TEXT DEFAULT 'beginner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- ==================== USER_CUSTOMERS TABLE ======================
-- Ensure user_customers table exists
CREATE TABLE IF NOT EXISTS public.user_customers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  role_id BIGINT, -- Can be null for general team members
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ, -- Can be null for current assignments
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, customer_id)
);

-- ==================== CUSTOMER_SKILLS TABLE ======================
-- Ensure customer_skills table exists
CREATE TABLE IF NOT EXISTS public.customer_skills (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  skill_id BIGINT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  utilization_level TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, skill_id)
);

-- ==================== SKILL_APPLICATIONS TABLE ======================
-- Ensure skill_applications table exists
CREATE TABLE IF NOT EXISTS public.skill_applications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id BIGINT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  proficiency TEXT DEFAULT 'intermediate',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== SKILL_APPLICATION_VIEW ======================
-- Create a view for easier access to skill application data
CREATE OR REPLACE VIEW skill_application_view AS
SELECT
  sa.id,
  sa.user_id,
  p.first_name || ' ' || p.last_name AS user_name,
  p.email AS user_email,
  sa.skill_id,
  s.name AS skill_name,
  sa.customer_id,
  c.name AS customer_name,
  sa.proficiency,
  sa.start_date,
  sa.end_date,
  sa.notes,
  sa.created_at,
  sa.updated_at
FROM
  skill_applications sa
JOIN
  profiles p ON sa.user_id = p.id
JOIN
  skills s ON sa.skill_id = s.id
JOIN
  customers c ON sa.customer_id = c.id;

-- ==================== CATEGORIES TABLE ======================
-- Ensure categories table exists for skill categories
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure foreign key for skills.category_id
ALTER TABLE public.skills
  DROP CONSTRAINT IF EXISTS skills_category_id_fkey,
  ADD CONSTRAINT skills_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

-- ==================== INDUSTRIES TABLE ======================
-- Ensure industries table exists for customer industries
CREATE TABLE IF NOT EXISTS public.industries (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure foreign key for customers.industry_id
ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_industry_id_fkey,
  ADD CONSTRAINT customers_industry_id_fkey 
  FOREIGN KEY (industry_id) REFERENCES public.industries(id) ON DELETE SET NULL;

-- ==================== CUSTOMER_ROLES TABLE ======================
-- Ensure customer_roles table exists
CREATE TABLE IF NOT EXISTS public.customer_roles (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure foreign key for user_customers.role_id
ALTER TABLE public.user_customers
  DROP CONSTRAINT IF EXISTS user_customers_role_id_fkey,
  ADD CONSTRAINT user_customers_role_id_fkey 
  FOREIGN KEY (role_id) REFERENCES public.customer_roles(id) ON DELETE SET NULL;

-- ==================== UPDATE TRIGGERS ======================
-- Create updated_at triggers for all tables
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('profiles', 'skills', 'customers', 'user_skills', 
                       'user_customers', 'customer_skills', 'skill_applications', 
                       'categories', 'industries', 'customer_roles')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_update_timestamp ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER %I_update_timestamp 
                    BEFORE UPDATE ON public.%I 
                    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp()', t, t);
  END LOOP;
END
$$;

-- ==================== ROW LEVEL SECURITY ======================
-- Enable RLS on all tables
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('profiles', 'skills', 'customers', 'user_skills', 
                       'user_customers', 'customer_skills', 'skill_applications', 
                       'categories', 'industries', 'customer_roles')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END
$$;

-- Add standard RLS policies to tables
-- Profiles policies already set in previous migration

-- Skills policies
DROP POLICY IF EXISTS "Skills are viewable by everyone" ON public.skills;
CREATE POLICY "Skills are viewable by everyone"
ON public.skills
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert skills" ON public.skills;
CREATE POLICY "Authenticated users can insert skills"
ON public.skills
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update skills" ON public.skills;
CREATE POLICY "Authenticated users can update skills"
ON public.skills
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Customers policies
DROP POLICY IF EXISTS "Anyone can view customers" ON public.customers;
CREATE POLICY "Anyone can view customers"
ON public.customers
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
CREATE POLICY "Authenticated users can insert customers"
ON public.customers
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
CREATE POLICY "Authenticated users can update customers"
ON public.customers
FOR UPDATE
USING (auth.role() = 'authenticated');

-- User Skills policies
DROP POLICY IF EXISTS "User skills are viewable by everyone" ON public.user_skills;
CREATE POLICY "User skills are viewable by everyone"
ON public.user_skills
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can manage their own skills" ON public.user_skills;
CREATE POLICY "Users can manage their own skills"
ON public.user_skills
FOR ALL
USING (auth.uid() = user_id);

-- User Customers policies
DROP POLICY IF EXISTS "User customers are viewable by everyone" ON public.user_customers;
CREATE POLICY "User customers are viewable by everyone"
ON public.user_customers
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can manage their customer assignments" ON public.user_customers;
CREATE POLICY "Users can manage their customer assignments"
ON public.user_customers
FOR ALL
USING (auth.uid() = user_id);

-- Customer Skills policies
DROP POLICY IF EXISTS "Customer skills are viewable by everyone" ON public.customer_skills;
CREATE POLICY "Customer skills are viewable by everyone"
ON public.customer_skills
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage customer skills" ON public.customer_skills;
CREATE POLICY "Authenticated users can manage customer skills"
ON public.customer_skills
FOR ALL
USING (auth.role() = 'authenticated');

-- Skill Applications policies
DROP POLICY IF EXISTS "Skill applications are viewable by everyone" ON public.skill_applications;
CREATE POLICY "Skill applications are viewable by everyone"
ON public.skill_applications
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can manage their skill applications" ON public.skill_applications;
CREATE POLICY "Users can manage their skill applications"
ON public.skill_applications
FOR ALL
USING (auth.uid() = user_id);

-- Categories policies
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone"
ON public.categories
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;
CREATE POLICY "Authenticated users can manage categories"
ON public.categories
FOR ALL
USING (auth.role() = 'authenticated');

-- Industries policies
DROP POLICY IF EXISTS "Industries are viewable by everyone" ON public.industries;
CREATE POLICY "Industries are viewable by everyone"
ON public.industries
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage industries" ON public.industries;
CREATE POLICY "Authenticated users can manage industries"
ON public.industries
FOR ALL
USING (auth.role() = 'authenticated');

-- Customer Roles policies
DROP POLICY IF EXISTS "Customer roles are viewable by everyone" ON public.customer_roles;
CREATE POLICY "Customer roles are viewable by everyone"
ON public.customer_roles
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage customer roles" ON public.customer_roles;
CREATE POLICY "Authenticated users can manage customer roles"
ON public.customer_roles
FOR ALL
USING (auth.role() = 'authenticated');

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema'); 