import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar, Button } from 'flowbite-react';
import { Users, Building, GraduationCap, Home, LogOut, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DarkModeToggle } from './DarkModeToggle';
import { Breadcrumbs } from './ui/Breadcrumbs';

export function Layout() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar className="fixed left-0 top-0 h-full">
        <div className="flex items-center justify-between p-4">
          <span className="text-lg font-semibold">Skills Manager</span>
          <DarkModeToggle />
        </div>
        <Sidebar.Items>
          <Sidebar.ItemGroup>
            <Sidebar.Item icon={Home} onClick={() => navigate('/')} className="cursor-pointer">
              Dashboard
            </Sidebar.Item>
            <Sidebar.Item icon={Users} onClick={() => navigate('/users')} className="cursor-pointer">
              Users
            </Sidebar.Item>
            <Sidebar.Item icon={Building} onClick={() => navigate('/customers')} className="cursor-pointer">
              Customers
            </Sidebar.Item>
            <Sidebar.Item icon={GraduationCap} onClick={() => navigate('/skills')} className="cursor-pointer">
              Skills
            </Sidebar.Item>
          </Sidebar.ItemGroup>
          <Sidebar.ItemGroup>
            <Sidebar.Item icon={Settings} onClick={() => navigate('/settings')} className="cursor-pointer">
              Settings
            </Sidebar.Item>
            <Sidebar.Item icon={LogOut} onClick={handleSignOut} className="cursor-pointer text-red-500">
              Sign Out
            </Sidebar.Item>
          </Sidebar.ItemGroup>
        </Sidebar.Items>
      </Sidebar>
      <div className="flex-1 ml-64 p-8">
        <Breadcrumbs />
        <Outlet />
      </div>
    </div>
  );
}