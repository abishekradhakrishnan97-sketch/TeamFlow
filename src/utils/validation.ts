import { z } from 'zod';

export const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  designation: z.string().min(1, 'Designation is required').max(100),
  department_id: z.string().optional(),
  initials: z.string().min(1).max(3),
  joining_date: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  client_name: z.string().optional(),
  description: z.string().optional(),
  project_type: z.string().min(1, 'Project type is required'),
  custom_type: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['not_started', 'active', 'on_hold', 'under_review', 'delivered', 'reopened', 'archived']),
  start_date: z.string().optional(),
  target_delivery_date: z.string().optional(),
  owner_id: z.string().optional(),
  notes: z.string().optional(),
  is_quick_request: z.boolean().default(false),
});

export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(300),
  description: z.string().optional(),
  project_id: z.string().min(1, 'Project is required'),
  workstream_id: z.string().optional(),
  workflow_stage_id: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['not_started', 'working', 'on_hold', 'blocked', 'ready_for_review', 'changes_requested', 'completed']),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  completion_date: z.string().optional(),
  notes: z.string().optional(),
});

export const attendanceSchema = z.object({
  employee_id: z.string().min(1, 'Employee is required'),
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['present', 'absent', 'half_day', 'leave', 'work_from_home', 'holiday', 'weekly_off']),
  arrival_time: z.string().optional(),
  departure_time: z.string().optional(),
  break_duration_minutes: z.number().min(0).optional(),
  remarks: z.string().optional(),
});

export const leaveSchema = z.object({
  employee_id: z.string().min(1, 'Employee is required'),
  category: z.enum(['casual_leave', 'sick_leave', 'planned_leave', 'emergency_leave', 'half_day_leave', 'unpaid_leave', 'work_from_home', 'other']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  num_days: z.number().min(0.5),
  reason: z.string().optional(),
  approval_status: z.enum(['pending', 'approved', 'rejected', 'cancelled']),
  remarks: z.string().optional(),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
export type AttendanceFormData = z.infer<typeof attendanceSchema>;
export type LeaveFormData = z.infer<typeof leaveSchema>;
