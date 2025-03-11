import React from 'react';
import { Card, Button } from 'flowbite-react';
import { Pencil } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface EntityCardProps {
  title: string;
  subtitle?: string;
  description?: React.ReactNode;
  icon: LucideIcon;
  iconColor: string;
  status?: string;
  onEdit?: (e: React.MouseEvent) => void;
}

export function EntityCard({
  title,
  subtitle,
  description,
  icon: Icon,
  iconColor,
  status,
  onEdit
}: EntityCardProps) {
  return (
    <Card className="max-w-sm">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${iconColor} bg-opacity-10`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div>
            <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {title}
            </h5>
            {subtitle && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {onEdit && (
          <Button size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>
      {status && (
        <div className="mt-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            status === 'active' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
          }`}>
            {status}
          </span>
        </div>
      )}
      {description && (
        <div className="mt-4 text-gray-700 dark:text-gray-400">
          {description}
        </div>
      )}
    </Card>
  );
}