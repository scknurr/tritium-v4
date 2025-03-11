/*
  # Add lookup tables for categories and industries

  1. New Tables
    - `skill_categories`
      - `id` (serial, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_at` (timestamp)
    
    - `industries`
      - `id` (serial, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_at` (timestamp)

  2. Changes
    - Modify `skills` table to reference `skill_categories`
    - Modify `customers` table to reference `industries`

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create skill_categories table
CREATE TABLE IF NOT EXISTS skill_categories (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read skill_categories"
  ON skill_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage skill_categories"
  ON skill_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create industries table
CREATE TABLE IF NOT EXISTS industries (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read industries"
  ON industries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage industries"
  ON industries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Modify existing tables to use foreign keys
ALTER TABLE skills ADD COLUMN IF NOT EXISTS category_id integer REFERENCES skill_categories(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS industry_id integer REFERENCES industries(id);