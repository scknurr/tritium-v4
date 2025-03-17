import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { GraduationCap, Info, Plus, Star } from 'lucide-react';
import { getUserSkillApplications, getCustomerSkillApplications } from '../lib/api';
import { SkillApplication } from '../types';
import { selectUser } from '../redux/slices/authSlice';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Dialog } from '../components/ui/Dialog';
import SkillApplicationDialog from '../components/dialogs/SkillApplicationDialog';
import { formatDate } from '../utils/format';
import { Timeline } from '../components/ui/Timeline';

const SkillApplicationsPage = () => {
  const user = useSelector(selectUser);
  const [applications, setApplications] = useState<SkillApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<SkillApplication | null>(null);
  const [view, setView] = useState<'list' | 'timeline'>('list');

  useEffect(() => {
    if (user?.id) {
      fetchUserApplications();
    }
  }, [user]);

  const fetchUserApplications = async () => {
    setIsLoading(true);
    try {
      const data = await getUserSkillApplications(user.id);
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching skill applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerApplications = async (customerId: number) => {
    setIsLoading(true);
    try {
      const data = await getCustomerSkillApplications(customerId);
      setApplications(data || []);
      setSelectedCustomerId(customerId);
    } catch (error) {
      console.error('Error fetching customer skill applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddApplication = () => {
    setSelectedApplication(null);
    setIsAddDialogOpen(true);
  };

  const handleEditApplication = (application: SkillApplication) => {
    setSelectedApplication(application);
    setIsAddDialogOpen(true);
  };

  const handleDialogClose = (refreshNeeded: boolean = false) => {
    setIsAddDialogOpen(false);
    if (refreshNeeded) {
      if (selectedCustomerId) {
        fetchCustomerApplications(selectedCustomerId);
      } else {
        fetchUserApplications();
      }
    }
  };

  const renderProficiencyStars = (proficiency: string) => {
    let stars = 0;
    switch (proficiency) {
      case 'NOVICE': stars = 1; break;
      case 'INTERMEDIATE': stars = 2; break;
      case 'ADVANCED': stars = 3; break;
      case 'EXPERT': stars = 4; break;
      default: stars = 0;
    }

    return (
      <div className="flex">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {Array.from({ length: 4 - stars }).map((_, i) => (
          <Star key={i + stars} className="h-4 w-4 text-gray-300" />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Skill Applications"
        description="Apply and manage your skills at different customers"
        icon={<GraduationCap className="h-6 w-6" />}
        action={
          <Button onClick={handleAddApplication}>
            <Plus className="h-4 w-4 mr-2" />
            Apply Skill
          </Button>
        }
      />

      <div className="mt-6">
        <Tabs defaultValue="list" onValueChange={(v) => setView(v as 'list' | 'timeline')}>
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : applications.length === 0 ? (
              <Card className="p-6 text-center">
                <div className="flex flex-col items-center justify-center py-6">
                  <Info className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No skill applications found</h3>
                  <p className="text-gray-500 mt-2">
                    Apply your skills at customers to showcase your expertise
                  </p>
                  <Button className="mt-4" onClick={handleAddApplication}>
                    Apply Skill
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {applications.map((app) => (
                  <Card key={app.id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between">
                        <h3 className="text-lg font-medium">{app.skill_name}</h3>
                        <Button variant="ghost" size="sm" onClick={() => handleEditApplication(app)}>
                          Edit
                        </Button>
                      </div>
                      
                      <p className="text-gray-600">{app.customer_name}</p>
                      
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm font-medium">{app.proficiency}</span>
                        {renderProficiencyStars(app.proficiency)}
                      </div>
                      
                      {(app.start_date || app.end_date) && (
                        <div className="mt-2 text-sm text-gray-500">
                          {app.start_date && formatDate(app.start_date)}
                          {app.start_date && app.end_date && ' — '}
                          {app.end_date && formatDate(app.end_date)}
                        </div>
                      )}
                      
                      {app.notes && (
                        <div className="mt-3 text-sm text-gray-600 border-t pt-2">
                          {app.notes}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="timeline">
            <Card>
              <div className="p-6">
                <Timeline
                  title="Skill Application Activity"
                  icon={<GraduationCap className="h-5 w-5" />}
                  loading={isLoading}
                  entityType="users"
                  entityId={user?.id}
                  tableFilter="skill_applications"
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => !open && handleDialogClose()}
      >
        <SkillApplicationDialog
          userId={user?.id}
          existingApplication={selectedApplication}
          onClose={handleDialogClose}
        />
      </Dialog>
    </div>
  );
};

export default SkillApplicationsPage; 