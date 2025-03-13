import React, { useState, useEffect } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Users as UsersIcon, Pencil } from 'lucide-react';
import { Button } from 'flowbite-react';
import { DataTable } from '../components/ui/DataTable';
import { EntityGrid } from '../components/ui/EntityGrid';
import { ViewToggle } from '../components/ui/ViewToggle';
import { PageHeader } from '../components/ui/PageHeader';
import { EntityFilter } from '../components/ui/EntityFilter';
import { UserForm } from '../components/forms/UserForm';
import { useQueryWithCache } from '../lib/hooks/useQueryWithCache';
import { useMutationWithCache } from '../lib/hooks/useMutationWithCache';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { USER_FILTERS } from '../lib/filters';
import { queryKeys } from '../lib/queryKeys';
import type { Profile } from '../lib/supabase';

const columnHelper = createColumnHelper<Profile>();

const columns = [
  columnHelper.accessor('full_name', {
    header: () => 'Name',
    cell: info => info.getValue() || 'Not set',
  }),
  columnHelper.accessor('email', {
    header: () => 'Email',
  }),
  columnHelper.accessor('title', {
    header: () => 'Title',
    cell: info => info.getValue() || 'Not set',
  }),
  columnHelper.accessor('created_at', {
    header: () => 'Joined',
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

export function Users() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Partial<Profile>>({});
  const [view, setView] = useLocalStorage<'grid' | 'table'>('users-view', 'table');
  const [filter, setFilter] = useLocalStorage('users-filter', 'newest');
  
  const queryKey = queryKeys.profiles.list(filter);
  
  const { data, isLoading: loading, error, refetch } = useQueryWithCache<Profile>(
    queryKey,
    'profiles',
    {
      orderBy: { column: filter.includes('name') ? 'full_name' : 'created_at', ascending: filter.includes('asc') }
    }
  );

  useEffect(() => {
    console.log('Query Key:', queryKey);
    console.log('Filter:', filter);
    console.log('Data:', data);
    console.log('Loading:', loading);
    console.log('Error:', error);
  }, [queryKey, filter, data, loading, error]);

  useRealtimeSubscription({
    table: 'profiles',
    onUpdate: refetch
  });

  const { create: createUser, update: updateUser } = useMutationWithCache<Profile>({
    table: 'profiles',
    invalidateQueries: ['profiles'],
    successMessage: 'User saved successfully',
    onSuccess: () => setIsFormOpen(false)
  });

  const handleAddUser = () => {
    setSelectedUser({});
    setIsFormOpen(true);
  };

  const handleEditUser = (user: Profile) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleSubmit = async (userData: Partial<Profile>) => {
    if (userData.id) {
      await updateUser({ id: userData.id, data: userData });
    } else {
      await createUser({ data: userData });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Users"
          count={data?.length || 0}
          icon={UsersIcon}
          iconColor="text-blue-500"
          badgeColor="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
          onAdd={handleAddUser}
        />
        <div className="flex gap-4">
          <EntityFilter
            options={USER_FILTERS}
            value={filter}
            onChange={setFilter}
          />
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {view === 'table' ? (
        <DataTable<Profile>
          data={data || []}
          columns={columns}
          loading={loading}
          error={error?.message}
          entityType="users"
          meta={{
            onEdit: handleEditUser,
          }}
        />
      ) : (
        <EntityGrid<Profile>
          data={data || []}
          loading={loading}
          error={error?.message}
          onEdit={handleEditUser}
          type="user"
        />
      )}

      <UserForm
        user={selectedUser}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}