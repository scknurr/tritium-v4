import React from 'react';
import { Card } from 'flowbite-react';
import { LucideIcon } from 'lucide-react';

interface ContentCardProps {
  title?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  entityType?: 'user' | 'customer' | 'skill' | 'application' | 'role';
  footer?: React.ReactNode;
  isLoading?: boolean;
}

/**
 * ContentCard component for displaying content in a consistent card format
 * 
 * Usage:
 * ```tsx
 * <ContentCard 
 *   title="Card Title" 
 *   icon={Users} 
 *   iconColor="text-blue-600"
 *   actions={<Button>Action</Button>}
 * >
 *   Content goes here
 * </ContentCard>
 * ```
 * 
 * Or with entity standardization:
 * ```tsx
 * <ContentCard 
 *   title="User Skills" 
 *   entityType="skill"
 *   actions={<Button>Add Skill</Button>}
 * >
 *   Content goes here
 * </ContentCard>
 * ```
 */
export function ContentCard({
  title,
  icon: Icon,
  iconColor,
  children,
  className = '',
  actions,
  entityType,
  footer,
  isLoading = false
}: ContentCardProps) {
  // Entity type standardized colors and icons
  const entityStyles = {
    user: {
      color: 'text-blue-600',
      iconClass: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
      borderClass: 'border-blue-200 dark:border-blue-800',
    },
    customer: {
      color: 'text-green-600',
      iconClass: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300',
      borderClass: 'border-green-200 dark:border-green-800',
    },
    skill: {
      color: 'text-purple-600',
      iconClass: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300',
      borderClass: 'border-purple-200 dark:border-purple-800',
    },
    application: {
      color: 'text-indigo-600',
      iconClass: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300',
      borderClass: 'border-indigo-200 dark:border-indigo-800',
    },
    role: {
      color: 'text-orange-600',
      iconClass: 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300',
      borderClass: 'border-orange-200 dark:border-orange-800',
    }
  };

  // If entityType is provided, use the standardized colors
  const effectiveIconColor = entityType ? entityStyles[entityType].color : iconColor;
  
  return (
    <Card className={`border ${entityType ? entityStyles[entityType].borderClass : ''} ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <div className="flex items-center gap-2">
              {Icon && (
                <div className={`p-1.5 rounded-md ${entityType ? entityStyles[entityType].iconClass : effectiveIconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            </div>
          )}
          {actions && (
            <div className="flex gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-3/4"></div>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-1/2"></div>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-2/3"></div>
        </div>
      ) : (
        <div>{children}</div>
      )}
      
      {footer && (
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </Card>
  );
} 