import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar, Button } from 'flowbite-react';
import { Users, Building, GraduationCap, Home, LogOut, Settings, Terminal, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DarkModeToggle } from './DarkModeToggle';
import { Breadcrumbs } from './ui/Breadcrumbs';
import { ConsoleViewer } from './debug/ConsoleViewer';

export function Layout() {
  const navigate = useNavigate();
  const [showConsole, setShowConsole] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const toggleConsole = () => {
    setShowConsole(!showConsole);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar className="fixed left-0 top-0 h-full">
        <div className="flex items-center justify-between p-4">


          <div className="flex h-14 items-center border-b border-gray-200 px-3 dark:border-gray-800"><a className="flex items-center" href="/"><svg viewBox="0 0 90 78.9" className="h-7 w-7 mr-2" xmlns="http://www.w3.org/2000/svg"><path d="M77.9,11.2L71.4,0c-7.8,4.4-16.8,6.9-26.4,6.9S26.4,4.4,18.6,0l-6.5,11.2c9.7,5.5,21,8.7,32.9,8.7s23.2-3.2,32.9-8.7Z" className="text-purple-600 dark:text-purple-400" fill="currentColor"></path><path d="M90,32.2l-6.5-11.2c-20,11.6-33.5,33.2-33.5,58h13c0-20,10.9-37.4,27-46.8Z" className="text-blue-600 dark:text-blue-400" fill="currentColor"></path><path d="M6.5,20.9L0,32.2c16.1,9.3,27,26.8,27,46.8h13c0-24.8-13.5-46.4-33.5-58Z" className="text-green-600 dark:text-green-400" fill="currentColor"></path></svg><h1 className="oxanium-logo text-lg font-bold bg-gradient-to-r from-green-500 via-blue-500 
                           via-indigo-500 to-purple-500 to-pink-500 bg-clip-text text-transparent">tritium</h1></a></div>
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
            <Sidebar.Item icon={Clock} onClick={() => navigate('/activity')} className="cursor-pointer">
              Activity
            </Sidebar.Item>
          </Sidebar.ItemGroup>
          <Sidebar.ItemGroup>
            <Sidebar.Item icon={Settings} onClick={() => navigate('/settings')} className="cursor-pointer">
              Settings
            </Sidebar.Item>
            <Sidebar.Item icon={Terminal} onClick={toggleConsole} className="cursor-pointer text-blue-500">
              Console Logs
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
      
      {/* Console Viewer */}
      <ConsoleViewer isOpen={showConsole} onClose={() => setShowConsole(false)} />
    </div>
  );
}