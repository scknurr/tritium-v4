-- Add policies for audit_logs table
CREATE POLICY "Allow authenticated users to read audit_logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert audit_logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true); 