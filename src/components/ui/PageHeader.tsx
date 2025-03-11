import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from 'flowbite-react';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  count: number;
  icon: LucideIcon;
  iconColor: string;
  badgeColor: string;
  onAdd?: () => void;
}

export function PageHeader({ 
  title, 
  count, 
  icon: Icon, 
  iconColor, 
  badgeColor,
  onAdd 
}: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Icon className={`h-6 w-6 ${iconColor}`} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <span className={`${badgeColor} text-xs font-medium px-2.5 py-0.5 rounded`}>
          {count}
        </span>
      </div>
      {onAdd && (
        <Button size="sm" className="gap-2" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add {title.slice(0, -1)}
        </Button>
      )}
    </div>
  );
}