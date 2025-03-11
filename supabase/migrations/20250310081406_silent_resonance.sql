/*
  # Fix audit_logs entity_id type

  1. Changes
    - Modify entity_id column to accept both integers and UUIDs by changing it to text
    - This allows storing both numeric IDs (for customers, skills) and UUIDs (for users)

  2. Security
    - Maintains existing RLS policies
*/

ALTER TABLE audit_logs 
ALTER COLUMN entity_id TYPE text USING entity_id::text;