-- Fix the full_name column issue in customers table
ALTER TABLE public.customers 
  DROP COLUMN IF EXISTS full_name,
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create a function to handle customer upserts
CREATE OR REPLACE FUNCTION public.handle_customer_upsert() 
RETURNS TRIGGER AS $$
BEGIN
  -- If we're trying to insert a customer that already exists, update it instead
  IF EXISTS (SELECT 1 FROM public.customers WHERE id = NEW.id) THEN
    UPDATE public.customers
    SET 
      name = NEW.name,
      description = NEW.description,
      industry_id = NEW.industry_id,
      website = NEW.website,
      status = NEW.status,
      logo_url = NEW.logo_url,
      updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NULL; -- Don't perform the insert
  END IF;
  RETURN NEW; -- Proceed with the insert
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to handle customer upserts
DROP TRIGGER IF EXISTS before_customer_insert ON public.customers;
CREATE TRIGGER before_customer_insert
  BEFORE INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_customer_upsert();

-- Fix the customers table to ensure RLS works properly
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read customers
DROP POLICY IF EXISTS "Anyone can view customers" ON public.customers;
CREATE POLICY "Anyone can view customers"
  ON public.customers
  FOR SELECT
  USING (true);

-- Create policy to allow authenticated users to insert customers
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
CREATE POLICY "Authenticated users can insert customers"
  ON public.customers
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update customers
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
CREATE POLICY "Authenticated users can update customers"
  ON public.customers
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Add updated_at column with a trigger to update it
ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updating timestamp
DROP TRIGGER IF EXISTS customers_update_timestamp ON public.customers;
CREATE TRIGGER customers_update_timestamp
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema'); 