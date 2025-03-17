import React, { useState } from 'react';
import { GraduationCap, PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createAuditLog } from '../lib/audit';
import { EVENT_TYPES } from '../lib/constants';
import { TimelineEventType } from '../types/timeline';

type ApplySkillButtonProps = {
  userId: string;
  onSuccess?: () => void;
  buttonText?: string;
  className?: string;
};

const ApplySkillButton: React.FC<ApplySkillButtonProps> = ({
  userId,
  onSuccess,
  buttonText = 'Apply Skill',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<{ id: number; name: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [existingApplications, setExistingApplications] = useState<{skill_id: number, customer_id: number, proficiency: string}[]>([]);
  const [formData, setFormData] = useState({
    skill_id: 0,
    customer_id: 0,
    proficiency: 'NOVICE',
    notes: ''
  });

  const openModal = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null); // Clear any previous errors
    
    // Reset form data to avoid stale state
    setFormData({
      skill_id: 0,
      customer_id: 0,
      proficiency: 'NOVICE',
      notes: ''
    });
    
    // Clear existing applications to avoid stale data
    setExistingApplications([]);
    
    try {
      // Fetch user's existing skills from user_skills (changed from profile_skills)
      const { data: userSkills, error: userSkillsError } = await supabase
        .from('user_skills')
        .select('skill_id, skill:skills(id, name)')
        .eq('user_id', userId);
      
      if (userSkillsError) throw userSkillsError;
      
      // Extract skill data from the nested structure
      const formattedSkills = userSkills?.map(item => ({
        id: item.skill_id,
        name: (item.skill as any)?.name || `Skill ${item.skill_id}`
      })) || [];
      
      setSkills(formattedSkills);
      
      // Fetch user's assigned customers from user_customers
      const { data: userCustomers, error: userCustomersError } = await supabase
        .from('user_customers')
        .select('customer_id, customer:customers(id, name)')
        .eq('user_id', userId)
        .is('end_date', null); // Only active assignments (no end date)
      
      if (userCustomersError) throw userCustomersError;
      
      // Extract customer data from the nested structure
      const formattedCustomers = userCustomers?.map(item => ({
        id: item.customer_id,
        name: (item.customer as any)?.name || `Customer ${item.customer_id}`
      })) || [];
      
      setCustomers(formattedCustomers);
      
      // Fetch existing skill applications to prevent duplicates - ensure we get fresh data
      const { data: applications, error: applicationsError } = await supabase
        .from('skill_applications')
        .select('skill_id, customer_id, proficiency, id')
        .eq('user_id', userId)
        .is('end_date', null) // Only active applications
        .order('updated_at', { ascending: false }); // Get the most recently updated first
      
      if (applicationsError) {
        console.error('Error fetching existing applications:', applicationsError);
        throw applicationsError;
      }
      
      console.log('Fetched current active applications:', applications);
      setExistingApplications(applications || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load skills or customers');
      // Ensure arrays are never undefined
      setSkills([]);
      setCustomers([]);
      setExistingApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setError(null);
    // Reset form
    setFormData({
      skill_id: 0,
      customer_id: 0,
      proficiency: 'NOVICE',
      notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if this skill-customer-proficiency combination already exists AMONG ACTIVE APPLICATIONS
      const isDuplicate = existingApplications.some(
        app => app.skill_id === formData.skill_id && 
              app.customer_id === formData.customer_id &&
              app.proficiency === formData.proficiency
      );
      
      console.log('Checking for duplicate application:', {
        formData,
        existingApplications,
        isDuplicate
      });
      
      if (isDuplicate) {
        setError(`You have already applied this skill at this customer with ${formData.proficiency} proficiency.`);
        setIsLoading(false);
        return;
      }
      
      // Clean up any potential duplicate active applications
      await cleanupActiveApplications(userId, formData.skill_id, formData.customer_id);
      
      // Fetch skill and customer names for logging
      const [skillResponse, customerResponse] = await Promise.all([
        supabase.from('skills').select('name').eq('id', formData.skill_id).single(),
        supabase.from('customers').select('name').eq('id', formData.customer_id).single()
      ]);
      
      const skillName = skillResponse.data?.name || `Skill #${formData.skill_id}`;
      const customerName = customerResponse.data?.name || `Customer #${formData.customer_id}`;
      
      console.log(`Creating skill application: ${skillName} at ${customerName} with ${formData.proficiency} proficiency`);
      
      // Initialize variables for data and errors
      let data: { id: number } | null = null;
      let errorResult: any = null;
      
      // Check if there's a historical application with the same user/skill/customer
      const { data: historicalApp, error: historicalError } = await supabase
        .from('skill_applications')
        .select('id, end_date, proficiency')
        .eq('user_id', userId)
        .eq('skill_id', formData.skill_id)
        .eq('customer_id', formData.customer_id)
        .not('end_date', 'is', null) // Find applications that have an end_date (historical)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (historicalError) {
        console.error('Error checking for historical applications:', historicalError);
      }
      
      // If we found a historical application, we'll update it instead of creating a new one
      if (historicalApp && historicalApp.length > 0 && historicalApp[0] && historicalApp[0].id) {
        console.log('Found historical application, will update it:', historicalApp[0]);
        
        try {
          // Create an audit log entry to track the reactivation
          const user = await supabase.auth.getUser();
          if (user.data.user) {
            await supabase.from('audit_logs').insert({
              event_type: 'UPDATE',
              entity_type: 'skill_applications',
              entity_id: historicalApp[0].id,
              user_id: user.data.user.id,
              description: `Reactivated ${skillName} at ${customerName} with ${formData.proficiency} proficiency`,
              metadata: {
                skill_id: formData.skill_id,
                customer_id: formData.customer_id,
                user_id: userId,
                previous_proficiency: historicalApp[0].proficiency,
                new_proficiency: formData.proficiency,
                action: 'reactivate_skill'
              }
            });
          }
          
          // Update the historical application to make it current again
          const { data: updateData, error: updateError } = await supabase
            .from('skill_applications')
            .update({
              proficiency: formData.proficiency,
              notes: formData.notes || null,
              start_date: new Date().toISOString().split('T')[0], // Reset start date to today
              end_date: null, // Remove end_date to make it active again
              updated_at: new Date().toISOString()
            })
            .eq('id', historicalApp[0].id)
            .select()
            .single();
            
            data = updateData;
            errorResult = updateError;
            
            console.log('Result of historical application update:', { data, error: errorResult });
            
            // If successful, bail out early
            if (!errorResult && data) {
              console.log(`Successfully reactivated historical application with ID: ${data.id}`);
              
              if (errorResult) {
                console.error('Detailed skill application error:', errorResult);
                console.error('Error code:', errorResult.code);
                console.error('Error message:', errorResult.message);
                console.error('Error details:', errorResult.details);
                throw errorResult;
              }
              
              if (!data) {
                throw new Error('No data returned from skill application operation');
              }
              
              console.log(`Skill application updated with ID: ${data.id}`);
              
              // Create an audit log entry with detailed metadata
              const user = await supabase.auth.getUser();
              if (user.data.user) {
                try {
                  // Get user's full name for better audit logging
                  const { data: userData } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', userId)
                    .single();
                    
                  const userName = userData?.full_name || 'User';
                  
                  // Create metadata object with comprehensive information
                  const metadataObject = {
                    skill_id: formData.skill_id,
                    skill_name: skillName,
                    customer_id: formData.customer_id,
                    customer_name: customerName,
                    proficiency: formData.proficiency,
                    user_id: userId,
                    user_name: userName,
                    notes: formData.notes || null,
                    start_date: new Date().toISOString().split('T')[0],
                    type: TimelineEventType.SKILL_APPLIED,
                    event_description: `Applied ${skillName} at ${customerName} with ${formData.proficiency} proficiency`,
                    application_id: data.id,
                    is_reapplication: true,
                    is_proficiency_change: false,
                    previous_proficiency: null
                  };
                  
                  // Create audit log entry with detailed metadata
                  const { error: auditError } = await supabase.from('audit_logs').insert({
                    event_type: TimelineEventType.SKILL_APPLIED,
                    entity_type: 'skill_applications',
                    entity_id: data.id,
                    user_id: user.data.user.id,
                    description: `Applied ${skillName} at ${customerName} with ${formData.proficiency} proficiency`,
                    metadata: metadataObject
                  });
                  
                  if (auditError) {
                    console.error('Error creating audit log with metadata:', auditError);
                    
                    // Fallback method: add the metadata information in the description field
                    const { error: fallbackError } = await supabase.from('audit_logs').insert({
                      event_type: 'SKILL_APPLIED',
                      entity_type: 'skill_applications',
                      entity_id: data.id,
                      user_id: user.data.user.id,
                      description: `Applied ${skillName} at ${customerName} with ${formData.proficiency} proficiency`
                    });
                    
                    if (fallbackError) {
                      console.error('Error creating fallback audit log:', fallbackError);
                    } else {
                      console.log('Created fallback audit log successfully');
                    }
                  } else {
                    console.log('Created audit log with metadata successfully');
                  }
                } catch (auditErr) {
                  console.error('Exception creating audit log:', auditErr);
                }
              }
              
              closeModal();
              if (onSuccess) {
                onSuccess();
              }
              
              // Force a page reload to ensure all data is refreshed from the server
              window.location.reload();
              
              return; // Exit early since we've handled everything
            }
        } catch (err) {
          console.error('Error updating historical application:', err);
          // Continue to standard flow if historical update fails
        }
      }
      
      // Check if we need to update an existing active application with a different proficiency
      const existingWithDifferentProficiency = existingApplications.some(
        app => app.skill_id === formData.skill_id && app.customer_id === formData.customer_id &&
              app.proficiency !== formData.proficiency
      );
      
      if (existingWithDifferentProficiency) {
        console.log('Found existing application with different proficiency:', existingApplications.find(
          app => app.skill_id === formData.skill_id && app.customer_id === formData.customer_id
        ));
        
        // Get the existing application for audit logging
        const existingApp = existingApplications.find(
          app => app.skill_id === formData.skill_id && app.customer_id === formData.customer_id
        );
        
        try {
          console.log('Using in-place update approach to handle proficiency change');
          
          // Create an audit log entry to preserve the history
          const user = await supabase.auth.getUser();
          if (user.data.user && existingApp) {
            await supabase.from('audit_logs').insert({
              event_type: 'UPDATE',
              entity_type: 'skill_applications',
              entity_id: (existingApp as any).id || 0,
              user_id: user.data.user.id,
              description: `Updated ${skillName} proficiency at ${customerName} from ${existingApp.proficiency} to ${formData.proficiency}`,
              metadata: {
                previous_proficiency: existingApp.proficiency,
                new_proficiency: formData.proficiency,
                skill_id: formData.skill_id,
                customer_id: formData.customer_id,
                user_id: userId,
                action: 'proficiency_update'
              }
            });
          }
          
          // Instead of deleting and re-creating, update the existing record
          // First find the ID of the existing application
          const { data: existingAppData, error: existingAppError } = await supabase
            .from('skill_applications')
            .select('id')
            .eq('user_id', userId)
            .eq('skill_id', formData.skill_id)
            .eq('customer_id', formData.customer_id)
            .is('end_date', null)
            .single();
            
          if (existingAppError) {
            console.error('Error fetching existing application ID:', existingAppError);
            throw existingAppError;
          }
          
          if (!existingAppData) {
            throw new Error('Could not find the existing application to update');
          }
          
          // Update the existing record with the new proficiency
          const { data: updateData, error: updateError } = await supabase
            .from('skill_applications')
            .update({
              proficiency: formData.proficiency,
              notes: formData.notes || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAppData.id)
            .select()
            .single();
            
          data = updateData;
          errorResult = updateError;
          
          console.log('Result of in-place update:', { data, error: errorResult });
        } catch (err) {
          console.error('Error in in-place update approach:', err);
          throw err;
        }
      } else {
        // No existing application with different proficiency, proceed with insert
        const insertResult = await supabase
          .from('skill_applications')
          .insert({
            user_id: userId,
            skill_id: formData.skill_id,
            customer_id: formData.customer_id,
            proficiency: formData.proficiency,
            notes: formData.notes || null,
            start_date: new Date().toISOString().split('T')[0], 
            end_date: null 
          })
          .select('id')
          .single();
          
        data = insertResult.data;
        errorResult = insertResult.error;
      }

      if (errorResult) {
        console.error('Detailed skill application error:', errorResult);
        console.error('Error code:', errorResult.code);
        console.error('Error message:', errorResult.message);
        console.error('Error details:', errorResult.details);
        throw errorResult;
      }
      
      if (!data) {
        throw new Error('No data returned from skill application operation');
      }
      
      console.log(`Skill application created with ID: ${data.id}`);
      
      // Create an audit log entry with detailed metadata
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        try {
          // Get user's full name for better audit logging
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();
            
          const userName = userData?.full_name || 'User';
          
          // Create metadata object with comprehensive information
          const metadataObject = {
            skill_id: formData.skill_id,
            skill_name: skillName,
            customer_id: formData.customer_id,
            customer_name: customerName,
            proficiency: formData.proficiency,
            user_id: userId,
            user_name: userName,
            notes: formData.notes || null,
            start_date: new Date().toISOString().split('T')[0],
            type: TimelineEventType.SKILL_APPLIED,
            event_description: `Applied ${skillName} at ${customerName} with ${formData.proficiency} proficiency`,
            application_id: data.id,
            is_reapplication: false,
            is_proficiency_change: false,
            previous_proficiency: null
          };
          
          // Create audit log entry with detailed metadata
          const { error: auditError } = await supabase.from('audit_logs').insert({
            event_type: TimelineEventType.SKILL_APPLIED,
            entity_type: 'skill_applications',
            entity_id: data.id,
            user_id: user.data.user.id,
            description: `Applied ${skillName} at ${customerName} with ${formData.proficiency} proficiency`,
            metadata: metadataObject
          });
          
          if (auditError) {
            console.error('Error creating audit log with metadata:', auditError);
            
            // Fallback method: add the metadata information in the description field
            const { error: fallbackError } = await supabase.from('audit_logs').insert({
              event_type: 'SKILL_APPLIED',
              entity_type: 'skill_applications',
              entity_id: data.id,
              user_id: user.data.user.id,
              description: `Applied ${skillName} at ${customerName} with ${formData.proficiency} proficiency`
            });
            
            if (fallbackError) {
              console.error('Error creating fallback audit log:', fallbackError);
            } else {
              console.log('Created fallback audit log successfully');
            }
          } else {
            console.log('Created audit log with metadata successfully');
          }
        } catch (auditErr) {
          console.error('Exception creating audit log:', auditErr);
        }
      }
      
      closeModal();
      if (onSuccess) {
        onSuccess();
      }
      
      // Force a page reload to ensure all data is refreshed from the server
      window.location.reload();
    } catch (err: any) {
      console.error('Error creating skill application:', err);
      
      // Provide more specific error messages
      if (err.code === '42501') {
        setError('Permission denied. You may not have the right permissions to insert skill applications.');
      } else if (err.code === '23505') {
        setError('You have already applied this skill at this customer with this proficiency level.');
      } else if (err.code === '23503') {
        setError('Foreign key constraint failed. One of the IDs (user, skill, or customer) does not exist.');
      } else if (err.code === '42P01') {
        setError('The skill_applications table does not exist in your database.');
      } else {
        setError(`Failed to apply skill. Error: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'skill_id' || name === 'customer_id' ? parseInt(value, 10) : value
    }));
  };

  // Ensure skills and customers are always arrays
  const skillsList = Array.isArray(skills) ? skills : [];
  const customersList = Array.isArray(customers) ? customers : [];

  // Check if the form should be disabled due to no available skills or customers
  const noSkills = skillsList.length === 0;
  const noCustomers = customersList.length === 0;
  const formDisabled = noSkills || noCustomers;

  // Determine if current skill-customer selection is a duplicate
  const isCurrentSelectionDuplicate = formData.skill_id > 0 && formData.customer_id > 0 && 
    existingApplications.some(app => 
      app.skill_id === formData.skill_id && app.customer_id === formData.customer_id &&
      app.proficiency === formData.proficiency
    );
    
  // Check if this customer-skill is already applied but with a different proficiency
  const hasOtherProficiency = formData.skill_id > 0 && formData.customer_id > 0 &&
    existingApplications.some(app =>
      app.skill_id === formData.skill_id && app.customer_id === formData.customer_id &&
      app.proficiency !== formData.proficiency
    );
    
  // If an application exists but with a different proficiency, find what it is
  const existingProficiency = hasOtherProficiency
    ? existingApplications.find(app => 
        app.skill_id === formData.skill_id && app.customer_id === formData.customer_id
      )?.proficiency
    : null;

  // Function to clean up any potential duplicate active applications
  const cleanupActiveApplications = async (userId: string, skillId: number, customerId: number) => {
    try {
      console.log('Cleaning up any potential duplicate active applications...');
      
      // Get all active applications for this combination
      const { data: activeApps, error: fetchError } = await supabase
        .from('skill_applications')
        .select('*')
        .eq('user_id', userId)
        .eq('skill_id', skillId)
        .eq('customer_id', customerId)
        .is('end_date', null);
        
      if (fetchError) {
        console.error('Error fetching active applications during cleanup:', fetchError);
        return;
      }
      
      console.log(`Found ${activeApps?.length || 0} active applications for cleanup`, activeApps);
      
      // If we have more than one active application, end all except the most recent one
      if (activeApps && activeApps.length > 1) {
        console.warn(`Found ${activeApps.length} active applications for the same user-skill-customer! Cleaning up...`);
        
        // Sort by created_at descending to get most recent first
        const sortedApps = [...activeApps].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        // Keep the most recent, end all others
        const appsToEnd = sortedApps.slice(1);
        console.log(`Ending ${appsToEnd.length} duplicate applications, keeping ID ${sortedApps[0].id}`);
        
        // End each duplicate application
        for (const app of appsToEnd) {
          const { error: endError } = await supabase
            .from('skill_applications')
            .update({
              end_date: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            })
            .eq('id', app.id);
            
          if (endError) {
            console.error(`Error ending duplicate application ${app.id}:`, endError);
          } else {
            console.log(`Successfully ended duplicate application ${app.id}`);
          }
        }
      }
    } catch (err) {
      console.error('Error in cleanupActiveApplications:', err);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${className}`}
      >
        <PlusCircle className="h-4 w-4" />
        {buttonText}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                Apply Skill at Customer
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {formDisabled && (
              <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-md">
                {noSkills && <p>You need to add skills to your profile before you can apply them at customers.</p>}
                {noCustomers && <p>You need to be assigned to customers before you can apply skills there.</p>}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skill
                </label>
                <select
                  name="skill_id"
                  value={formData.skill_id}
                  onChange={handleChange}
                  disabled={isLoading || formDisabled}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select a skill</option>
                  {skillsList.map(skill => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
                {noSkills && (
                  <p className="text-xs text-gray-500 mt-1">
                    Add skills to your profile first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  disabled={isLoading || formDisabled}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select a customer</option>
                  {customersList.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {noCustomers && (
                  <p className="text-xs text-gray-500 mt-1">
                    You need to be assigned to customers first.
                  </p>
                )}
              </div>

              {isCurrentSelectionDuplicate && (
                <div className="p-2 bg-red-50 text-red-600 rounded-md text-sm">
                  You've already applied this skill at this customer with {formData.proficiency} proficiency.
                </div>
              )}
              
              {hasOtherProficiency && !isCurrentSelectionDuplicate && (
                <div className="p-2 bg-yellow-50 text-amber-600 rounded-md text-sm">
                  Note: You've already applied this skill at this customer with {existingProficiency} proficiency. 
                  Submitting this form will update the proficiency level.
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proficiency Level
                </label>
                <select
                  name="proficiency"
                  value={formData.proficiency}
                  onChange={handleChange}
                  disabled={isLoading || formDisabled || isCurrentSelectionDuplicate}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="NOVICE">Novice</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                  <option value="EXPERT">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={isLoading || formDisabled || isCurrentSelectionDuplicate}
                  className="w-full p-2 border rounded-md h-24"
                  placeholder="Add any additional information"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || formDisabled || isCurrentSelectionDuplicate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Applying...' : 'Apply Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ApplySkillButton; 