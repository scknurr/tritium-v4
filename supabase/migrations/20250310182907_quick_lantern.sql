/*
  # Add descriptions to customers and skills

  1. Changes
    - Add description column to customers table
    - Add description column to skills table

  2. Security
    - No changes to RLS policies needed
*/

-- Add description to customers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'description'
  ) THEN
    ALTER TABLE customers ADD COLUMN description text;
  END IF;
END $$;

-- Add description to skills
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'skills' AND column_name = 'description'
  ) THEN
    ALTER TABLE skills ADD COLUMN description text;
  END IF;
END $$;