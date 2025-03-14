import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { GraduationCap, Users, Building, FolderOpen } from 'lucide-react';
import { EntityDetail } from '../../components/ui/EntityDetail';
import { SkillForm } from '../../components/forms/SkillForm';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useMutationWithCache } from '../../lib/hooks/useMutationWithCache';
import type { Skill, Customer } from '../../types';
import { queryKeys } from '../../lib/queryKeys';
import { useQueryWithCache } from '../../lib/hooks/useQueryWithCache';

// Define interfaces for relationships
interface UserSkill {
  id: number;
  user_id: string;
  skill_id: number;
  proficiency_level: number;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    title?: string | null;
  };
}

interface SkillCustomer {
  id: number;
  customer_id: number;
  skill_id: number;
  utilization_level: number;
  customer: {
    id: number;
    name: string;
    description?: string | null;
  };
}

export function SkillDetail() {
  const { id } = useParams<{ id: string }>();

  // Validate that id is a number
  if (id && isNaN(Number(id))) {
    return <Navigate to={`/users/${id}`} replace />;
  }

  const { data: skills, loading: loadingSkill, refresh: refreshSkill } = useSupabaseQuery<Skill>(
    'skills',
    {
      select: '*, category:skill_categories(*)',
      filter: { column: 'id', value: Number(id) }
    }
  );

  const { update } = useMutationWithCache<Skill>({
    table: 'skills',
    invalidateQueries: [
      `skills:detail:${id}`,
      'skills:list',
      `audit:skills:${id}`
    ],
    successMessage: 'Skill updated successfully'
  });

  const { data: users, loading: loadingUsers, refresh: refreshUsers } = useSupabaseQuery<UserSkill>(
    'user_skills',
    {
      select: '*, user:profiles(*)',
      filter: { column: 'skill_id', value: Number(id) }
    }
  );

  const { data: customers, loading: loadingCustomers, refresh: refreshCustomers } = useSupabaseQuery<SkillCustomer>(
    'customer_skills',
    {
      select: '*, customer:customers(*)',
      filter: { column: 'skill_id', value: Number(id) }
    }
  );

  const { data: timeline = [], isLoading: timelineLoading } = useQueryWithCache(
    queryKeys.audit.list('skills', id),
    'audit_logs',
    {
      filter: { column: 'entity_id', value: id },
      orderBy: { column: 'event_time', ascending: false }
    }
  );

  if (loadingSkill) {
    return <div>Loading...</div>;
  }

  const skill = skills[0];
  if (!skill) {
    return <div>Skill not found</div>;
  }

  return (
    <EntityDetail
      entityType="skills"
      entityId={Number(id)}
      title={skill.name}
      icon={GraduationCap}
      description={skill.description || undefined}
      form={
        <SkillForm
          skill={skill}
          isOpen={false}
          onClose={() => {}}
          onSubmit={async (data) => {
            await update({ id: Number(id), data });
            await refreshSkill();
          }}
        />
      }
      mainContent={
        skill.category && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
            <FolderOpen className="w-4 h-4" />
            <span>Category: {skill.category.name}</span>
          </div>
        )
      }
      relatedEntities={[
        {
          title: "Users",
          icon: Users,
          entities: users.map((su: UserSkill) => ({
            id: su.user.id,
            name: su.user.full_name || su.user.email,
            subtitle: `Proficiency: ${su.proficiency_level}`,
            link: `/users/${su.user.id}`,
            relationshipId: su.id,
            relationshipData: {
              id: su.id,
              user_id: su.user_id,
              skill_id: su.skill_id,
              proficiency_level: su.proficiency_level
            }
          })),
          loading: loadingUsers,
          type: "user-skill",
          onUpdate: refreshUsers
        },
        {
          title: "Customers",
          icon: Building,
          entities: customers.map((sc: SkillCustomer) => ({
            id: sc.customer.id,
            name: sc.customer.name,
            subtitle: `Utilization: ${sc.utilization_level}`,
            link: `/customers/${sc.customer.id}`,
            relationshipId: sc.id,
            relationshipData: {
              id: sc.id,
              customer_id: sc.customer_id,
              skill_id: sc.skill_id,
              utilization_level: sc.utilization_level
            }
          })),
          loading: loadingCustomers,
          type: "customer-skill",
          onUpdate: refreshCustomers
        }
      ]}
      onRefresh={refreshSkill}
      deleteInfo={{
        entityName: skill.name,
        relatedDataDescription: "user proficiencies, customer requirements, etc."
      }}
    />
  );
}