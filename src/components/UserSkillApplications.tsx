// This is a redirect file to maintain backward compatibility
import React from 'react';
import UserAppliedSkills from './UserAppliedSkills';
import { SkillApplication } from '../types';

// Forward the component
export interface UserSkillApplicationsProps {
  userId: string;
  initialApplications?: SkillApplication[];
  hideTitle?: boolean;
}

const UserSkillApplications = (props: UserSkillApplicationsProps) => {
  return <UserAppliedSkills {...props} />;
};

export default UserSkillApplications; 