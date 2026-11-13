import { supabase } from './client';
import { AppSettings, Holiday } from '@/types';

export async function getAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    // Return default settings
    return {
      id: 'default',
      company_name: 'TeamFlow',
      department_name: 'Design Department',
      design_lead_name: 'Design Lead',
      working_hours_start: '09:00',
      working_hours_end: '18:00',
      working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      weekly_offs: ['sunday'],
      break_duration_minutes: 60,
      timezone: 'Asia/Kolkata',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return data;
}

export async function updateAppSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();

  if (current.id === 'default') {
    const { data, error } = await supabase
      .from('app_settings')
      .insert([updates])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('app_settings')
    .update(updates)
    .eq('id', current.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getHolidays(): Promise<Holiday[]> {
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .order('date');
  if (error) throw error;
  return data || [];
}

export async function addHoliday(holiday: { name: string; date: string; is_recurring?: boolean }): Promise<Holiday> {
  const { data, error } = await supabase
    .from('holidays')
    .insert([holiday])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteHoliday(id: string): Promise<void> {
  const { error } = await supabase.from('holidays').delete().eq('id', id);
  if (error) throw error;
}

