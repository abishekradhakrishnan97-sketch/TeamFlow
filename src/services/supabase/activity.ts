import { supabase } from './client';
import { ActivityEvent, ActivityEventType, UUID } from '@/types';

export async function logActivity(params: {
  event_type: ActivityEventType;
  description: string;
  project_id?: UUID;
  task_id?: UUID;
  employee_id?: UUID;
  revision_id?: UUID;
  previous_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
}) {
  try {
    const { data, error } = await supabase
      .from('activity_events')
      .insert([params])
      .select()
      .single();

    if (error) {
      console.warn('Failed to log activity event:', error.message);
      return null;
    }
    return data as ActivityEvent;
  } catch (err) {
    console.warn('Failed to log activity event (exception):', err);
    return null;
  }
}

export async function getActivityEvents(options?: {
  project_id?: UUID;
  employee_id?: UUID;
  task_id?: UUID;
  limit?: number;
}) {
  let query = supabase
    .from('activity_events')
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.project_id) {
    query = query.eq('project_id', options.project_id);
  }
  if (options?.employee_id) {
    query = query.eq('employee_id', options.employee_id);
  }
  if (options?.task_id) {
    query = query.eq('task_id', options.task_id);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  } else {
    query = query.limit(100);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ActivityEvent[];
}

