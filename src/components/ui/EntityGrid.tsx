import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GridView } from './GridView';
import { DetailCard } from './DetailCard';
import { EntityDetailItem } from './EntityDetailItem';
import { useQueryWithCache } from '../../lib/hooks/useQueryWithCache';
import { queryKeys } from '../../lib/queryKeys';
import type { Customer, Profile, Skill } from '../../types';
import { Users, Building, GraduationCap, Star, Briefcase, Gauge, Eye, Pencil, Mail, Globe, Folder } from 'lucide-react';
import { EntityLink } from './EntityLink';
import { Button } from 'flowbite-react';
import { formatFullName } from '../../lib/utils';

// Define interfaces for the relationship data
interface UserCustomerRelation {
  id: number;
  user_id: string;
  customer_id: number;
  role_id: number | null;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }
  customer: {
    id: number;
    name: string;
  }
}

interface UserSkillRelation {
  id: number;
  user_id: string;
  skill_id: number;
  proficiency_level: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }
  skill: {
    id: number;
    name: string;
  }
}

interface CustomerSkillRelation {
  id: number;
  customer_id: number;
  skill_id: number;
  utilization_level: string;
  customer?: {
    id: number;
    name: string;
  };
  skill?: {
    id: number;
    name: string;
  };
}

// Define a type for relationship items
interface RelationshipItem {
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  name: string;
  id?: string | number;
  entityType?: 'user' | 'customer' | 'skill' | 'application' | 'role';
  level?: string;
}

interface EntityGridProps<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  onEdit?: (entity: T) => void;
  onView?: (entity: T) => void;
  type: 'user' | 'customer' | 'skill';
}

export function EntityGrid<T extends Profile | Customer | Skill>({ 
  data, 
  loading, 
  error, 
  onEdit,
  onView,
  type 
}: EntityGridProps<T>) {
  const navigate = useNavigate();

  // Fetch relationships and related entities with proper typing
  const { data: userCustomers = [] } = useQueryWithCache<UserCustomerRelation[]>(
    queryKeys.profiles.customers('all'),
    'user_customers',
    {
      select: '*, user:profiles(id, first_name, last_name, email), customer:customers(id, name)'
    }
  );

  const { data: userSkills = [] } = useQueryWithCache<UserSkillRelation[]>(
    queryKeys.profiles.skills('all'),
    'user_skills',
    {
      select: '*, user:profiles(id, first_name, last_name, email), skill:skills(id, name), proficiency_level'
    }
  );

  const { data: customerSkills = [] } = useQueryWithCache<CustomerSkillRelation[]>(
    queryKeys.customers.skills('all'),
    'customer_skills',
    {
      select: '*, customer:customers(id, name), skill:skills(id, name), utilization_level'
    }
  );

  const getTitle = (entity: T) => {
    if ('first_name' in entity && 'last_name' in entity) {
      return formatFullName(entity.first_name, entity.last_name, entity.email);
    }
    if ('name' in entity) return entity.name;
    return 'Unknown';
  };

  const getSubtitle = (entity: T): string | undefined => {
    if ('email' in entity) return entity.email;
    if ('website' in entity) return entity.website || undefined;
    if ('category' in entity && entity.category) return `Category: ${entity.category.name}`;
    return undefined;
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
          // Filter user-customer relationships
          const customerAssignments: RelationshipItem[] = (userCustomers || [])
            .filter(uc => uc.user_id === id)
            .map(uc => ({
              title: 'Customer',
              icon: Building,
              color: 'text-green-500',
              name: uc.customer?.name || 'Unknown Customer',
              id: uc.customer?.id,
              entityType: 'customer'
            }));

          // Filter user-skill relationships
          const skillProficiencies: RelationshipItem[] = (userSkills || [])
            .filter(us => us.user_id === id)
            .map(us => ({
              title: 'Skill',
              icon: us.proficiency_level === 'expert' ? Star : GraduationCap,
              color: us.proficiency_level === 'expert' ? 'text-yellow-500' : 'text-purple-500',
              name: us.skill?.name || 'Unknown Skill',
              id: us.skill?.id,
              entityType: 'skill',
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
          // Filter customer team members
          const teamMembers: RelationshipItem[] = (userCustomers || [])
            .filter(uc => uc.customer_id === Number(id))
            .map(uc => ({
              title: 'Team Member',
              icon: Users,
              color: 'text-blue-500',
              name: formatFullName(uc.user?.first_name, uc.user?.last_name, uc.user?.email) || 'Unknown User',
              id: uc.user?.id,
              entityType: 'user'
            }));

          // Filter customer required skills
          const requiredSkills: RelationshipItem[] = (customerSkills || [])
            .filter(cs => cs.customer_id === Number(id))
            .map(cs => ({
              title: 'Required Skill',
              icon: cs.utilization_level === 'critical' ? Gauge : GraduationCap,
              color: cs.utilization_level === 'critical' ? 'text-red-500' : 'text-purple-500',
              name: cs.skill?.name || 'Unknown Skill',
              id: cs.skill?.id,
              entityType: 'skill',
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
          // Filter users with this skill
          const skilledUsers: RelationshipItem[] = (userSkills || [])
            .filter(us => us.skill_id === Number(id))
            .map(us => ({
              title: 'User',
              icon: us.proficiency_level === 'expert' ? Star : Users,
              color: us.proficiency_level === 'expert' ? 'text-yellow-500' : 'text-blue-500',
              name: formatFullName(us.user?.first_name, us.user?.last_name, us.user?.email) || 'Unknown User',
              id: us.user?.id,
              entityType: 'user',
              level: us.proficiency_level
            }));

          // Filter customers needing this skill
          const customersNeeding: RelationshipItem[] = (customerSkills || [])
            .filter(cs => cs.skill_id === Number(id))
            .map(cs => ({
              title: 'Customer',
              icon: cs.utilization_level === 'critical' ? Gauge : Building,
              color: cs.utilization_level === 'critical' ? 'text-red-500' : 'text-green-500',
              name: cs.customer?.name || 'Unknown Customer',
              id: cs.customer?.id,
              entityType: 'customer',
              level: cs.utilization_level
            }));

          return {
            sections: [
              {
                title: 'Users with this Skill',
                items: skilledUsers
              },
              {
                title: 'Customers Requiring this Skill',
                items: customersNeeding
              }
            ]
          };
        }
      }
    }
    
    return {
      sections: []
    };
  };

  const getStatus = (entity: T) => {
    if ('status' in entity && entity.status) {
      return {
        value: entity.status,
        color: entity.status === 'active' ? 'green' : 'gray'
      };
    }
    return undefined;
  };

  const getImageUrl = (entity: T) => {
    if ('avatar_url' in entity) return entity.avatar_url;
    if ('logo_url' in entity) return entity.logo_url;
    if ('svg_icon' in entity) return entity.svg_icon;
    return undefined;
  };

  const handleEntityClick = (entity: T) => {
    if (onView) {
      onView(entity);
    } else if ('id' in entity) {
      // Navigate to the detail page if no onView handler is provided
      switch (type) {
        case 'user':
          navigate(`/users/${entity.id}`);
          break;
        case 'customer':
          navigate(`/customers/${entity.id}`);
          break;
        case 'skill':
          navigate(`/skills/${entity.id}`);
          break;
      }
    }
  };

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <DetailCard
            key={index}
            title=""
            entityType={type}
            isLoading={true}
          />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="p-6 text-center text-gray-500">
        No {type}s found. Try adjusting your filter or adding a new {type}.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((entity, index) => {
        if (!('id' in entity)) return null;
        
        // Get relationship data
        const relationshipData = getRelationshipDetails(entity);
        
        // Combine sections from different relationships
        const allRelationships: RelationshipItem[] = relationshipData.sections.flatMap(
          section => section.items.slice(0, 3)
        ).slice(0, 3); // Limit to 3 total relationships for space
        
        return (
          <DetailCard
            key={`${type}-${index}-${entity.id}`}
            title={getTitle(entity)}
            entityType={type}
            actions={[
              { 
                label: "View", 
                icon: Eye, 
                variant: "outline",
                onClick: () => handleEntityClick(entity)
              },
              ...(onEdit ? [{ 
                label: "Edit", 
                icon: Pencil, 
                variant: "secondary",
                onClick: () => onEdit(entity)
              }] : [])
            ]}
          >
            <div className="space-y-4">
              {/* Description */}
              {getDescription(entity) && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {getDescription(entity)}
                </p>
              )}
              
              {/* Subtitle/secondary info */}
              {getSubtitle(entity) && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  {type === 'user' && <Mail className="h-4 w-4" />}
                  {type === 'customer' && <Globe className="h-4 w-4" />}
                  {type === 'skill' && <Folder className="h-4 w-4" />}
                  <span>{getSubtitle(entity)}</span>
                </div>
              )}
              
              {/* Status if available */}
              {getStatus(entity) && (
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    getStatus(entity)?.color === 'green' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                  }`}>
                    {getStatus(entity)?.value.charAt(0).toUpperCase() + getStatus(entity)?.value.slice(1)}
                  </span>
                </div>
              )}
              
              {/* Related Entities */}
              {allRelationships.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Related</h4>
                  <div className="space-y-2">
                    {allRelationships.map((item, i) => (
                      item.id && item.entityType ? (
                        <EntityDetailItem
                          key={`relation-${i}-${item.id}`}
                          id={item.id}
                          name={item.name}
                          type={item.entityType}
                          status={item.level ? {
                            value: item.level.charAt(0).toUpperCase() + item.level.slice(1),
                            color: item.level === 'expert' || item.level === 'critical' ? 'yellow' : 'blue'
                          } : undefined}
                          className="py-1 px-2"
                        />
                      ) : (
                        <div key={`relation-${i}`} className="flex items-center gap-2 text-sm">
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                          <span>{item.name}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DetailCard>
        );
      })}
    </div>
  );
}