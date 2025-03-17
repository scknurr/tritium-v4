-- Update profiles table schema to replace full_name with first_name and last_name
-- First check if the profiles table needs to be updated
DO $$
BEGIN
  -- Check if the full_name column exists and first_name does not
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    -- Add first_name and last_name columns
    ALTER TABLE public.profiles
      ADD COLUMN first_name TEXT,
      ADD COLUMN last_name TEXT;
    
    -- Copy data from full_name to first_name (as a simple migration)
    UPDATE public.profiles
    SET 
      first_name = SPLIT_PART(full_name, ' ', 1),
      last_name = SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1);
    
    -- Drop the full_name column
    ALTER TABLE public.profiles
      DROP COLUMN IF EXISTS full_name;
      
    -- Make first_name and last_name not null
    ALTER TABLE public.profiles
      ALTER COLUMN first_name SET NOT NULL,
      ALTER COLUMN last_name SET DEFAULT '';
  END IF;
END
$$;

-- Recreate necessary RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can see their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can insert their profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Create or update the profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (new.id, new.email, '', '')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema'); 