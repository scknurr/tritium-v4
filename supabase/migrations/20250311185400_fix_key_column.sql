/*
  # Fix key column reference in audit logging

  Fixes:
  - Remove reference to non-existent key column
  - Use column name directly from the loop variable
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
  column_name TEXT;
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
      FOR column_name, old_value, new_value IN
        SELECT 
          key as col_name,
          CASE 
            -- Handle industry_id updates
            WHEN key = 'industry_id' THEN
              CASE
                WHEN (old_record->key)::text = 'null' OR (old_record->key) IS NULL THEN 'null'::jsonb
                ELSE COALESCE(
                  (SELECT jsonb_build_object('name', name) 
                  FROM industries 
                  WHERE id = (old_record->key)::text::int
                  ),
                  'null'::jsonb
                )
              END
            -- Handle category_id updates
            WHEN key = 'category_id' THEN
              CASE
                WHEN (old_record->key)::text = 'null' OR (old_record->key) IS NULL THEN 'null'::jsonb
                ELSE COALESCE(
                  (SELECT jsonb_build_object('name', name) 
                  FROM skill_categories 
                  WHERE id = (old_record->key)::text::int
                  ),
                  'null'::jsonb
                )
              END
            ELSE
              CASE 
                WHEN old_record->key IS NULL THEN 'null'::jsonb
                ELSE to_jsonb((old_record->>key)::text)
              END
          END as old_val,
          CASE
            -- Handle industry_id updates
            WHEN key = 'industry_id' THEN
              CASE
                WHEN (new_record->key)::text = 'null' OR (new_record->key) IS NULL THEN 'null'::jsonb
                ELSE COALESCE(
                  (SELECT jsonb_build_object('name', name) 
                  FROM industries 
                  WHERE id = (new_record->key)::text::int
                  ),
                  'null'::jsonb
                )
              END
            -- Handle category_id updates
            WHEN key = 'category_id' THEN
              CASE
                WHEN (new_record->key)::text = 'null' OR (new_record->key) IS NULL THEN 'null'::jsonb
                ELSE COALESCE(
                  (SELECT jsonb_build_object('name', name) 
                  FROM skill_categories 
                  WHERE id = (new_record->key)::text::int
                  ),
                  'null'::jsonb
                )
              END
            ELSE
              CASE 
                WHEN new_record->key IS NULL THEN 'null'::jsonb
                ELSE to_jsonb((new_record->>key)::text)
              END
          END as new_val
        FROM jsonb_object_keys(old_record || new_record) as key
        WHERE (old_record->key)::text IS DISTINCT FROM (new_record->key)::text
          AND key NOT IN ('id', 'created_at', 'updated_at')
        ORDER BY key  -- Ensure consistent order of changes
      LOOP
        -- Add change to the changes array
        changes := changes || jsonb_build_object(
          'field',
          CASE 
            WHEN TG_TABLE_NAME = 'customers' AND column_name = 'industry_id' THEN 'industry'
            WHEN TG_TABLE_NAME = 'skills' AND column_name = 'category_id' THEN 'category'
            ELSE column_name
          END,
          'oldValue', old_value,
          'newValue', new_value,
          'changeKey', 
          CASE
            WHEN column_name = 'industry_id' THEN 
              'industry-' || COALESCE(
                (SELECT name FROM industries WHERE id = NULLIF((old_record->>'industry_id')::text, 'null')::int),
                'none'
              ) ||
              '-to-' || COALESCE(
                (SELECT name FROM industries WHERE id = NULLIF((new_record->>'industry_id')::text, 'null')::int),
                'none'
              )
            WHEN column_name = 'category_id' THEN
              'category-' || COALESCE(
                (SELECT name FROM skill_categories WHERE id = NULLIF((old_record->>'category_id')::text, 'null')::int),
                'none'
              ) ||
              '-to-' || COALESCE(
                (SELECT name FROM skill_categories WHERE id = NULLIF((new_record->>'category_id')::text, 'null')::int),
                'none'
              )
            ELSE
              column_name || '-' || 
              COALESCE((old_record->>column_name)::text, 'none') || 
              '-to-' || 
              COALESCE((new_record->>column_name)::text, 'none')
          END
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