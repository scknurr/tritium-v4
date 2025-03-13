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

export interface SkillApplication {
  id: number;
  user_id: string;
  skill_id: number;
  skill_name?: string;
  customer_id: number;
  customer_name?: string;
  proficiency: string;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerSkillApplication extends SkillApplication {
  user_name?: string;
}

// ... rest of the types file remains unchanged