import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, Briefcase, Building, GraduationCap, Clock, Users, Calendar, Star } from 'lucide-react';
import { EntityDetail } from '../../components/ui/EntityDetail';
import { UserForm } from '../../components/forms/UserForm';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useMutationWithCache } from '../../lib/hooks/useMutationWithCache';
import { useQueryWithCache } from '../../lib/hooks/useQueryWithCache';
import { DetailCard } from '../../components/ui/DetailCard';
import { EntityDetailItem } from '../../components/ui/EntityDetailItem';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import ApplySkillButton from '../../components/ApplySkillButton';
import UserAppliedSkills from '../../components/UserAppliedSkills';
import { useUnifiedTimeline } from '../../lib/useUnifiedTimeline';
import { UnifiedTimeline } from '../../components/ui/UnifiedTimeline';
import { useToast } from '../../lib/hooks/useToast';
import { Profile } from '../../types';
import { EntityLink } from '../../components/ui/EntityLink';
import { Button } from 'flowbite-react';
import { formatFullName } from '@/lib/utils';

// Type definitions for users, skills, and customer relationships
interface UserSkill {
  id: number;
  user_id: string;
  skill_id: number;
  proficiency_level: string;
  skill: {
    id: number;
    name: string;
  };
}

interface UserCustomer {
  id: number;
  user_id: string;
  customer_id: number;
  role_id: number;
  start_date: string;
  end_date?: string | null;
  customer: {
    id: number;
    name: string;
  };
}

interface SimpleSkill {
  id: number;
  name: string;
}

interface SimpleCustomer {
  id: number;
  name: string;
}

interface SimpleRole {
  id: number;
  name: string;
}

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const { success, error: showError } = useToast();
  
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState('Novice');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  
  // Fetch profile data
  const { data: profiles, loading: loadingProfile, refresh: refreshProfile } = useSupabaseQuery<Profile>(
    'profiles',
    {
      select: '*',
      filter: { column: 'id', value: id }
    }
  );

  // Fetch user's skills
  const { data: skills, loading: loadingSkills, refresh: refreshSkills } = useSupabaseQuery<UserSkill>(
    'user_skills',
    {
      select: '*, skill:skill_id(*)',
      filter: { column: 'user_id', value: id }
    }
  );

  // Fetch user's customers
  const { data: customers, loading: loadingCustomers, refresh: refreshCustomers } = useSupabaseQuery<UserCustomer>(
    'user_customers',
    {
      select: '*, customer:customer_id(*)',
      filter: { column: 'user_id', value: id }
    }
  );

  // Fetch available skills to add
  const { data: availableSkills, loading: loadingAvailableSkills } = useSupabaseQuery<SimpleSkill>(
    'skills',
    {
      select: 'id, name',
      orderBy: { column: 'name', ascending: true }
    }
  );

  // Fetch available customers to add
  const { data: availableCustomers, loading: loadingAvailableCustomers } = useSupabaseQuery<SimpleCustomer>(
    'customers',
    {
      select: 'id, name',
      orderBy: { column: 'name', ascending: true }
    }
  );

  // Fetch available roles to assign
  const { data: availableRoles, loading: loadingAvailableRoles } = useSupabaseQuery<SimpleRole>(
    'customer_roles',
    {
      select: 'id, name',
      orderBy: { column: 'name', ascending: true }
    }
  );

  // Mutation for updating profile
  const { update } = useMutationWithCache({
    table: 'profiles',
    invalidateQueries: [
      'profiles',
      `profiles:detail:${id}`
    ],
    successMessage: 'Profile updated successfully'
  });

  // Fetch timeline data
  const { 
    events: timelineEvents, 
    loading: timelineLoading, 
    error: timelineError,
    refresh: refreshTimeline 
  } = useUnifiedTimeline({
    entityType: 'profiles',
    entityId: id || '',
    relatedEntityType: 'user',
    relatedEntityId: id || '',
    limit: 50
  });

  // Function to upload profile image
  const handleImageUpload = async (file: File) => {
    try {
      // Create a unique file path using the user ID
      const filePath = `profile_images/${id}_${Date.now()}.${file.name.split('.').pop()}`;
      
      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      
      const publicUrl = publicUrlData.publicUrl;
      
      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Refresh the profile data
      await refreshProfile();
      setProfileImageUrl(publicUrl);
      
      success('Profile image uploaded successfully');
      
    } catch (error) {
      console.error('Error uploading profile image:', error);
      showError('Failed to upload profile image');
    }
  };

  // Add skill to user
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    if (!selectedSkill) {
      setError('Please select a skill');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const { error } = await supabase.from('user_skills').insert({
        user_id: id,
        skill_id: Number(selectedSkill),
        proficiency_level: proficiencyLevel
      });
      
      if (error) throw error;
      
      setSelectedSkill('');
      setProficiencyLevel('Novice');
      setIsAddingSkill(false);
      refreshSkills();
      success('Skill added successfully');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error adding skill:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add customer to user
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    if (!selectedCustomer) {
      setError('Please select a customer');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const { error } = await supabase.from('user_customers').insert({
        user_id: id,
        customer_id: Number(selectedCustomer),
        role_id: selectedRole ? Number(selectedRole) : null,
        start_date: startDate,
        end_date: null // Active assignment
      });
      
      if (error) throw error;
      
      setSelectedCustomer('');
      setSelectedRole('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setIsAddingCustomer(false);
      refreshCustomers();
      success('Customer assigned successfully');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error adding customer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to refresh data
  const handleRefreshAll = async () => {
    await refreshProfile();
    refreshSkills();
    refreshCustomers();
    refreshTimeline();
  };

  // Add delete skill function
  const handleDeleteSkill = async (skillId: number) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('user_skills')
        .delete()
        .eq('id', skillId);
      
      if (error) throw error;
      
      refreshSkills();
      success('Skill removed successfully');
    } catch (err: any) {
      showError(err.message || 'Failed to remove skill');
      console.error('Error removing skill:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add delete customer function
  const handleDeleteCustomer = async (customerAssignmentId: number) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('user_customers')
        .delete()
        .eq('id', customerAssignmentId);
      
      if (error) throw error;
      
      refreshCustomers();
      success('Customer assignment removed successfully');
    } catch (err: any) {
      showError(err.message || 'Failed to remove customer assignment');
      console.error('Error removing customer assignment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingProfile) {
    return <div>Loading...</div>;
  }

  // Ensure we have a valid profile with fallbacks for all properties
  const profile: Profile = profiles?.[0] || {
    id: id || '',
    first_name: '',
    last_name: '',
    email: '',
    title: null,
    bio: null,
    avatar_url: null,
    created_at: new Date().toISOString()
  };

  // Create safe arrays for data
  const safeSkills = skills || [];
  const safeCustomers = customers || [];

  return (
    <EntityDetail
      entityType="profiles"
      entityId={id || ''}
      title={formatFullName(profile.first_name, profile.last_name, profile.email)}
      subtitle={profile.title || ''}
      icon={Users}
      description={profile.bio || ''}
      imageUrl={profile.avatar_url || profileImageUrl || ''}
      onImageUpload={handleImageUpload}
      hideOldTimeline={true}
      form={
        <UserForm
          user={profile}
          isOpen={false}
          onClose={() => {}}
          onSubmit={async (data) => {
            await update({ id: id || '', data });
            await handleRefreshAll();
          }}
        />
      }
      mainContent={
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Info */}
            <DetailCard 
              title="Profile Details" 
              entityType="user"
              icon={Users}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Email:</span>
                <span>{profile.email}</span>
                </div>
                
                {profile.title && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Title:</span>
                    <span>{profile.title}</span>
                  </div>
                )}
                
                {profile.bio && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-200">Bio</h3>
                    <p className="text-gray-600 dark:text-gray-300">{profile.bio}</p>
                  </div>
                )}
              </div>
            </DetailCard>

            {/* User Skills Section */}
            <DetailCard 
              title="Skills" 
              entityType="skill"
              icon={GraduationCap}
              actions={[
                { 
                  label: isAddingSkill ? 'Cancel' : 'Add Skill', 
                  icon: isAddingSkill ? undefined : GraduationCap,
                  onClick: () => setIsAddingSkill(!isAddingSkill),
                  variant: 'primary'
                }
              ]}
              isLoading={loadingSkills}
              emptyState={
                safeSkills.length === 0 && !isAddingSkill ? {
                  message: "No skills added yet.",
                  action: {
                    label: "Add Skill",
                    icon: GraduationCap,
                    onClick: () => setIsAddingSkill(true)
                  }
                } : undefined
              }
            >
              {/* Add skill form */}
              {isAddingSkill && (
                <form onSubmit={handleAddSkill} className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Skill
                      </label>
                      <select
                        value={selectedSkill}
                        onChange={(e) => setSelectedSkill(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        required
                      >
                        <option value="">Select a skill</option>
                        {availableSkills.map((skill) => (
                          <option key={skill.id} value={skill.id}>{skill.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Proficiency Level
                      </label>
                      <select
                        value={proficiencyLevel}
                        onChange={(e) => setProficiencyLevel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="Novice">Novice</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                    
                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => setIsAddingSkill(false)}
                        color="light"
                        size="xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        color="purple"
                        size="xs"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Adding...' : 'Add Skill'}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
              
              {/* Skills List */}
              {!isAddingSkill && safeSkills.length > 0 && (
                <div className="space-y-2">
                  {safeSkills.map((userSkill) => (
                    <EntityDetailItem
                      key={userSkill.id}
                      id={userSkill.skill.id}
                      name={userSkill.skill.name}
                      type="skill"
                      status={{
                        value: userSkill.proficiency_level,
                        color: 'purple'
                      }}
                      actions={
                        <Button
                          color="light"
                          size="xs"
                          onClick={() => handleDeleteSkill(userSkill.id)}
                        >
                          Remove
                        </Button>
                      }
                    />
                  ))}
                </div>
              )}
            </DetailCard>
          
            {/* User's Customers Section */}
            <DetailCard 
              title="Customers" 
              entityType="customer"
              icon={Building}
              actions={[
                { 
                  label: isAddingCustomer ? 'Cancel' : 'Add Customer', 
                  icon: isAddingCustomer ? undefined : Building,
                  onClick: () => setIsAddingCustomer(!isAddingCustomer),
                  variant: 'primary'
                }
              ]}
              isLoading={loadingCustomers}
              emptyState={
                safeCustomers.length === 0 && !isAddingCustomer ? {
                  message: "No customer assignments yet.",
                  action: {
                    label: "Add Customer",
                    icon: Building,
                    onClick: () => setIsAddingCustomer(true)
                  }
                } : undefined
              }
            >
              {/* Add customer form */}
              {isAddingCustomer && (
                <form onSubmit={handleAddCustomer} className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Customer
                      </label>
                      <select
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        required
                      >
                        <option value="">Select a customer</option>
                        {availableCustomers.map((customer) => (
                          <option key={customer.id} value={customer.id}>{customer.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Role (Optional)
                      </label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="">No specific role</option>
                        {availableRoles.map((role) => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    
                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => setIsAddingCustomer(false)}
                        color="light"
                        size="xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        color="green"
                        size="xs"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Adding...' : 'Add Customer'}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
              
              {/* Customers List */}
              {!isAddingCustomer && safeCustomers.length > 0 && (
                <div className="space-y-2">
                  {safeCustomers.map((userCustomer) => (
                    <EntityDetailItem
                      key={userCustomer.id}
                      id={userCustomer.customer.id}
                      name={userCustomer.customer.name}
                      type="customer"
                      date={{
                        label: "Since",
                        value: userCustomer.start_date
                      }}
                      tertiaryField={
                        userCustomer.role_id ? {
                          label: "Role",
                          value: `Role ID: ${userCustomer.role_id}`,
                          icon: Briefcase
                        } : undefined
                      }
                      actions={
                        <Button
                          color="light"
                          size="xs"
                          onClick={() => handleDeleteCustomer(userCustomer.id)}
                        >
                          Remove
                        </Button>
                      }
                    />
                  ))}
                </div>
              )}
            </DetailCard>
           
            {/* Applied Skills */}
            <div className="lg:col-span-2">
              <DetailCard
                title="Applied Skills"
                entityType="application"
                icon={Star}
              >
                <UserAppliedSkills userId={id || ''} />
              </DetailCard>
            </div>
          </div>
          
          {/* Timeline Section */}
          <div className="mt-8">
            <DetailCard
              title="Activity Timeline"
              entityType="application"
              icon={Clock}
            >
              <UnifiedTimeline
                title="Activity Timeline"
                events={timelineEvents}
                loading={timelineLoading}
                error={timelineError}
                showHeader={false}
                entityType="profiles"
                entityId={id}
                onRefresh={refreshTimeline}
                emptyMessage="No activity recorded yet."
              />
            </DetailCard>
            </div>
        </>
      }
      relatedEntities={[]}
      onRefresh={handleRefreshAll}
      deleteInfo={{
        entityName: formatFullName(profile.first_name, profile.last_name, profile.email),
        relatedDataDescription: "skills, customer assignments, and activity history"
      }}
    />
  );
}