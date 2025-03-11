/*
  # Add audit logging for relationship management

  1. Changes
    - Add audit trigger function for relationship tables
    - Add audit triggers for user_customers, user_skills, and customer_skills tables
    - Update audit log descriptions for better readability

  2. Security
    - Maintain existing RLS policies
*/

-- Update the audit log handler to include better descriptions for relationships
CREATE OR REPLACE FUNCTION handle_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  description TEXT;
  entity_name TEXT;
  related_entity_name TEXT;
BEGIN
  -- Get entity names based on the table being audited
  CASE TG_TABLE_NAME
    WHEN 'user_customers' THEN
      SELECT profiles.full_name INTO entity_name
      FROM profiles WHERE id = NEW.user_id OR id = OLD.user_id;
      
      SELECT customers.name INTO related_entity_name
      FROM customers WHERE id = NEW.customer_id OR id = OLD.customer_id;
      
      description := CASE TG_OP
        WHEN 'INSERT' THEN 'Assigned user ' || COALESCE(entity_name, 'Unknown') || ' to customer ' || COALESCE(related_entity_name, 'Unknown')
        WHEN 'DELETE' THEN 'Removed user ' || COALESCE(entity_name, 'Unknown') || ' from customer ' || COALESCE(related_entity_name, 'Unknown')
        WHEN 'UPDATE' THEN 'Updated user ' || COALESCE(entity_name, 'Unknown') || '''s assignment to customer ' || COALESCE(related_entity_name, 'Unknown')
      END;
      
    WHEN 'user_skills' THEN
      SELECT profiles.full_name INTO entity_name
      FROM profiles WHERE id = NEW.user_id OR id = OLD.user_id;
      
      SELECT skills.name INTO related_entity_name
      FROM skills WHERE id = NEW.skill_id OR id = OLD.skill_id;
      
      description := CASE TG_OP
        WHEN 'INSERT' THEN 'Added skill ' || COALESCE(related_entity_name, 'Unknown') || ' to user ' || COALESCE(entity_name, 'Unknown')
        WHEN 'DELETE' THEN 'Removed skill ' || COALESCE(related_entity_name, 'Unknown') || ' from user ' || COALESCE(entity_name, 'Unknown')
        WHEN 'UPDATE' THEN 'Updated skill ' || COALESCE(related_entity_name, 'Unknown') || ' for user ' || COALESCE(entity_name, 'Unknown')
      END;
      
    WHEN 'customer_skills' THEN
      SELECT customers.name INTO entity_name
      FROM customers WHERE id = NEW.customer_id OR id = OLD.customer_id;
      
      SELECT skills.name INTO related_entity_name
      FROM skills WHERE id = NEW.skill_id OR id = OLD.skill_id;
      
      description := CASE TG_OP
        WHEN 'INSERT' THEN 'Added skill ' || COALESCE(related_entity_name, 'Unknown') || ' to customer ' || COALESCE(entity_name, 'Unknown')
        WHEN 'DELETE' THEN 'Removed skill ' || COALESCE(related_entity_name, 'Unknown') || ' from customer ' || COALESCE(entity_name, 'Unknown')
        WHEN 'UPDATE' THEN 'Updated skill ' || COALESCE(related_entity_name, 'Unknown') || ' for customer ' || COALESCE(entity_name, 'Unknown')
      END;
      
    ELSE
      description := TG_TABLE_NAME || ' ' || TG_OP;
  END CASE;

  -- Insert the audit log entry
  INSERT INTO audit_logs (
    event_type,
    entity_type,
    entity_id,
    user_id,
    description
  ) VALUES (
    TG_OP,
    TG_TABLE_NAME,
    CASE TG_OP
      WHEN 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    auth.uid(),
    description
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for relationship tables if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'audit_user_customers'
  ) THEN
    CREATE TRIGGER audit_user_customers
    AFTER INSERT OR UPDATE OR DELETE ON user_customers
    FOR EACH ROW EXECUTE FUNCTION handle_audit_log();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'audit_user_skills'
  ) THEN
    CREATE TRIGGER audit_user_skills
    AFTER INSERT OR UPDATE OR DELETE ON user_skills
    FOR EACH ROW EXECUTE FUNCTION handle_audit_log();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'audit_customer_skills'
  ) THEN
    CREATE TRIGGER audit_customer_skills
    AFTER INSERT OR UPDATE OR DELETE ON customer_skills
    FOR EACH ROW EXECUTE FUNCTION handle_audit_log();
  END IF;
END $$;