import React, { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  ColumnDef,
} from '@tanstack/react-table';
import { Table, Spinner } from 'flowbite-react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { EntityLink } from './EntityLink';

// Declare TableMeta interface to fix type issues
export interface TableMeta<T> {
  onEdit?: (entity: T) => void;
  onView?: (entity: T) => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  loading?: boolean;
  error?: string | null;
  entityType: string;
  meta?: TableMeta<T>;
}

export function DataTable<T extends { id: string | number, name?: string }>({
  data,
  columns,
  loading = false,
  error,
  entityType,
  meta,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // Convert entityType (plural) to entity type (singular) for EntityLink
  const getEntityType = (type: string): 'user' | 'customer' | 'skill' | 'application' | 'role' => {
    if (type === 'users' || type === 'profiles') return 'user';
    if (type === 'customers') return 'customer';
    if (type === 'skills') return 'skill';
    if (type === 'applications') return 'application';
    if (type === 'roles') return 'role';
    // Default fallback
    return 'user';
  };

  const handleRowClick = (row: T) => {
    if (meta?.onView) {
      meta.onView(row);
    }
  };

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  const headerGroups = table.getHeaderGroups();
  const headerGroup = headerGroups.length > 0 ? headerGroups[0] : undefined;

  return (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <Table hoverable>
        <Table.Head>
          {headerGroup && headerGroup.headers.map((header) => {
            const canSort = header.column.getCanSort();
            const isSorted = header.column.getIsSorted();

            return (
              <Table.HeadCell
                key={header.id}
                onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                className={`cursor-pointer select-none whitespace-nowrap px-4 py-3 ${
                  canSort ? 'hover:bg-gray-100 dark:hover:bg-gray-600' : ''
                }`}
              >
                <div className="flex items-center gap-1">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {canSort && (
                    <span className="flex flex-col ml-1">
                      <ChevronUp
                        className={`w-3 h-3 ${
                          isSorted === 'asc' ? 'text-gray-800' : 'text-gray-400'
                        }`}
                      />
                      <ChevronDown
                        className={`w-3 h-3 ${
                          isSorted === 'desc' ? 'text-gray-800' : 'text-gray-400'
                        }`}
                      />
                    </span>
                  )}
                </div>
              </Table.HeadCell>
            );
          })}
        </Table.Head>

        <Table.Body className="divide-y">
          {table.getRowModel().rows.map((row) => (
            <Table.Row 
              key={row.id} 
              className="bg-white dark:bg-gray-800 cursor-pointer"
              onClick={() => meta?.onView && handleRowClick(row.original)}
            >
              {row.getVisibleCells().map((cell, cellIndex) => {
                const cellContent = flexRender(cell.column.columnDef.cell, cell.getContext());

                return (
                  <Table.Cell key={cell.id} className="whitespace-nowrap px-4 py-3">
                    {cellIndex === 0 ? (
                      <EntityLink
                        type={getEntityType(entityType)}
                        id={row.original.id}
                        name={typeof cellContent === 'string' ? cellContent : row.original.name || 'Unknown'}
                      />
                    ) : (
                      cellContent
                    )}
                  </Table.Cell>
                );
              })}
            </Table.Row>
          ))}

          {data.length === 0 && (
            <Table.Row>
              <Table.Cell
                colSpan={columns.length}
                className="py-4 text-center text-gray-500 dark:text-gray-400"
              >
                No data available
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </div>
  );
}