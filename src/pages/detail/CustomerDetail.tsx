import React from 'react';
import { useParams } from 'react-router-dom';
import { Globe, Factory, Users, GraduationCap, Building } from 'lucide-react';
import { EntityDetail } from '../../components/ui/EntityDetail';
import { CustomerForm } from '../../components/forms/CustomerForm';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import type { Customer, Profile, Skill } from '../../types';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: customers, loading: loadingCustomer, refresh: refreshCustomer } = useSupabaseQuery<Customer>(
    'customers',
    {
      select: '*, industry:industries(*)',
      filter: { column: 'id', value: id }
    }
  );

  const { data: users, loading: loadingUsers, refresh: refreshUsers } = useSupabaseQuery<Profile>(
    'user_customers',
    {
      select: '*, user:profiles(*)',
      filter: { column: 'customer_id', value: id }
    }
  );

  const { data: skills, loading: loadingSkills, refresh: refreshSkills } = useSupabaseQuery<Skill>(
    'customer_skills',
    {
      select: '*, skill:skills(*)',
      filter: { column: 'customer_id', value: id }
    }
  );

  const { data: timeline } = useSupabaseQuery(
    'audit_logs',
    {
      filter: { column: 'entity_id', value: id },
      orderBy: { column: 'event_time', ascending: false }
    }
  );

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
      form={
        <CustomerForm
          customer={customer}
          isOpen={false}
          onClose={() => {}}
          onSubmit={async () => {
            await refreshCustomer();
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
        </>
      }
      relatedEntities={[
        {
          title: "Team Members",
          icon: Users,
          entities: users.map(uc => ({
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
          entities: skills.map(cs => ({
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
      onRefresh={refreshCustomer}
      deleteInfo={{
        entityName: customer.name,
        relatedDataDescription: "team members, skills, etc."
      }}
    />
  );
}