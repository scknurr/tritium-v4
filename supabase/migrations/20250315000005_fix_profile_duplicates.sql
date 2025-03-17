-- Create a function to handle profile creation/update without duplicates
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Update existing profile
    UPDATE public.profiles
    SET 
      email = NEW.email,
      full_name = NEW.raw_user_meta_data->>'full_name',
      updated_at = NOW()
    WHERE id = NEW.id;
  ELSE
    -- Insert new profile
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that calls function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create or replace RLS policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert a profile" ON public.profiles;
CREATE POLICY "Anyone can insert a profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Refresh schema cache to apply all changes
SELECT pg_notify('pgrst', 'reload schema'); 