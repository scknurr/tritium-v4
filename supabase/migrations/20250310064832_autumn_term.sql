/*
  # Initial Schema Setup for Skill Customer Management

  1. New Tables
    - profiles (linked to Supabase Auth)
    - customers
    - skills
    - customer_users
    - customer_skills
    - user_skills
    - user_customers
    - skill_customers
    - skill_users
    - audit_logs

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    
  3. Triggers
    - Auto-create profile on user signup
    - Audit logging for all tables
*/

-- Profiles table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  title TEXT,
  bio TEXT,
  extended_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  status TEXT CHECK (status IN ('active', 'historical')) DEFAULT 'active',
  industry TEXT,
  extended_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills table
CREATE TABLE IF NOT EXISTS public.skills (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  extended_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relationship tables
CREATE TABLE IF NOT EXISTS public.customer_users (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES public.customers ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE,
  user_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_skills (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES public.customers ON DELETE CASCADE,
  skill_id INTEGER REFERENCES public.skills ON DELETE CASCADE,
  utilization_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_skills (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE,
  skill_id INTEGER REFERENCES public.skills ON DELETE CASCADE,
  proficiency_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_customers (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE,
  customer_id INTEGER REFERENCES public.customers ON DELETE CASCADE,
  start_date DATE,
  end_date DATE DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.skill_customers (
  id SERIAL PRIMARY KEY,
  skill_id INTEGER REFERENCES public.skills ON DELETE CASCADE,
  customer_id INTEGER REFERENCES public.customers ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  application_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.skill_users (
  id SERIAL PRIMARY KEY,
  skill_id INTEGER REFERENCES public.skills ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE,
  proficiency_display TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  user_id UUID REFERENCES public.profiles,
  description TEXT,
  event_time TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow users to update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to read customers"
  ON public.customers FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage customers"
  ON public.customers FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read skills"
  ON public.skills FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage skills"
  ON public.skills FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read customer_users"
  ON public.customer_users FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage customer_users"
  ON public.customer_users FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read customer_skills"
  ON public.customer_skills FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage customer_skills"
  ON public.customer_skills FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read user_skills"
  ON public.user_skills FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage user_skills"
  ON public.user_skills FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read user_customers"
  ON public.user_customers FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage user_customers"
  ON public.user_customers FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read skill_customers"
  ON public.skill_customers FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage skill_customers"
  ON public.skill_customers FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read skill_users"
  ON public.skill_users FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage skill_users"
  ON public.skill_users FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read audit_logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (true);

-- Create trigger for auto-creating profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function and trigger for audit logging
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    event_type,
    entity_type,
    entity_id,
    user_id,
    description
  )
  VALUES (
    TG_OP,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    auth.uid(),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'Created new ' || TG_TABLE_NAME
      WHEN TG_OP = 'UPDATE' THEN 'Updated ' || TG_TABLE_NAME
      WHEN TG_OP = 'DELETE' THEN 'Deleted ' || TG_TABLE_NAME
    END
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for all tables
CREATE TRIGGER audit_customers
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

CREATE TRIGGER audit_skills
  AFTER INSERT OR UPDATE OR DELETE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

CREATE TRIGGER audit_customer_users
  AFTER INSERT OR UPDATE OR DELETE ON public.customer_users
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

CREATE TRIGGER audit_customer_skills
  AFTER INSERT OR UPDATE OR DELETE ON public.customer_skills
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

CREATE TRIGGER audit_user_skills
  AFTER INSERT OR UPDATE OR DELETE ON public.user_skills
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

CREATE TRIGGER audit_user_customers
  AFTER INSERT OR UPDATE OR DELETE ON public.user_customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

CREATE TRIGGER audit_skill_customers
  AFTER INSERT OR UPDATE OR DELETE ON public.skill_customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

CREATE TRIGGER audit_skill_users
  AFTER INSERT OR UPDATE OR DELETE ON public.skill_users
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();