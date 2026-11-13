import { supabase } from './client';
import { Employee, Department, UUID } from '@/types';
import { logActivity } from './activity';

export const DESIGN_LEAD_EMPLOYEE_ID = '00000000-0000-0000-0000-000000000099';

export const DESIGN_LEAD_FALLBACK: Employee = {
  id: DESIGN_LEAD_EMPLOYEE_ID,
  name: 'Abishek',
  designation: 'Design Lead',
  initials: 'AB',
  status: 'active',
  email: 'lead@designteam.com',
  notes: 'Design Lead & Principal Product Architect (Administrator + Employee)',
  is_lead: true,
  created_at: '2026-11-01T00:00:00.000Z',
  updated_at: '2026-11-01T00:00:00.000Z',
};

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
  if (error) {
    console.warn('getEmployees query caught error:', error.message);
  }

  let list = (data || []) as Employee[];

  // Guarantee Abishek (Design Lead) is always present and active
  const hasLead = list.some(
    (e) =>
      e.name.toLowerCase().includes('abishek') ||
      e.designation.toLowerCase().includes('design lead') ||
      e.id === DESIGN_LEAD_EMPLOYEE_ID
  );

  if (!hasLead) {
    try {
      const depts = await getDepartments();
      const designDept = depts.find((d) => d.name.toLowerCase().includes('design')) || depts[0];
      const leadPayload: Employee = {
        ...DESIGN_LEAD_FALLBACK,
        department_id: designDept?.id,
        department: designDept,
      };

      // Asynchronously attempt to sync into database without blocking
      supabase
        .from('employees')
        .insert([
          {
            id: DESIGN_LEAD_EMPLOYEE_ID,
            name: leadPayload.name,
            designation: leadPayload.designation,
            department_id: designDept?.id,
            initials: leadPayload.initials,
            status: leadPayload.status,
            email: leadPayload.email,
            notes: leadPayload.notes,
            is_lead: true,
          },
        ])
        .then(({ error: insertErr }) => {
          if (insertErr) {
            console.warn('Auto-provisioning Abishek in employees table notice:', insertErr.message);
          }
        });

      list = [leadPayload, ...list];
    } catch {
      list = [DESIGN_LEAD_FALLBACK, ...list];
    }
  }

  return list;
}

export async function getDesignLeadEmployee(): Promise<Employee> {
  const emps = await getEmployees(true);
  const lead = emps.find(
    (e) =>
      e.name.toLowerCase().includes('abishek') ||
      e.designation.toLowerCase().includes('design lead') ||
      e.is_lead ||
      e.id === DESIGN_LEAD_EMPLOYEE_ID
  );
  return lead || DESIGN_LEAD_FALLBACK;
}

export async function getEmployeeById(id: UUID): Promise<Employee | null> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*, department:departments(*)')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      return data as Employee;
    }
    if (error) {
      console.warn('getEmployeeById join query failed, falling back:', error.message);
    }
  } catch (err) {
    console.warn('getEmployeeById join query threw exception:', err);
  }

  // Fallback query without complex join
  try {
    const { data: base, error: baseErr } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (baseErr || !base) {
      if (id === DESIGN_LEAD_EMPLOYEE_ID || id.toLowerCase().includes('abishek')) {
        return DESIGN_LEAD_FALLBACK;
      }
      console.error('getEmployeeById fallback error or not found:', baseErr);
      return null;
    }

    let department = null;
    if (base.department_id) {
      try {
        const { data: deptData } = await supabase
          .from('departments')
          .select('*')
          .eq('id', base.department_id)
          .maybeSingle();
        department = deptData || null;
      } catch {
        // Safe to ignore
      }
    }

    return {
      ...base,
      department,
    } as Employee;
  } catch (fallbackErr) {
    console.error('getEmployeeById complete failure:', fallbackErr);
    return null;
  }
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

