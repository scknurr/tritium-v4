import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Building, Calendar, Star, Trash, PlusCircle } from 'lucide-react';
import { getUserSkillApplications, deleteSkillApplication } from '../lib/api';
import { SkillApplication } from '../types';
import ApplySkillButton from './ApplySkillButton';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import { useApiRequest } from '../hooks/useApiRequest';
import { Button, Modal, Card } from 'flowbite-react';

type SkillApplicationsListProps = {
  userId: string;
  showAddButton?: boolean;
};

const SkillApplicationsList: React.FC<SkillApplicationsListProps> = ({
  userId,
  showAddButton = true
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Use standardized API request hook
  const {
    state: { data: applications = [], isLoading, error: apiError },
    execute: fetchApplications
  } = useApiRequest<SkillApplication[]>(
    async () => {
      return await getUserSkillApplications(userId);
    },
    { data: [], isLoading: true, error: null }
  );

  // Update error state when API error changes
  useEffect(() => {
    if (apiError) {
      setError(apiError.message);
    }
  }, [apiError]);

  // Set up real-time subscription to skill_applications table
  useRealtimeSubscription({
    table: 'skill_applications',
    filter: { user_id: userId },
    onUpdate: fetchApplications
  });

  // Initial data fetch
  useEffect(() => {
    fetchApplications();
  }, [userId]);

  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await deleteSkillApplication(id);
      setConfirmDeleteId(null);
      // No need to call fetchApplications here as the real-time subscription will handle it
    } catch (error) {
      console.error('Error deleting skill application:', error);
      setDeleteError('Failed to delete skill application. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

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

  // Function to format date range
  const formatDateRange = (startDate?: string | null, endDate?: string | null) => {
    if (!startDate) return '';
    
    const format = (date: string) => new Date(date).toLocaleDateString();
    
    return `${format(startDate)}${endDate ? ` - ${format(endDate)}` : ' - Present'}`;
  };

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner centered size="md" text="Loading skill applications..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Skill Applications</h2>
        {showAddButton && <span className="text-sm text-gray-500">{applications?.length || 0} applications</span>}
      </div>

      {isLoading ? (
        <LoadingSpinner centered size="md" text="Loading skill applications..." />
      ) : error ? (
        <ErrorMessage 
          message={error} 
          onRetry={fetchApplications} 
          onDismiss={() => setError(null)} 
        />
      ) : (applications?.length || 0) === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500">No skill applications found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications?.map((app) => {
            const { color, stars } = getProficiencyDetails(app.proficiency);
            return (
              <Card key={app.id} className="p-4 relative hover:shadow-sm transition-shadow">
                <div className="flex justify-between">
                  <div>
                    <Link 
                      to={`/skills/${app.skill_id}`}
                      className="font-medium hover:text-blue-600"
                    >
                      {app.skill_name || 'Unknown Skill'}
                    </Link>
                    
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                      <Building className="h-4 w-4 text-gray-400" />
                      <Link 
                        to={`/customers/${app.customer_id}`}
                        className="hover:text-blue-600"
                      >
                        {app.customer_name || 'Unknown Customer'}
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                      {app.proficiency || 'Unknown'}
                    </span>
                    <div className="mt-1">
                      {renderProficiencyStars(app.proficiency || '')}
                    </div>
                  </div>
                </div>
                
                {(app.start_date || app.end_date) && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDateRange(app.start_date, app.end_date)}</span>
                  </div>
                )}
                
                {app.notes && (
                  <p className="mt-2 text-sm text-gray-600 border-t pt-2">
                    {app.notes}
                  </p>
                )}
                
                <Button
                  onClick={() => setConfirmDeleteId(app.id)}
                  disabled={isDeleting}
                  color="light"
                  size="xs"
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"
                  title="Delete"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Modal
        show={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
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
                onClick={() => setConfirmDeleteId(null)}
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

export default SkillApplicationsList; 