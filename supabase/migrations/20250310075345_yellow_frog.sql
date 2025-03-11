/*
  # Add relationship management tables

  1. New Tables
    - `user_customers`
      - `id` (integer, primary key)
      - `user_id` (uuid, references profiles)
      - `customer_id` (integer, references customers)
      - `start_date` (date)
      - `end_date` (date, nullable)
      - `created_at` (timestamp with time zone)

    - `user_skills`
      - `id` (integer, primary key)
      - `user_id` (uuid, references profiles)
      - `skill_id` (integer, references skills)
      - `proficiency_level` (text)
      - `created_at` (timestamp with time zone)

    - `customer_skills`
      - `id` (integer, primary key)
      - `customer_id` (integer, references customers)
      - `skill_id` (integer, references skills)
      - `utilization_level` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create user_customers table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS user_customers (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    customer_id integer REFERENCES customers(id) ON DELETE CASCADE,
    start_date date NOT NULL,
    end_date date,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Enable RLS and create policy if it doesn't exist
ALTER TABLE user_customers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_customers' 
    AND policyname = 'Allow authenticated users to manage user_customers'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage user_customers"
      ON user_customers
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create user_skills table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS user_skills (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id integer REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level text NOT NULL,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Enable RLS and create policy if it doesn't exist
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_skills' 
    AND policyname = 'Allow authenticated users to manage user_skills'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage user_skills"
      ON user_skills
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create customer_skills table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS customer_skills (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    customer_id integer REFERENCES customers(id) ON DELETE CASCADE,
    skill_id integer REFERENCES skills(id) ON DELETE CASCADE,
    utilization_level text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Enable RLS and create policy if it doesn't exist
ALTER TABLE customer_skills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customer_skills' 
    AND policyname = 'Allow authenticated users to manage customer_skills'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage customer_skills"
      ON customer_skills
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Add unique constraints to prevent duplicates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_customers_user_id_customer_id_unique'
  ) THEN
    ALTER TABLE user_customers
      ADD CONSTRAINT user_customers_user_id_customer_id_unique 
      UNIQUE (user_id, customer_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_skills_user_id_skill_id_unique'
  ) THEN
    ALTER TABLE user_skills
      ADD CONSTRAINT user_skills_user_id_skill_id_unique 
      UNIQUE (user_id, skill_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'customer_skills_customer_id_skill_id_unique'
  ) THEN
    ALTER TABLE customer_skills
      ADD CONSTRAINT customer_skills_customer_id_skill_id_unique 
      UNIQUE (customer_id, skill_id);
  END IF;
END $$;