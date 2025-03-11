import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Auth } from './components/Auth';
import { Users } from './pages/Users';
import { Customers } from './pages/Customers';
import { Skills } from './pages/Skills';
import { Settings } from './pages/Settings';
import { Dashboard } from './pages/Dashboard';
import { UserDetail } from './pages/detail/UserDetail';
import { CustomerDetail } from './pages/detail/CustomerDetail';
import { SkillDetail } from './pages/detail/SkillDetail';
import { supabase } from './lib/supabase';
import { useDarkMode } from './hooks/useDarkMode';
import type { User } from '@supabase/supabase-js';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize dark mode
  useDarkMode();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          <Route path="*" element={<Auth />} />
        ) : (
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={
              <CustomerDetail />
            } />
            <Route path="skills" element={<Skills />} />
            <Route path="skills/:id" element={
              <SkillDetail />
            } />
            <Route path="settings" element={<Settings />} />
            {/* Redirect invalid skill UUIDs to users */}
            <Route path="skills/:id" element={
              <Navigate to="/users/:id" replace />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;