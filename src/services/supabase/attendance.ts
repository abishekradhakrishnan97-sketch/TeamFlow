import { supabase } from './client';
import { AttendanceRecord, UUID, AttendanceStatus } from '@/types';
import { calculateOfficeHours } from '@/utils/dates';
import { logActivity } from './activity';

export async function getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*, employee:employees(*)')
    .eq('date', date);

  if (error) throw error;
  return data || [];
}

export async function getAttendanceByEmployee(
  employeeId: UUID,
  startDate?: string,
  endDate?: string
): Promise<AttendanceRecord[]> {
  let query = supabase
    .from('attendance_records')
    .select('*, employee:employees(*)')
    .eq('employee_id', employeeId)
    .order('date', { ascending: false });

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getAttendanceRange(
  startDate: string,
  endDate: string
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*, employee:employees(*)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function recordAttendance(record: {
  employee_id: UUID;
  date: string;
  status: AttendanceStatus;
  arrival_time?: string;
  departure_time?: string;
  break_duration_minutes?: number;
  remarks?: string;
}): Promise<AttendanceRecord> {
  let total_hours: number | undefined;

  if (record.arrival_time && record.departure_time) {
    total_hours = calculateOfficeHours(
      record.arrival_time,
      record.departure_time,
      record.break_duration_minutes || 0
    );
  }

  // Check if a record already exists for this employee on this date
  const { data: existing } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', record.employee_id)
    .eq('date', record.date)
    .maybeSingle();

  let result: AttendanceRecord;

  if (existing) {
    // Update existing record (correction)
    const { data, error } = await supabase
      .from('attendance_records')
      .update({
        status: record.status,
        arrival_time: record.arrival_time,
        departure_time: record.departure_time,
        break_duration_minutes: record.break_duration_minutes || 0,
        total_hours,
        remarks: record.remarks,
        correction_of: existing.id,
      })
      .eq('id', existing.id)
      .select('*, employee:employees(*)')
      .single();

    if (error) throw error;
    result = data;

    await logActivity({
      event_type: 'attendance_corrected',
      description: `Corrected attendance for employee on ${record.date} (status: ${record.status})`,
      employee_id: record.employee_id,
      previous_value: existing,
      new_value: data,
    });
  } else {
    // Create new record
    const { data, error } = await supabase
      .from('attendance_records')
      .insert([
        {
          employee_id: record.employee_id,
          date: record.date,
          status: record.status,
          arrival_time: record.arrival_time,
          departure_time: record.departure_time,
          break_duration_minutes: record.break_duration_minutes || 0,
          total_hours,
          remarks: record.remarks,
        },
      ])
      .select('*, employee:employees(*)')
      .single();

    if (error) throw error;
    result = data;

    await logActivity({
      event_type: 'attendance_created',
      description: `Recorded attendance for employee on ${record.date} (status: ${record.status})`,
      employee_id: record.employee_id,
      new_value: data,
    });
  }

  return result;
}

export async function bulkRecordAttendance(
  date: string,
  entries: Array<{
    employee_id: UUID;
    status: AttendanceStatus;
    arrival_time?: string;
    departure_time?: string;
    break_duration_minutes?: number;
    remarks?: string;
  }>
): Promise<void> {
  for (const entry of entries) {
    await recordAttendance({
      ...entry,
      date,
    });
  }
}
