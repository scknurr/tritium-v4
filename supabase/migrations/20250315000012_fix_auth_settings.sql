-- Fix profile creation trigger and RLS policies

-- Update the handle_new_user trigger function with robust error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  name_parts text[];
  first_name_part text;
  last_name_part text;
BEGIN
  -- Parse email local part to get a default name with better error handling
  BEGIN
    IF position('@' in NEW.email) > 0 THEN
      first_name_part := split_part(split_part(NEW.email, '@', 1), '.', 1);
      
      -- Capitalize first letter
      IF length(first_name_part) > 0 THEN
        first_name_part := upper(substring(first_name_part, 1, 1)) || substring(first_name_part, 2);
      ELSE
        first_name_part := 'New';
      END IF;
    ELSE
      first_name_part := 'New';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    first_name_part := 'New';
  END;
  
  last_name_part := 'User';
  
  -- Create a new profile entry with robust error handling
  BEGIN
    INSERT INTO public.profiles (
      id, 
      email, 
      first_name, 
      last_name,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id, 
      NEW.email, 
      first_name_part, 
      last_name_part,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the transaction
    RAISE NOTICE 'Error creating profile for user %: %', NEW.id, SQLERRM;
  END;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Check and update profiles RLS policies to ensure proper access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Ensure service role can access all profiles
DROP POLICY IF EXISTS "Service role can do anything with profiles" ON public.profiles;
CREATE POLICY "Service role can do anything with profiles"
ON public.profiles
FOR ALL
USING (auth.role() = 'service_role');

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema'); 