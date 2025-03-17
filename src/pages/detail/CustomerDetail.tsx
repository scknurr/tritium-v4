import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Globe, Factory, Users, GraduationCap, Building, Clock, Upload, Calendar, Mail, MapPin } from 'lucide-react';
import { EntityDetail } from '../../components/ui/EntityDetail';
import { CustomerForm } from '../../components/forms/CustomerForm';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useMutationWithCache } from '../../lib/hooks/useMutationWithCache';
import type { Customer } from '../../types';
import { UnifiedTimeline } from '../../components/ui/UnifiedTimeline';
import { useUnifiedTimeline } from '../../lib/useUnifiedTimeline';
import CustomerSkillApplicationsList from '../../components/CustomerSkillApplicationsList';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/hooks/useToast';
import { DetailCard } from '../../components/ui/DetailCard';
import { EntityDetailItem } from '../../components/ui/EntityDetailItem';
import { Button } from 'flowbite-react';
import { EntityLink } from '../../components/ui/EntityLink';

// Define the interface for the team members
interface UserCustomer {
  id: number;
  user_id: string;
  customer_id: number;
  role_id: number | null;
  role: string | null;  // Added role field to capture the user's role
  start_date: string;
  end_date: string | null;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    title: string | null;
  };
  customer_roles?: {  // Added customer_roles field as optional
    id?: number;
    name?: string;
  };
}

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const numericId = parseInt(id || '0', 10);
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const { data: customers, loading: loadingCustomer, refresh: refreshCustomer } = useSupabaseQuery<Customer>(
    'customers',
    {
      select: '*, industry:industry_id(*)',
      filter: { column: 'id', value: numericId }
    }
  );

  const { update } = useMutationWithCache<Customer>({
    table: 'customers',
    invalidateQueries: [
      `customers:detail:${numericId}`,
      'customers:list',
      `audit:customers:${numericId}`
    ],
    successMessage: 'Customer updated successfully'
  });

  const { data: users, loading: loadingUsers, refresh: refreshUsers } = useSupabaseQuery<UserCustomer>(
    'user_customers',
    {
      select: '*, user:user_id(*), customer_roles:role_id(*)',
      filter: { column: 'customer_id', value: numericId }
    }
  );

  // Fetch timeline data for this customer using the UnifiedTimeline hook
  const { 
    events: timelineEvents, 
    loading: timelineLoading, 
    error: timelineError,
    refresh: refreshTimeline 
  } = useUnifiedTimeline({
    entityType: 'customers',
    entityId: numericId,
    relatedEntityType: 'customer',
    relatedEntityId: numericId,
    limit: 50 // Show up to 50 events
  });

  // Debug function to log timeline events with more detail
  React.useEffect(() => {
    if (timelineEvents && timelineEvents.length > 0) {
      // Count skill applications for debugging
      const skillApplicationCount = timelineEvents.filter(event => 
        event.type === 'SKILL_APPLIED' || 
        event.entity_type === 'skill_applications' ||
        (event.description && 
          event.description.toLowerCase().includes('applied') && 
          event.description.toLowerCase().includes('skill'))
      ).length;
      
      console.log('Customer Timeline Events:', {
        customerId: numericId,
        count: timelineEvents.length,
        skillApplicationCount,
        events: timelineEvents.map(event => ({
          id: event.id,
          type: event.type,
          description: event.description,
          metadata: event.metadata,
          entity_type: event.entity_type,
          entity_id: event.entity_id,
          user: event.user,
          skill: event.skill,
          customer: event.customer,
          timestamp: event.timestamp
        }))
      });
    } else {
      console.log('No timeline events found for customer:', numericId);
    }
  }, [timelineEvents, numericId]);

  // Also log the actual skills applications to compare with timeline
  React.useEffect(() => {
    const fetchDirectApplications = async () => {
      try {
        const { data, error } = await supabase
          .from('skill_applications')
          .select('*')
          .eq('customer_id', numericId);
        
        if (error) {
          console.error('Error fetching direct skill applications:', error);
        } else {
          console.log('Direct skill applications from database:', {
            customerId: numericId,
            count: data?.length || 0,
            applications: data
          });
        }
      } catch (err) {
        console.error('Exception fetching direct skill applications:', err);
      }
    };
    
    fetchDirectApplications();
  }, [numericId]);

  // Function to handle all refreshes at once
  const handleRefreshAll = async () => {
    await refreshCustomer();
    refreshUsers();
    refreshTimeline();
  };

  // Function to upload customer logo
  const handleImageUpload = async (file: File) => {
    try {
      // Create a unique file path using the customer ID
      const filePath = `customer_logos/${numericId}_${Date.now()}.${file.name.split('.').pop()}`;
      
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
      
      // Update the customer with the new logo URL
      const { error: updateError } = await supabase
        .from('customers')
        .update({ logo_url: publicUrl })
        .eq('id', numericId);
      
      if (updateError) {
        throw updateError;
      }
      
      // Refresh the customer data
      await refreshCustomer();
      
      showSuccessToast('Customer logo uploaded successfully');
      
    } catch (error) {
      console.error('Error uploading customer logo:', error);
      showErrorToast('Failed to upload customer logo');
    }
  };

  if (loadingCustomer) {
    return <div>Loading...</div>;
  }

  const customer = customers[0];
  if (!customer) {
    return <div>Customer not found</div>;
  }

  // Create industry tag if available
  const customerTags = [];
  if (customer.industry) {
    customerTags.push({
      label: customer.industry.name,
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    });
  }

  // Create safe arrays for team
  const safeTeamMembers = users || [];

  return (
    <EntityDetail
      entityType="customers"
      entityId={numericId.toString()}
      title={customer.name}
      subtitle={customer.status === 'active' ? 'Active' : 'Inactive'}
      icon={Building}
      description={customer.description || ''}
      imageUrl={customer.logo_url || undefined}
      onImageUpload={handleImageUpload}
      tags={customerTags}
      form={
        <CustomerForm
          customer={customer}
          isOpen={false}
          onClose={() => {}}
          onSubmit={async (data) => {
            await update({ id: numericId, data });
            await handleRefreshAll();
          }}
        />
      }
      mainContent={
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customer Info */}
            <DetailCard 
              title="Customer Details" 
              entityType="customer"
              icon={Building}
            >
              <div className="space-y-4">
                {customer.website && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Website:</span>
                    <a 
                      href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {customer.website}
                    </a>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Factory className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    customer.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                  </span>
                </div>
                
                {customer.industry && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Factory className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Industry:</span>
                    <span className="text-gray-700 dark:text-gray-300">{customer.industry.name}</span>
                  </div>
                )}
                
                {customer.description && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-200">Description</h3>
                    <p className="text-gray-600 dark:text-gray-300">{customer.description}</p>
                  </div>
                )}
              </div>
            </DetailCard>
            
            {/* Team Members */}
            <DetailCard 
              title="Team Members" 
              entityType="user"
              icon={Users}
              actions={[
                {
                  label: "Add Team Member",
                  icon: Users,
                  onClick: () => {/* Add team member functionality */},
                  variant: "primary"
                }
              ]}
              emptyState={
                safeTeamMembers.length === 0 ? {
                  message: "No team members assigned to this customer yet.",
                  action: {
                    label: "Add Team Member",
                    icon: Users,
                    onClick: () => {/* Add team member functionality */}
                  }
                } : undefined
              }
              isLoading={loadingUsers}
            >
              <div className="space-y-3">
                {safeTeamMembers.map(member => (
                  <EntityDetailItem
                    key={member.id}
                    id={member.user_id}
                    name={member.user.full_name || member.user.email}
                    type="user"
                    description={member.user.title || undefined}
                    secondaryField={
                      member.user.email ? {
                        label: "Email",
                        value: member.user.email,
                        icon: Mail
                      } : undefined
                    }
                    tertiaryField={
                      member.role_id ? {
                        label: "Role",
                        value: member.customer_roles?.name || `Role ID: ${member.role_id}`,
                        icon: Users
                      } : undefined
                    }
                    date={{
                      label: "Since",
                      value: member.start_date
                    }}
                    actions={
                      <Button
                        color="light"
                        size="xs"
                        onClick={() => {/* Delete functionality */}}
                      >
                        Remove
                      </Button>
                    }
                  />
                ))}
              </div>
            </DetailCard>
          </div>
          
          {/* Skills Applied at this Customer */}
          <div className="mt-8">
            <DetailCard
              title="Skills Applied"
              entityType="skill"
              icon={GraduationCap}
              actions={[
                {
                  label: "Apply Skill",
                  icon: GraduationCap,
                  onClick: () => {/* Apply skill functionality */},
                  variant: "primary"
                }
              ]}
            >
              <CustomerSkillApplicationsList customerId={numericId} />
            </DetailCard>
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
                entityType="customers"
                entityId={numericId.toString()}
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
        entityName: customer.name,
        relatedDataDescription: "team assignments, skill applications, and activity history"
      }}
    />
  );
}