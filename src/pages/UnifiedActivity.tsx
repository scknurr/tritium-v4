import React from 'react';
import { Card } from 'flowbite-react';
import { UnifiedTimeline } from '../components/ui/UnifiedTimeline';
import { useUnifiedTimeline } from '../lib/useUnifiedTimeline';
import { useToast } from '../lib/hooks/useToast';

/**
 * Unified Activity Page showing a timeline of all activities across the platform
 */
export default function UnifiedActivityPage() {
  const toast = useToast();
  
  // Fetch all timeline events without entity filters
  const { 
    events, 
    loading, 
    error, 
    refresh 
  } = useUnifiedTimeline({
    limit: 50 // Show more events for a comprehensive view
  });
  
  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      await refresh();
      toast.success('The activity timeline has been updated with the latest events.');
    } catch (err) {
      toast.error('Could not refresh the timeline. Please try again.');
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Activity Timeline</h1>
      
      <p className="text-gray-600 mb-8">
        View a comprehensive timeline of all activities across the platform. This timeline 
        includes user actions, customer updates, skill applications, and more - all in one place.
      </p>
      
      <div className="grid gap-8">
        {/* Main timeline card */}
        <Card data-testid="flowbite-card" className="flex rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800 flex-col">
          <div className="flex h-full flex-col justify-center gap-4 p-6">
            <UnifiedTimeline
              title="Recent Activity"
              events={events}
              loading={loading}
              error={error}
              onRefresh={handleRefresh}
              emptyMessage="No activity recorded yet. Actions will appear here as they happen."
            />
          </div>
        </Card>
      </div>
    </div>
  );
} 