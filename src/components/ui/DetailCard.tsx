import React from 'react';
import { Card, Button } from 'flowbite-react';
import { LucideIcon, Plus, Users, Building, GraduationCap, FileText, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EntityLink } from './EntityLink';

interface DetailCardAction {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
}

interface DetailCardProps {
  title: string;
  entityType: 'user' | 'customer' | 'skill' | 'application' | 'role';
  icon?: LucideIcon;
  children: React.ReactNode;
  actions?: DetailCardAction[];
  footer?: React.ReactNode;
  isLoading?: boolean;
  emptyState?: {
    message: string;
    action?: DetailCardAction;
  };
}

/**
 * DetailCard component for displaying entity information in detail pages
 * Provides consistent styling and layout for entity cards
 * 
 * @example
 * ```tsx
 * <DetailCard
 *   title="Team Members"
 *   entityType="user"
 *   actions={[
 *     { label: 'Add Member', icon: Plus, onClick: handleAddMember }
 *   ]}
 *   emptyState={{
 *     message: "No team members assigned yet",
 *     action: { label: "Add Member", onClick: handleAddMember }
 *   }}
 * >
 *   {members.map(member => (
 *     <div key={member.id}>
 *       <EntityLink type="user" id={member.id} name={member.name} showIcon />
 *     </div>
 *   ))}
 * </DetailCard>
 * ```
 */
export function DetailCard({
  title,
  entityType,
  icon,
  children,
  actions = [],
  footer,
  isLoading = false,
  emptyState
}: DetailCardProps) {
  // Entity type standardized styles
  const entityStyles = {
    user: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800',
      icon: Users,
      buttonColor: 'blue'
    },
    customer: {
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: Building,
      buttonColor: 'green'
    },
    skill: {
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      borderColor: 'border-purple-200 dark:border-purple-800',
      icon: GraduationCap,
      buttonColor: 'purple'
    },
    application: {
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
      icon: FileText,
      buttonColor: 'indigo'
    },
    role: {
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      borderColor: 'border-orange-200 dark:border-orange-800',
      icon: Briefcase,
      buttonColor: 'orange'
    }
  };

  const style = entityStyles[entityType];
  const IconComponent = icon || style.icon;
  
  // Check if content is empty to show empty state
  const isEmpty = React.Children.count(children) === 0 && emptyState;

  // Map variant to Flowbite button color
  const getButtonColor = (variant?: 'primary' | 'secondary' | 'outline' | 'ghost') => {
    switch (variant) {
      case 'primary': return entityType;
      case 'secondary': return 'gray';
      case 'outline': return 'light';
      case 'ghost': return 'light';
      default: return entityType;
    }
  };

  // Render action button based on whether it has an href or onClick
  const renderActionButton = (action: DetailCardAction, index: number) => {
    const ActionIcon = action.icon;
    
    const buttonContent = (
      <>
        {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
        {action.label}
      </>
    );
    
    if (action.href) {
      return (
        <Link key={index} to={action.href}>
          <Button
            size="sm"
            color={getButtonColor(action.variant) as any}
            outline={action.variant === 'outline'}
            disabled={action.disabled}
          >
            {buttonContent}
          </Button>
        </Link>
      );
    }
    
    return (
      <Button
        key={index}
        onClick={action.onClick}
        size="sm"
        color={getButtonColor(action.variant) as any}
        outline={action.variant === 'outline'}
        disabled={action.disabled}
      >
        {buttonContent}
      </Button>
    );
  };

  return (
    <Card className={`border ${style.borderColor} h-full`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${style.bgColor} ${style.color}`}>
            <IconComponent className={`h-5 w-5 ${style.color}`} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
        
        {actions.length > 0 && (
          <div className="flex gap-2">
            {actions.map(renderActionButton)}
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-3/4"></div>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-1/2"></div>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-2/3"></div>
        </div>
      ) : isEmpty ? (
        <div className="py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">{emptyState.message}</p>
          {emptyState.action && (
            emptyState.action.href ? (
              <Link to={emptyState.action.href}>
                <Button
                  size="sm"
                  color={getButtonColor(emptyState.action.variant) as any}
                  outline={emptyState.action.variant === 'outline'}
                  disabled={emptyState.action.disabled}
                >
                  {emptyState.action.icon && <emptyState.action.icon className="h-4 w-4 mr-2" />}
                  {emptyState.action.label}
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                color={getButtonColor(emptyState.action.variant) as any}
                outline={emptyState.action.variant === 'outline'}
                onClick={emptyState.action.onClick}
                disabled={emptyState.action.disabled}
              >
                {emptyState.action.icon && <emptyState.action.icon className="h-4 w-4 mr-2" />}
                {emptyState.action.label}
              </Button>
            )
          )}
        </div>
      ) : (
        <div className="space-y-4">{children}</div>
      )}
      
      {footer && (
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </Card>
  );
} 