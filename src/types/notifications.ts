export type NotificationPriority = 'critical' | 'important' | 'normal' | 'informational';

export type NotificationCategory =
  | 'task'
  | 'project'
  | 'team'
  | 'attendance'
  | 'import'
  | 'system';

export type NotificationEntity =
  | 'task'
  | 'project'
  | 'employee'
  | 'attendance'
  | 'leave'
  | 'report'
  | 'backup'
  | 'import';

export interface NotificationItem {
  id: string;
  event_key: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  related_entity_type?: NotificationEntity;
  related_entity_id?: string;
  related_entity_name?: string;
  target_route: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  dismissed_at?: string | null;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  taskUpdates: boolean;
  projectUpdates: boolean;
  attendanceAndHr: boolean;
  excelImports: boolean;
  reportsAndBackups: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  taskUpdates: true,
  projectUpdates: true,
  attendanceAndHr: true,
  excelImports: true,
  reportsAndBackups: true,
};
