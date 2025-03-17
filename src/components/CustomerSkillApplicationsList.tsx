import React, { useState, useEffect } from 'react';
import { Calendar, Star, GraduationCap } from 'lucide-react';
import { CustomerSkillApplication } from '../types';
import { ContentCard } from './ui/ContentCard';
import { getCustomerSkillApplications } from '../lib/api';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import { useApiRequest } from '../hooks/useApiRequest';
import { EntityLink } from './ui/EntityLink';

/**
 * @file CustomerSkillApplicationsList.tsx
 * @description Displays skills applied at a specific customer
 * 
 * @dataSource skill_applications (direct Supabase query)
 * @dataSink None (read-only component)
 * @relatedComponents UnifiedTimeline (also shows skill applications)
 * @criticalNotes This component shows ONLY skills from skill_applications table,
 *                not from audit_logs like UnifiedTimeline does
 * 
 * @checkFile DEVELOPER_NOTES.md for known issues
 */

type CustomerSkillApplicationsListProps = {
  customerId: number;
};

/**
 * @dataFlow This component fetches data from skill_applications using direct Supabase query
 * @dataConsistency This data should be consistent with UnifiedTimeline which shows similar data
 * @realtimeUpdate This component uses Supabase real-time subscriptions to auto-refresh when data changes
 * 
 * @CRITICAL_CHECK Ensure this data matches what appears in Timeline events
 * @example Test with http://localhost:5173/customers/1 to verify consistency
 */
const CustomerSkillApplicationsList: React.FC<CustomerSkillApplicationsListProps> = ({
  customerId
}) => {
  const [error, setError] = useState<string | null>(null);
  
  // Use standardized API request hook
  const { 
    state: { data: applications = [], isLoading, error: apiError },
    execute: fetchApplications 
  } = useApiRequest<CustomerSkillApplication[]>(
    // Use arrow function without parameters since customerId is in closure
    async () => await getCustomerSkillApplications(customerId),
    { data: [], isLoading: true, error: null }
  );

  // Set up real-time subscription to skill_applications table using standardized pattern
  useRealtimeSubscription({
    table: 'skill_applications',
    filter: { customer_id: customerId.toString() }, // Ensure customer_id is a string for RT
    onUpdate: (payload) => {
      console.log(`[Debug] Received real-time update for customer ${customerId} skill applications:`, payload);
      fetchApplications();
    },
    debug: true
  });

  // Initial data fetch
  useEffect(() => {
    fetchApplications();
  }, [customerId]);

  // Update error state from API error
  useEffect(() => {
    if (apiError) {
      setError(apiError.message);
    }
  }, [apiError]);

  // Function to render stars based on proficiency
  const renderProficiencyStars = (proficiency: string) => {
    let count = 0;
    
    switch ((proficiency || '').toUpperCase()) {
      case 'NOVICE': count = 1; break;
      case 'INTERMEDIATE': count = 2; break;
      case 'ADVANCED': count = 3; break;
      case 'EXPERT': count = 4; break;
      default: count = 0;
    }
    
    return (
      <div className="flex">
        {Array.from({ length: count }).map((_, i) => (
          <Star key={i} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
        ))}
        {Array.from({ length: 4 - count }).map((_, i) => (
          <Star key={`empty-${i}`} className="h-3 w-3 text-gray-300" />
        ))}
      </div>
    );
  };

  // Ensure applications is always an array using standardized pattern
  const safeApplications = applications || [];

  // Render the UI
  return (
    <ContentCard
      title="Applied Skills"
      icon={GraduationCap}
      iconColor="text-purple-600"
    >
      {error && (
        <ErrorMessage 
          message={error}
          onRetry={fetchApplications}
          onDismiss={() => setError(null)}
        />
      )}
      
      {isLoading ? (
        <LoadingSpinner centered size="lg" text="Loading skills..." />
      ) : safeApplications.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          No one has applied skills at this customer yet
        </div>
      ) : (
        <div className="space-y-4">
          {safeApplications.map(app => (
            <div key={app.id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium flex items-center gap-1">
                    {/* User entity link with icon */}
                    <EntityLink
                      type="user"
                      id={app.user_id}
                      name={app.user_name}
                      showIcon
                    />
                    <span className="text-gray-500">applied</span>
                    {/* Skill entity link with icon */}
                    <EntityLink
                      type="skill"
                      id={app.skill_id}
                      name={app.skill_name}
                      showIcon
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                      {app.proficiency || 'Unknown Proficiency'}
                    </span>
                    <div className="ml-1">
                      {renderProficiencyStars(app.proficiency || '')}
                    </div>
                  </div>
                  
                  {app.start_date && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Since {new Date(app.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {app.notes && (
                    <div className="mt-2 text-sm text-gray-600 border-t pt-2">
                      <span className="font-semibold">Notes:</span> {app.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ContentCard>
  );
};

export default CustomerSkillApplicationsList; 