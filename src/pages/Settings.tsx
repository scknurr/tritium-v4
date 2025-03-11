import React, { useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Settings as SettingsIcon, Pencil, Plus } from 'lucide-react';
import { Button, Tabs } from 'flowbite-react';
import { DataTable } from '../components/ui/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { IndustryForm } from '../components/forms/IndustryForm';
import { SkillCategoryForm } from '../components/forms/SkillCategoryForm';
import { CustomerRoleForm } from '../components/forms/CustomerRoleForm';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { supabase } from '../lib/supabase';
import type { Industry, SkillCategory, CustomerRole } from '../types';

const industryHelper = createColumnHelper<Industry>();
const categoryHelper = createColumnHelper<SkillCategory>();
const roleHelper = createColumnHelper<CustomerRole>();

const industryColumns = [
  industryHelper.accessor('name', {
    header: () => 'Name',
  }),
  industryHelper.accessor('description', {
    header: () => 'Description',
    cell: info => info.getValue() || 'Not set',
  }),
  industryHelper.accessor('created_at', {
    header: () => 'Created',
    cell: info => new Date(info.getValue()).toLocaleDateString(),
  }),
  industryHelper.display({
    id: 'actions',
    header: () => 'Actions',
    cell: (info) => (
      <Button size="sm" onClick={() => info.table.options.meta?.onEdit(info.row.original)}>
        <Pencil className="h-4 w-4" />
      </Button>
    ),
  }),
];

const categoryColumns = [
  categoryHelper.accessor('name', {
    header: () => 'Name',
  }),
  categoryHelper.accessor('description', {
    header: () => 'Description',
    cell: info => info.getValue() || 'Not set',
  }),
  categoryHelper.accessor('created_at', {
    header: () => 'Created',
    cell: info => new Date(info.getValue()).toLocaleDateString(),
  }),
  categoryHelper.display({
    id: 'actions',
    header: () => 'Actions',
    cell: (info) => (
      <Button size="sm" onClick={() => info.table.options.meta?.onEdit(info.row.original)}>
        <Pencil className="h-4 w-4" />
      </Button>
    ),
  }),
];

const roleColumns = [
  roleHelper.accessor('name', {
    header: () => 'Name',
  }),
  roleHelper.accessor('description', {
    header: () => 'Description',
    cell: info => info.getValue() || 'Not set',
  }),
  roleHelper.accessor('created_at', {
    header: () => 'Created',
    cell: info => new Date(info.getValue()).toLocaleDateString(),
  }),
  roleHelper.display({
    id: 'actions',
    header: () => 'Actions',
    cell: (info) => (
      <Button size="sm" onClick={() => info.table.options.meta?.onEdit(info.row.original)}>
        <Pencil className="h-4 w-4" />
      </Button>
    ),
  }),
];

export function Settings() {
  const [isIndustryFormOpen, setIsIndustryFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<Partial<Industry>>({});
  const [selectedCategory, setSelectedCategory] = useState<Partial<SkillCategory>>({});
  const [selectedRole, setSelectedRole] = useState<Partial<CustomerRole>>({});

  const { data: industries, loading: industriesLoading, error: industriesError, refresh: refreshIndustries } = useSupabaseQuery<Industry>('industries', {
    orderBy: { column: 'name' },
  });

  const { data: categories, loading: categoriesLoading, error: categoriesError, refresh: refreshCategories } = useSupabaseQuery<SkillCategory>('skill_categories', {
    orderBy: { column: 'name' },
  });

  const { data: roles, loading: rolesLoading, error: rolesError, refresh: refreshRoles } = useSupabaseQuery<CustomerRole>('customer_roles', {
    orderBy: { column: 'name' },
  });

  const handleAddIndustry = () => {
    setSelectedIndustry({});
    setIsIndustryFormOpen(true);
  };

  const handleEditIndustry = (industry: Industry) => {
    setSelectedIndustry(industry);
    setIsIndustryFormOpen(true);
  };

  const handleSubmitIndustry = async (industryData: Partial<Industry>) => {
    try {
      if (industryData.id) {
        const { error } = await supabase
          .from('industries')
          .update(industryData)
          .eq('id', industryData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('industries')
          .insert([industryData]);
        if (error) throw error;
      }
      await refreshIndustries();
      setIsIndustryFormOpen(false);
    } catch (error) {
      console.error('Error saving industry:', error);
    }
  };

  const handleAddCategory = () => {
    setSelectedCategory({});
    setIsCategoryFormOpen(true);
  };

  const handleEditCategory = (category: SkillCategory) => {
    setSelectedCategory(category);
    setIsCategoryFormOpen(true);
  };

  const handleSubmitCategory = async (categoryData: Partial<SkillCategory>) => {
    try {
      if (categoryData.id) {
        const { error } = await supabase
          .from('skill_categories')
          .update(categoryData)
          .eq('id', categoryData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('skill_categories')
          .insert([categoryData]);
        if (error) throw error;
      }
      await refreshCategories();
      setIsCategoryFormOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleAddRole = () => {
    setSelectedRole({});
    setIsRoleFormOpen(true);
  };

  const handleEditRole = (role: CustomerRole) => {
    setSelectedRole(role);
    setIsRoleFormOpen(true);
  };

  const handleSubmitRole = async (roleData: Partial<CustomerRole>) => {
    try {
      if (roleData.id) {
        const { error } = await supabase
          .from('customer_roles')
          .update(roleData)
          .eq('id', roleData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customer_roles')
          .insert([roleData]);
        if (error) throw error;
      }
      await refreshRoles();
      setIsRoleFormOpen(false);
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        count={industries.length + categories.length + roles.length}
        icon={SettingsIcon}
        iconColor="text-gray-500"
        badgeColor="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      />

      <Tabs aria-label="Settings tabs">
        <Tabs.Item title="Industries">
          <div className="mt-4">
            <div className="mb-4 flex justify-end">
              <Button size="sm" onClick={handleAddIndustry}>
                <Plus className="h-4 w-4 mr-2" />
                Add Industry
              </Button>
            </div>
            <DataTable<Industry>
              data={industries}
              columns={industryColumns}
              loading={industriesLoading}
              error={industriesError}
              meta={{
                onEdit: handleEditIndustry,
              }}
            />
          </div>
        </Tabs.Item>
        <Tabs.Item title="Skill Categories">
          <div className="mt-4">
            <div className="mb-4 flex justify-end">
              <Button size="sm" onClick={handleAddCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
            <DataTable<SkillCategory>
              data={categories}
              columns={categoryColumns}
              loading={categoriesLoading}
              error={categoriesError}
              meta={{
                onEdit: handleEditCategory,
              }}
            />
          </div>
        </Tabs.Item>
        <Tabs.Item title="Customer Roles">
          <div className="mt-4">
            <div className="mb-4 flex justify-end">
              <Button size="sm" onClick={handleAddRole}>
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </div>
            <DataTable<CustomerRole>
              data={roles}
              columns={roleColumns}
              loading={rolesLoading}
              error={rolesError}
              meta={{
                onEdit: handleEditRole,
              }}
            />
          </div>
        </Tabs.Item>
      </Tabs>

      <IndustryForm
        industry={selectedIndustry}
        isOpen={isIndustryFormOpen}
        onClose={() => setIsIndustryFormOpen(false)}
        onSubmit={handleSubmitIndustry}
      />

      <SkillCategoryForm
        category={selectedCategory}
        isOpen={isCategoryFormOpen}
        onClose={() => setIsCategoryFormOpen(false)}
        onSubmit={handleSubmitCategory}
      />

      <CustomerRoleForm
        role={selectedRole}
        isOpen={isRoleFormOpen}
        onClose={() => setIsRoleFormOpen(false)}
        onSubmit={handleSubmitRole}
      />
    </div>
  );
}