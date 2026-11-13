-- ============================================================
-- TEAMFLOW — ATTENDANCE & EXTRA WORK EXTENSIONS MIGRATION
-- ============================================================

-- 1. ATTENDANCE PERMISSIONS (HALF-DAY PERMISSION)
CREATE TABLE IF NOT EXISTS public.attendance_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  permission_date DATE NOT NULL,
  half_day_period TEXT NOT NULL CHECK (half_day_period IN ('first_half', 'second_half', 'custom')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'not_required')),
  admin_remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. EARLY LOG-OFFS
CREATE TABLE IF NOT EXISTS public.early_logoffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  logoff_date DATE NOT NULL,
  scheduled_departure_time TIME NOT NULL DEFAULT '18:00',
  actual_departure_time TIME NOT NULL,
  difference_minutes INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'not_required')),
  admin_remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. EXTENDED AVAILABILITY / LATE HOURS
CREATE TABLE IF NOT EXISTS public.extended_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  availability_date DATE NOT NULL,
  regular_closing_time TIME NOT NULL DEFAULT '18:00',
  actual_end_time TIME NOT NULL,
  active_work_minutes INTEGER NOT NULL DEFAULT 0,
  standby_minutes INTEGER NOT NULL DEFAULT 0,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('active_work', 'client_support', 'meeting', 'standby')),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  reason TEXT,
  approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'not_required')),
  admin_remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. EXTRA WORK RECORDS (SATURDAY & SUNDAY)
CREATE TABLE IF NOT EXISTS public.extra_work_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  work_day_type TEXT NOT NULL CHECK (work_day_type IN ('saturday', 'sunday')),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  work_description TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'not_required')),
  admin_remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_permissions_employee ON public.attendance_permissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_permissions_date ON public.attendance_permissions(permission_date);
CREATE INDEX IF NOT EXISTS idx_permissions_status ON public.attendance_permissions(approval_status);

CREATE INDEX IF NOT EXISTS idx_early_logoffs_employee ON public.early_logoffs(employee_id);
CREATE INDEX IF NOT EXISTS idx_early_logoffs_date ON public.early_logoffs(logoff_date);
CREATE INDEX IF NOT EXISTS idx_early_logoffs_status ON public.early_logoffs(approval_status);

CREATE INDEX IF NOT EXISTS idx_extended_employee ON public.extended_availability(employee_id);
CREATE INDEX IF NOT EXISTS idx_extended_date ON public.extended_availability(availability_date);
CREATE INDEX IF NOT EXISTS idx_extended_project ON public.extended_availability(project_id);
CREATE INDEX IF NOT EXISTS idx_extended_status ON public.extended_availability(approval_status);

CREATE INDEX IF NOT EXISTS idx_extra_work_employee ON public.extra_work_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_extra_work_date ON public.extra_work_records(work_date);
CREATE INDEX IF NOT EXISTS idx_extra_work_type ON public.extra_work_records(work_day_type);
CREATE INDEX IF NOT EXISTS idx_extra_work_project ON public.extra_work_records(project_id);
CREATE INDEX IF NOT EXISTS idx_extra_work_status ON public.extra_work_records(approval_status);

-- ============================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'attendance_permissions', 'early_logoffs', 'extended_availability', 'extra_work_records'
  ] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trigger_update_%s_updated_at ON public.%s;
      CREATE TRIGGER trigger_update_%s_updated_at
        BEFORE UPDATE ON public.%s
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
    ', t, t, t, t);
  END LOOP;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.attendance_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.early_logoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extended_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_work_records ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
  ops TEXT[] := ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
  op TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'attendance_permissions', 'early_logoffs', 'extended_availability', 'extra_work_records'
  ] LOOP
    FOREACH op IN ARRAY ops LOOP
      EXECUTE format('DROP POLICY IF EXISTS "admin_%s_%s" ON public.%s', lower(op), t, t);
      IF op = 'SELECT' THEN
        EXECUTE format('CREATE POLICY "admin_%s_%s" ON public.%s FOR %s USING (public.is_admin())', lower(op), t, t, op);
      ELSIF op = 'INSERT' THEN
        EXECUTE format('CREATE POLICY "admin_%s_%s" ON public.%s FOR %s WITH CHECK (public.is_admin())', lower(op), t, t, op);
      ELSIF op = 'UPDATE' THEN
        EXECUTE format('CREATE POLICY "admin_%s_%s" ON public.%s FOR %s USING (public.is_admin()) WITH CHECK (public.is_admin())', lower(op), t, t, op);
      ELSIF op = 'DELETE' THEN
        EXECUTE format('CREATE POLICY "admin_%s_%s" ON public.%s FOR %s USING (public.is_admin())', lower(op), t, t, op);
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

