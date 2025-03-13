import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Globe, Factory, Users, GraduationCap, Building } from 'lucide-react';
import { EntityDetail } from '../../components/ui/EntityDetail';
import { CustomerForm } from '../../components/forms/CustomerForm';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useMutationWithCache } from '../../lib/hooks/useMutationWithCache';
import type { Customer, Skill } from '../../types';
import { useQueryWithCache } from '../../lib/hooks/useQueryWithCache';
import { queryKeys } from '../../lib/queryKeys';
import CustomerSkillApplicationsList from '../../components/CustomerSkillApplicationsList';

// Define the interfaces for the relationships
interface UserCustomer {
  id: number;
  user_id: string;
  customer_id: number;
  role_id: number | null;
  start_date: string;
  end_date: string | null;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    title: string | null;
  };
}

interface CustomerSkill {
  id: number;
  customer_id: number;
  skill_id: number;
  utilization_level: number;
  skill: {
    id: number;
    name: string;
    description?: string | null;
  };
}

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { data: customers, loading: loadingCustomer, refresh: refreshCustomer } = useSupabaseQuery<Customer>(
    'customers',
    {
      select: '*, industry:industries(*)',
      filter: { column: 'id', value: id }
    }
  );

  const { update } = useMutationWithCache<Customer>({
    table: 'customers',
    invalidateQueries: [
      `customers:detail:${id}`,
      'customers:list',
      `audit:customers:${id}`
    ],
    successMessage: 'Customer updated successfully'
  });

  const { data: users, loading: loadingUsers, refresh: refreshUsers } = useSupabaseQuery<UserCustomer>(
    'user_customers',
    {
      select: '*, user:profiles(*)',
      filter: { column: 'customer_id', value: id }
    }
  );

  const { data: skills, loading: loadingSkills, refresh: refreshSkills } = useSupabaseQuery<CustomerSkill>(
    'customer_skills',
    {
      select: '*, skill:skills(*)',
      filter: { column: 'customer_id', value: id }
    }
  );

  const { isLoading: timelineLoading } = useQueryWithCache(
    queryKeys.audit.list('customers', id),
    'audit_logs',
    {
      filter: { column: 'entity_id', value: id },
      orderBy: { column: 'event_time', ascending: false }
    }
  );

  // Function to refresh the applied skills list when something changes
  const refreshAppliedSkills = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loadingCustomer) {
    return <div>Loading...</div>;
  }

  const customer = customers[0];
  if (!customer) {
    return <div>Customer not found</div>;
  }

  return (
    <EntityDetail
      entityType="customers"
      entityId={Number(id)}
      title={customer.name}
      icon={Building}
      description={customer.description || undefined}
      form={
        <CustomerForm
          customer={customer}
          isOpen={false}
          onClose={() => {}}
          onSubmit={async (data) => {
            await update({ id: Number(id), data });
            await refreshCustomer();
            refreshAppliedSkills();
          }}
        />
      }
      mainContent={
        <>
          {customer.website && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
              <Globe className="w-4 h-4" />
              <a 
                href={customer.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {new URL(customer.website).hostname}
              </a>
            </div>
          )}
          {customer.industry && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Factory className="w-4 h-4" />
              <span>Industry: {customer.industry.name}</span>
            </div>
          )}

          {/* Applied Skills Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Applied Skills
            </h3>
            <CustomerSkillApplicationsList 
              customerId={Number(id)} 
              refreshTrigger={refreshTrigger}
            />
          </div>
        </>
      }
      relatedEntities={[
        {
          title: "Team Members",
          icon: Users,
          entities: users.map((uc: UserCustomer) => ({
            id: uc.user.id,
            name: uc.user.full_name || uc.user.email,
            subtitle: uc.user.title || `Since ${new Date(uc.start_date).toLocaleDateString()}`,
            link: `/users/${uc.user.id}`,
            relationshipId: uc.id,
            relationshipData: {
              id: uc.id,
              user_id: uc.user_id,
              customer_id: uc.customer_id,
              role_id: uc.role_id,
              start_date: uc.start_date,
              end_date: uc.end_date
            }
          })),
          loading: loadingUsers,
          type: "user-customer",
          onUpdate: refreshUsers
        },
        {
          title: "Required Skills",
          icon: GraduationCap,
          entities: skills.map((cs: CustomerSkill) => ({
            id: cs.skill.id,
            name: cs.skill.name,
            subtitle: `Utilization: ${cs.utilization_level}`,
            link: `/skills/${cs.skill.id}`,
            relationshipId: cs.id,
            relationshipData: {
              id: cs.id,
              customer_id: cs.customer_id,
              skill_id: cs.skill_id,
              utilization_level: cs.utilization_level
            }
          })),
          loading: loadingSkills,
          type: "customer-skill",
          onUpdate: refreshSkills
        }
      ]}
      onRefresh={async () => {
        await refreshCustomer();
        refreshAppliedSkills();
      }}
      deleteInfo={{
        entityName: customer.name,
        relatedDataDescription: "team members, skills, etc."
      }}
    />
  );
}