-- ============================================================
-- STORAGE BUCKET SETUP (IDEMPOTENT & SAFE TO RE-RUN)
-- ============================================================

-- Ensure buckets exist in storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('teamflow-reports', 'teamflow-reports', false, 52428800, ARRAY['application/pdf']),
  ('teamflow-backups', 'teamflow-backups', false, 104857600, ARRAY['application/json']),
  ('teamflow-assets', 'teamflow-assets', false, 10485760, ARRAY['image/png','image/jpeg','image/svg+xml','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for teamflow-reports
DROP POLICY IF EXISTS "reports_admin_select" ON storage.objects;
CREATE POLICY "reports_admin_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'teamflow-reports' AND public.is_admin()
  );

DROP POLICY IF EXISTS "reports_admin_insert" ON storage.objects;
CREATE POLICY "reports_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'teamflow-reports' AND public.is_admin()
  );

DROP POLICY IF EXISTS "reports_admin_delete" ON storage.objects;
CREATE POLICY "reports_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'teamflow-reports' AND public.is_admin()
  );

-- Storage RLS policies for teamflow-backups
DROP POLICY IF EXISTS "backups_admin_select" ON storage.objects;
CREATE POLICY "backups_admin_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'teamflow-backups' AND public.is_admin()
  );

DROP POLICY IF EXISTS "backups_admin_insert" ON storage.objects;
CREATE POLICY "backups_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'teamflow-backups' AND public.is_admin()
  );

DROP POLICY IF EXISTS "backups_admin_delete" ON storage.objects;
CREATE POLICY "backups_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'teamflow-backups' AND public.is_admin()
  );

-- Storage RLS policies for teamflow-assets
DROP POLICY IF EXISTS "assets_admin_select" ON storage.objects;
CREATE POLICY "assets_admin_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'teamflow-assets' AND public.is_admin()
  );

DROP POLICY IF EXISTS "assets_admin_insert" ON storage.objects;
CREATE POLICY "assets_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'teamflow-assets' AND public.is_admin()
  );

DROP POLICY IF EXISTS "assets_admin_delete" ON storage.objects;
CREATE POLICY "assets_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'teamflow-assets' AND public.is_admin()
  );
