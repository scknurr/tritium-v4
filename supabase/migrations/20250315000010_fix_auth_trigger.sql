-- Fix the user registration trigger to properly handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  name_parts text[];
  first_name_part text;
  last_name_part text;
BEGIN
  -- Parse email local part to get a default name
  IF position('@' in NEW.email) > 0 THEN
    first_name_part := split_part(split_part(NEW.email, '@', 1), '.', 1);
    -- Capitalize first letter
    first_name_part := upper(substring(first_name_part, 1, 1)) || substring(first_name_part, 2);
  ELSE
    first_name_part := 'New';
  END IF;
  
  last_name_part := 'User';
  
  -- Create a new profile entry with the extracted names
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
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is correctly attached to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema'); 