import React from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import type { Customer, Profile, Skill } from '../../types';

export function Breadcrumbs() {
  const location = useLocation();
  const params = useParams();
  const paths = location.pathname.split('/').filter(Boolean);

  // Fetch entity details if we're on a detail page
  const { data: profiles } = useSupabaseQuery<Profile>(
    'profiles',
    params.id && paths[0] === 'users' ? { filter: { column: 'id', value: params.id } } : null
  );

  const { data: customers } = useSupabaseQuery<Customer>(
    'customers',
    params.id && paths[0] === 'customers' ? { filter: { column: 'id', value: params.id } } : null
  );

  const { data: skills } = useSupabaseQuery<Skill>(
    'skills',
    params.id && paths[0] === 'skills' ? { filter: { column: 'id', value: params.id } } : null
  );

  // Generate breadcrumb items
  const getBreadcrumbs = () => {
    const items = [
      {
        name: 'Home',
        path: '/',
        icon: Home
      }
    ];

    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      
      // Handle entity detail pages
      if (params.id && index === 1) {
        let entityName = 'Loading...';
        
        if (path === params.id) {
          switch (paths[0]) {
            case 'users':
              entityName = profiles?.[0]?.full_name || profiles?.[0]?.email || params.id;
              break;
            case 'customers':
              entityName = customers?.[0]?.name || params.id;
              break;
            case 'skills':
              entityName = skills?.[0]?.name || params.id;
              break;
          }
        }
        
        items.push({
          name: entityName,
          path: currentPath
        });
      } else {
        items.push({
          name: path.charAt(0).toUpperCase() + path.slice(1),
          path: currentPath
        });
      }
    });

    return items;
  };

  const breadcrumbs = getBreadcrumbs();

  if (location.pathname === '/') return null;

  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbs.map((item, index) => (
          <li key={item.path} className="inline-flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
            )}
            <Link
              to={item.path}
              className={`inline-flex items-center text-sm font-medium ${
                index === breadcrumbs.length - 1
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              {item.icon && <item.icon className="w-4 h-4 mr-2" />}
              {item.name}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}