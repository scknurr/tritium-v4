import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar } from 'flowbite-react';
import { Users, Building, GraduationCap, Mail, Briefcase, Clock } from 'lucide-react';
import { EntityDetail } from '../../components/ui/EntityDetail';
import { UserForm } from '../../components/forms/UserForm';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useMutationWithCache } from '../../lib/hooks/useMutationWithCache';
import { useQueryWithCache } from '../../lib/hooks/useQueryWithCache';
import type { Customer, Skill, SkillApplication } from '../../types';
import { queryKeys } from '../../lib/queryKeys';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import ApplySkillButton from '../../components/ApplySkillButton';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  bio?: string | null;
  title?: string | null;
  created_at: string;
}

interface UserCustomer {
  id: number;
  user_id: string;
  customer_id: number;
  role_id: number;
  start_date: string;
  end_date?: string | null;
  customer: Customer;
}

interface UserSkill {
  id: number;
  user_id: string;
  skill_id: number;
  proficiency_level: string;
  skill: Skill;
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

// Simple component to display user skill applications
const UserSkillApplicationsList = ({ userId, refreshTrigger = 0, onRefresh }: { userId: string, refreshTrigger?: number, onRefresh?: () => void }) => {
  const [applications, setApplications] = React.useState<SkillApplication[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isArchiving, setIsArchiving] = React.useState<number | null>(null);

  React.useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        // Fetch latest skill applications data
        const { data, error } = await supabase
          .from('skill_applications')
          .select(`
            id, 
            user_id, 
            skill_id, 
            customer_id, 
            proficiency, 
            start_date, 
            end_date, 
            notes, 
            created_at,
            updated_at,
            skills:skill_id(name),
            customers:customer_id(name)
          `)
          .eq('user_id', userId)
          .order('end_date', { ascending: true, nullsFirst: false })  // Show active applications first
          .order('created_at', { ascending: false });  // Then most recent applications first
        
        if (error) throw error;
        
        // Format the data to match the expected SkillApplication structure
        const formattedData = data?.map(app => ({
          ...app,
          skill_name: app.skills ? (app.skills as any).name : 'Unknown Skill',
          customer_name: app.customers ? (app.customers as any).name : 'Unknown Customer'
        })) || [];
        
        setApplications(formattedData);
      } catch (error) {
        console.error('Error fetching skill applications:', error);
        setApplications([]); // Ensure we always have an array
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [userId, refreshTrigger]);

  const endApplication = async (applicationId: number) => {
    setIsArchiving(applicationId);
    try {
      // End the application by setting an end date
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('skill_applications')
        .update({ end_date: today })
        .eq('id', applicationId);
      
      if (error) throw error;
      
      // Create audit log for ending the application
      const application = applications.find(app => app.id === applicationId);
      if (application) {
        const user = await supabase.auth.getUser();
        if (user.data.user) {
          await supabase.from('audit_logs').insert({
            event_type: 'UPDATE',
            entity_type: 'skill_applications',
            entity_id: applicationId,
            user_id: user.data.user.id,
            description: `Ended application of ${application.skill_name} at ${application.customer_name}`,
            metadata: {
              skill_name: application.skill_name,
              customer_name: application.customer_name,
              end_date: today,
              skill_id: application.skill_id,
              customer_id: application.customer_id,
              profile_id: userId,
              proficiency: application.proficiency,
              notes: application.notes || null
            }
          });
        }
      }
      
      // Refresh the application list
      if (onRefresh) onRefresh();
      
      // Update the local state to show the change immediately
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, end_date: today } : app
      ));
    } catch (error) {
      console.error('Error ending skill application:', error);
    } finally {
      setIsArchiving(null);
    }
  };

  if (isLoading) {
    return <div className="py-4">Loading skill applications...</div>;
  }

  // Ensure applications is always an array before mapping
  const applicationsList = Array.isArray(applications) ? applications : [];
  
  // Separate active and historical applications
  const activeApplications = applicationsList.filter(app => !app.end_date);
  const historicalApplications = applicationsList.filter(app => app.end_date);

  return (
    <div>
      {/* Active Applications */}
      <h3 className="text-lg font-semibold mb-2">Active Applications</h3>
      {activeApplications.length === 0 ? (
        <p className="text-gray-500 mb-6">No active skill applications</p>
      ) : (
        <div className="space-y-4 mb-6">
          {activeApplications.map(app => (
            <div key={app.id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium flex items-center gap-1">
                    <GraduationCap className="h-4 w-4 text-purple-500" />
                    <Link to={`/skills/${app.skill_id}`} className="text-purple-500 hover:underline">
                      {app.skill_name}
                    </Link>
                    <span className="text-gray-500">at</span>
                    <Building className="h-4 w-4 text-green-500" />
                    <Link to={`/customers/${app.customer_id}`} className="text-green-500 hover:underline">
                      {app.customer_name}
                    </Link>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">Proficiency:</span> {app.proficiency}
                  </div>
                  {app.start_date && (
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Since:</span> {new Date(app.start_date).toLocaleDateString()}
                    </div>
                  )}
                  {app.notes && (
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-semibold">Notes:</span> {app.notes}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => endApplication(app.id)}
                  disabled={isArchiving === app.id}
                  className="text-sm px-3 py-1 border border-red-300 text-red-500 rounded hover:bg-red-50 disabled:opacity-50"
                >
                  {isArchiving === app.id ? 'Ending...' : 'End'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Historical Applications */}
      {historicalApplications.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-2">Historical Applications</h3>
          <div className="space-y-4">
            {historicalApplications.map(app => (
              <div key={app.id} className="border rounded-lg p-4 shadow-sm bg-gray-50">
                <div className="opacity-70">
                  <div className="font-medium flex items-center gap-1">
                    <GraduationCap className="h-4 w-4 text-purple-500" />
                    <Link to={`/skills/${app.skill_id}`} className="text-purple-500 hover:underline">
                      {app.skill_name}
                    </Link>
                    <span className="text-gray-500">at</span>
                    <Building className="h-4 w-4 text-green-500" />
                    <Link to={`/customers/${app.customer_id}`} className="text-green-500 hover:underline">
                      {app.customer_name}
                    </Link>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">Proficiency:</span> {app.proficiency}
                  </div>
                  {app.start_date && app.end_date && (
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Period:</span> {new Date(app.start_date).toLocaleDateString()} - {new Date(app.end_date).toLocaleDateString()}
                    </div>
                  )}
                  {app.notes && (
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-semibold">Notes:</span> {app.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('info');
  
  // Add state for adding skills and customers
  const [isAddingSkill, setIsAddingSkill] = React.useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = React.useState(false);
  const [selectedSkill, setSelectedSkill] = React.useState('');
  const [selectedCustomer, setSelectedCustomer] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState('');
  const [proficiencyLevel, setProficiencyLevel] = React.useState('Intermediate');
  const [startDate, setStartDate] = React.useState(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  
  // Add state for tracking skill application refreshes
  const [skillApplicationRefreshCount, setSkillApplicationRefreshCount] = React.useState(0);
  
  // Function to refresh skill applications
  const refreshSkillApplications = React.useCallback(() => {
    // Increment the counter to trigger a refresh
    setSkillApplicationRefreshCount(prev => prev + 1);
    
    // Also refresh the timeline to show the new activity
    refreshTimelineData();
  }, []);

  // Redirect if no ID is provided
  React.useEffect(() => {
    if (!id) {
      navigate('/users');
    }
  }, [id, navigate]);

  // Don't make any queries if there's no ID
  if (!id) {
    return null;
  }

  const { data: users, loading: loadingUser, refresh: refreshUser } = useSupabaseQuery<Profile>(
    'profiles',
    { filter: { column: 'id', value: id } }
  );

  const { update } = useMutationWithCache<Profile>({
    table: 'profiles',
    invalidateQueries: [
      `profiles:detail:${id}`,
      'profiles:list',
      `audit:profiles:${id}`
    ],
    successMessage: 'Profile updated successfully'
  });

  const { data: customers, loading: loadingCustomers, refresh: refreshCustomers } = useSupabaseQuery<UserCustomer>(
    'user_customers',
    {
      select: '*, customer:customers(*)',
      filter: { column: 'user_id', value: id }
    }
  );

  const { data: skills, loading: loadingSkills, refresh: refreshSkills } = useSupabaseQuery<UserSkill>(
    'user_skills',
    {
      select: '*, skill:skills(*)',
      filter: { column: 'user_id', value: id }
    }
  );

  // Add refetch to timeline data to refresh it when skill applications change
  const { data: timeline = [], isLoading: timelineLoading, refetch: refreshTimelineData } = useQueryWithCache(
    queryKeys.audit.list('profiles', id),
    'audit_logs',
    {
      filter: { column: 'entity_id', value: id },
      orderBy: { column: 'event_time', ascending: false }
    }
  );
 
  // Fetch available skills and customers for dropdowns
  const { data: availableSkills = [] } = useQueryWithCache<SimpleSkill[]>(
    queryKeys.skills.list(),
    'skills',
    { select: 'id, name' }
  );
  
  const { data: availableCustomers = [] } = useQueryWithCache<SimpleCustomer[]>(
    queryKeys.customers.list(),
    'customers',
    { select: 'id, name' }
  );
  
  const { data: availableRoles = [] } = useQueryWithCache<SimpleRole[]>(
    ['customer_roles', 'list'],
    'customer_roles',
    { select: 'id, name' }
  );
  
  // Handle adding a skill
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSkill) {
      setError('Please select a skill');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const { error: insertError } = await supabase.from('user_skills').insert({
        user_id: id,
        skill_id: parseInt(selectedSkill, 10),
        proficiency_level: proficiencyLevel
      });
      
      if (insertError) throw insertError;
      
      await refreshSkills();
      // Also refresh timeline
      refreshTimelineData();
      
      setIsAddingSkill(false);
      setSelectedSkill('');
      setProficiencyLevel('Intermediate');
    } catch (err: any) {
      setError(err.message || 'Failed to add skill');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle adding a customer
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const { error: insertError } = await supabase.from('user_customers').insert({
        user_id: id,
        customer_id: parseInt(selectedCustomer, 10),
        role_id: selectedRole ? parseInt(selectedRole, 10) : null,
        start_date: startDate
      });
      
      if (insertError) throw insertError;
      
      await refreshCustomers();
      // Also refresh timeline
      refreshTimelineData();
      
      setIsAddingCustomer(false);
      setSelectedCustomer('');
      setSelectedRole('');
      setStartDate(new Date().toISOString().split('T')[0]);
    } catch (err: any) {
      setError(err.message || 'Failed to add customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUser) {
    return <div>Loading...</div>;
  }

  const profile = users[0];
  if (!profile) {
    return <div>User not found</div>;
  }
  
  // Define the tab contents
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <>
            <div className="flex items-start gap-4">
              <Avatar size="lg" rounded />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>{profile.email}</span>
                </div>
                {profile.title && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{profile.title}</span>
                  </div>
                )}
              </div>
            </div>
            {profile.bio && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2">Bio</h2>
                <p className="text-gray-600 dark:text-gray-300">{profile.bio}</p>
              </div>
            )}
          </>
        );
      
      case 'skills':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Skills
                </h2>
                <button 
                  onClick={() => setIsAddingSkill(!isAddingSkill)} 
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {isAddingSkill ? 'Cancel' : 'Add Skill'}
                </button>
              </div>
              
              {/* Add skill form */}
              {isAddingSkill && (
                <div className="mb-4 p-4 border rounded-md bg-gray-50">
                  <h3 className="text-md font-medium mb-3">Add Skill</h3>
                  {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
                  <form onSubmit={handleAddSkill} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Skill</label>
                      <select 
                        value={selectedSkill} 
                        onChange={(e) => setSelectedSkill(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        disabled={isSubmitting}
                      >
                        <option value="">Select a skill</option>
                        {Array.isArray(availableSkills) && availableSkills.map((skill: any) => (
                          <option key={skill.id} value={skill.id}>
                            {skill.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Proficiency Level</label>
                      <select 
                        value={proficiencyLevel} 
                        onChange={(e) => setProficiencyLevel(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        disabled={isSubmitting}
                      >
                        <option value="Novice">Novice</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button 
                        type="button" 
                        onClick={() => setIsAddingSkill(false)}
                        className="px-3 py-1 border rounded-md"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Adding...' : 'Add Skill'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {loadingSkills ? (
                <div>Loading skills...</div>
              ) : skills.length === 0 ? (
                <div className="text-gray-500">No skills found</div>
              ) : (
                <div className="grid gap-2">
                  {skills.map((us: UserSkill) => (
                    <div key={us.id} className="p-3 border rounded-md flex justify-between items-center">
                      <div>
                        <div className="font-medium">{us.skill.name}</div>
                        <div className="text-sm text-gray-500">Proficiency: {us.proficiency_level}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold mb-3 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Applied Skills at Customers
                </h2>
                <ApplySkillButton 
                  userId={id} 
                  buttonText="Apply Skill" 
                  onSuccess={refreshSkillApplications}
                />
              </div>
              <UserSkillApplicationsList 
                userId={id} 
                refreshTrigger={skillApplicationRefreshCount}
                onRefresh={refreshSkillApplications}
              />
            </div>
          </div>
        );
      
      case 'customers':
        return (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Customer Affiliations
              </h2>
              <button 
                onClick={() => setIsAddingCustomer(!isAddingCustomer)} 
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {isAddingCustomer ? 'Cancel' : 'Add Customer'}
              </button>
            </div>
            
            {/* Add customer form */}
            {isAddingCustomer && (
              <div className="mb-4 p-4 border rounded-md bg-gray-50">
                <h3 className="text-md font-medium mb-3">Add Customer Assignment</h3>
                {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
                <form onSubmit={handleAddCustomer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Customer</label>
                    <select 
                      value={selectedCustomer} 
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      disabled={isSubmitting}
                    >
                      <option value="">Select a customer</option>
                      {Array.isArray(availableCustomers) && availableCustomers.map((customer: any) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Role (optional)</label>
                    <select 
                      value={selectedRole} 
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      disabled={isSubmitting}
                    >
                      <option value="">No specific role</option>
                      {Array.isArray(availableRoles) && availableRoles.map((role: any) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingCustomer(false)}
                      className="px-3 py-1 border rounded-md"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Adding...' : 'Add Customer'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {loadingCustomers ? (
              <div>Loading customers...</div>
            ) : customers.length === 0 ? (
              <div className="text-gray-500">No customers found</div>
            ) : (
              <div className="grid gap-2">
                {customers.map((uc: UserCustomer) => (
                  <div key={uc.id} className="p-3 border rounded-md flex justify-between items-center">
                    <div>
                      <div className="font-medium">{uc.customer.name}</div>
                      <div className="text-sm text-gray-500">
                        Since {new Date(uc.start_date).toLocaleDateString()}
                        {uc.role_id && ` • Role ID: ${uc.role_id}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'activity':
        return (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activity
            </h2>
            {timelineLoading ? (
              <div>Loading activity...</div>
            ) : timeline.length === 0 ? (
              <div className="text-gray-500">No activity found</div>
            ) : (
              <div className="grid gap-2">
                {timeline.map((item: any) => (
                  <div key={item.id} className="p-3 border rounded-md">
                    <div className="font-medium">{item.event_type} {item.entity_type}</div>
                    <div className="text-sm">{item.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(item.event_time).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <EntityDetail
      entityType="profiles"
      entityId={id}
      title={profile.full_name || profile.email}
      icon={Users}
      form={
        <UserForm
          user={profile}
          isOpen={false}
          onClose={() => {}}
          onSubmit={async (data) => {
            await update({ id: id, data });
            await refreshUser();
          }}
        />
      }
      mainContent={
        <>
          {/* Tabs Navigation */}
          <div className="border-b mb-6">
            <div className="flex space-x-8">
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'info'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('info')}
              >
                Info
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'skills'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('skills')}
              >
                Skills
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'customers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('customers')}
              >
                Customers
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activity'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('activity')}
              >
                Activity
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="mt-6">
            {renderTabContent()}
          </div>
        </>
      }
      relatedEntities={[
        {
          title: 'Customer Affiliations',
          icon: Building,
          entities: customers.map((uc: UserCustomer) => ({
            id: uc.customer.id,
            name: uc.customer.name,
            subtitle: uc.role_id ? `Role ID: ${uc.role_id}` : undefined,
            link: `/customers/${uc.customer.id}`
          })),
          loading: loadingCustomers
        },
        {
          title: 'Skills',
          icon: GraduationCap,
          entities: skills.map((us: UserSkill) => ({
            id: us.skill.id,
            name: us.skill.name,
            subtitle: `Proficiency: ${us.proficiency_level}`,
            link: `/skills/${us.skill.id}`
          })),
          loading: loadingSkills
        }
      ]}
      onRefresh={refreshUser}
      deleteInfo={{
        entityName: profile.full_name || profile.email,
        relatedDataDescription: "customer assignments, skills, and skill applications"
      }}
    />
  );
}