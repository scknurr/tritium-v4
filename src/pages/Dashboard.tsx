import React from 'react';
import { Users, Building, GraduationCap, Clock, ChevronRight, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { ContentCard } from '../components/ui/ContentCard';
import { DetailCard } from '../components/ui/DetailCard';
import { RandomQuote } from '../components/ui/QuoteGenerator';
import { UnifiedTimeline } from '../components/ui/UnifiedTimeline';
import { useUnifiedTimeline } from '../lib/useUnifiedTimeline';
import { EntityLink } from '../components/ui/EntityLink';
import type { Customer, Skill } from '../types';
import { Button } from 'flowbite-react';

// Define the Profile interface locally since it's not exported from types
interface Profile {
  id: string;
  full_name?: string | null;
  email?: string;
}

// Define entity type to ensure type safety
type EntityType = 'user' | 'customer' | 'skill' | 'application' | 'role';

// Define relationship structure
interface Relationship {
  label: string;
  count: number;
  entityType: EntityType;
}

// Define card data structure
interface DashboardCard {
  title: string;
  description: string;
  icon: LucideIcon;
  entityType: EntityType;
  link: string;
  count: number;
  relationships: Relationship[];
}

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

  // Fetch unified timeline events for the dashboard
  const { events: timelineEvents, loading: timelineLoading, error: timelineError, refresh: refreshTimeline } = useUnifiedTimeline({
    limit: 10 // Limit to 10 events for the dashboard
  });

  const cards: DashboardCard[] = [
    {
      title: 'Users',
      description: 'Manage user profiles and their skills',
      icon: Users,
      entityType: 'user',
      link: '/users',
      count: users.length,
      relationships: [
        {
          label: 'Customer Assignments',
          count: userCustomers.length,
          entityType: 'customer'
        },
        {
          label: 'Skills',
          count: userSkills.length,
          entityType: 'skill'
        }
      ]
    },
    {
      title: 'Customers',
      description: 'Track customer information and relationships',
      icon: Building,
      entityType: 'customer',
      link: '/customers',
      count: customers.length,
      relationships: [
        {
          label: 'Team Members',
          count: userCustomers.length,
          entityType: 'user'
        },
        {
          label: 'Required Skills',
          count: customerSkills.length,
          entityType: 'skill'
        }
      ]
    },
    {
      title: 'Skills',
      description: 'Maintain skill categories and assignments',
      icon: GraduationCap,
      entityType: 'skill',
      link: '/skills',
      count: skills.length,
      relationships: [
        {
          label: 'Users',
          count: userSkills.length,
          entityType: 'user'
        },
        {
          label: 'Customers',
          count: customerSkills.length,
          entityType: 'customer'
        }
      ]
    },
  ];

  // Helper function to get entity color classes
  const getEntityColorClass = (entityType: EntityType) => {
    switch (entityType) {
      case 'user': return 'text-blue-600';
      case 'customer': return 'text-green-600';
      case 'skill': return 'text-purple-600';
      case 'application': return 'text-indigo-600';
      case 'role': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <ContentCard className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome to Tritium</h1>
            <p className="text-blue-100 text-lg">
              Manage your users, customers, and skills from one central location.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button color="light" size="md" as={Link} to="/activity">
              <Activity className="h-4 w-4 mr-2" />
              View Activity
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </ContentCard>

      {/* Daily Inspiration Quote */}
      <ContentCard>
        <RandomQuote />
      </ContentCard>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.title} className="group">
            <DetailCard
              title={card.title}
              entityType={card.entityType}
              icon={card.icon}
              actions={[
                { 
                  label: "View All", 
                  href: card.link,
                  icon: ChevronRight,
                  variant: "primary"
                }
              ]}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {card.description}
                  </p>
                  <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-opacity-10 bg-blue-100 dark:bg-blue-900">
                    {card.count}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  {card.relationships.map((rel, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {rel.label}
                      </span>
                      <span className={`font-medium ${getEntityColorClass(rel.entityType)}`}>
                        {rel.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </DetailCard>
          </div>
        ))}
      </div>

      {/* Recent Activity Timeline */}
      <DetailCard
        title="Recent Activity"
        entityType="application"
        icon={Clock}
        actions={[{ label: "View All", href: "/activity", icon: ChevronRight }]}
      >
        <UnifiedTimeline
          title="Recent Activity"
          events={timelineEvents}
          loading={timelineLoading}
          error={timelineError}
          showHeader={false}
          onRefresh={refreshTimeline}
          emptyMessage="No activity recorded yet. Actions will appear here as they happen."
        />
      </DetailCard>
    </div>
  );
}