/*
  Ensure all backend functions and views are updated to use first_name and last_name fields
  This is the final migration for the name field normalization effort.
*/

-- Fix any function that uses 'full_name' in profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    updated_at = now();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update any view that might reference full_name
CREATE OR REPLACE VIEW public.skill_applications_view AS
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
  s.name AS skill_name,
  c.name AS customer_name,
  CONCAT_WS(' ', p.first_name, p.last_name) AS user_name,
  p.email AS user_email
FROM public.skill_applications sa
JOIN public.skills s ON sa.skill_id = s.id
JOIN public.customers c ON sa.customer_id = c.id
JOIN public.profiles p ON sa.user_id = p.id;

-- Update audit log handling to use first/last name
CREATE OR REPLACE FUNCTION public.add_audit_metadata()
RETURNS trigger AS $$
DECLARE
  user_first_name TEXT;
  user_last_name TEXT;
  user_email TEXT;
  entity_name TEXT;
BEGIN
  -- Get user information
  SELECT first_name, last_name, email INTO user_first_name, user_last_name, user_email
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Get entity name based on entity type
  CASE NEW.entity_type
    WHEN 'profiles' THEN
      SELECT CONCAT_WS(' ', first_name, last_name) INTO entity_name
      FROM profiles
      WHERE id = NEW.entity_id;
    WHEN 'customers' THEN
      SELECT name INTO entity_name
      FROM customers
      WHERE id = NEW.entity_id::integer;
    WHEN 'skills' THEN
      SELECT name INTO entity_name
      FROM skills
      WHERE id = NEW.entity_id::integer;
    ELSE
      entity_name := NEW.entity_id;
  END CASE;
  
  -- Add metadata
  NEW.metadata := jsonb_build_object(
    'user_name', CONCAT_WS(' ', user_first_name, user_last_name),
    'user_email', user_email,
    'entity_name', entity_name
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 