import React, { useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { GraduationCap, Pencil } from 'lucide-react';
import { Button } from 'flowbite-react';
import { DataTable } from '../components/ui/DataTable';
import { EntityGrid } from '../components/ui/EntityGrid';
import { ViewToggle } from '../components/ui/ViewToggle';
import { PageHeader } from '../components/ui/PageHeader';
import { EntityFilter } from '../components/ui/EntityFilter';
import { SkillForm } from '../components/forms/SkillForm';
import { useQueryWithCache } from '../lib/hooks/useQueryWithCache';
import { useMutationWithCache } from '../lib/hooks/useMutationWithCache';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { SKILL_FILTERS } from '../lib/filters';
import { queryKeys } from '../lib/queryKeys';
import type { Skill } from '../types';

const columnHelper = createColumnHelper<Skill>();

const columns = [
  columnHelper.accessor('name', {
    header: () => 'Name',
  }),
  columnHelper.accessor('description', {
    header: () => 'Description',
    cell: info => (
      <div className="max-w-xs truncate">
        {info.getValue() || 'No description'}
      </div>
    )
  }),
  columnHelper.accessor('category.name', {
    header: () => 'Category',
    cell: info => (
      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
        {info.getValue() || 'Uncategorized'}
      </span>
    ),
  }),
  columnHelper.accessor('created_at', {
    header: () => 'Created',
    cell: info => new Date(info.getValue()).toLocaleDateString(),
  }),
  columnHelper.display({
    id: 'actions',
    header: () => 'Actions',
    cell: (info) => (
      <Button size="sm" onClick={() => info.table.options.meta?.onEdit(info.row.original)}>
        <Pencil className="h-4 w-4" />
      </Button>
    ),
  }),
];

export function Skills() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Partial<Skill>>({});
  const [view, setView] = useLocalStorage<'grid' | 'table'>('skills-view', 'table');
  const [filter, setFilter] = useLocalStorage('skills-filter', 'newest');
  
  const queryKey = queryKeys.skills.list(filter);
  
  const { data, isLoading: loading, error, refetch } = useQueryWithCache<Skill>(
    queryKey,
    'skills',
    {
      select: '*, category:skill_categories(id, name)',
      orderBy: { column: filter.includes('name') ? 'name' : 'created_at', ascending: filter.includes('asc') }
    }
  );

  useRealtimeSubscription({
    table: 'skills',
    onUpdate: refetch
  });

  const { create: createSkill, update: updateSkill } = useMutationWithCache<Skill>({
    table: 'skills',
    invalidateQueries: ['skills'],
    successMessage: 'Skill saved successfully',
    onSuccess: () => {
      setIsFormOpen(false);
      refetch();
    }
  });

  const handleAddSkill = () => {
    setSelectedSkill({});
    setIsFormOpen(true);
  };

  const handleEditSkill = (skill: Skill) => {
    setSelectedSkill(skill);
    setIsFormOpen(true);
  };

  const handleSubmit = async (skillData: Partial<Skill>) => {
    if (skillData.id) {
      await updateSkill({ id: skillData.id, data: skillData });
    } else {
      await createSkill({ data: { ...skillData } });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Skills"
          count={data?.length || 0}
          icon={GraduationCap}
          iconColor="text-purple-500"
          badgeColor="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
          onAdd={handleAddSkill}
        />
        <div className="flex gap-4">
          <EntityFilter
            options={SKILL_FILTERS}
            value={filter}
            onChange={setFilter}
          />
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {view === 'table' ? (
        <DataTable<Skill>
          data={data || []}
          columns={columns}
          loading={loading}
          error={error?.message}
          entityType="skills"
          meta={{
            onEdit: handleEditSkill,
          }}
        />
      ) : (
        <EntityGrid<Skill>
          data={data || []}
          loading={loading}
          error={error?.message}
          onEdit={handleEditSkill}
          type="skill"
        />
      )}

      <SkillForm
        skill={selectedSkill}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}