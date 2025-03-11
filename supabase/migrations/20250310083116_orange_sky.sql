/*
  # Add customer roles management

  1. New Tables
    - `customer_roles`
      - `id` (integer, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_at` (timestamp)

  2. Changes
    - Update `customer_users` table to reference `customer_roles`
      - Rename `user_role` column to `role_id` and change type to integer
      - Add foreign key constraint to `customer_roles`

  3. Security
    - Enable RLS on `customer_roles` table
    - Add policies for authenticated users
*/

-- Create customer roles table
CREATE TABLE IF NOT EXISTS customer_roles (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customer_roles ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Allow authenticated users to read customer_roles"
  ON customer_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default roles
INSERT INTO customer_roles (name, description)
VALUES 
  ('admin', 'Full access to customer management'),
  ('manager', 'Can manage team and resources'),
  ('member', 'Regular team member'),
  ('observer', 'Read-only access')
ON CONFLICT (name) DO NOTHING;

-- Update customer_users table
DO $$ 
BEGIN
  -- Rename and change type of user_role column
  ALTER TABLE customer_users 
    DROP COLUMN IF EXISTS user_role,
    ADD COLUMN role_id integer REFERENCES customer_roles(id);
END $$;