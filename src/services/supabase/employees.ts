import { supabase } from './client';
import { Employee, Department, UUID } from '@/types';
import { logActivity } from './activity';

export async function getDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function getEmployees(includeInactive = false): Promise<Employee[]> {
  let query = supabase
    .from('employees')
    .select('*, department:departments(*)')
    .is('deleted_at', null)
    .order('name');

  if (!includeInactive) {
    query = query.eq('status', 'active');
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getEmployeeById(id: UUID): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*, department:departments(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createEmployee(employee: Partial<Employee>): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .insert([employee])
    .select('*, department:departments(*)')
    .single();

  if (error) throw error;

  await logActivity({
    event_type: 'employee_created',
    description: `Added employee ${data.name} (${data.designation})`,
    employee_id: data.id,
    new_value: data,
  });

  return data;
}

export async function updateEmployee(id: UUID, updates: Partial<Employee>): Promise<Employee> {
  const previous = await getEmployeeById(id);

  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select('*, department:departments(*)')
    .single();

  if (error) throw error;

  await logActivity({
    event_type: 'employee_updated',
    description: `Updated employee ${data.name}`,
    employee_id: id,
    previous_value: previous as unknown as Record<string, unknown>,
    new_value: data,
  });

  return data;
}

export async function deleteEmployee(id: UUID, soft = true): Promise<void> {
  const employee = await getEmployeeById(id);
  if (soft) {
    const { error } = await supabase
      .from('employees')
      .update({ deleted_at: new Date().toISOString(), status: 'inactive' })
      .eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  await logActivity({
    event_type: 'employee_updated',
    description: `Deactivated employee ${employee?.name || id}`,
    employee_id: id,
  });
}

