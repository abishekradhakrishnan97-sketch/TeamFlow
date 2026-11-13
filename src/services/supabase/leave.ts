import { supabase } from './client';
import { LeaveRecord, UUID, LeaveApprovalStatus, LeaveCategory } from '@/types';
import { logActivity } from './activity';

export async function getLeaveRecords(options?: {
  employeeId?: UUID;
  status?: LeaveApprovalStatus;
  startDate?: string;
  endDate?: string;
}): Promise<LeaveRecord[]> {
  let query = supabase
    .from('leave_records')
    .select('*, employee:employees(*)')
    .order('start_date', { ascending: false });

  if (options?.employeeId) query = query.eq('employee_id', options.employeeId);
  if (options?.status) query = query.eq('approval_status', options.status);
  if (options?.startDate) query = query.gte('end_date', options.startDate);
  if (options?.endDate) query = query.lte('start_date', options.endDate);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createLeaveRecord(record: {
  employee_id: UUID;
  category: LeaveCategory;
  start_date: string;
  end_date: string;
  num_days: number;
  reason?: string;
  approval_status?: LeaveApprovalStatus;
  remarks?: string;
}): Promise<LeaveRecord> {
  const { data, error } = await supabase
    .from('leave_records')
    .insert([
      {
        ...record,
        approval_status: record.approval_status || 'approved', // Design Lead records approved leave directly
      },
    ])
    .select('*, employee:employees(*)')
    .single();

  if (error) throw error;

  await logActivity({
    event_type: 'leave_created',
    description: `Recorded ${record.category.replace('_', ' ')} (${record.num_days}d) for employee from ${record.start_date} to ${record.end_date}`,
    employee_id: record.employee_id,
    new_value: data,
  });

  return data;
}

export async function updateLeaveRecord(
  id: UUID,
  updates: Partial<LeaveRecord>
): Promise<LeaveRecord> {
  const { data, error } = await supabase
    .from('leave_records')
    .update(updates)
    .eq('id', id)
    .select('*, employee:employees(*)')
    .single();

  if (error) throw error;

  await logActivity({
    event_type: 'leave_updated',
    description: `Updated leave record (${data.category}) status to ${data.approval_status}`,
    employee_id: data.employee_id,
    new_value: data,
  });

  return data;
}

export async function deleteLeaveRecord(id: UUID): Promise<void> {
  const { error } = await supabase.from('leave_records').delete().eq('id', id);
  if (error) throw error;
}

