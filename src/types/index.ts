export interface Customer {
  id: number;
  name: string;
  description?: string | null;
  website: string | null;
  status: string;
  industry_id: number | null;
  industry?: {
    id: number;
    name: string;
  };
  created_at: string;
}

export interface Skill {
  id: number;
  name: string;
  description?: string | null;
  category_id: number | null;
  category?: {
    id: number;
    name: string;
  };
  created_at: string;
}

// ... rest of the types file remains unchanged