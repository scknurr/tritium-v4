/*
  # Enhance audit logging to better handle changes

  1. Changes
    - Update handle_audit_log function to properly format changes for industry and category updates
    - Add better handling of JSON objects in changes
    - Ensure changes are properly stored in the changes column
*/

-- Update the audit log handler to better handle changes
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  description TEXT;
  changes JSONB;
  old_value JSONB;
  new_value JSONB;
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
          END as new_val
        FROM jsonb_each_text(to_jsonb(OLD)) old_record
        FULL OUTER JOIN jsonb_each_text(to_jsonb(NEW)) new_record USING (key)
        WHERE old_record->>key IS DISTINCT FROM new_record->>key
          AND key NOT IN ('id', 'created_at', 'updated_at')
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
          'newValue', new_value
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