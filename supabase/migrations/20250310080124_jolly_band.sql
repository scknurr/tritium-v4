/*
  # Add RLS policies for audit logs

  1. Security
    - Enable RLS on audit_logs table
    - Add policies for:
      - Authenticated users can insert audit logs
      - Authenticated users can read audit logs
*/

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert audit logs
CREATE POLICY "Allow authenticated users to insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to read audit logs
CREATE POLICY "Allow authenticated users to read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);