import { format, parseISO, isValid, differenceInMinutes, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export const IST_TIMEZONE = 'Asia/Kolkata';

export function nowIST(): Date {
  return toZonedTime(new Date(), IST_TIMEZONE);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return format(d, 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return formatInTimeZone(d, IST_TIMEZONE, 'dd MMM yyyy, hh:mm a');
  } catch {
    return '—';
  }
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return '—';
  try {
    if (time.includes(':')) {
      const [h, m] = time.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 || 12;
      return `${hour}:${String(m).padStart(2, '0')} ${period}`;
    }
    return time;
  } catch {
    return time;
  }
}

export function formatHours(hours: number | null | undefined): string {
  if (!hours && hours !== 0) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function calculateOfficeHours(
  arrival: string,
  departure: string,
  breakMinutes: number = 0
): number {
  try {
    const [ah, am] = arrival.split(':').map(Number);
    const [dh, dm] = departure.split(':').map(Number);
    const totalMinutes = (dh * 60 + dm) - (ah * 60 + am) - breakMinutes;
    return Math.max(0, totalMinutes / 60);
  } catch {
    return 0;
  }
}

export function todayIST(): string {
  return formatInTimeZone(new Date(), IST_TIMEZONE, 'yyyy-MM-dd');
}

export function getMonthDays(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return eachDayOfInterval({ start, end });
}

export function getMonthRange(monthStr?: string): { startDate: string; endDate: string } {
  const date = monthStr ? parseISO(`${monthStr}-01`) : new Date();
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
  };
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isSameDay(d, new Date());
}

export function getRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const mins = differenceInMinutes(now, d);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

export { addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay };
