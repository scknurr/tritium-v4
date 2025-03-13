/**
 * Test Helpers for Debugging and Data Validation
 * 
 * This file contains helper functions for testing and debugging
 * the application, including data formatters, validators, and 
 * comparison utilities.
 */

import { supabase } from './supabase';
import { logger } from './debug';

/**
 * Creates a sample entity and logs the audit data generated
 * Useful for testing the audit logging system
 */
export async function testAuditLogging(entityType: string, entityData: any): Promise<void> {
  try {
    logger.info(`Testing audit logging for ${entityType}`);
    
    // 1. Create the entity
    const { data: createData, error: createError } = await supabase
      .from(entityType)
      .insert(entityData)
      .select()
      .single();
      
    if (createError) {
      logger.error(`Error creating test ${entityType}`, createError);
      return;
    }
    
    logger.debug(`Created test ${entityType}`, createData);
    
    // 2. Check for audit log entry
    const { data: auditData, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', createData.id)
      .eq('event_type', 'INSERT')
      .order('event_time', { ascending: false })
      .limit(1);
      
    if (auditError) {
      logger.error(`Error fetching audit logs for ${entityType}`, auditError);
      return;
    }
    
    logger.debug(`Audit log entry for creation`, auditData);
    
    // 3. Update the entity
    const updateData = { ...entityData, description: `Updated description ${Date.now()}` };
    const { data: updateResult, error: updateError } = await supabase
      .from(entityType)
      .update(updateData)
      .eq('id', createData.id)
      .select()
      .single();
      
    if (updateError) {
      logger.error(`Error updating test ${entityType}`, updateError);
      return;
    }
    
    logger.debug(`Updated test ${entityType}`, updateResult);
    
    // 4. Check for update audit log
    const { data: updateAuditData, error: updateAuditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', createData.id)
      .eq('event_type', 'UPDATE')
      .order('event_time', { ascending: false })
      .limit(1);
      
    if (updateAuditError) {
      logger.error(`Error fetching update audit logs for ${entityType}`, updateAuditError);
      return;
    }
    
    logger.debug(`Audit log entry for update`, updateAuditData);
    
    // 5. Clean up - delete the test entity
    const { error: deleteError } = await supabase
      .from(entityType)
      .delete()
      .eq('id', createData.id);
      
    if (deleteError) {
      logger.error(`Error deleting test ${entityType}`, deleteError);
    }
    
    logger.info(`Completed audit logging test for ${entityType}`);
  } catch (error) {
    logger.error(`Unexpected error in testAuditLogging`, error);
  }
}

/**
 * Test function to verify description handling
 */
export async function testDescriptionChange(entityType: 'skills' | 'customers', entityId: number): Promise<void> {
  try {
    logger.info(`Testing description change for ${entityType} id ${entityId}`);
    
    // 1. Get the current entity
    const { data: entity, error: getError } = await supabase
      .from(entityType)
      .select('*')
      .eq('id', entityId)
      .single();
      
    if (getError) {
      logger.error(`Error fetching ${entityType}`, getError);
      return;
    }
    
    const oldDescription = entity.description || '';
    const newDescription = `Test description ${Date.now()}`;
    
    logger.debug('Starting description update test', {
      entity,
      oldDescription,
      newDescription
    });
    
    // 2. Update the description
    const { data: updateResult, error: updateError } = await supabase
      .from(entityType)
      .update({ description: newDescription })
      .eq('id', entityId)
      .select()
      .single();
      
    if (updateError) {
      logger.error(`Error updating ${entityType} description`, updateError);
      return;
    }
    
    logger.debug(`Updated ${entityType} description`, updateResult);
    
    // 3. Check for audit log entry
    const { data: auditData, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('event_type', 'UPDATE')
      .order('event_time', { ascending: false })
      .limit(1);
      
    if (auditError) {
      logger.error(`Error fetching audit logs for ${entityType}`, auditError);
      return;
    }
    
    if (auditData && auditData.length > 0) {
      logger.debug(`Audit log entry`, auditData[0]);
      
      // 4. Check if the changes contain the description change
      const changes = auditData[0].changes || [];
      const descriptionChange = changes.find((c: any) => c.field === 'description');
      
      if (descriptionChange) {
        logger.debug('Description change found in audit log', descriptionChange);
      } else {
        logger.warn('No description change found in audit log', { changes });
      }
    } else {
      logger.warn('No audit log entry found for description update');
    }
    
    // 5. Restore the original description
    const { error: restoreError } = await supabase
      .from(entityType)
      .update({ description: oldDescription })
      .eq('id', entityId);
      
    if (restoreError) {
      logger.error(`Error restoring original description`, restoreError);
    }
    
    logger.info(`Completed description change test for ${entityType}`);
  } catch (error) {
    logger.error(`Unexpected error in testDescriptionChange`, error);
  }
}

/**
 * Get detailed information about a timeline item for debugging
 */
export function inspectTimelineItem(item: any): void {
  logger.debug('Timeline item details', item);
  
  if (item.changes && Array.isArray(item.changes)) {
    item.changes.forEach((change: any, index: number) => {
      logger.debug(`Change ${index + 1}`, {
        field: change.field,
        oldValue: change.oldValue,
        oldValueType: typeof change.oldValue,
        newValue: change.newValue,
        newValueType: typeof change.newValue,
        changeKey: change.changeKey
      });
    });
  } else {
    logger.debug('No changes array in timeline item');
  }
} 