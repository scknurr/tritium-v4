import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GridView } from './GridView';
import { EntityCard } from './EntityCard';
import { useQueryWithCache } from '../../lib/hooks/useQueryWithCache';
import { queryKeys } from '../../lib/queryKeys';
import type { Customer, Profile, Skill } from '../../types';
import { Users, Building, GraduationCap, Star, Briefcase, Gauge } from 'lucide-react';

interface EntityGridProps<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  onEdit?: (entity: T) => void;
  type: 'user' | 'customer' | 'skill';
}

export function EntityGrid<T extends Profile | Customer | Skill>({ 
  data, 
  loading, 
  error, 
  onEdit,
  type 
}: EntityGridProps<T>) {
  const navigate = useNavigate();

  // Fetch relationships and related entities
  const { data: userCustomers = [] } = useQueryWithCache(
    queryKeys.profiles.customers('all'),
    'user_customers',
    {
      select: '*, user:profiles(id, full_name, email), customer:customers(id, name)'
    }
  );

  const { data: userSkills = [] } = useQueryWithCache(
    queryKeys.profiles.skills('all'),
    'user_skills',
    {
      select: '*, user:profiles(id, full_name, email), skill:skills(id, name), proficiency_level'
    }
  );

  const { data: customerSkills = [] } = useQueryWithCache(
    queryKeys.customers.skills('all'),
    'customer_skills',
    {
      select: '*, customer:customers(id, name), skill:skills(id, name), utilization_level'
    }
  );

  const getIcon = () => {
    switch (type) {
      case 'user':
        return Users;
      case 'customer':
        return Building;
      case 'skill':
        return GraduationCap;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'user':
        return 'text-blue-500';
      case 'customer':
        return 'text-green-500';
      case 'skill':
        return 'text-purple-500';
    }
  };

  const getTitle = (entity: T) => {
    if ('full_name' in entity) return entity.full_name || entity.email;
    if ('name' in entity) return entity.name;
    return 'Unknown';
  };

  const getSubtitle = (entity: T) => {
    if ('email' in entity) return entity.email;
    if ('website' in entity) return entity.website || 'No website';
    if ('category' in entity && entity.category) return `Category: ${entity.category.name}`;
    return null;
  };

  const getDescription = (entity: T) => {
    if ('description' in entity && entity.description) {
      return entity.description;
    }
    if ('bio' in entity && entity.bio) {
      return entity.bio;
    }
    return null;
  };

  const getRelationshipDetails = (entity: T) => {
    if ('id' in entity) {
      const id = entity.id;
      
      switch (type) {
        case 'user': {
          const customerAssignments = userCustomers
            .filter(uc => uc.user_id === id)
            .map(uc => ({
              title: 'Customer',
              icon: Building,
              color: 'text-green-500',
              name: uc.customer?.name || 'Unknown Customer'
            }));

          const skillProficiencies = userSkills
            .filter(us => us.user_id === id)
            .map(us => ({
              title: 'Skill',
              icon: us.proficiency_level === 'expert' ? Star : GraduationCap,
              color: us.proficiency_level === 'expert' ? 'text-yellow-500' : 'text-purple-500',
              name: us.skill?.name || 'Unknown Skill',
              level: us.proficiency_level
            }));

          return {
            sections: [
              {
                title: 'Team Member For',
                items: customerAssignments
              },
              {
                title: 'Skills',
                items: skillProficiencies
              }
            ]
          };
        }

        case 'customer': {
          const teamMembers = userCustomers
            .filter(uc => uc.customer_id === id)
            .map(uc => ({
              title: 'Team Member',
              icon: Users,
              color: 'text-blue-500',
              name: uc.user?.full_name || uc.user?.email || 'Unknown User'
            }));

          const requiredSkills = customerSkills
            .filter(cs => cs.customer_id === id)
            .map(cs => ({
              title: 'Required Skill',
              icon: cs.utilization_level === 'critical' ? Gauge : GraduationCap,
              color: cs.utilization_level === 'critical' ? 'text-red-500' : 'text-purple-500',
              name: cs.skill?.name || 'Unknown Skill',
              level: cs.utilization_level
            }));

          return {
            sections: [
              {
                title: 'Team Members',
                items: teamMembers
              },
              {
                title: 'Required Skills',
                items: requiredSkills
              }
            ]
          };
        }

        case 'skill': {
          const skilledUsers = userSkills
            .filter(us => us.skill_id === id)
            .map(us => ({
              title: 'User',
              icon: us.proficiency_level === 'expert' ? Star : Users,
              color: us.proficiency_level === 'expert' ? 'text-yellow-500' : 'text-blue-500',
              name: us.user?.full_name || us.user?.email || 'Unknown User',
              level: us.proficiency_level
            }));

          const customerApplications = customerSkills
            .filter(cs => cs.skill_id === id)
            .map(cs => ({
              title: 'Customer',
              icon: cs.utilization_level === 'critical' ? Briefcase : Building,
              color: cs.utilization_level === 'critical' ? 'text-red-500' : 'text-green-500',
              name: cs.customer?.name || 'Unknown Customer',
              level: cs.utilization_level
            }));

          return {
            sections: [
              {
                title: 'Users',
                items: skilledUsers
              },
              {
                title: 'Customer Applications',
                items: customerApplications
              }
            ]
          };
        }
      }
    }
    return { sections: [] };
  };

  const getStatus = (entity: T) => {
    if ('status' in entity) return entity.status;
    return null;
  };

  const handleCardClick = (entity: T) => {
    const id = 'id' in entity ? entity.id : '';
    switch (type) {
      case 'user':
        navigate(`/users/${id}`);
        break;
      case 'customer':
        navigate(`/customers/${id}`);
        break;
      case 'skill':
        navigate(`/skills/${id}`);
        break;
    }
  };

  return (
    <GridView loading={loading} error={error}>
      {data.map((entity) => {
        const { sections } = getRelationshipDetails(entity);
        const description = (
          <>
            {getDescription(entity) && (
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-400">{getDescription(entity)}</p>
              </div>
            )}
            {sections.length > 0 && (
              <div className="space-y-4">
                {sections.map((section, sectionIndex) => (
                  <div key={sectionIndex}>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {section.title}
                    </h3>
                    <div className="space-y-2">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center gap-2">
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                          <span className="text-gray-600 dark:text-gray-400 text-sm">
                            {item.name}
                            {item.level && ` (${item.level})`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );

        return (
          <div
            key={'id' in entity ? entity.id : ''}
            className="cursor-pointer"
            onClick={() => handleCardClick(entity)}
          >
            <EntityCard
              title={getTitle(entity)}
              subtitle={getSubtitle(entity)}
              description={description}
              icon={getIcon()}
              iconColor={getIconColor()}
              status={getStatus(entity)}
              onEdit={onEdit ? (e) => {
                e.stopPropagation();
                onEdit(entity);
              } : undefined}
            />
          </div>
        );
      })}
    </GridView>
  );
}