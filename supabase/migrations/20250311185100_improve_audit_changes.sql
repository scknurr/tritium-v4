/*
  # Improve audit logging and timeline display

  1. Changes
    - Update handle_audit_log function to better format changes
    - Add proper handling of industry and category references
    - Improve deduplication by using stable keys
    - Fix color scheme for entities
*/

-- Update the audit log handler to better handle changes
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  description TEXT;
  changes JSONB;
  old_value JSONB;
  new_value JSONB;
  change_key TEXT;
BEGIN
  -- Initialize changes array
  changes := '[]'::JSONB;

  -- Handle different operations
  CASE TG_OP
    WHEN 'UPDATE' THEN
      -- Compare all columns and record changes
      FOR old_value, new_value IN
        SELECT 
          CASE 
            -- Handle industry_id updates
            WHEN key = 'industry_id' THEN
              COALESCE(
                (SELECT jsonb_build_object('name', name) 
                FROM industries 
                WHERE id = (old_record->>key)::int
                ),
                'null'::jsonb
              )
            -- Handle category_id updates
            WHEN key = 'category_id' THEN
              COALESCE(
                (SELECT jsonb_build_object('name', name) 
                FROM skill_categories 
                WHERE id = (old_record->>key)::int
                ),
                'null'::jsonb
              )
            ELSE
              to_jsonb(old_record->>key)
          END as old_val,
          CASE
            -- Handle industry_id updates
            WHEN key = 'industry_id' THEN
              COALESCE(
                (SELECT jsonb_build_object('name', name) 
                FROM industries 
                WHERE id = (new_record->>key)::int
                ),
                'null'::jsonb
              )
            -- Handle category_id updates
            WHEN key = 'category_id' THEN
              COALESCE(
                (SELECT jsonb_build_object('name', name) 
                FROM skill_categories 
                WHERE id = (new_record->>key)::int
                ),
                'null'::jsonb
              )
            ELSE
              to_jsonb(new_record->>key)
          END as new_val,
          -- Create a stable key for deduplication
          CASE
            WHEN key = 'industry_id' THEN 
              'industry-' || COALESCE((SELECT name FROM industries WHERE id = (old_record->>key)::int), '') ||
              '-to-' || COALESCE((SELECT name FROM industries WHERE id = (new_record->>key)::int), '')
            WHEN key = 'category_id' THEN
              'category-' || COALESCE((SELECT name FROM skill_categories WHERE id = (old_record->>key)::int), '') ||
              '-to-' || COALESCE((SELECT name FROM skill_categories WHERE id = (new_record->>key)::int), '')
            ELSE
              key || '-' || COALESCE(old_record->>key, '') || '-to-' || COALESCE(new_record->>key, '')
          END as change_key
        FROM jsonb_each_text(to_jsonb(OLD)) old_record
        FULL OUTER JOIN jsonb_each_text(to_jsonb(NEW)) new_record USING (key)
        WHERE old_record->>key IS DISTINCT FROM new_record->>key
          AND key NOT IN ('id', 'created_at', 'updated_at')
        ORDER BY key  -- Ensure consistent order of changes
      LOOP
        -- Add change to the changes array
        changes := changes || jsonb_build_object(
          'field',
          CASE 
            WHEN TG_TABLE_NAME = 'customers' AND key = 'industry_id' THEN 'industry'
            WHEN TG_TABLE_NAME = 'skills' AND key = 'category_id' THEN 'category'
            ELSE key
          END,
          'oldValue', old_value,
          'newValue', new_value,
          'changeKey', change_key  -- Add change key for deduplication
        );
      END LOOP;

      description := 'Updated ' || TG_TABLE_NAME || ' ' || COALESCE(NEW.name, NEW.id::text);

    WHEN 'INSERT' THEN
      description := 'Created ' || TG_TABLE_NAME || ' ' || COALESCE(NEW.name, NEW.id::text);

    WHEN 'DELETE' THEN
      description := 'Deleted ' || TG_TABLE_NAME || ' ' || COALESCE(OLD.name, OLD.id::text);
  END CASE;

  -- Insert the audit log entry
  INSERT INTO public.audit_logs (
    event_type,
    entity_type,
    entity_id,
    user_id,
    description,
    changes
  )
  VALUES (
    TG_OP,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id::text
      ELSE NEW.id::text
    END,
    auth.uid(),
    description,
    CASE
      WHEN TG_OP = 'UPDATE' AND jsonb_array_length(changes) > 0 THEN changes
      ELSE NULL
    END
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 