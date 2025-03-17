import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Users, Star, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CustomerSkillApplication } from '../types';

type CustomerSkillApplicationsListProps = {
  customerId: number;
  refreshTrigger?: number;
};

const CustomerSkillApplicationsList: React.FC<CustomerSkillApplicationsListProps> = ({
  customerId,
  refreshTrigger = 0
}) => {
  const [applications, setApplications] = useState<CustomerSkillApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        // Fetch skill applications for this customer
        const { data, error } = await supabase
          .from('skill_applications')
          .select(`
            id, 
            user_id, 
            skill_id, 
            customer_id, 
            proficiency, 
            start_date, 
            end_date, 
            notes, 
            created_at,
            updated_at,
            skills:skill_id(name),
            users:user_id(id, full_name, email)
          `)
          .eq('customer_id', customerId)
          .is('end_date', null) // Only show active applications
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Format the data to include user and skill names
        const formattedData = data?.map(app => ({
          ...app,
          skill_name: app.skills ? (app.skills as any).name : 'Unknown Skill',
          user_name: app.users ? 
            ((app.users as any).full_name || (app.users as any).email) : 
            'Unknown User'
        })) || [];
        
        setApplications(formattedData);
      } catch (error) {
        console.error('Error fetching customer skill applications:', error);
        setApplications([]); // Ensure we always have an array
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [customerId, refreshTrigger]);

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

  if (isLoading) {
    return <div className="py-4">Loading applied skills...</div>;
  }

  // Ensure applications is always an array before mapping
  const applicationsList = Array.isArray(applications) ? applications : [];

  if (applicationsList.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No one has applied skills at this customer yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applicationsList.map(app => (
        <div key={app.id} className="border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium flex items-center gap-1">
                <Users className="h-4 w-4 text-blue-500" />
                <Link to={`/users/${app.user_id}`} className="text-blue-500 hover:underline">
                  {app.user_name}
                </Link>
                <span className="text-gray-500">applied</span>
                <GraduationCap className="h-4 w-4 text-purple-500" />
                <Link to={`/skills/${app.skill_id}`} className="text-purple-500 hover:underline">
                  {app.skill_name}
                </Link>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                  {app.proficiency}
                </span>
                <div className="ml-1">
                  {renderProficiencyStars(app.proficiency)}
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
  );
};

export default CustomerSkillApplicationsList; 