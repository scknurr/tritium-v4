import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GraduationCap, Folder, Users, Book, Clock, Calendar, Star, Code, Briefcase } from 'lucide-react';
import { EntityDetail } from '../../components/ui/EntityDetail';
import { SkillForm } from '../../components/forms/SkillForm';
import { DetailCard } from '../../components/ui/DetailCard';
import { EntityDetailItem } from '../../components/ui/EntityDetailItem';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useMutationWithCache } from '../../lib/hooks/useMutationWithCache';
import type { Skill, SkillApplication } from '../../types';
import { UnifiedTimeline } from '../../components/ui/UnifiedTimeline';
import { useUnifiedTimeline } from '../../lib/useUnifiedTimeline';
import { supabase } from '../../lib/supabase';
import { SkillIconWithFallback } from '../../components/ui/SkillIcon';
import { useToast } from '../../lib/hooks/useToast';
import { getSkillApplicationsBySkill } from '../../lib/api';
import { useApiRequest } from '../../hooks/useApiRequest';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { EntityLink } from '../../components/ui/EntityLink';
import { Button } from 'flowbite-react';

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
  const numericId = parseInt(id || '0', 10);
  const { success, error: showError } = useToast();
  const [iconFileUrl, setIconFileUrl] = useState<string | null>(null);
  
  const { data: skills, loading: loadingSkill, refresh: refreshSkill } = useSupabaseQuery<Skill>(
    'skills',
    {
      select: '*, category:skill_categories(*)',
      filter: { column: 'id', value: numericId }
    }
  );

  const { update } = useMutationWithCache<Skill>({
    table: 'skills',
    invalidateQueries: [
      `skills:detail:${numericId}`,
      'skills:list',
      `audit:skills:${numericId}`
    ],
    successMessage: 'Skill updated successfully'
  });

  // Use the standardized API request hook instead of direct Supabase query
  const { 
    state: { data: usersWithSkill = [], isLoading: loadingUsers, error: usersError },
    execute: fetchUsersWithSkill
  } = useApiRequest<SkillApplication[]>(
    // Use arrow function without parameters since id is in closure
    async () => await getSkillApplicationsBySkill(numericId),
    { data: [], isLoading: true, error: null }
  );

  // Initial data fetch
  useEffect(() => {
    if (numericId) {
      fetchUsersWithSkill();
    }
  }, [numericId]);

  // Eliminate duplicates to show each user only once
  const users = React.useMemo(() => {
    const uniqueUserIds = new Set();
    // Ensure usersWithSkill is always an array using our standardized pattern
    const safeApplications = usersWithSkill || [];
    return safeApplications.filter(app => {
      if (!app.user_id || uniqueUserIds.has(app.user_id)) return false;
      uniqueUserIds.add(app.user_id);
      return true;
    });
  }, [usersWithSkill]);

  // Fetch timeline data for this skill
  const { 
    events: timelineEvents, 
    loading: timelineLoading, 
    error: timelineError,
    refresh: refreshTimeline 
  } = useUnifiedTimeline({
    entityType: 'skills',
    entityId: numericId.toString(),
    relatedEntityType: 'skill',
    relatedEntityId: numericId.toString(),
    limit: 50 // Show up to 50 events
  });

  // Function to upload skill SVG icon
  const handleSVGIconUpload = async (file: File) => {
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === 'string') {
          const svgContent = e.target.result;
          
          // Update the skill with the SVG content
          const { error: updateError } = await supabase
            .from('skills')
            .update({ svg_icon: svgContent })
            .eq('id', numericId);
          
          if (updateError) {
            throw updateError;
          }
          
          // Refresh the skill data
          await refreshSkill();
          
          success('Skill icon updated successfully');
        }
      };
      
      reader.onerror = () => {
        throw new Error('Failed to read the file');
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error uploading skill icon:', error);
      showError('Failed to upload skill icon');
    }
  };

  if (loadingSkill) {
    return <div>Loading...</div>;
  }

  const skill = skills[0];
  if (!skill) {
    return <div>Skill not found</div>;
  }

  // Create categories and proficiency level tags
  const skillTags = [];
  
  if (skill.category) {
    skillTags.push({
      label: skill.category.name,
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    });
  }

  if (skill.proficiency_levels && Array.isArray(skill.proficiency_levels)) {
    skill.proficiency_levels.forEach((level: string) => {
      skillTags.push({
        label: level,
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      });
    });
  }

  // Render proficiency stars
  const renderProficiencyStars = (proficiency: string) => {
    const levels = {
      'Novice': 1,
      'Intermediate': 2,
      'Advanced': 3,
      'Expert': 4
    };
    
    const level = levels[proficiency as keyof typeof levels] || 0;
    
    return (
      <div className="flex">
        {[...Array(4)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < level ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <EntityDetail
      entityType="skills"
      entityId={numericId.toString()}
      title={skill.name}
      subtitle={skill.category ? `Category: ${skill.category.name}` : undefined}
      icon={GraduationCap}
      description={skill.description || undefined}
      imageUrl={skill.svg_icon || iconFileUrl || ''}
      onImageUpload={handleSVGIconUpload}
      form={
        <SkillForm
          skill={skill}
          isOpen={false}
          onClose={() => {}}
          onSubmit={async (data) => {
            await update({ id: numericId, data });
            await refreshSkill();
            refreshTimeline();
            fetchUsersWithSkill();
          }}
        />
      }
      mainContent={
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Skill Details */}
            <DetailCard
              title="Skill Details"
              entityType="skill"
              icon={Code}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-2">
                  <SkillIconWithFallback
                    name={skill.name}
                    svgContent={skill.svg_icon || undefined}
                    size="lg"
                    className="flex-shrink-0"
                  />
                  <div>
                    <h4 className="text-lg font-medium">{skill.name}</h4>
                    {skill.category && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Category: {skill.category.name}
                      </p>
                    )}
                  </div>
                </div>

                {skill.description && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h5>
                    <p className="text-gray-600 dark:text-gray-400">{skill.description}</p>
                  </div>
                )}

                {skill.proficiency_levels && Array.isArray(skill.proficiency_levels) && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proficiency Levels</h5>
                    <div className="space-y-2">
                      {skill.proficiency_levels.map((level, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-sm font-medium px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                            {level}
                          </span>
                          {renderProficiencyStars(level)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DetailCard>

            {/* Users with this Skill */}
            <DetailCard
              title="Users with this Skill"
              entityType="user"
              icon={Users}
              isLoading={loadingUsers}
              emptyState={
                users.length === 0 ? {
                  message: "No users have applied this skill yet"
                } : undefined
              }
            >
              {usersError && (
                <ErrorMessage 
                  message={usersError.message}
                  onRetry={fetchUsersWithSkill}
                  onDismiss={() => {}}
                />
              )}

              {users.length > 0 && (
                <div className="space-y-3">
                  {users.map((application) => (
                    <EntityDetailItem
                      key={application.user_id}
                      id={application.user_id}
                      name={application.user_name || 'Unknown User'}
                      type="user"
                      secondaryField={
                        application.proficiency ? {
                          label: "Proficiency",
                          value: (
                            <div className="flex items-center gap-2">
                              <span>{application.proficiency}</span>
                              {renderProficiencyStars(application.proficiency)}
                            </div>
                          )
                        } : undefined
                      }
                      tertiaryField={
                        application.customer_id ? {
                          label: "At Customer",
                          value: (
                            <EntityLink
                              type="customer"
                              id={application.customer_id}
                              name={application.customer_name || 'Unknown Customer'}
                            />
                          )
                        } : undefined
                      }
                      date={
                        application.start_date ? {
                          label: "Since",
                          value: application.start_date
                        } : undefined
                      }
                      description={application.notes || undefined}
                    />
                  ))}
                </div>
              )}
            </DetailCard>
          </div>
          
          {/* Activity Timeline */}
          <div className="mt-8">
            <DetailCard
              title="Skill Activity"
              entityType="application"
              icon={Clock}
            >
              <UnifiedTimeline
                title="Activity"
                events={timelineEvents}
                loading={timelineLoading}
                error={timelineError}
                showHeader={false}
                entityType="skills"
                entityId={numericId.toString()}
                onRefresh={refreshTimeline}
                emptyMessage="No activity recorded for this skill yet."
              />
            </DetailCard>
          </div>
        </>
      }
      relatedEntities={[]}
      onRefresh={async () => {
        await refreshSkill();
        refreshTimeline();
        fetchUsersWithSkill();
      }}
      deleteInfo={{
        entityName: skill.name,
        relatedDataDescription: "skill applications and user references"
      }}
    />
  );
}