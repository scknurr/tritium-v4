import { supabase } from './supabase';
import { SkillApplication } from '../types';

/**
 * Get skill application details from a timeline item record
 */
export const getSkillApplicationDetails = async (record: any) => {
  if (!record || !record.skill_id || !record.customer_id) {
    return null;
  }

  // Get skill name
  let skillName = 'Unknown Skill';
  try {
    const { data: skillData } = await supabase
      .from('skills')
      .select('name')
      .eq('id', record.skill_id)
      .single();
    
    if (skillData) {
      skillName = skillData.name;
    }
  } catch (error) {
    console.error('Error fetching skill name:', error);
  }

  // Get customer name
  let customerName = 'Unknown Customer';
  try {
    const { data: customerData } = await supabase
      .from('customers')
      .select('name')
      .eq('id', record.customer_id)
      .single();
    
    if (customerData) {
      customerName = customerData.name;
    }
  } catch (error) {
    console.error('Error fetching customer name:', error);
  }

  // Get user name if available
  let userName = 'Unknown User';
  if (record.user_id) {
    try {
      const { data: userData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', record.user_id)
        .single();
      
      if (userData) {
        userName = `${userData.first_name} ${userData.last_name}`.trim();
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  }

  return {
    skillName,
    customerName,
    userName,
    proficiency: record.proficiency || 'Unknown'
  };
};

/**
 * Format skill application event for timeline display
 */
export const formatSkillApplicationEvent = async (item: any, actorName: string) => {
  if (!item || !item.record) {
    return null;
  }

  const details = await getSkillApplicationDetails(item.record);
  if (!details) {
    return null;
  }

  const { skillName, customerName, proficiency } = details;
  const actor = actorName || 'Someone';

  if (item.action === 'INSERT') {
    return {
      message: `${actor} applied ${skillName} at ${customerName} with proficiency: ${proficiency}`,
      icon: 'GraduationCap',
      color: 'blue'
    };
  }

  if (item.action === 'UPDATE') {
    const oldRecord = item.old_record || {};
    const newRecord = item.record || {};

    // If proficiency was updated
    if (oldRecord.proficiency !== newRecord.proficiency) {
      const oldDetails = await getSkillApplicationDetails(oldRecord);
      const oldProficiency = oldDetails?.proficiency || 'Unknown';
      
      return {
        message: `${actor} updated ${skillName} proficiency at ${customerName} from ${oldProficiency} to ${proficiency}`,
        icon: 'RefreshCw',
        color: 'purple'
      };
    }

    return {
      message: `${actor} updated ${skillName} application at ${customerName}`,
      icon: 'RefreshCw',
      color: 'purple'
    };
  }

  if (item.action === 'DELETE') {
    const oldDetails = await getSkillApplicationDetails(item.old_record);
    if (!oldDetails) {
      return null;
    }

    return {
      message: `${actor} removed ${oldDetails.skillName} from ${oldDetails.customerName}`,
      icon: 'Trash',
      color: 'red'
    };
  }

  return null;
};

/**
 * Helper function to check if a timeline item is related to skill applications
 */
export const isSkillApplicationEvent = (item: any) => {
  return item && item.table_name === 'skill_applications';
}; 