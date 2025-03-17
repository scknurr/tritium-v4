-- Fix the full_name column issue in skills table
ALTER TABLE public.skills
  DROP COLUMN IF EXISTS full_name;

-- Create a function to handle skill upserts
CREATE OR REPLACE FUNCTION public.handle_skill_upsert() 
RETURNS TRIGGER AS $$
BEGIN
  -- If we're trying to insert a skill that already exists, update it instead
  IF EXISTS (SELECT 1 FROM public.skills WHERE id = NEW.id) THEN
    UPDATE public.skills
    SET 
      name = NEW.name,
      description = NEW.description,
      category_id = NEW.category_id,
      proficiency_levels = NEW.proficiency_levels,
      svg_icon = NEW.svg_icon,
      updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NULL; -- Don't perform the insert
  END IF;
  RETURN NEW; -- Proceed with the insert
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to handle skill upserts
DROP TRIGGER IF EXISTS before_skill_insert ON public.skills;
CREATE TRIGGER before_skill_insert
  BEFORE INSERT ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_skill_upsert();

-- Add updated_at column with a trigger to update it
ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add trigger for updating timestamp
DROP TRIGGER IF EXISTS skills_update_timestamp ON public.skills;
CREATE TRIGGER skills_update_timestamp
  BEFORE UPDATE ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- Fix RLS policies for skills
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

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema'); 