/*
  # Fix Audit Logging for Description Fields

  Problem:
  - Description field changes are being stored as empty objects instead of text values
  - This causes the timeline to show empty values for description changes

  Solution:
  - Update the handle_audit_log function to properly extract and store description values
  - Add special handling for description fields to ensure text content is preserved
  - Fix type casting issues that are causing database errors
*/

-- Update the handle_audit_log function to fix description field handling
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  description TEXT;
  changes JSONB;
  old_value JSONB;
  new_value JSONB;
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
      FOR column_name IN 
        SELECT key 
        FROM jsonb_object_keys(old_record || new_record) as key
        WHERE (old_record->key)::text IS DISTINCT FROM (new_record->key)::text
          AND key NOT IN ('id', 'created_at', 'updated_at')
        ORDER BY key
      LOOP
        -- Get old value - special handling for description field
        IF column_name = 'description' THEN
          -- For description fields, store the raw text values directly
          old_value := to_jsonb(COALESCE((old_record->>column_name)::text, ''));
          new_value := to_jsonb(COALESCE((new_record->>column_name)::text, ''));
        ELSE
          -- Handle category_id fields
          IF column_name = 'category_id' AND (old_record->column_name) IS NOT NULL AND (old_record->column_name)::text <> 'null' THEN
            old_value := COALESCE(
              (SELECT jsonb_build_object('name', name) 
              FROM skill_categories 
              WHERE id = (old_record->>column_name)::int
              ),
              to_jsonb(old_record->>column_name)
            );
          ELSE
            old_value := CASE 
              WHEN old_record->column_name IS NULL THEN 'null'::jsonb
              ELSE to_jsonb(old_record->>column_name)
            END;
          END IF;

          -- Handle category_id for new values
          IF column_name = 'category_id' AND (new_record->column_name) IS NOT NULL AND (new_record->column_name)::text <> 'null' THEN
            new_value := COALESCE(
              (SELECT jsonb_build_object('name', name) 
              FROM skill_categories 
              WHERE id = (new_record->>column_name)::int
              ),
              to_jsonb(new_record->>column_name)
            );
          ELSE
            new_value := CASE 
              WHEN new_record->column_name IS NULL THEN 'null'::jsonb
              ELSE to_jsonb(new_record->>column_name)
            END;
          END IF;
        END IF;

        -- Add change to the changes array with proper field name formatting
        changes := changes || jsonb_build_object(
          'field',
          CASE 
            WHEN TG_TABLE_NAME = 'skills' AND column_name = 'category_id' THEN 'category'
            ELSE column_name
          END,
          'oldValue', old_value,
          'newValue', new_value,
          'changeKey', column_name || '-' || COALESCE(old_record->>column_name, 'none') || '-to-' || COALESCE(new_record->>column_name, 'none')
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

-- Create a function to test the changes array handling
CREATE OR REPLACE FUNCTION public.debug_audit_log_changes(
  old_description TEXT,
  new_description TEXT
) RETURNS JSONB AS $$
DECLARE
  changes JSONB;
BEGIN
  changes := '[]'::JSONB;
  
  -- Simulate creating a changes entry for a description field
  changes := changes || jsonb_build_object(
    'field', 'description',
    'oldValue', to_jsonb(old_description),
    'newValue', to_jsonb(new_description),
    'changeKey', 'description-' || COALESCE(old_description, 'none') || '-to-' || COALESCE(new_description, 'none')
  );
  
  RETURN changes;
END;
$$ LANGUAGE plpgsql; 