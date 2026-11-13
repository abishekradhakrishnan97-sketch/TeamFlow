-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_name);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_employee ON public.project_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignees ON public.task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON public.attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_employee ON public.leave_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_dates ON public.leave_records(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_revisions_project ON public.revisions(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_project ON public.activity_events(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_employee ON public.activity_events(employee_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_created ON public.report_documents(created_at DESC);

-- Full text search
CREATE INDEX IF NOT EXISTS idx_projects_name_fts ON public.projects USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_employees_name_fts ON public.employees USING gin(to_tsvector('english', name));
