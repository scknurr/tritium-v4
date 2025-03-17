-- Add metadata column to audit_logs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN metadata JSONB;
    END IF;
END
$$;

-- Create function to show existing audit logs with a filter for skill applications
CREATE OR REPLACE FUNCTION find_skill_application_logs() 
RETURNS SETOF audit_logs AS $$
BEGIN
    RETURN QUERY 
    SELECT * FROM audit_logs 
    WHERE (entity_type = 'skill_applications' OR description ILIKE '%applied%skill%')
    ORDER BY event_time DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for skill_applications table to ensure audit logs are created
CREATE OR REPLACE FUNCTION handle_skill_application_audit()
RETURNS TRIGGER AS $$
DECLARE
    skill_name TEXT;
    customer_name TEXT;
    proficiency TEXT;
    description TEXT;
    user_full_name TEXT;
BEGIN
    -- Get skill name
    SELECT name INTO skill_name
    FROM skills
    WHERE id = NEW.skill_id;
    
    -- Get customer name
    SELECT name INTO customer_name
    FROM customers
    WHERE id = NEW.customer_id;
    
    -- Get user's full name
    SELECT full_name INTO user_full_name
    FROM profiles
    WHERE id = NEW.user_id;
    
    -- Set proficiency
    proficiency := NEW.proficiency;
    
    -- Create description
    description := 'Applied ' || COALESCE(skill_name, 'unknown skill') 
                  || ' at ' || COALESCE(customer_name, 'unknown customer')
                  || ' with ' || COALESCE(proficiency, 'unknown') || ' proficiency';
    
    -- Insert audit log with metadata
    INSERT INTO audit_logs (
        event_type,
        entity_type,
        entity_id,
        user_id,
        description,
        metadata
    ) VALUES (
        'SKILL_APPLIED', -- Using SKILL_APPLIED instead of INSERT for better classification
        'skill_applications',
        NEW.id,
        NEW.user_id,
        description,
        jsonb_build_object(
            'skill_id', NEW.skill_id,
            'skill_name', skill_name,
            'customer_id', NEW.customer_id,
            'customer_name', customer_name,
            'proficiency', NEW.proficiency,
            'user_id', NEW.user_id,
            'user_name', user_full_name,
            'notes', NEW.notes,
            'start_date', NEW.start_date,
            'type', 'SKILL_APPLIED'
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'trigger_skill_application_audit'
    ) THEN
        CREATE TRIGGER trigger_skill_application_audit
        AFTER INSERT ON skill_applications
        FOR EACH ROW
        EXECUTE FUNCTION handle_skill_application_audit();
    END IF;
END
$$; 