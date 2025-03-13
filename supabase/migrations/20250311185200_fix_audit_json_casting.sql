/*
  # Fix JSON casting in audit log function

  Fixes:
  - Add proper type casting for JSON operations
  - Fix operator does not exist error for ->> on record types
  - Ensure proper handling of NULL values
*/

CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  description TEXT;
  changes JSONB;
  old_value JSONB;
  new_value JSONB;
  change_key TEXT;
  old_record JSONB;
  new_record JSONB;
BEGIN
  -- Convert records to JSONB
  old_record := to_jsonb(OLD);
  new_record := to_jsonb(NEW);
  
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
            WHEN key = 'industry_id' AND (old_record->key)::text IS NOT NULL THEN
              COALESCE(
                (SELECT jsonb_build_object('name', name) 
                FROM industries 
                WHERE id = (old_record->key)::text::int
                ),
                'null'::jsonb
              )
            -- Handle category_id updates
            WHEN key = 'category_id' AND (old_record->key)::text IS NOT NULL THEN
              COALESCE(
                (SELECT jsonb_build_object('name', name) 
                FROM skill_categories 
                WHERE id = (old_record->key)::text::int
                ),
                'null'::jsonb
              )
            ELSE
              CASE 
                WHEN old_record->key IS NULL THEN 'null'::jsonb
                ELSE to_jsonb((old_record->>key)::text)
              END
          END as old_val,
          CASE
            -- Handle industry_id updates
            WHEN key = 'industry_id' AND (new_record->key)::text IS NOT NULL THEN
              COALESCE(
                (SELECT jsonb_build_object('name', name) 
                FROM industries 
                WHERE id = (new_record->key)::text::int
                ),
                'null'::jsonb
              )
            -- Handle category_id updates
            WHEN key = 'category_id' AND (new_record->key)::text IS NOT NULL THEN
              COALESCE(
                (SELECT jsonb_build_object('name', name) 
                FROM skill_categories 
                WHERE id = (new_record->key)::text::int
                ),
                'null'::jsonb
              )
            ELSE
              CASE 
                WHEN new_record->key IS NULL THEN 'null'::jsonb
                ELSE to_jsonb((new_record->>key)::text)
              END
          END as new_val,
          -- Create a stable key for deduplication
          CASE
            WHEN key = 'industry_id' THEN 
              'industry-' || COALESCE(
                (SELECT name FROM industries WHERE id = (old_record->key)::text::int),
                ''
              ) ||
              '-to-' || COALESCE(
                (SELECT name FROM industries WHERE id = (new_record->key)::text::int),
                ''
              )
            WHEN key = 'category_id' THEN
              'category-' || COALESCE(
                (SELECT name FROM skill_categories WHERE id = (old_record->key)::text::int),
                ''
              ) ||
              '-to-' || COALESCE(
                (SELECT name FROM skill_categories WHERE id = (new_record->key)::text::int),
                ''
              )
            ELSE
              key || '-' || 
              COALESCE((old_record->>key)::text, '') || 
              '-to-' || 
              COALESCE((new_record->>key)::text, '')
          END as change_key
        FROM jsonb_object_keys(old_record || new_record) as key
        WHERE (old_record->key)::text IS DISTINCT FROM (new_record->key)::text
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

      description := 'Updated ' || TG_TABLE_NAME || ' ' || COALESCE(
        (new_record->>'name')::text,
        (new_record->>'id')::text
      );

    WHEN 'INSERT' THEN
      description := 'Created ' || TG_TABLE_NAME || ' ' || COALESCE(
        (new_record->>'name')::text,
        (new_record->>'id')::text
      );

    WHEN 'DELETE' THEN
      description := 'Deleted ' || TG_TABLE_NAME || ' ' || COALESCE(
        (old_record->>'name')::text,
        (old_record->>'id')::text
      );
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
      WHEN TG_OP = 'DELETE' THEN (old_record->>'id')::text
      ELSE (new_record->>'id')::text
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