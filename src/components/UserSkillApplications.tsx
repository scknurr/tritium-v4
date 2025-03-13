import React, { useState, useEffect } from 'react';
import { GraduationCap, PlusCircle, Pencil, Trash, Building, Calendar, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Dialog } from './ui/Dialog';
import { SkillApplication } from '../types';
import { getUserSkillApplications, deleteSkillApplication } from '../lib/api';
import SkillApplicationDialog from './dialogs/SkillApplicationDialog';
import { Link } from 'react-router-dom';

// Helper function to map proficiency to color and stars
const getProficiencyDetails = (proficiency: string) => {
  switch (proficiency.toUpperCase()) {
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
};

type UserSkillApplicationsProps = {
  userId: string;
  initialApplications?: SkillApplication[];
  hideTitle?: boolean;
};

const UserSkillApplications: React.FC<UserSkillApplicationsProps> = ({
  userId,
  initialApplications,
  hideTitle = false
}) => {
  const [applications, setApplications] = useState<SkillApplication[]>(initialApplications || []);
  const [isLoading, setIsLoading] = useState(!initialApplications);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<SkillApplication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!initialApplications) {
      fetchApplications();
    }
  }, [initialApplications, userId]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const data = await getUserSkillApplications(userId);
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching skill applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    fetchApplications();
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    fetchApplications();
  };

  const handleEditClick = (application: SkillApplication) => {
    setSelectedApplication(application);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = async (application: SkillApplication) => {
    if (window.confirm(`Are you sure you want to remove "${application.skill_name}" from "${application.customer_name}"?`)) {
      setIsDeleting(true);
      try {
        await deleteSkillApplication(application.id);
        fetchApplications();
      } catch (error) {
        console.error('Error deleting skill application:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Format date like "Jan 2023 - Present" or "Jan 2023 - Dec 2023"
  const formatDateRange = (startDate?: string | null, endDate?: string | null) => {
    if (!startDate) return '';
    
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };
    
    return `${formatDate(startDate)}${endDate ? ` - ${formatDate(endDate)}` : ' - Present'}`;
  };

  return (
    <Card>
      {!hideTitle && (
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Applied Skills
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Apply Skill
          </Button>
        </CardHeader>
      )}
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No skills applied at any customers yet
            <Button 
              variant="link" 
              className="block mx-auto mt-2"
              onClick={() => setIsAddDialogOpen(true)}
            >
              Apply a skill
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {applications.map(application => {
              const { color, stars } = getProficiencyDetails(application.proficiency);
              
              return (
                <div key={application.id} className="border rounded-lg p-4 relative hover:shadow-md transition-shadow">
                  <div className="absolute top-2 right-2 flex gap-1 opacity-50 hover:opacity-100">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      title="Edit"
                      onClick={() => handleEditClick(application)}
                      disabled={isDeleting}
                      className="h-7 w-7"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      title="Remove"
                      onClick={() => handleDeleteClick(application)}
                      disabled={isDeleting}
                      className="h-7 w-7"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Link 
                    to={`/skills/${application.skill_id}`}
                    className="font-semibold text-base hover:text-blue-600"
                  >
                    {application.skill_name}
                  </Link>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Link 
                      to={`/customers/${application.customer_id}`}
                      className="text-sm hover:text-blue-600"
                    >
                      {application.customer_name}
                    </Link>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>
                      {application.proficiency}
                    </span>
                    <div className="flex ml-1">
                      {Array.from({ length: stars }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                      {Array.from({ length: 4 - stars }).map((_, i) => (
                        <Star key={i + stars} className="h-3 w-3 text-gray-200" />
                      ))}
                    </div>
                  </div>
                  
                  {(application.start_date || application.end_date) && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{formatDateRange(application.start_date, application.end_date)}</span>
                    </div>
                  )}
                  
                  {application.notes && (
                    <p className="text-sm mt-3 text-gray-600 border-t pt-2 line-clamp-2">
                      {application.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <SkillApplicationDialog
          userId={userId}
          existingApplication={null}
          onClose={(refresh) => {
            setIsAddDialogOpen(false);
            if (refresh) fetchApplications();
          }}
        />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {selectedApplication && (
          <SkillApplicationDialog
            userId={userId}
            existingApplication={selectedApplication}
            onClose={(refresh) => {
              setIsEditDialogOpen(false);
              if (refresh) fetchApplications();
            }}
          />
        )}
      </Dialog>
    </Card>
  );
};

export default UserSkillApplications; 