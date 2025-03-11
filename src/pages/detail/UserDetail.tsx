import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar } from 'flowbite-react';
import { Users, Building, GraduationCap, Mail, Briefcase } from 'lucide-react';
import { EntityDetail } from '../../components/ui/EntityDetail';
import { UserForm } from '../../components/forms/UserForm';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import type { Profile, Customer, Skill } from '../../types';

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  const { data: customers, loading: loadingCustomers, refresh: refreshCustomers } = useSupabaseQuery<Customer>(
    'user_customers',
    {
      select: '*, customer:customers(*)',
      filter: { column: 'user_id', value: id }
    }
  );

  const { data: skills, loading: loadingSkills, refresh: refreshSkills } = useSupabaseQuery<Skill>(
    'user_skills',
    {
      select: '*, skill:skills(*)',
      filter: { column: 'user_id', value: id }
    }
  );

  const { data: timeline } = useSupabaseQuery(
    'audit_logs',
    {
      filter: { column: 'entity_id', value: id },
      orderBy: { column: 'event_time', ascending: false }
    }
  );

  if (loadingUser) {
    return <div>Loading...</div>;
  }

  const profile = users[0];
  if (!profile) {
    return <div>User not found</div>;
  }

  return (
    <EntityDetail
      entityType="profiles"
      entityId={id}
      title={profile.full_name || profile.email}
      icon={Users}
      form={
        <UserForm
          user={profile}
          isOpen={false} // Controlled by EntityDetail
          onClose={() => {}} // Controlled by EntityDetail
          onSubmit={async (data) => {
            await refreshUser();
          }}
        />
      }
      mainContent={
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
      }
      relatedEntities={[
        {
          title: "Customers",
          icon: Building,
          entities: customers.map(uc => ({
            id: uc.customer.id,
            name: uc.customer.name,
            subtitle: `Since ${new Date(uc.start_date).toLocaleDateString()}`,
            link: `/customers/${uc.customer.id}`,
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
          loading: loadingCustomers,
          type: "user-customer",
          onUpdate: refreshCustomers
        },
        {
          title: "Skills",
          icon: GraduationCap,
          entities: skills.map(us => ({
            id: us.skill.id,
            name: us.skill.name,
            subtitle: `Proficiency: ${us.proficiency_level}`,
            link: `/skills/${us.skill.id}`,
            relationshipId: us.id,
            relationshipData: {
              id: us.id,
              user_id: us.user_id,
              skill_id: us.skill_id,
              proficiency_level: us.proficiency_level
            }
          })),
          loading: loadingSkills,
          type: "user-skill",
          onUpdate: refreshSkills
        }
      ]}
      onRefresh={refreshUser}
      deleteInfo={{
        entityName: profile.full_name || profile.email,
        relatedDataDescription: "customer assignments, skills, etc."
      }}
    />
  );
}