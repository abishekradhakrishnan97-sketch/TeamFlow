import { supabase } from './client';
import {
  AttendancePermission,
  EarlyLogoff,
  ExtendedAvailability,
  ExtraWorkRecord,
  ApprovalStatus,
  HalfDayPeriod,
  ExtendedActivityType,
  WorkDayType,
  UUID,
} from '@/types';
import { logActivity } from './activity';

// ============================================================
// 1. HALF-DAY PERMISSIONS
// ============================================================

export async function getAttendancePermissions(options?: {
  employeeId?: UUID;
  startDate?: string;
  endDate?: string;
  status?: ApprovalStatus;
}): Promise<AttendancePermission[]> {
  let query = supabase
    .from('attendance_permissions')
    .select('*, employee:employees(*)')
    .order('permission_date', { ascending: false });

  if (options?.employeeId) query = query.eq('employee_id', options.employeeId);
  if (options?.startDate) query = query.gte('permission_date', options.startDate);
  if (options?.endDate) query = query.lte('permission_date', options.endDate);
  if (options?.status) query = query.eq('approval_status', options.status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createAttendancePermission(params: {
  employee_id: UUID;
  permission_date: string;
  half_day_period: HalfDayPeriod;
  start_time: string;
  end_time: string;
  duration_minutes?: number;
  reason?: string;
  approval_status?: ApprovalStatus;
  admin_remarks?: string;
}): Promise<AttendancePermission> {
  // Calculate duration if not provided
  let duration = params.duration_minutes;
  if (!duration && params.start_time && params.end_time) {
    const [sh, sm] = params.start_time.split(':').map(Number);
    const [eh, em] = params.end_time.split(':').map(Number);
    duration = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  }

  const { data, error } = await supabase
    .from('attendance_permissions')
    .insert([
      {
        ...params,
        duration_minutes: duration || 0,
        approval_status: params.approval_status || 'approved',
      },
    ])
    .select('*, employee:employees(*)')
    .single();

  if (error) throw error;

  await logActivity({
    event_type: 'permission_created',
    description: `Recorded half-day permission (${params.half_day_period.replace('_', ' ')}) on ${params.permission_date}`,
    employee_id: params.employee_id,
    new_value: data,
  });

  return data;
}

export async function updateAttendancePermission(
  id: UUID,
  updates: Partial<AttendancePermission>
): Promise<AttendancePermission> {
  const { data, error } = await supabase
    .from('attendance_permissions')
    .update(updates)
    .eq('id', id)
    .select('*, employee:employees(*)')
    .single();

  if (error) throw error;

  await logActivity({
    event_type: 'permission_updated',
    description: `Updated half-day permission status to ${data.approval_status}`,
    employee_id: data.employee_id,
    new_value: data,
  });

  return data;
}

export async function deleteAttendancePermission(id: UUID): Promise<void> {
  const { error } = await supabase.from('attendance_permissions').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// 2. EARLY LOG-OFFS
// ============================================================

export async function getEarlyLogoffs(options?: {
  employeeId?: UUID;
  startDate?: string;
  endDate?: string;
  status?: ApprovalStatus;
}): Promise<EarlyLogoff[]> {
  let query = supabase
    .from('early_logoffs')
    .select('*, employee:employees(*)')
    .order('logoff_date', { ascending: false });

  if (options?.employeeId) query = query.eq('employee_id', options.employeeId);
  if (options?.startDate) query = query.gte('logoff_date', options.startDate);
  if (options?.endDate) query = query.lte('logoff_date', options.endDate);
  if (options?.status) query = query.eq('approval_status', options.status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createEarlyLogoff(params: {
  employee_id: UUID;
  logoff_date: string;
  scheduled_departure_time?: string;
  actual_departure_time: string;
  difference_minutes?: number;
  reason?: string;
  approval_status?: ApprovalStatus;
  admin_remarks?: string;
}): Promise<EarlyLogoff> {
  const scheduled = params.scheduled_departure_time || '18:00';
  let diff = params.difference_minutes;
  if (!diff && params.actual_departure_time) {
    const [sh, sm] = scheduled.split(':').map(Number);
    const [ah, am] = params.actual_departure_time.split(':').map(Number);
    diff = Math.max(0, (sh * 60 + sm) - (ah * 60 + am));
  }

  const { data, error } = await supabase
    .from('early_logoffs')
    .insert([
      {
        ...params,
        scheduled_departure_time: scheduled,
        difference_minutes: diff || 0,
        approval_status: params.approval_status || 'approved',
      },
    ])
    .select('*, employee:employees(*)')
    .single();

  if (error) throw error;

  await logActivity({
    event_type: 'early_logoff_created',
    description: `Recorded early log-off (${diff}m early) on ${params.logoff_date}`,
    employee_id: params.employee_id,
    new_value: data,
  });

  return data;
}

export async function updateEarlyLogoff(
  id: UUID,
  updates: Partial<EarlyLogoff>
): Promise<EarlyLogoff> {
  const { data, error } = await supabase
    .from('early_logoffs')
    .update(updates)
    .eq('id', id)
    .select('*, employee:employees(*)')
    .single();

  if (error) throw error;

  await logActivity({
    event_type: 'early_logoff_updated',
    description: `Updated early log-off record status to ${data.approval_status}`,
    employee_id: data.employee_id,
    new_value: data,
  });

  return data;
}

export async function deleteEarlyLogoff(id: UUID): Promise<void> {
  const { error } = await supabase.from('early_logoffs').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// 3. EXTENDED AVAILABILITY / LATE HOURS
// ============================================================

export async function getExtendedAvailability(options?: {
  employeeId?: UUID;
  projectId?: UUID;
  startDate?: string;
  endDate?: string;
  status?: ApprovalStatus;
}): Promise<ExtendedAvailability[]> {
  let query = supabase
    .from('extended_availability')
    .select('*, employee:employees(*), project:projects(*), task:tasks(*)')
    .order('availability_date', { ascending: false });

  if (options?.employeeId) query = query.eq('employee_id', options.employeeId);
  if (options?.projectId) query = query.eq('project_id', options.projectId);
  if (options?.startDate) query = query.gte('availability_date', options.startDate);
  if (options?.endDate) query = query.lte('availability_date', options.endDate);
  if (options?.status) query = query.eq('approval_status', options.status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createExtendedAvailability(params: {
  employee_id: UUID;
  availability_date: string;
  regular_closing_time?: string;
  actual_end_time: string;
  active_work_minutes?: number;
  standby_minutes?: number;
  activity_type: ExtendedActivityType;
  project_id?: UUID;
  task_id?: UUID;
  reason?: string;
  approval_status?: ApprovalStatus;
  admin_remarks?: string;
}): Promise<ExtendedAvailability> {
  const regular = params.regular_closing_time || '18:00';
  let totalDelta = 0;
  if (params.actual_end_time) {
    const [rh, rm] = regular.split(':').map(Number);
    const [eh, em] = params.actual_end_time.split(':').map(Number);
    totalDelta = Math.max(0, (eh * 60 + em) - (rh * 60 + rm));
  }

  // If active_work_minutes or standby_minutes not explicitly given, derive by activity_type
  let activeWork = params.active_work_minutes ?? 0;
  let standby = params.standby_minutes ?? 0;

  if (params.active_work_minutes === undefined && params.standby_minutes === undefined) {
    if (params.activity_type === 'standby') {
      standby = totalDelta;
    } else {
      activeWork = totalDelta;
    }
  }

  const { data, error } = await supabase
    .from('extended_availability')
    .insert([
      {
        ...params,
        regular_closing_time: regular,
        active_work_minutes: activeWork,
        standby_minutes: standby,
        approval_status: params.approval_status || 'approved',
      },
    ])
    .select('*, employee:employees(*), project:projects(*), task:tasks(*)')
    .single();

  if (error) throw error;

  await logActivity({
    event_type: 'extended_availability_created',
    description: `Recorded extended availability (${params.activity_type.replace('_', ' ')}: ${activeWork}m active, ${standby}m standby) on ${params.availability_date}`,
    employee_id: params.employee_id,
    project_id: params.project_id,
    task_id: params.task_id,
    new_value: data,
  });

  return data;
}

export async function updateExtendedAvailability(
  id: UUID,
  updates: Partial<ExtendedAvailability>
): Promise<ExtendedAvailability> {
  const { data, error } = await supabase
    .from('extended_availability')
    .update(updates)
    .eq('id', id)
    .select('*, employee:employees(*), project:projects(*), task:tasks(*)')
    .single();

  if (error) throw error;

  await logActivity({
    event_type: 'extended_availability_updated',
    description: `Updated extended availability status to ${data.approval_status}`,
    employee_id: data.employee_id,
    new_value: data,
  });

  return data;
}

export async function deleteExtendedAvailability(id: UUID): Promise<void> {
  const { error } = await supabase.from('extended_availability').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// 4. EXTRA WORK RECORDS (SATURDAY & SUNDAY)
// ============================================================

export async function getExtraWorkRecords(options?: {
  employeeId?: UUID;
  workDayType?: WorkDayType;
  projectId?: UUID;
  startDate?: string;
  endDate?: string;
  status?: ApprovalStatus;
}): Promise<ExtraWorkRecord[]> {
  let query = supabase
    .from('extra_work_records')
    .select('*, employee:employees(*), project:projects(*), task:tasks(*)')
    .order('work_date', { ascending: false });

  if (options?.employeeId) query = query.eq('employee_id', options.employeeId);
  if (options?.workDayType) query = query.eq('work_day_type', options.workDayType);
  if (options?.projectId) query = query.eq('project_id', options.projectId);
  if (options?.startDate) query = query.gte('work_date', options.startDate);
  if (options?.endDate) query = query.lte('work_date', options.endDate);
  if (options?.status) query = query.eq('approval_status', options.status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createExtraWorkRecord(params: {
  employee_id: UUID;
  work_date: string;
  work_day_type: WorkDayType;
  project_id?: UUID;
  task_id?: UUID;
  work_description: string;
  start_time: string;
  end_time: string;
  total_minutes?: number;
  approval_status?: ApprovalStatus;
  admin_remarks?: string;
}): Promise<ExtraWorkRecord> {
  let minutes = params.total_minutes;
  if (!minutes && params.start_time && params.end_time) {
    const [sh, sm] = params.start_time.split(':').map(Number);
    const [eh, em] = params.end_time.split(':').map(Number);
    minutes = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  }

  const { data, error } = await supabase
    .from('extra_work_records')
    .insert([
      {
        ...params,
        total_minutes: minutes || 0,
        approval_status: params.approval_status || 'approved',
      },
    ])
    .select('*, employee:employees(*), project:projects(*), task:tasks(*)')
    .single();

  if (error) throw error;

  await logActivity({
    event_type: 'extra_work_created',
    description: `Recorded ${params.work_day_type} extra work (${minutes}m) on ${params.work_date}: ${params.work_description}`,
    employee_id: params.employee_id,
    project_id: params.project_id,
    task_id: params.task_id,
    new_value: data,
  });

  return data;
}

export async function updateExtraWorkRecord(
  id: UUID,
  updates: Partial<ExtraWorkRecord>
): Promise<ExtraWorkRecord> {
  const { data, error } = await supabase
    .from('extra_work_records')
    .update(updates)
    .eq('id', id)
    .select('*, employee:employees(*), project:projects(*), task:tasks(*)')
    .single();

  if (error) throw error;

  await logActivity({
    event_type: 'extra_work_updated',
    description: `Updated ${data.work_day_type} extra work record status to ${data.approval_status}`,
    employee_id: data.employee_id,
    new_value: data,
  });

  return data;
}

export async function deleteExtraWorkRecord(id: UUID): Promise<void> {
  const { error } = await supabase.from('extra_work_records').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// AGGREGATED METRICS HELPER
// ============================================================

export interface AttendanceExtensionSummary {
  halfDayPermissionsCount: number;
  halfDayDurationMinutes: number;
  earlyLogoffsCount: number;
  earlyLogoffMinutes: number;
  extendedActiveMinutes: number;
  extendedStandbyMinutes: number;
  saturdayExtraMinutes: number;
  sundayExtraMinutes: number;
  pendingApprovalsCount: number;
}

export async function getAttendanceExtensionsSummary(options?: {
  employeeId?: UUID;
  startDate?: string;
  endDate?: string;
}): Promise<AttendanceExtensionSummary> {
  const [permissions, logoffs, extended, extraWork] = await Promise.all([
    getAttendancePermissions(options),
    getEarlyLogoffs(options),
    getExtendedAvailability(options),
    getExtraWorkRecords(options),
  ]);

  let halfDayPermissionsCount = 0;
  let halfDayDurationMinutes = 0;
  let earlyLogoffsCount = 0;
  let earlyLogoffMinutes = 0;
  let extendedActiveMinutes = 0;
  let extendedStandbyMinutes = 0;
  let saturdayExtraMinutes = 0;
  let sundayExtraMinutes = 0;
  let pendingApprovalsCount = 0;

  permissions.forEach((p) => {
    if (p.approval_status === 'approved') {
      halfDayPermissionsCount++;
      halfDayDurationMinutes += p.duration_minutes || 0;
    } else if (p.approval_status === 'pending') {
      pendingApprovalsCount++;
    }
  });

  logoffs.forEach((l) => {
    if (l.approval_status === 'approved') {
      earlyLogoffsCount++;
      earlyLogoffMinutes += l.difference_minutes || 0;
    } else if (l.approval_status === 'pending') {
      pendingApprovalsCount++;
    }
  });

  extended.forEach((e) => {
    if (e.approval_status === 'approved') {
      extendedActiveMinutes += e.active_work_minutes || 0;
      extendedStandbyMinutes += e.standby_minutes || 0;
    } else if (e.approval_status === 'pending') {
      pendingApprovalsCount++;
    }
  });

  extraWork.forEach((w) => {
    if (w.approval_status === 'approved') {
      if (w.work_day_type === 'saturday') {
        saturdayExtraMinutes += w.total_minutes || 0;
      } else if (w.work_day_type === 'sunday') {
        sundayExtraMinutes += w.total_minutes || 0;
      }
    } else if (w.approval_status === 'pending') {
      pendingApprovalsCount++;
    }
  });

  return {
    halfDayPermissionsCount,
    halfDayDurationMinutes,
    earlyLogoffsCount,
    earlyLogoffMinutes,
    extendedActiveMinutes,
    extendedStandbyMinutes,
    saturdayExtraMinutes,
    sundayExtraMinutes,
    pendingApprovalsCount,
  };
}

