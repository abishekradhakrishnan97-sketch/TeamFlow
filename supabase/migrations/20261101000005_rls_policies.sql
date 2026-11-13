-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- Enable RLS on all tables
-- ============================================================

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workstreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_records ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is an authenticated admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- ADMIN PROFILES — only owner can access their own profile
-- ============================================================
DROP POLICY IF EXISTS "admin_profiles_select" ON public.admin_profiles;
CREATE POLICY "admin_profiles_select" ON public.admin_profiles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_profiles_insert" ON public.admin_profiles;
CREATE POLICY "admin_profiles_insert" ON public.admin_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_profiles_update" ON public.admin_profiles;
CREATE POLICY "admin_profiles_update" ON public.admin_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- ALL OTHER TABLES — only authenticated admins can access
-- ============================================================
DO $$
DECLARE
  t TEXT;
  ops TEXT[] := ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
  op TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'departments', 'employees', 'workflow_templates', 'workflow_stages',
    'projects', 'project_members', 'workstreams', 'tasks', 'task_assignees',
    'attendance_records', 'leave_records', 'revisions', 'revision_assignees',
    'delivery_records', 'activity_events', 'holidays', 'app_settings',
    'report_documents', 'backup_records'
  ] LOOP
    FOREACH op IN ARRAY ops LOOP
      EXECUTE format('DROP POLICY IF EXISTS "admin_%s_%s" ON public.%s', 
        lower(op), t, t);
      IF op = 'SELECT' THEN
        EXECUTE format('
          CREATE POLICY "admin_%s_%s" ON public.%s
          FOR %s USING (public.is_admin())',
          lower(op), t, t, op);
      ELSIF op = 'INSERT' THEN
        EXECUTE format('
          CREATE POLICY "admin_%s_%s" ON public.%s
          FOR %s WITH CHECK (public.is_admin())',
          lower(op), t, t, op);
      ELSIF op = 'UPDATE' THEN
        EXECUTE format('
          CREATE POLICY "admin_%s_%s" ON public.%s
          FOR %s USING (public.is_admin()) WITH CHECK (public.is_admin())',
          lower(op), t, t, op);
      ELSIF op = 'DELETE' THEN
        EXECUTE format('
          CREATE POLICY "admin_%s_%s" ON public.%s
          FOR %s USING (public.is_admin())',
          lower(op), t, t, op);
      END IF;
    END LOOP;
  END LOOP;
END;
$$;
