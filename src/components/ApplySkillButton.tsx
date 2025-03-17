import React, { useState } from 'react';
import { GraduationCap, PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createAuditLog } from '../lib/audit';
import { EVENT_TYPES } from '../lib/constants';

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
  const [existingApplications, setExistingApplications] = useState<{skill_id: number, customer_id: number}[]>([]);
  const [formData, setFormData] = useState({
    skill_id: 0,
    customer_id: 0,
    proficiency: 'NOVICE',
    notes: ''
  });

  const openModal = async () => {
    setIsOpen(true);
    setIsLoading(true);
    
    try {
      // Fetch user's existing skills from profile_skills
      const { data: userSkills, error: userSkillsError } = await supabase
        .from('profile_skills')
        .select('skill_id, skills(id, name)')
        .eq('profile_id', userId);
      
      if (userSkillsError) throw userSkillsError;
      
      // Extract skill data from the nested structure
      const formattedSkills = userSkills?.map(item => ({
        id: item.skill_id,
        name: (item.skills as any)?.name || `Skill ${item.skill_id}`
      })) || [];
      
      setSkills(formattedSkills);
      
      // Fetch user's assigned customers from user_customers
      const { data: userCustomers, error: userCustomersError } = await supabase
        .from('user_customers')
        .select('customer_id, customers(id, name)')
        .eq('profile_id', userId)
        .is('end_date', null); // Only active assignments (no end date)
      
      if (userCustomersError) throw userCustomersError;
      
      // Extract customer data from the nested structure
      const formattedCustomers = userCustomers?.map(item => ({
        id: item.customer_id,
        name: (item.customers as any)?.name || `Customer ${item.customer_id}`
      })) || [];
      
      setCustomers(formattedCustomers);
      
      // Fetch existing skill applications to prevent duplicates
      const { data: applications, error: applicationsError } = await supabase
        .from('skill_applications')
        .select('skill_id, customer_id')
        .eq('user_id', userId)
        .is('end_date', null); // Only active applications
      
      if (applicationsError) throw applicationsError;
      
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
      // Check if this skill-customer combination already exists
      const isDuplicate = existingApplications.some(
        app => app.skill_id === formData.skill_id && app.customer_id === formData.customer_id
      );
      
      if (isDuplicate) {
        setError('You have already applied this skill at this customer. Please choose a different combination.');
        setIsLoading(false);
        return;
      }
      
      // Fetch skill and customer names for logging
      const [skillResponse, customerResponse] = await Promise.all([
        supabase.from('skills').select('name').eq('id', formData.skill_id).single(),
        supabase.from('customers').select('name').eq('id', formData.customer_id).single()
      ]);
      
      const skillName = skillResponse.data?.name || `Skill #${formData.skill_id}`;
      const customerName = customerResponse.data?.name || `Customer #${formData.customer_id}`;
      
      // Since the RPC function may not exist, insert directly into the table
      const { data, error } = await supabase
        .from('skill_applications')
        .insert({
          user_id: userId,
          skill_id: formData.skill_id,
          customer_id: formData.customer_id,
          proficiency: formData.proficiency,
          notes: formData.notes || null,
          start_date: new Date().toISOString().split('T')[0], // Default to today
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Create an audit log entry with detailed metadata
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        // Create ONE comprehensive audit log entry with all details
        await supabase.from('audit_logs').insert({
          event_type: 'INSERT',
          entity_type: 'skill_applications',
          entity_id: data.id,
          user_id: user.data.user.id,
          description: `Applied ${skillName} at ${customerName}`,
          metadata: {
            skill_name: skillName,
            customer_name: customerName,
            proficiency: formData.proficiency,
            skill_id: formData.skill_id,
            customer_id: formData.customer_id,
            profile_id: userId,
            notes: formData.notes || null
          }
        });
        
        console.log("Created audit log for skill application with details:", {
          skill: skillName,
          customer: customerName,
          proficiency: formData.proficiency,
          notes: formData.notes || null
        });
      }
      
      closeModal();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error creating skill application:', err);
      setError('Failed to apply skill. Please check if the skill_applications table exists in your database.');
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
      app.skill_id === formData.skill_id && app.customer_id === formData.customer_id
    );

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
                  You've already applied this skill at this customer.
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