import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Building, Calendar, Star, Trash, PlusCircle } from 'lucide-react';
import { getUserSkillApplications, deleteSkillApplication } from '../lib/api';
import { SkillApplication } from '../types';
import ApplySkillButton from './ApplySkillButton';

type SkillApplicationsListProps = {
  userId: string;
  showAddButton?: boolean;
};

const SkillApplicationsList: React.FC<SkillApplicationsListProps> = ({
  userId,
  showAddButton = true
}) => {
  const [applications, setApplications] = useState<SkillApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const data = await getUserSkillApplications(userId);
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching skill applications:', error);
      setApplications([]); // Ensure applications is always an array even on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [userId]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this skill application?')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await deleteSkillApplication(id);
      await fetchApplications();
    } catch (error) {
      console.error('Error deleting skill application:', error);
      alert('Failed to delete skill application');
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

  if (isLoading) {
    return <div className="py-4">Loading skill applications...</div>;
  }

  // Ensure applications is always an array before mapping
  const applicationsList = Array.isArray(applications) ? applications : [];

  return (
    <div>
      {showAddButton && (
        <div className="flex justify-end mb-4">
          <ApplySkillButton 
            userId={userId} 
            onSuccess={fetchApplications} 
            buttonText="Apply Skill at Customer"
          />
        </div>
      )}
      
      {applicationsList.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          No skill applications found
          {showAddButton && (
            <div className="mt-2">
              <ApplySkillButton 
                userId={userId} 
                onSuccess={fetchApplications} 
                buttonText="Apply a Skill" 
                className="mx-auto"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {applicationsList.map(app => (
            <div key={app.id} className="border rounded-md p-4 relative hover:shadow-sm transition-shadow">
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
              
              <button
                onClick={() => handleDelete(app.id)}
                disabled={isDeleting}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"
                title="Delete"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillApplicationsList; 