import React, { useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Building, Pencil, Eye } from 'lucide-react';
import { Button } from 'flowbite-react';
import { DataTable } from '../components/ui/DataTable';
import { EntityGrid } from '../components/ui/EntityGrid';
import { ViewToggle } from '../components/ui/ViewToggle';
import { PageHeader } from '../components/ui/PageHeader';
import { EntityFilter } from '../components/ui/EntityFilter';
import { CustomerForm } from '../components/forms/CustomerForm';
import { useQueryWithCache } from '../lib/hooks/useQueryWithCache';
import { useMutationWithCache } from '../lib/hooks/useMutationWithCache';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CUSTOMER_FILTERS } from '../lib/filters';
import { queryKeys } from '../lib/queryKeys';
import type { Customer } from '../types';
import { useNavigate } from 'react-router-dom';

const columnHelper = createColumnHelper<Customer>();

const columns = [
  columnHelper.accessor('name', {
    header: () => 'Name',
    cell: info => (
      <div className="max-w-xs truncate">
        {info.getValue()}
      </div>
    )
  }),
  columnHelper.accessor('description', {
    header: () => 'Description',
    cell: info => (
      <div className="max-w-xs truncate">
        {info.getValue() || 'No description'}
      </div>
    )
  }),
  columnHelper.accessor('website', {
    header: () => 'Website',
    cell: info => info.getValue() ? (
      <a 
        href={info.getValue()!} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline max-w-xs truncate block"
      >
        {new URL(info.getValue()!).hostname}
      </a>
    ) : 'Not set',
  }),
  columnHelper.accessor('industry.name', {
    header: () => 'Industry',
    cell: info => (
      <div className="max-w-xs truncate">
        {info.getValue() || 'Not set'}
      </div>
    )
  }),
  columnHelper.accessor('status', {
    header: () => 'Status',
    cell: info => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        info.getValue() === 'active' 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      }`}>
        {info.getValue()}
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

export function Customers() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Partial<Customer>>({});
  const [view, setView] = useLocalStorage<'grid' | 'table'>('customers-view', 'table');
  const [filter, setFilter] = useLocalStorage('customers-filter', 'newest');
  const navigate = useNavigate();

  const queryKey = queryKeys.customers.list(filter);
  
  const { data, isLoading: loading, error, refetch } = useQueryWithCache<Customer>(
    queryKey,
    'customers',
    {
      select: '*, industry:industries(id, name)',
      orderBy: { column: filter.includes('name') ? 'name' : 'created_at', ascending: filter.includes('asc') }
    }
  );

  useRealtimeSubscription({
    table: 'customers',
    onUpdate: () => {
      refetch();
    }
  });

  const { create: createCustomer, update: updateCustomer } = useMutationWithCache<Customer>({
    table: 'customers',
    invalidateQueries: ['customers'],
    successMessage: 'Customer saved successfully',
    onSuccess: () => {
      setIsFormOpen(false);
      refetch();
    }
  });

  const handleAddCustomer = () => {
    setSelectedCustomer({});
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };
  
  const handleViewCustomer = (customer: Customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleSubmit = async (customerData: Partial<Customer>) => {
    if (customerData.id) {
      await updateCustomer({ id: customerData.id, data: customerData });
    } else {
      await createCustomer({ data: { ...customerData, status: customerData.status || 'active' } });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Customers"
          count={data?.length || 0}
          icon={Building}
          iconColor="text-green-500"
          badgeColor="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          onAdd={handleAddCustomer}
        />
        <div className="flex gap-4 w-full sm:w-auto">
          <EntityFilter
            options={CUSTOMER_FILTERS}
            value={filter}
            onChange={setFilter}
          />
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      <div className="overflow-hidden">
        {view === 'table' ? (
          <DataTable<Customer>
            data={data || []}
            columns={columns}
            loading={loading}
            error={error?.message}
            entityType="customers"
            meta={{
              onEdit: handleEditCustomer,
              onView: handleViewCustomer
            }}
          />
        ) : (
          <EntityGrid<Customer>
            data={data || []}
            loading={loading}
            error={error?.message}
            onEdit={handleEditCustomer}
            type="customer"
          />
        )}
      </div>

      <CustomerForm
        customer={selectedCustomer}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}