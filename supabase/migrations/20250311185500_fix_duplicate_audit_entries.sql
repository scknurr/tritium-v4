/*
  # Fix duplicate audit entries

  Fixes:
  - Consolidate multiple field changes into a single audit log entry
  - Improve handling of category and description updates
  - Remove redundant entries for the same transaction
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
  change_array JSONB[];
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
      FOR column_name IN 
        SELECT key 
        FROM jsonb_object_keys(old_record || new_record) as key
        WHERE (old_record->key)::text IS DISTINCT FROM (new_record->key)::text
          AND key NOT IN ('id', 'created_at', 'updated_at')
        ORDER BY key
      LOOP
        -- Get old value
        old_value := CASE 
          WHEN column_name = 'category_id' AND (old_record->column_name)::text IS NOT NULL THEN
            COALESCE(
              (SELECT jsonb_build_object('name', name) 
              FROM skill_categories 
              WHERE id = (old_record->column_name)::text::int
              ),
              'null'::jsonb
            )
          ELSE
            CASE 
              WHEN old_record->column_name IS NULL THEN 'null'::jsonb
              ELSE to_jsonb((old_record->>column_name)::text)
            END
        END;

        -- Get new value
        new_value := CASE 
          WHEN column_name = 'category_id' AND (new_record->column_name)::text IS NOT NULL THEN
            COALESCE(
              (SELECT jsonb_build_object('name', name) 
              FROM skill_categories 
              WHERE id = (new_record->column_name)::text::int
              ),
              'null'::jsonb
            )
          ELSE
            CASE 
              WHEN new_record->column_name IS NULL THEN 'null'::jsonb
              ELSE to_jsonb((new_record->>column_name)::text)
            END
        END;

        -- Add change to the changes array
        changes := changes || jsonb_build_object(
          'field',
          CASE 
            WHEN TG_TABLE_NAME = 'skills' AND column_name = 'category_id' THEN 'category'
            ELSE column_name
          END,
          'oldValue', old_value->>'name',
          'newValue', new_value->>'name'
        );
      END LOOP;

      description := format('Updated %s %s', 
        TG_TABLE_NAME, 
        COALESCE((new_record->>'name')::text, (new_record->>'id')::text)
      );

    WHEN 'INSERT' THEN
      description := format('Created %s %s',
        TG_TABLE_NAME,
        COALESCE((new_record->>'name')::text, (new_record->>'id')::text)
      );

    WHEN 'DELETE' THEN
      description := format('Deleted %s %s',
        TG_TABLE_NAME,
        COALESCE((old_record->>'name')::text, (old_record->>'id')::text)
      );
  END CASE;

  -- Only insert audit log if there are changes or it's not an UPDATE
  IF TG_OP != 'UPDATE' OR jsonb_array_length(changes) > 0 THEN
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
        WHEN TG_OP = 'UPDATE' THEN changes
        ELSE NULL
      END
    );
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 