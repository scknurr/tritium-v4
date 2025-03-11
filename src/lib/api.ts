import { supabase } from './supabase';
import type { PostgrestError } from '@supabase/supabase-js';

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