/*
  # Add role_id to user_customers table

  1. Changes
    - Add role_id column to user_customers table initially allowing nulls
    - Add foreign key constraint to customer_roles table
    - Set default role for existing records
    - Add NOT NULL constraint after data migration

  2. Security
    - Maintain existing RLS policies
*/

-- First add the column allowing nulls
ALTER TABLE user_customers 
ADD COLUMN role_id integer REFERENCES customer_roles(id);

-- Get or create a default role for existing relationships
DO $$
DECLARE
  default_role_id integer;
BEGIN
  -- Try to find an existing 'Team Member' role
  SELECT id INTO default_role_id FROM customer_roles WHERE name = 'Team Member' LIMIT 1;
  
  -- If no 'Team Member' role exists, create it
  IF default_role_id IS NULL THEN
    INSERT INTO customer_roles (name, description)
    VALUES ('Team Member', 'Default role for team members')
    RETURNING id INTO default_role_id;
  END IF;

  -- Update existing records with the default role
  UPDATE user_customers
  SET role_id = default_role_id
  WHERE role_id IS NULL;
END $$;

-- Now we can safely add the NOT NULL constraint
ALTER TABLE user_customers
ALTER COLUMN role_id SET NOT NULL;

-- Add comment to explain the column's purpose
COMMENT ON COLUMN user_customers.role_id IS 'References the role this user has at the customer';