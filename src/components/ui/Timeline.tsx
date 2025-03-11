import React from 'react';
import { Clock, Users, Building, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQueryWithCache } from '../../lib/hooks/useQueryWithCache';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import { queryKeys } from '../../lib/queryKeys';
import { formatDateTime } from '../../lib/utils';
import type { Profile, Customer, Skill } from '../../types';
import type { LucideIcon } from 'lucide-react';

interface TimelineItem {
  id: number;
  event_type: string;
  description: string;
  event_time: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
}

interface TimelineProps {
  title: string;
  icon: LucideIcon;
  items: TimelineItem[];
  loading?: boolean;
  entityType?: string;
  entityId?: string | number;
  onUpdate?: () => void;
}

export function Timeline({
  title,
  icon: Icon,
  items,
  loading = false,
  entityType,
  entityId,
  onUpdate
}: TimelineProps) {
  useRealtimeSubscription({
    table: 'audit_logs',
    filter: entityType && entityId ? {
      filter: `entity_type=eq.${entityType},entity_id=eq.${entityId}`
    } : undefined,
    onUpdate
  });

  // Filter and sort items
  const filteredItems = items
    .filter(item => {
      if (!entityType || !entityId) return true;
      return item.entity_type === entityType && String(item.entity_id) === String(entityId);
    })
    .sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime());

  // Get unique IDs for related entities
  const userIds = [...new Set(filteredItems.map(item => item.user_id))];
  const entityIds = filteredItems.map(item => item.entity_id);
  const numericIds = entityIds.filter(id => !isNaN(Number(id))).map(Number);
  const uuidIds = entityIds.filter(id => isNaN(Number(id)));

  // Fetch related entities
  const { data: users = [] } = useQueryWithCache<Profile>(
    queryKeys.profiles.list(),
    'profiles',
    userIds.length > 0 ? {
      select: 'id, full_name, email',
      filter: { column: 'id', value: userIds }
    } : null
  );

  const { data: customers = [] } = useQueryWithCache<Customer>(
    queryKeys.customers.list(),
    'customers',
    numericIds.length > 0 ? {
      select: 'id, name',
      filter: { column: 'id', value: numericIds }
    } : null
  );

  const { data: skills = [] } = useQueryWithCache<Skill>(
    queryKeys.skills.list(),
    'skills',
    numericIds.length > 0 ? {
      select: 'id, name',
      filter: { column: 'id', value: numericIds }
    } : null
  );

  const { data: profiles = [] } = useQueryWithCache<Profile>(
    queryKeys.profiles.list(),
    'profiles',
    uuidIds.length > 0 ? {
      select: 'id, full_name, email',
      filter: { column: 'id', value: uuidIds }
    } : null
  );

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'profiles':
        return Users;
      case 'customers':
        return Building;
      case 'skills':
        return GraduationCap;
      default:
        return Clock;
    }
  };

  const getEntityColor = (type: string) => {
    switch (type) {
      case 'profiles':
        return 'text-blue-500';
      case 'customers':
        return 'text-green-500';
      case 'skills':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  const getEntityLink = (type: string, id: string) => {
    switch (type) {
      case 'profiles':
        return `/users/${id}`;
      case 'customers':
        return `/customers/${id}`;
      case 'skills':
        return `/skills/${id}`;
      default:
        return '#';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-4 h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5" />
        {title}
      </h2>
      <ol className="relative border-l border-gray-200 dark:border-gray-700">
        {filteredItems.map((item) => {
          const ActionIcon = getEntityIcon(item.entity_type);
          const actionColor = getEntityColor(item.entity_type);
          const user = users.find(u => u.id === item.user_id);
          
          return (
            <li key={item.id} className="mb-10 ml-4">
              <div className="absolute w-3 h-3 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700"></div>
              <time className="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
                {formatDateTime(item.event_time)}
              </time>
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <Link 
                    to={`/users/${user?.id}`} 
                    className="text-blue-500 hover:underline"
                  >
                    {user?.full_name || user?.email || item.user_id}
                  </Link>
                  <ActionIcon className={`w-4 h-4 ${actionColor}`} />
                  <Link 
                    to={getEntityLink(item.entity_type, item.entity_id)}
                    className={`${actionColor} hover:underline`}
                  >
                    {item.entity_type}
                  </Link>
                </div>
                <p className="text-base font-normal text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            </li>
          );
        })}
        {filteredItems.length === 0 && (
          <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
            <Clock className="w-5 h-5 mr-2" />
            No activity recorded yet
          </div>
        )}
      </ol>
    </>
  );
}