-- Ensure the profiles table has the correct structure and constraints
-- First, check if the profiles table exists
DO $$
BEGIN
  -- Create the profiles table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      title TEXT,
      bio TEXT,
      avatar_url TEXT,
      extended_data JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Ensure all required columns exist
    ALTER TABLE public.profiles
      ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY,
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS first_name TEXT,
      ADD COLUMN IF NOT EXISTS last_name TEXT,
      ADD COLUMN IF NOT EXISTS title TEXT,
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS avatar_url TEXT,
      ADD COLUMN IF NOT EXISTS extended_data JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    
    -- Ensure foreign key constraint exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'profiles_id_fkey'
    ) THEN
      ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id)
        REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Set NOT NULL constraints on required fields
ALTER TABLE public.profiles
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL;

-- Ensure we have a default value for first_name and last_name
ALTER TABLE public.profiles
  ALTER COLUMN first_name SET DEFAULT 'New',
  ALTER COLUMN last_name SET DEFAULT 'User';

-- Make sure we have indexes for frequent queries
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);
CREATE INDEX IF NOT EXISTS profiles_first_name_idx ON public.profiles (first_name);
CREATE INDEX IF NOT EXISTS profiles_last_name_idx ON public.profiles (last_name);

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema'); 