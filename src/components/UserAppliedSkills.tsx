/**
 * UserAppliedSkills.tsx
 * A redesigned component to display a user's applied skills at customers
 */
import React, { useState, useEffect } from 'react';
import { GraduationCap, Trash, Building, Calendar, Star, AlertCircle } from 'lucide-react';
import { Button, Modal, Card } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { SkillApplication } from '../types';
import { getUserSkillApplications, deleteSkillApplication } from '../lib/api';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import { useApiRequest } from '../hooks/useApiRequest';

// Helper function to get proficiency details (used in multiple places)
export function getProficiencyDetails(proficiency: string) {
  switch ((proficiency || '').toUpperCase()) {
    case 'NOVICE':
      return { color: 'bg-blue-100 text-blue-800', stars: 1 };
    case 'INTERMEDIATE':
      return { color: 'bg-green-100 text-green-800', stars: 2 };
    case 'ADVANCED':
      return { color: 'bg-yellow-100 text-yellow-800', stars: 3 };
    case 'EXPERT':
      return { color: 'bg-purple-100 text-purple-800', stars: 4 };
    default:
      return { color: 'bg-gray-100 text-gray-800', stars: 0 };
  }
}

// Format date like "Jan 2023 - Present" or "Jan 2023 - Dec 2023"
export function formatDateRange(startDate?: string | null, endDate?: string | null) {
  if (!startDate) return '';
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  
  return `${formatDate(startDate)}${endDate ? ` - ${formatDate(endDate)}` : ' - Present'}`;
}

interface UserAppliedSkillsProps {
  userId: string;
  initialApplications?: SkillApplication[];
  hideTitle?: boolean;
}

/**
 * UserAppliedSkills component displays all skills a user has applied at different customers
 * Uses real-time subscriptions to stay up-to-date with database changes
 */
const UserAppliedSkills: React.FC<UserAppliedSkillsProps> = ({
  userId,
  initialApplications = [],
  hideTitle = false
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  
  // Use standardized API request hook
  const {
    state: { data: applications = [], isLoading, error: apiError },
    execute: fetchApplications
  } = useApiRequest<SkillApplication[]>(
    // Use arrow function without parameters since userId is in closure
    async () => await getUserSkillApplications(userId),
    { data: initialApplications, isLoading: initialApplications.length === 0, error: null }
  );

  // Update error state when API error changes
  useEffect(() => {
    if (apiError) {
      setError(apiError.message);
    }
  }, [apiError]);

  // Set up real-time subscription using standardized pattern
  useRealtimeSubscription({
    table: 'skill_applications',
    filter: userId ? { user_id: userId.toString() } : undefined,
    onUpdate: (payload) => {
      console.log(`[Debug] Received real-time update for user ${userId} skill applications:`, payload);
      fetchApplications();
    },
    debug: true
  });

  // Initial data fetch
  useEffect(() => {
    fetchApplications();
  }, [userId]);
  
  const handleDeleteClick = async (id: number) => {
    setConfirmDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await deleteSkillApplication(id);
      // Update the applications list by filtering out the deleted application
      const updatedApplications = applications?.filter(app => app.id !== id) || [];
      // This will cause the UI to update and close the dialog
      fetchApplications();
      setIsDeleteDialogOpen(false);
    } catch (err) {
      console.error('Error deleting skill application:', err);
      setDeleteError('Failed to delete skill application. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const renderStars = (count: number) => {
    return (
      <div className="flex space-x-0.5">
        {Array.from({ length: count }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
        ))}
        {Array.from({ length: 4 - count }).map((_, i) => (
          <Star key={`empty-${i}`} className="h-3.5 w-3.5 text-gray-300" />
        ))}
      </div>
    );
  };
  
  if (isLoading) {
    return <LoadingSpinner centered size="md" text="Loading applied skills..." />;
  }
  
  // Create a safe, non-null version of the applications array
  const safeApplications = applications || [];
  
  if (safeApplications.length === 0 && !isLoading) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center justify-center py-6">
          <GraduationCap className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">No skills applied yet</h3>
          <p className="text-gray-500 mt-2">
            This user hasn't applied any skills to customers yet
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {!hideTitle && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium leading-6">Applied Skills</h3>
          <span className="text-sm text-gray-500">{safeApplications.length} skills</span>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner centered size="md" text="Loading applied skills..." />
      ) : error ? (
        <ErrorMessage 
          message={error} 
          onRetry={fetchApplications} 
          onDismiss={() => setError(null)} 
        />
      ) : safeApplications.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500">No skills applied yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {safeApplications.map((app) => {
            const { color, stars } = getProficiencyDetails(app.proficiency);
            return (
              <Card key={app.id} className="relative">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{app.skill_name}</h3>
                      <p className="text-sm text-gray-600">{app.customer_name}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-medium rounded-full px-2 py-1 ${color}`}>
                        {app.proficiency}
                      </span>
                      <div className="mt-1">{renderStars(stars)}</div>
                    </div>
                  </div>
                  
                  {(app.start_date || app.end_date) && (
                    <div className="mt-2 text-xs text-gray-500">
                      {formatDateRange(app.start_date, app.end_date)}
                    </div>
                  )}
                  
                  {app.notes && (
                    <div className="mt-3 text-sm text-gray-600 border-t pt-2">
                      {app.notes}
                    </div>
                  )}
                  
                  <Button
                    color="light"
                    size="xs"
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 h-7 w-7"
                    onClick={() => handleDeleteClick(app.id)}
                    title="Delete skill application"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Modal
        show={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <Modal.Body>
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            
            {deleteError && (
              <div className="mb-4">
                <ErrorMessage 
                  message={deleteError}
                  onDismiss={() => setDeleteError(null)}
                />
              </div>
            )}
            
            <p className="mb-6">Are you sure you want to delete this skill application? This action cannot be undone.</p>
            
            <div className="flex justify-end gap-2">
              <Button
                color="light"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                color="failure"
                onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default UserAppliedSkills; 