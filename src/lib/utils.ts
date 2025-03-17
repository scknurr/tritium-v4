import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility functions for the application
 */

// Date formatting
export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(dateString: string | Date): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formats a date as a relative time string (e.g., "just now", "5 minutes ago", "2 days ago").
 * For older dates (> 7 days), falls back to full date format.
 */
export function formatTimeAgo(date: string | Date) {
  if (!date) return '';
  
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  
  // Handle invalid dates
  if (isNaN(past.getTime())) return 'Invalid date';
  
  // Convert to seconds, minutes, hours, days
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Format based on how long ago
  if (diffSeconds < 5) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  
  // Fall back to standard date format for older dates
  return formatDateTime(date);
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

// Name formatting utilities
export function formatFullName(firstName: string | null | undefined, lastName: string | null | undefined, email: string | null | undefined): string {
  // Create full name from first and last name parts
  const nameArray: string[] = [];
  if (firstName) nameArray.push(firstName);
  if (lastName) nameArray.push(lastName);
  
  const fullName = nameArray.join(' ').trim();
  
  // Return full name or fallback to email or default
  return fullName || (email ?? '') || 'Unknown User';
}

export function parseFullNameToFirstLast(fullName: string = ''): { firstName: string, lastName: string } {
  if (!fullName || fullName.trim() === '') {
    return { firstName: '', lastName: '' };
  }
  
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0] || '', lastName: '' };
  }
  
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ');
  
  return { firstName, lastName };
}

// Safe value conversion
export function safeString(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

export function safeNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

// Object manipulation
export function omitKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

export function pickKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

// String manipulation
export function truncate(str: string, length: number = 100): string {
  if (!str) return '';
  if (str.length <= length) return str;
  return `${str.substring(0, length - 3)}...`;
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}