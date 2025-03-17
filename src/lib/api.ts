import { supabase } from './supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Customer, Skill, SkillApplication } from '../types';

export type QueryOptions = {
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  filter?: { column: string; value: any };
} | null;

export type ApiError = PostgrestError & {
  message: string;
};

export async function fetchData<T>(
  table: string,
  options: QueryOptions = null
): Promise<T[]> {
  if (!options) {
    return [];
  }

  let query = supabase.from(table).select(options.select || '*');

  if (options.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? false,
    });
  }

  if (options.filter) {
    const { column, value } = options.filter;
    
    if (Array.isArray(value)) {
      query = query.in(column, value);
    } else {
      query = query.eq(column, value);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createData<T>(
  table: string,
  data: Partial<T>
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .insert([data])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return result;
}

export async function updateData<T>(
  table: string,
  id: string | number,
  data: Partial<T>
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return result;
}

export async function deleteData(
  table: string,
  id: string | number
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}

export async function fetchRelatedData<T>(
  table: string,
  column: string,
  value: any,
  select: string = '*'
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq(column, value);

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchEntityById<T>(
  table: string,
  id: string | number,
  select: string = '*'
): Promise<T> {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Skill Applications API
export const getUserSkillApplications = async (userId: string) => {
  const { data, error } = await supabase
    .rpc('get_user_skill_applications', { p_user_id: userId });
  
  if (error) throw error;
  return data;
};

export const getCustomerSkillApplications = async (customerId: number) => {
  const { data, error } = await supabase
    .rpc('get_customer_skill_applications', { p_customer_id: customerId });
  
  if (error) throw error;
  return data;
};

export const createSkillApplication = async (skillApplication: Omit<SkillApplication, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('skill_applications')
    .insert(skillApplication)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateSkillApplication = async (id: number, updates: Partial<Omit<SkillApplication, 'id' | 'created_at' | 'updated_at'>>) => {
  const { data, error } = await supabase
    .from('skill_applications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteSkillApplication = async (id: number) => {
  const { error } = await supabase
    .from('skill_applications')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

export const getSkillApplication = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from('skill_applications')
      .select(`
        id,
        user_id,
        skill_id,
        customer_id,
        proficiency,
        start_date,
        end_date,
        notes,
        created_at,
        updated_at,
        skills:skill_id(id, name),
        customers:customer_id(id, name),
        profiles:user_id(id, full_name)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (data) {
      // Safely extract names from potentially undefined objects
      const skillName = data.skills && typeof data.skills === 'object' ? data.skills.name : undefined;
      const customerName = data.customers && typeof data.customers === 'object' ? data.customers.name : undefined;
      const userName = data.profiles && typeof data.profiles === 'object' ? data.profiles.full_name : undefined;
      
      return {
        ...data,
        skill_name: skillName,
        customer_name: customerName,
        user_name: userName
      };
    }
    
    return null;
  } catch (err) {
    console.error('Error fetching skill application:', err);
    throw err;
  }
};

export async function query<T>(
  query: Promise<{
    data: T | null;
    error: PostgrestError | null;
  }>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await query;
    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}