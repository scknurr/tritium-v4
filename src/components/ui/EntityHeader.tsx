import React from 'react';
import { Button } from 'flowbite-react';
import { Pencil, Trash2 } from 'lucide-react';

interface EntityHeaderProps {
  title: string;
  onEdit: () => void;
  onDelete: () => void;
  children?: React.ReactNode;
}

export function EntityHeader({ title, onEdit, onDelete, children }: EntityHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      <Button size="sm" onClick={onEdit}>
        <Pencil className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <Button size="sm" color="failure" onClick={onDelete}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
      {children}
    </div>
  );
}