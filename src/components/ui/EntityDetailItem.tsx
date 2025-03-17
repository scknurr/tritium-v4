import React from 'react';
import { LucideIcon, ExternalLink, Clock } from 'lucide-react';
import { EntityLink } from './EntityLink';
import { Badge } from 'flowbite-react';

interface EntityDetailItemProps {
  id?: string | number;
  name: string;
  type: 'user' | 'customer' | 'skill' | 'application' | 'role';
  description?: string;
  secondaryField?: {
    label: string;
    value: string | number | React.ReactNode;
    icon?: LucideIcon;
  };
  tertiaryField?: {
    label: string;
    value: string | number | React.ReactNode;
    icon?: LucideIcon;
  };
  date?: {
    label: string;
    value: string | Date;
  };
  status?: {
    value: string;
    color?: 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray';
  };
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * EntityDetailItem component for displaying entity items within detail cards
 * 
 * @example
 * ```tsx
 * <EntityDetailItem
 *   id="123"
 *   name="John Doe"
 *   type="user"
 *   description="Software Engineer"
 *   secondaryField={{
 *     label: "Email",
 *     value: "john.doe@example.com"
 *   }}
 *   tertiaryField={{
 *     label: "Department",
 *     value: "Engineering"
 *   }}
 *   date={{
 *     label: "Joined",
 *     value: "2023-01-15"
 *   }}
 *   status={{
 *     value: "Active",
 *     color: "green"
 *   }}
 *   actions={<Button>View Details</Button>}
 * />
 * ```
 */
export function EntityDetailItem({
  id,
  name,
  type,
  description,
  secondaryField,
  tertiaryField,
  date,
  status,
  actions,
  onClick,
  className = ''
}: EntityDetailItemProps) {
  // Style constants based on entity type
  const entityStyles = {
    user: {
      hoverClass: 'hover:bg-blue-50 dark:hover:bg-blue-950',
      dividerClass: 'border-blue-100 dark:border-blue-900'
    },
    customer: {
      hoverClass: 'hover:bg-green-50 dark:hover:bg-green-950',
      dividerClass: 'border-green-100 dark:border-green-900'
    },
    skill: {
      hoverClass: 'hover:bg-purple-50 dark:hover:bg-purple-950',
      dividerClass: 'border-purple-100 dark:border-purple-900'
    },
    application: {
      hoverClass: 'hover:bg-indigo-50 dark:hover:bg-indigo-950',
      dividerClass: 'border-indigo-100 dark:border-indigo-900'
    },
    role: {
      hoverClass: 'hover:bg-orange-50 dark:hover:bg-orange-950',
      dividerClass: 'border-orange-100 dark:border-orange-900'
    }
  };

  const style = entityStyles[type];
  
  // Badge color mapping
  const getBadgeColor = (color?: string) => {
    switch (color) {
      case 'green': return 'success';
      case 'red': return 'failure';
      case 'yellow': return 'warning';
      case 'blue': return 'info';
      case 'purple': return 'purple';
      default: return 'default';
    }
  };

  return (
    <div 
      className={`
        p-3 rounded-lg border border-gray-100 dark:border-gray-800 
        ${onClick ? `cursor-pointer ${style.hoverClass}` : ''}
        transition-colors duration-150 
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {id ? (
              <EntityLink
                type={type}
                id={id}
                name={name}
                showIcon
                variant="default"
                className="font-medium"
              />
            ) : (
              <span className="font-medium flex items-center gap-2">
                <EntityLink
                  type={type}
                  id=""
                  name={name}
                  showIcon
                  variant="default"
                  className="font-medium"
                  customPath="#"
                />
              </span>
            )}
            
            {status && (
              <Badge 
                color={getBadgeColor(status.color) as any} 
                className="ml-2"
                size="sm"
              >
                {status.value}
              </Badge>
            )}
          </div>
          
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            {secondaryField && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                {secondaryField.icon && (
                  <secondaryField.icon className="h-4 w-4 mr-1" />
                )}
                <span className="mr-1 text-gray-500 dark:text-gray-500">{secondaryField.label}:</span>
                <span>{secondaryField.value}</span>
              </div>
            )}
            
            {tertiaryField && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                {tertiaryField.icon && (
                  <tertiaryField.icon className="h-4 w-4 mr-1" />
                )}
                <span className="mr-1 text-gray-500 dark:text-gray-500">{tertiaryField.label}:</span>
                <span>{tertiaryField.value}</span>
              </div>
            )}
            
            {date && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-1" />
                <span className="mr-1 text-gray-500 dark:text-gray-500">{date.label}:</span>
                <span>{typeof date.value === 'string' ? date.value : date.value.toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex-shrink-0 flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
} 