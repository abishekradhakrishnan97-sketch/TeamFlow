import { AttendanceRecord } from '@/types';

export interface AttendanceSummary {
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  wfh: number;
  holiday: number;
  weeklyOff: number;
  totalHours: number;
  workingDays: number;
}

export function summariseAttendance(records: AttendanceRecord[]): AttendanceSummary {
  const summary: AttendanceSummary = {
    present: 0, absent: 0, halfDay: 0, leave: 0,
    wfh: 0, holiday: 0, weeklyOff: 0, totalHours: 0, workingDays: 0,
  };
  for (const r of records) {
    if (r.status === 'present') summary.present++;
    else if (r.status === 'absent') summary.absent++;
    else if (r.status === 'half_day') { summary.halfDay++; summary.present += 0.5; }
    else if (r.status === 'leave') summary.leave++;
    else if (r.status === 'work_from_home') summary.wfh++;
    else if (r.status === 'holiday') summary.holiday++;
    else if (r.status === 'weekly_off') summary.weeklyOff++;
    summary.totalHours += r.total_hours || 0;
  }
  summary.workingDays = summary.present + summary.halfDay + summary.wfh + summary.absent;
  return summary;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (!minutes && minutes !== 0) return '—';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function generateId(): string {
  return crypto.randomUUID();
}
