// ============================================================
// TEAMFLOW — TypeScript Type Definitions
// ============================================================

export type UUID = string;

// ============================================================
// AUTH & ADMIN
// ============================================================
export interface AdminProfile {
  id: UUID;
  user_id: UUID;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// DEPARTMENTS
// ============================================================
export interface Department {
  id: UUID;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// EMPLOYEES
// ============================================================
export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  id: UUID;
  name: string;
  designation: string;
  department_id?: UUID;
  department?: Department;
  initials: string;
  joining_date?: string;
  status: EmployeeStatus;
  email?: string;
  phone?: string;
  notes?: string;
  user_id?: UUID;
  is_lead?: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// PROJECTS
// ============================================================
export type ProjectType =
  | 'existing_product_redesign'
  | 'new_product'
  | 'ui_ux_design_only'
  | 'frontend_development'
  | 'backend_development'
  | 'full_product_development'
  | 'document_pdf_formatting'
  | 'presentation_slide_design'
  | 'graphic_design'
  | 'existing_project_maintenance'
  | 'other';

export type ProjectStatus =
  | 'not_started'
  | 'active'
  | 'on_hold'
  | 'under_review'
  | 'delivered'
  | 'reopened'
  | 'archived';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: UUID;
  name: string;
  client_name?: string;
  description?: string;
  project_type: ProjectType;
  custom_type?: string;
  priority: Priority;
  status: ProjectStatus;
  start_date?: string;
  target_delivery_date?: string;
  actual_delivery_date?: string;
  owner_id?: UUID;
  owner?: Employee;
  workflow_template_id?: UUID;
  notes?: string;
  is_quick_request: boolean;
  parent_project_id?: UUID;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: UUID;
  project_id: UUID;
  employee_id: UUID;
  employee?: Employee;
  role?: string;
  created_at: string;
}

// ============================================================
// WORKFLOW
// ============================================================
export interface WorkflowTemplate {
  id: UUID;
  name: string;
  description?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  stages?: WorkflowStage[];
}

export interface WorkflowStage {
  id: UUID;
  template_id: UUID;
  name: string;
  order_index: number;
  color?: string;
  is_optional: boolean;
  created_at: string;
}

// ============================================================
// WORKSTREAMS
// ============================================================
export interface Workstream {
  id: UUID;
  project_id: UUID;
  name: string;
  description?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// TASKS
// ============================================================
export type TaskStatus =
  | 'not_started'
  | 'working'
  | 'on_hold'
  | 'blocked'
  | 'ready_for_review'
  | 'changes_requested'
  | 'completed';

export interface Task {
  id: UUID;
  title: string;
  description?: string;
  project_id: UUID;
  project?: Project;
  workstream_id?: UUID;
  workstream?: Workstream;
  workflow_stage_id?: UUID;
  workflow_stage?: WorkflowStage;
  priority: Priority;
  status: TaskStatus;
  start_date?: string;
  due_date?: string;
  completion_date?: string;
  notes?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  assignees?: TaskAssignee[];
}

export interface TaskAssignee {
  id: UUID;
  task_id: UUID;
  employee_id: UUID;
  employee?: Employee;
  created_at: string;
}

// ============================================================
// ATTENDANCE
// ============================================================
export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'half_day'
  | 'leave'
  | 'work_from_home'
  | 'holiday'
  | 'weekly_off';

export interface AttendanceRecord {
  id: UUID;
  employee_id: UUID;
  employee?: Employee;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  arrival_time?: string; // HH:MM
  departure_time?: string; // HH:MM
  break_duration_minutes?: number;
  total_hours?: number;
  remarks?: string;
  correction_of?: UUID;
  created_at: string;
  updated_at: string;
}

// ============================================================
// LEAVE
// ============================================================
export type LeaveCategory =
  | 'casual_leave'
  | 'sick_leave'
  | 'planned_leave'
  | 'emergency_leave'
  | 'half_day_leave'
  | 'unpaid_leave'
  | 'work_from_home'
  | 'other';

export type LeaveApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRecord {
  id: UUID;
  employee_id: UUID;
  employee?: Employee;
  category: LeaveCategory;
  start_date: string;
  end_date: string;
  num_days: number;
  reason?: string;
  approval_status: LeaveApprovalStatus;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// ATTENDANCE & EXTRA WORK EXTENSIONS
// ============================================================
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'not_required';
export type HalfDayPeriod = 'first_half' | 'second_half' | 'custom';
export type ExtendedActivityType = 'active_work' | 'client_support' | 'meeting' | 'standby';
export type WorkDayType = 'saturday' | 'sunday';

export interface AttendancePermission {
  id: UUID;
  employee_id: UUID;
  employee?: Employee;
  permission_date: string; // YYYY-MM-DD
  half_day_period: HalfDayPeriod;
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  duration_minutes: number;
  reason?: string;
  approval_status: ApprovalStatus;
  admin_remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface EarlyLogoff {
  id: UUID;
  employee_id: UUID;
  employee?: Employee;
  logoff_date: string; // YYYY-MM-DD
  scheduled_departure_time: string; // HH:MM
  actual_departure_time: string; // HH:MM
  difference_minutes: number;
  reason?: string;
  approval_status: ApprovalStatus;
  admin_remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface ExtendedAvailability {
  id: UUID;
  employee_id: UUID;
  employee?: Employee;
  availability_date: string; // YYYY-MM-DD
  regular_closing_time: string; // HH:MM
  actual_end_time: string; // HH:MM
  active_work_minutes: number;
  standby_minutes: number;
  activity_type: ExtendedActivityType;
  project_id?: UUID;
  project?: Project;
  task_id?: UUID;
  task?: Task;
  reason?: string;
  approval_status: ApprovalStatus;
  admin_remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface ExtraWorkRecord {
  id: UUID;
  employee_id: UUID;
  employee?: Employee;
  work_date: string; // YYYY-MM-DD
  work_day_type: WorkDayType;
  project_id?: UUID;
  project?: Project;
  task_id?: UUID;
  task?: Task;
  work_description: string;
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  total_minutes: number;
  approval_status: ApprovalStatus;
  admin_remarks?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// REVISIONS
// ============================================================
export type RevisionStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface Revision {
  id: UUID;
  project_id: UUID;
  project?: Project;
  revision_number: number;
  date_received: string;
  change_description: string;
  priority: Priority;
  deadline?: string;
  status: RevisionStatus;
  completion_date?: string;
  delivery_notes?: string;
  created_at: string;
  updated_at: string;
  assignees?: RevisionAssignee[];
}

export interface RevisionAssignee {
  id: UUID;
  revision_id: UUID;
  employee_id: UUID;
  employee?: Employee;
  created_at: string;
}

// ============================================================
// DELIVERIES
// ============================================================
export type DeliveryType = 'initial' | 'revision';

export interface DeliveryRecord {
  id: UUID;
  project_id: UUID;
  project?: Project;
  revision_id?: UUID;
  delivery_type: DeliveryType;
  delivered_at: string;
  delivery_notes?: string;
  delivered_by_id?: UUID;
  delivered_by?: Employee;
  created_at: string;
}

// ============================================================
// ACTIVITY EVENTS
// ============================================================
export type ActivityEventType =
  | 'project_created'
  | 'project_updated'
  | 'project_status_changed'
  | 'project_delivered'
  | 'project_archived'
  | 'project_reopened'
  | 'member_assigned'
  | 'member_removed'
  | 'task_created'
  | 'task_updated'
  | 'task_status_changed'
  | 'task_completed'
  | 'task_reopened'
  | 'task_deleted'
  | 'revision_created'
  | 'revision_updated'
  | 'revision_completed'
  | 'delivery_created'
  | 'attendance_created'
  | 'attendance_corrected'
  | 'leave_created'
  | 'leave_updated'
  | 'employee_created'
  | 'employee_updated'
  | 'permission_created'
  | 'permission_updated'
  | 'early_logoff_created'
  | 'early_logoff_updated'
  | 'extended_availability_created'
  | 'extended_availability_updated'
  | 'extra_work_created'
  | 'extra_work_updated';

export interface ActivityEvent {
  id: UUID;
  event_type: ActivityEventType;
  project_id?: UUID;
  task_id?: UUID;
  employee_id?: UUID;
  revision_id?: UUID;
  previous_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  description: string;
  created_at: string;
}

// ============================================================
// HOLIDAYS
// ============================================================
export interface Holiday {
  id: UUID;
  name: string;
  date: string;
  is_recurring: boolean;
  created_at: string;
}

// ============================================================
// APP SETTINGS
// ============================================================
export interface AppSettings {
  id: UUID;
  company_name: string;
  department_name: string;
  design_lead_name: string;
  logo_url?: string;
  working_hours_start: string;
  working_hours_end: string;
  working_days: string[]; // ['monday','tuesday',...]
  weekly_offs: string[];
  break_duration_minutes: number;
  timezone: string;
  report_footer_text?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// REPORTS
// ============================================================
export type ReportType =
  | 'attendance'
  | 'employee_work'
  | 'team_monthly'
  | 'project_activity'
  | 'combined_hr'
  | 'employee_monthly_attendance_permission'
  | 'half_day_permission'
  | 'early_logoff'
  | 'extended_availability'
  | 'saturday_extra_work'
  | 'sunday_extra_work'
  | 'combined_extra_work'
  | 'complete_employee_hr'
  | 'team_monthly_attendance_extra_work';

export type ReportScope = 'team' | 'individual' | 'selected' | 'project';
export type ReportPeriod = 'weekly' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';

export interface ReportDocument {
  id: UUID;
  report_name: string;
  report_type: ReportType;
  scope: ReportScope;
  period: ReportPeriod;
  period_start: string;
  period_end: string;
  employee_id?: UUID;
  employee?: Employee;
  project_id?: UUID;
  storage_path?: string;
  storage_bucket: string;
  file_size_bytes?: number;
  generated_by: string;
  upload_status: 'pending' | 'uploaded' | 'failed';
  created_at: string;
}

// ============================================================
// BACKUPS
// ============================================================
export interface BackupRecord {
  id: UUID;
  description?: string;
  storage_path: string;
  storage_bucket: string;
  file_size_bytes?: number;
  record_counts?: Record<string, number>;
  created_by: string;
  created_at: string;
}

// ============================================================
// UI / FORM TYPES
// ============================================================
export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface FilterState {
  search: string;
  status?: string;
  department?: string;
  employee?: string;
  project?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

// Label maps for display
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  existing_product_redesign: 'Existing Product – UI/UX Redesign',
  new_product: 'New Product – From Scratch',
  ui_ux_design_only: 'UI/UX Design Only',
  frontend_development: 'Frontend Development',
  backend_development: 'Backend Development',
  full_product_development: 'Full Product Development',
  document_pdf_formatting: 'Document / PDF Formatting',
  presentation_slide_design: 'Presentation / Slide Design',
  graphic_design: 'Graphic Design',
  existing_project_maintenance: 'Existing Project – Changes & Maintenance',
  other: 'Other / Custom Request',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  not_started: 'Not Started',
  active: 'Active',
  on_hold: 'On Hold',
  under_review: 'Under Review',
  delivered: 'Delivered',
  reopened: 'Reopened',
  archived: 'Archived',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  working: 'Working',
  on_hold: 'On Hold',
  blocked: 'Blocked',
  ready_for_review: 'Ready for Review',
  changes_requested: 'Changes Requested',
  completed: 'Completed',
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  half_day: 'Half Day',
  leave: 'Leave',
  work_from_home: 'Work From Home',
  holiday: 'Holiday',
  weekly_off: 'Weekly Off',
};

export const LEAVE_CATEGORY_LABELS: Record<LeaveCategory, string> = {
  casual_leave: 'Casual Leave',
  sick_leave: 'Sick Leave',
  planned_leave: 'Planned Leave',
  emergency_leave: 'Emergency Leave',
  half_day_leave: 'Half-day Leave',
  unpaid_leave: 'Unpaid Leave',
  work_from_home: 'Work From Home',
  other: 'Other',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  not_required: 'Not Required',
};

export const EXTENDED_ACTIVITY_LABELS: Record<ExtendedActivityType, string> = {
  active_work: 'Active Work',
  client_support: 'Client Support',
  meeting: 'Meeting',
  standby: 'Standby / Availability',
};

export const HALF_DAY_LABELS: Record<HalfDayPeriod, string> = {
  first_half: 'First Half (Morning)',
  second_half: 'Second Half (Afternoon)',
  custom: 'Custom Window',
};

// Re-export notification types
export * from './notifications';

