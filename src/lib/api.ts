/**
 * Standardized API functions for Tritium v4
 * This file contains all API functions for interacting with the backend
 */
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { SkillApplication, ApiError } from '../types';

export type QueryOptions = {
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  filter?: { column: string; value: any };
} | null;

/**
 * Standardized API error type definition
 */
export type ApiErrorType = PostgrestError & {
  message: string;
};

/**
 * Generic fetch data function
 * Uses consistent error handling and return types
 */
export async function fetchData<T>(
  table: string,
  options: QueryOptions = null
): Promise<T[]> {
  try {
    let query = supabase.from(table).select(options?.select || '*');

    if (options?.filter) {
      query = query.eq(options.filter.column, options.filter.value);
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? false,
      });
    }

    const { data, error } = await query;

    if (error) throw error;

    // Type assertion to maintain compatibility while ensuring type safety
    return (data || []) as T[];
  } catch (err) {
    console.error(`Error in fetchData(${table}):`, err);
    throw err;
  }
}

/**
 * Standardized create data function
 */
export async function createData<T>(
  table: string,
  data: Partial<T>
): Promise<T> {
  try {
    const { data: createdData, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    return createdData as T;
  } catch (err) {
    console.error(`Error in createData(${table}):`, err);
    throw err;
  }
}

/**
 * Standardized update data function
 */
export async function updateData<T>(
  table: string,
  id: string | number,
  data: Partial<T>
): Promise<T> {
  try {
    const { data: updatedData, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return updatedData as T;
  } catch (err) {
    console.error(`Error in updateData(${table}):`, err);
    throw err;
  }
}

/**
 * Standardized delete data function
 */
export async function deleteData(
  table: string,
  id: string | number
): Promise<void> {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);

    if (error) throw error;
  } catch (err) {
    console.error(`Error in deleteData(${table}):`, err);
    throw err;
  }
}

/**
 * Standardized fetch related data function
 */
export async function fetchRelatedData<T>(
  table: string,
  column: string,
  value: any,
  select: string = '*'
): Promise<T[]> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .eq(column, value);

    if (error) throw error;

    // Type assertion to maintain compatibility while ensuring type safety
    return (data || []) as T[];
  } catch (err) {
    console.error(`Error in fetchRelatedData(${table}):`, err);
    throw err;
  }
}

/**
 * Standardized fetch entity by ID function
 */
export async function fetchEntityById<T>(
  table: string,
  id: string | number,
  select: string = '*'
): Promise<T> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .eq('id', id)
      .single();

    if (error) throw error;

    return data as T;
  } catch (err) {
    console.error(`Error in fetchEntityById(${table}):`, err);
    throw err;
  }
}

interface UserRelation {
  id: string;
  email: string;
}

interface SkillRelation {
  id: number;
  name: string;
}

interface CustomerRelation {
  id: number;
  name: string;
}

interface SupabaseSkillApplication {
  id: number;
  user_id: string;
  skill_id: number;
  customer_id: number;
  proficiency: number;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  skill: { id: number; name: string; }[];
  user: { id: string; email: string; }[];
  customer: { id: number; name: string; }[];
}

interface SkillApplicationResponse extends SupabaseSkillApplication {
  skill_name: string;
  user_name: string;
  customer_name: string;
}

/**
 * Get all skill applications for a user
 * Uses standardized query format with consistent foreign key syntax
 */
export const getUserSkillApplications = async (userId: string): Promise<SkillApplicationResponse[]> => {
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
        skill:skills(id, name),
        user:user_id(id, email),
        customer:customers(id, name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Type assertion and data transformation
    return (data as SupabaseSkillApplication[]).map(app => ({
      ...app,
      skill_name: app.skill[0]?.name || 'Unknown Skill',
      user_name: app.user[0]?.email || 'Unknown User',
      customer_name: app.customer[0]?.name || 'Unknown Customer'
    }));
  } catch (err) {
    console.error('Error in getUserSkillApplications:', err);
    throw err;
  }
};

/**
 * Get all skill applications for a customer
 * Uses standardized query format with consistent foreign key syntax
 */
export const getCustomerSkillApplications = async (customerId: number): Promise<SkillApplicationResponse[]> => {
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
        skill:skills(id, name),
        user:auth_users!user_id(id, email),
        customer:customers(id, name)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Type assertion and data transformation
    return (data as SupabaseSkillApplication[]).map(app => ({
      ...app,
      skill_name: app.skill[0]?.name || 'Unknown Skill',
      user_name: app.user[0]?.email || 'Unknown User',
      customer_name: app.customer[0]?.name || 'Unknown Customer'
    }));
  } catch (err) {
    console.error('Error in getCustomerSkillApplications:', err);
    throw err;
  }
};

/**
 * Get a single skill application by ID
 * Uses standardized query format with consistent foreign key syntax
 */
export const getSkillApplication = async (id: number): Promise<SkillApplicationResponse> => {
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
        skill:skills(id, name),
        user:user_id(id, email),
        customer:customers(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Type assertion and data transformation
    const rawApp = data as SupabaseSkillApplication;
    return {
      ...rawApp,
      skill_name: rawApp.skill[0]?.name || 'Unknown Skill',
      user_name: rawApp.user[0]?.email || 'Unknown User',
      customer_name: rawApp.customer[0]?.name || 'Unknown Customer'
    };
  } catch (err) {
    console.error('Error in getSkillApplication:', err);
    throw err;
  }
};

/**
 * Get all skill applications for a skill
 * Uses standardized query format with consistent foreign key syntax
 */
export const getSkillApplicationsBySkill = async (skillId: number): Promise<SkillApplicationResponse[]> => {
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
        skill:skills(id, name),
        user:user_id(id, email),
        customer:customers(id, name)
      `)
      .eq('skill_id', skillId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Type assertion and data transformation
    return (data as SupabaseSkillApplication[]).map(app => ({
      ...app,
      skill_name: app.skill[0]?.name || 'Unknown Skill',
      user_name: app.user[0]?.email || 'Unknown User',
      customer_name: app.customer[0]?.name || 'Unknown Customer'
    }));
  } catch (err) {
    console.error('Error in getSkillApplicationsBySkill:', err);
    throw err;
  }
};

/**
 * Create a new skill application
 * Validates data before submission
 */
export const createSkillApplication = async (skillApplication: Omit<SkillApplication, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    // Standardized data validation
    if (!skillApplication.user_id || !skillApplication.skill_id || !skillApplication.customer_id) {
      throw new Error('Missing required fields: user_id, skill_id, and customer_id are required');
    }

    const { data, error } = await supabase
      .from('skill_applications')
      .insert(skillApplication)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error('Error in createSkillApplication:', err);
    throw err;
  }
};

/**
 * Update an existing skill application
 */
export const updateSkillApplication = async (id: number, updates: Partial<Omit<SkillApplication, 'id' | 'created_at' | 'updated_at'>>) => {
  try {
    const { data, error } = await supabase
      .from('skill_applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error('Error in updateSkillApplication:', err);
    throw err;
  }
};

/**
 * Delete a skill application
 */
export const deleteSkillApplication = async (id: number) => {
  try {
    const { error } = await supabase
      .from('skill_applications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    console.error('Error in deleteSkillApplication:', err);
    throw err;
  }
};

/**
 * Standardized query wrapper function
 */
export async function query<T>(
  query: Promise<{
    data: T | null;
    error: PostgrestError | null;
  }>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await query;
    return { data, error: error ? error.message : null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}