import React from 'react';
import { Card } from 'flowbite-react';
import { Users, Building, GraduationCap, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { Timeline } from '../components/ui/Timeline';
import type { Profile, Customer, Skill } from '../types';

export function Dashboard() {
  // Fetch counts for each entity type
  const { data: users } = useSupabaseQuery<Profile>('profiles', {
    select: 'id'
  });

  const { data: customers } = useSupabaseQuery<Customer>('customers', {
    select: 'id'
  });

  const { data: skills } = useSupabaseQuery<Skill>('skills', {
    select: 'id'
  });

  // Fetch relationship counts
  const { data: userCustomers } = useSupabaseQuery('user_customers', {
    select: 'id'
  });

  const { data: userSkills } = useSupabaseQuery('user_skills', {
    select: 'id'
  });

  const { data: customerSkills } = useSupabaseQuery('customer_skills', {
    select: 'id'
  });

  // Fetch all audit logs for the combined timeline
  const { data: timeline } = useSupabaseQuery('audit_logs', {
    orderBy: { column: 'event_time', ascending: false }
  });

  const cards = [
    {
      title: 'Users',
      description: 'Manage user profiles and their skills',
      icon: Users,
      color: 'text-blue-500',
      link: '/users',
      count: users.length,
      relationships: [
        {
          label: 'Customer Assignments',
          count: userCustomers.length,
          color: 'text-green-500'
        },
        {
          label: 'Skills',
          count: userSkills.length,
          color: 'text-purple-500'
        }
      ]
    },
    {
      title: 'Customers',
      description: 'Track customer information and relationships',
      icon: Building,
      color: 'text-green-500',
      link: '/customers',
      count: customers.length,
      relationships: [
        {
          label: 'Team Members',
          count: userCustomers.length,
          color: 'text-blue-500'
        },
        {
          label: 'Required Skills',
          count: customerSkills.length,
          color: 'text-purple-500'
        }
      ]
    },
    {
      title: 'Skills',
      description: 'Maintain skill categories and assignments',
      icon: GraduationCap,
      color: 'text-purple-500',
      link: '/skills',
      count: skills.length,
      relationships: [
        {
          label: 'Users',
          count: userSkills.length,
          color: 'text-blue-500'
        },
        {
          label: 'Customers',
          count: customerSkills.length,
          color: 'text-green-500'
        }
      ]
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to Skill Customer Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your users, customers, and skills from one central location.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} to={card.link}>
              <Card className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${card.color} bg-opacity-10`}>
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {card.title}
                        </h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${card.color} bg-opacity-10`}>
                          {card.count}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                    {card.relationships.map((rel, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {rel.label}
                        </span>
                        <span className={`font-medium ${rel.color}`}>
                          {rel.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <Timeline
          title="Recent Activity"
          icon={Clock}
          items={timeline}
        />
      </Card>
    </div>
  );
}