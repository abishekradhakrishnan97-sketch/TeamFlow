-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'admin_profiles', 'departments', 'employees', 'workflow_templates',
    'projects', 'workstreams', 'tasks', 'attendance_records',
    'leave_records', 'revisions', 'app_settings'
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

-- Function to get next revision number for a project
CREATE OR REPLACE FUNCTION public.get_next_revision_number(p_project_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(MAX(revision_number), 0) + 1
  FROM public.revisions
  WHERE project_id = p_project_id;
$$ LANGUAGE SQL STABLE;

-- Function to calculate office hours
CREATE OR REPLACE FUNCTION public.calculate_office_hours(
  arrival TIME,
  departure TIME,
  break_minutes INTEGER DEFAULT 0
)
RETURNS DECIMAL AS $$
  SELECT GREATEST(0, 
    EXTRACT(EPOCH FROM (departure - arrival)) / 3600 - (break_minutes / 60.0)
  );
$$ LANGUAGE SQL IMMUTABLE;
