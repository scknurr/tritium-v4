/*
  # Update audit_logs table policies

  1. Security
    - Enable RLS on audit_logs table
    - Add policies for:
      - Inserting audit logs for authenticated users
      - Reading audit logs for authenticated users

  2. Changes
    - Drop existing policies
    - Create new, more permissive policies for authenticated users
*/

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow authenticated users to read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow authenticated users to read audit_logs" ON audit_logs;

-- Create new policies
CREATE POLICY "Allow authenticated users to insert audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (true);