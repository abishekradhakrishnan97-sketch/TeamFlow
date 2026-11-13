-- ============================================================
-- TEAMFLOW DATABASE SCHEMA
-- ============================================================

-- ADMIN PROFILES
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Design Lead',
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EMPLOYEES
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  initials TEXT NOT NULL DEFAULT '',
  joining_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  email TEXT,
  phone TEXT,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WORKFLOW TEMPLATES
CREATE TABLE IF NOT EXISTS public.workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WORKFLOW STAGES
CREATE TABLE IF NOT EXISTS public.workflow_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#6258E8',
  is_optional BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_name TEXT,
  description TEXT,
  project_type TEXT NOT NULL DEFAULT 'other',
  custom_type TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'active', 'on_hold', 'under_review', 'delivered', 'reopened', 'archived')),
  start_date DATE,
  target_delivery_date DATE,
  actual_delivery_date DATE,
  owner_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  workflow_template_id UUID REFERENCES public.workflow_templates(id) ON DELETE SET NULL,
  notes TEXT,
  is_quick_request BOOLEAN NOT NULL DEFAULT false,
  parent_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PROJECT MEMBERS
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, employee_id)
);

-- WORKSTREAMS
CREATE TABLE IF NOT EXISTS public.workstreams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workstream_id UUID REFERENCES public.workstreams(id) ON DELETE SET NULL,
  workflow_stage_id UUID REFERENCES public.workflow_stages(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'working', 'on_hold', 'blocked', 'ready_for_review', 'changes_requested', 'completed')),
  start_date DATE,
  due_date DATE,
  completion_date DATE,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TASK ASSIGNEES
CREATE TABLE IF NOT EXISTS public.task_assignees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, employee_id)
);

-- ATTENDANCE RECORDS
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day', 'leave', 'work_from_home', 'holiday', 'weekly_off')),
  arrival_time TIME,
  departure_time TIME,
  break_duration_minutes INTEGER DEFAULT 0,
  total_hours DECIMAL(5,2),
  remarks TEXT,
  correction_of UUID REFERENCES public.attendance_records(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- LEAVE RECORDS
CREATE TABLE IF NOT EXISTS public.leave_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('casual_leave','sick_leave','planned_leave','emergency_leave','half_day_leave','unpaid_leave','work_from_home','other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  num_days DECIMAL(4,1) NOT NULL,
  reason TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected','cancelled')),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REVISIONS
CREATE TABLE IF NOT EXISTS public.revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL DEFAULT 1,
  date_received DATE NOT NULL,
  change_description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  completion_date DATE,
  delivery_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REVISION ASSIGNEES
CREATE TABLE IF NOT EXISTS public.revision_assignees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  revision_id UUID NOT NULL REFERENCES public.revisions(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(revision_id, employee_id)
);

-- DELIVERY RECORDS
CREATE TABLE IF NOT EXISTS public.delivery_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  revision_id UUID REFERENCES public.revisions(id) ON DELETE SET NULL,
  delivery_type TEXT NOT NULL DEFAULT 'initial' CHECK (delivery_type IN ('initial', 'revision')),
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_notes TEXT,
  delivered_by_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ACTIVITY EVENTS
CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  revision_id UUID REFERENCES public.revisions(id) ON DELETE SET NULL,
  previous_value JSONB,
  new_value JSONB,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HOLIDAYS
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL UNIQUE,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- APP SETTINGS
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL DEFAULT 'TeamFlow',
  department_name TEXT NOT NULL DEFAULT 'Design',
  design_lead_name TEXT NOT NULL DEFAULT 'Design Lead',
  logo_url TEXT,
  working_hours_start TEXT NOT NULL DEFAULT '09:00',
  working_hours_end TEXT NOT NULL DEFAULT '18:00',
  working_days TEXT[] NOT NULL DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday'],
  weekly_offs TEXT[] NOT NULL DEFAULT ARRAY['saturday','sunday'],
  break_duration_minutes INTEGER NOT NULL DEFAULT 60,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  report_footer_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REPORT DOCUMENTS
CREATE TABLE IF NOT EXISTS public.report_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('attendance','employee_work','team_monthly','project_activity','combined_hr')),
  scope TEXT NOT NULL CHECK (scope IN ('team','individual','selected','project')),
  period TEXT NOT NULL CHECK (period IN ('weekly','monthly','quarterly','half_yearly','yearly','custom')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  storage_path TEXT,
  storage_bucket TEXT NOT NULL DEFAULT 'teamflow-reports',
  file_size_bytes BIGINT,
  generated_by TEXT NOT NULL,
  upload_status TEXT NOT NULL DEFAULT 'pending' CHECK (upload_status IN ('pending','uploaded','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BACKUP RECORDS
CREATE TABLE IF NOT EXISTS public.backup_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT,
  storage_path TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'teamflow-backups',
  file_size_bytes BIGINT,
  record_counts JSONB,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
