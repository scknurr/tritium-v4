import { FilterOption } from '../components/ui/EntityFilter';

export const USER_FILTERS: FilterOption[] = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'most_customers', label: 'Most Customers' },
  { value: 'fewest_customers', label: 'Fewest Customers' },
  { value: 'most_skills', label: 'Most Skills' },
  { value: 'fewest_skills', label: 'Fewest Skills' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' }
];

export const CUSTOMER_FILTERS: FilterOption[] = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'largest_team', label: 'Largest Team' },
  { value: 'smallest_team', label: 'Smallest Team' },
  { value: 'most_skills', label: 'Most Skills' },
  { value: 'fewest_skills', label: 'Fewest Skills' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' }
];

export const SKILL_FILTERS: FilterOption[] = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'most_customers', label: 'Most Customers' },
  { value: 'fewest_customers', label: 'Fewest Customers' },
  { value: 'most_users', label: 'Most Users' },
  { value: 'fewest_users', label: 'Fewest Users' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' }
];