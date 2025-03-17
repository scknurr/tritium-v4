import React from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Building, 
  GraduationCap, 
  FileSpreadsheet,
  Briefcase
} from 'lucide-react';

export type EntityType = 'user' | 'customer' | 'skill' | 'application' | 'role';

interface EntityLinkProps {
  /** The type of entity to link to */
  type: EntityType;
  /** The ID of the entity to link to */
  id: string | number;
  /** The name to display for the entity */
  name?: string | null;
  /** Additional CSS classes to apply to the link */
  className?: string;
  /** Whether to show an icon next to the entity name */
  showIcon?: boolean;
  /** Custom path to override the default path calculation */
  customPath?: string;
  /** Whether to use a larger variant of the link */
  variant?: 'default' | 'large';
}

/**
 * A standardized component for linking to entities in the application
 * 
 * @example
 * ```tsx
 * <EntityLink type="user" id={userId} name={userName} />
 * <EntityLink type="skill" id={skillId} name={skillName} showIcon />
 * <EntityLink type="customer" id={customerId} name={customerName} variant="large" />
 * ```
 */
export function EntityLink({ 
  type, 
  id, 
  name, 
  className = '', 
  showIcon = false,
  customPath,
  variant = 'default'
}: EntityLinkProps) {
  // Define color scheme for entity types
  const colors: Record<EntityType, string> = {
    user: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300',
    customer: 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300',
    skill: 'text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300',
    application: 'text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300',
    role: 'text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300'
  };
  
  // Define icons for entity types
  const icons: Record<EntityType, React.ReactNode> = {
    user: <User className="h-4 w-4" />,
    customer: <Building className="h-4 w-4" />,
    skill: <GraduationCap className="h-4 w-4" />,
    application: <FileSpreadsheet className="h-4 w-4" />,
    role: <Briefcase className="h-4 w-4" />
  };
  
  // Get color and icon for this entity type
  const color = colors[type] || 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100';
  const icon = icons[type];
  
  // Calculate URL path
  const path = customPath || `/${type}s/${id}`;
  
  // Handle null names with appropriate fallbacks
  const displayName = name || `Unknown ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  
  // Set font size based on variant
  const fontSize = variant === 'large' ? 'text-lg' : 'text-sm';
  
  return (
    <Link 
      to={path} 
      className={`${color} hover:underline font-medium ${fontSize} flex items-center gap-1 ${className}`}
    >
      {showIcon && icon}
      <span>{displayName}</span>
    </Link>
  );
} 