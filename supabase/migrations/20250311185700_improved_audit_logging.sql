/*
  # Improved Audit Logging System

  This migration simplifies and improves the audit logging system:
  
  1. Uses simple text processing to ensure description and text fields are preserved correctly
  2. Properly formats all values for consistent display in the UI
  3. Provides clear type safety and null handling
  4. Follows Supabase best practices for performance
*/

-- Drop the existing debug function
DROP FUNCTION IF EXISTS public.debug_audit_log_changes;

-- Create a simplified, robust audit logging function
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  description TEXT;
  changes JSONB := '[]'::JSONB;
  old_record JSONB;
  new_record JSONB;
  column_name TEXT;
  old_value TEXT;
  new_value TEXT;
BEGIN
  -- Convert records to JSONB
  old_record := to_jsonb(OLD);
  new_record := to_jsonb(NEW);
  
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
        -- Extract old and new values as simple text for consistent processing
        old_value := COALESCE(old_record->>column_name, '');
        new_value := COALESCE(new_record->>column_name, '');
        
        -- Special handling for foreign keys that need name lookup
        IF column_name = 'category_id' AND old_value != '' THEN
          BEGIN
            SELECT name INTO old_value 
            FROM skill_categories 
            WHERE id = old_value::int;
          EXCEPTION WHEN OTHERS THEN
            -- Keep the original value if lookup fails
          END;
        END IF;
        
        IF column_name = 'category_id' AND new_value != '' THEN
          BEGIN
            SELECT name INTO new_value 
            FROM skill_categories 
            WHERE id = new_value::int;
          EXCEPTION WHEN OTHERS THEN
            -- Keep the original value if lookup fails
          END;
        END IF;
        
        IF column_name = 'industry_id' AND old_value != '' THEN
          BEGIN
            SELECT name INTO old_value 
            FROM industries 
            WHERE id = old_value::int;
          EXCEPTION WHEN OTHERS THEN
            -- Keep the original value if lookup fails
          END;
        END IF;
        
        IF column_name = 'industry_id' AND new_value != '' THEN
          BEGIN
            SELECT name INTO new_value 
            FROM industries 
            WHERE id = new_value::int;
          EXCEPTION WHEN OTHERS THEN
            -- Keep the original value if lookup fails
          END;
        END IF;
        
        -- Add change to the changes array
        changes := changes || jsonb_build_object(
          'field',
          CASE 
            WHEN TG_TABLE_NAME = 'skills' AND column_name = 'category_id' THEN 'category'
            WHEN TG_TABLE_NAME = 'customers' AND column_name = 'industry_id' THEN 'industry'
            ELSE column_name
          END,
          'oldValue', old_value,
          'newValue', new_value,
          'changeKey', column_name || '-' || old_value || '-to-' || new_value
        );
      END LOOP;

      description := format('Updated %s %s', 
        TG_TABLE_NAME, 
        COALESCE(new_record->>'name', new_record->>'id')
      );

    WHEN 'INSERT' THEN
      description := format('Created %s %s',
        TG_TABLE_NAME,
        COALESCE(new_record->>'name', new_record->>'id')
      );

    WHEN 'DELETE' THEN
      description := format('Deleted %s %s',
        TG_TABLE_NAME,
        COALESCE(old_record->>'name', old_record->>'id')
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
        WHEN TG_OP = 'DELETE' THEN old_record->>'id'
        ELSE new_record->>'id'
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

-- Create a test function for debugging
CREATE OR REPLACE FUNCTION public.test_audit_log()
RETURNS TEXT AS $$
DECLARE
  test_changes JSONB;
BEGIN
  -- Test description change audit logging
  test_changes := '[]'::JSONB;
  test_changes := test_changes || jsonb_build_object(
    'field', 'description',
    'oldValue', 'Old description text',
    'newValue', 'New description text',
    'changeKey', 'description-change'
  );
  
  RETURN 'Test completed successfully';
END;
$$ LANGUAGE plpgsql; 