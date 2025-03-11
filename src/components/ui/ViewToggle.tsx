import React from 'react';
import { Button } from 'flowbite-react';
import { LayoutGrid, Table } from 'lucide-react';

interface ViewToggleProps {
  view: 'grid' | 'table';
  onViewChange: (view: 'grid' | 'table') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        color={view === 'table' ? 'primary' : 'gray'}
        onClick={() => onViewChange('table')}
      >
        <Table className="h-4 w-4 mr-2" />
        Table
      </Button>
      <Button
        size="sm"
        color={view === 'grid' ? 'primary' : 'gray'}
        onClick={() => onViewChange('grid')}
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Grid
      </Button>
    </div>
  );
}