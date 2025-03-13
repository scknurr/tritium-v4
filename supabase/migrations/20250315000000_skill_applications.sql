-- Create skill_applications table
CREATE TABLE IF NOT EXISTS skill_applications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  proficiency TEXT NOT NULL CHECK (proficiency IN ('NOVICE', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id, customer_id)
);

-- Add RLS policies
ALTER TABLE skill_applications ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own skill applications
CREATE POLICY "Users can view their own skill applications"
  ON skill_applications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to create their own skill applications
CREATE POLICY "Users can create their own skill applications"
  ON skill_applications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own skill applications
CREATE POLICY "Users can update their own skill applications"
  ON skill_applications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own skill applications
CREATE POLICY "Users can delete their own skill applications"
  ON skill_applications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to get user's skill applications with additional info
CREATE OR REPLACE FUNCTION get_user_skill_applications(p_user_id UUID)
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY
  SELECT
    json_build_object(
      'id', sa.id,
      'user_id', sa.user_id,
      'skill_id', sa.skill_id,
      'skill_name', s.name,
      'customer_id', sa.customer_id,
      'customer_name', c.name,
      'proficiency', sa.proficiency,
      'start_date', sa.start_date,
      'end_date', sa.end_date,
      'notes', sa.notes,
      'created_at', sa.created_at,
      'updated_at', sa.updated_at
    )
  FROM
    skill_applications sa
  JOIN
    skills s ON sa.skill_id = s.id
  JOIN
    customers c ON sa.customer_id = c.id
  WHERE
    sa.user_id = p_user_id
  ORDER BY
    sa.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get customer skill applications with additional info
CREATE OR REPLACE FUNCTION get_customer_skill_applications(p_customer_id BIGINT)
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY
  SELECT
    json_build_object(
      'id', sa.id,
      'user_id', sa.user_id,
      'user_name', p.full_name,
      'skill_id', sa.skill_id,
      'skill_name', s.name,
      'customer_id', sa.customer_id,
      'customer_name', c.name,
      'proficiency', sa.proficiency,
      'start_date', sa.start_date,
      'end_date', sa.end_date,
      'notes', sa.notes,
      'created_at', sa.created_at,
      'updated_at', sa.updated_at
    )
  FROM
    skill_applications sa
  JOIN
    skills s ON sa.skill_id = s.id
  JOIN
    customers c ON sa.customer_id = c.id
  JOIN
    profiles p ON sa.user_id = p.id
  WHERE
    sa.customer_id = p_customer_id
  ORDER BY
    sa.created_at DESC;
END;
$$ LANGUAGE plpgsql; 