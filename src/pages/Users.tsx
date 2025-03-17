import React, { useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Users as UsersIcon, Pencil, Eye } from 'lucide-react';
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
import type { Profile } from '../types';
import { useNavigate } from 'react-router-dom';

const columnHelper = createColumnHelper<Profile>();

const columns = [
  columnHelper.accessor(row => `${row.first_name} ${row.last_name}`.trim() || row.email, {
    id: 'name',
    header: () => 'Name',
    cell: info => info.getValue() || 'No name',
  }),
  columnHelper.accessor('email', {
    header: () => 'Email',
    cell: info => (
      <div className="max-w-xs truncate">
        {info.getValue()}
      </div>
    )
  }),
  columnHelper.accessor('title', {
    header: () => 'Title',
    cell: info => info.getValue() || 'Not set',
  }),
  columnHelper.display({
    id: 'actions',
    header: () => 'Actions',
    cell: (info) => (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => info.table.options.meta?.onView?.(info.row.original)}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={() => info.table.options.meta?.onEdit?.(info.row.original)}>
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    ),
  }),
];

export function Users() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Partial<Profile>>({});
  const [view, setView] = useLocalStorage<'grid' | 'table'>('users-view', 'table');
  const [filter, setFilter] = useLocalStorage('users-filter', 'newest');
  const navigate = useNavigate();
  
  const queryKey = queryKeys.profiles.list(filter);
  
  const { data, isLoading: loading, error, refetch } = useQueryWithCache<Profile>(
    queryKey,
    'profiles',
    {
      select: '*',
      orderBy: { 
        column: filter.includes('name') ? 'first_name' : 'created_at', 
        ascending: filter.includes('asc') 
      }
    }
  );

  useRealtimeSubscription({
    table: 'profiles',
    onUpdate: () => {
      refetch();
    }
  });

  const { create: createUser, update: updateUser } = useMutationWithCache<Profile>({
    table: 'profiles',
    invalidateQueries: ['profiles'],
    successMessage: 'User saved successfully',
    onSuccess: () => {
      setIsFormOpen(false);
      refetch();
    }
  });

  const handleAddUser = () => {
    setSelectedUser({});
    setIsFormOpen(true);
  };

  const handleEditUser = (user: Profile) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };
  
  const handleViewUser = (user: Profile) => {
    navigate(`/users/${user.id}`);
  };

  const handleSubmit = async (userData: Partial<Profile>) => {
    if (userData.id) {
      await updateUser({ id: userData.id, data: userData });
    } else {
      await createUser({ data: { ...userData } });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Users"
          count={data?.length || 0}
          icon={UsersIcon}
          iconColor="text-blue-600"
          badgeColor="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
          onAdd={handleAddUser}
        />
        <div className="flex gap-4 w-full sm:w-auto">
          <EntityFilter
            options={USER_FILTERS}
            value={filter}
            onChange={setFilter}
          />
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      <div className="overflow-hidden">
        {view === 'table' ? (
          <DataTable<Profile>
            data={data || []}
            columns={columns}
            loading={loading}
            error={error?.message}
            entityType="profiles"
            meta={{
              onEdit: handleEditUser,
              onView: handleViewUser
            }}
          />
        ) : (
          <EntityGrid<Profile>
            data={data || []}
            loading={loading}
            error={error?.message}
            onEdit={handleEditUser}
            onView={handleViewUser}
            type="user"
          />
        )}
      </div>

      <UserForm
        user={selectedUser}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}