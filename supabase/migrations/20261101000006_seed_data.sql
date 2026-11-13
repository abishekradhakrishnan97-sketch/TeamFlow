-- ============================================================
-- SEED DATA — Initial departments, workflows, and employees
-- ============================================================

-- Departments
INSERT INTO public.departments (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Design'),
  ('00000000-0000-0000-0000-000000000002', 'Development'),
  ('00000000-0000-0000-0000-000000000003', 'Content'),
  ('00000000-0000-0000-0000-000000000004', 'Video')
ON CONFLICT DO NOTHING;

-- Initial team (sample — editable by Design Lead)
INSERT INTO public.employees (name, designation, department_id, initials, status) VALUES
  ('Akash', 'Graphic & UI Designer', '00000000-0000-0000-0000-000000000001', 'AK', 'active'),
  ('Abirami', 'Graphic & UI Designer', '00000000-0000-0000-0000-000000000001', 'AB', 'active'),
  ('Tamil', 'Backend Developer', '00000000-0000-0000-0000-000000000002', 'TA', 'active'),
  ('Gokul', 'Frontend Developer', '00000000-0000-0000-0000-000000000002', 'GK', 'active'),
  ('Tilak', 'Frontend Developer & Designer', '00000000-0000-0000-0000-000000000002', 'TI', 'active'),
  ('Krishna', 'Frontend Developer & UI Designer', '00000000-0000-0000-0000-000000000002', 'KR', 'active'),
  ('Roshan', 'Video Editor & Scripting', '00000000-0000-0000-0000-000000000004', 'RO', 'active'),
  ('Bowtham', 'Video Editor & Scripting', '00000000-0000-0000-0000-000000000004', 'BO', 'active'),
  ('Sangavi', 'Designer', '00000000-0000-0000-0000-000000000001', 'SA', 'active'),
  ('Sruthi', 'Graphic & UI Designer', '00000000-0000-0000-0000-000000000001', 'SR', 'active'),
  ('Makhesh', 'Scripting & Design', '00000000-0000-0000-0000-000000000003', 'MA', 'active')
ON CONFLICT DO NOTHING;

-- Default workflow templates
INSERT INTO public.workflow_templates (id, name, description, is_default) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Standard Design Workflow', 'Default workflow for most design projects', true),
  ('10000000-0000-0000-0000-000000000002', 'UI/UX Redesign', 'For existing product redesigns', false),
  ('10000000-0000-0000-0000-000000000003', 'New Product Development', 'Full product from scratch', false),
  ('10000000-0000-0000-0000-000000000004', 'Document Formatting', 'For PDF and document projects', false),
  ('10000000-0000-0000-0000-000000000005', 'Maintenance & Changes', 'For ongoing changes and maintenance', false)
ON CONFLICT DO NOTHING;

-- Workflow stages for Standard Design Workflow
INSERT INTO public.workflow_stages (template_id, name, order_index, color) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Project Initiation', 1, '#737985'),
  ('10000000-0000-0000-0000-000000000001', 'Design', 2, '#6258E8'),
  ('10000000-0000-0000-0000-000000000001', 'Development', 3, '#D99B35'),
  ('10000000-0000-0000-0000-000000000001', 'Testing', 4, '#17191F'),
  ('10000000-0000-0000-0000-000000000001', 'Review', 5, '#249B70'),
  ('10000000-0000-0000-0000-000000000001', 'Delivery', 6, '#249B70'),
  ('10000000-0000-0000-0000-000000000001', 'Post-delivery / Revisions', 7, '#D9534F')
ON CONFLICT DO NOTHING;

-- UI/UX Redesign stages
INSERT INTO public.workflow_stages (template_id, name, order_index, color) VALUES
  ('10000000-0000-0000-0000-000000000002', 'Initiation', 1, '#737985'),
  ('10000000-0000-0000-0000-000000000002', 'Analysis', 2, '#6258E8'),
  ('10000000-0000-0000-0000-000000000002', 'Design', 3, '#6258E8'),
  ('10000000-0000-0000-0000-000000000002', 'Review', 4, '#249B70'),
  ('10000000-0000-0000-0000-000000000002', 'Delivery', 5, '#249B70')
ON CONFLICT DO NOTHING;

-- New Product stages
INSERT INTO public.workflow_stages (template_id, name, order_index, color) VALUES
  ('10000000-0000-0000-0000-000000000003', 'Initiation', 1, '#737985'),
  ('10000000-0000-0000-0000-000000000003', 'Design', 2, '#6258E8'),
  ('10000000-0000-0000-0000-000000000003', 'Development', 3, '#D99B35'),
  ('10000000-0000-0000-0000-000000000003', 'Testing', 4, '#17191F'),
  ('10000000-0000-0000-0000-000000000003', 'Review', 5, '#249B70'),
  ('10000000-0000-0000-0000-000000000003', 'Delivery', 6, '#249B70')
ON CONFLICT DO NOTHING;

-- Document Formatting stages
INSERT INTO public.workflow_stages (template_id, name, order_index, color) VALUES
  ('10000000-0000-0000-0000-000000000004', 'Initiation', 1, '#737985'),
  ('10000000-0000-0000-0000-000000000004', 'Formatting', 2, '#6258E8'),
  ('10000000-0000-0000-0000-000000000004', 'Review', 3, '#249B70'),
  ('10000000-0000-0000-0000-000000000004', 'Delivery', 4, '#249B70')
ON CONFLICT DO NOTHING;

-- Maintenance stages
INSERT INTO public.workflow_stages (template_id, name, order_index, color) VALUES
  ('10000000-0000-0000-0000-000000000005', 'Request', 1, '#737985'),
  ('10000000-0000-0000-0000-000000000005', 'Changes', 2, '#6258E8'),
  ('10000000-0000-0000-0000-000000000005', 'Testing', 3, '#D99B35'),
  ('10000000-0000-0000-0000-000000000005', 'Delivery', 4, '#249B70')
ON CONFLICT DO NOTHING;

-- Default app settings
INSERT INTO public.app_settings (
  company_name, department_name, design_lead_name,
  working_hours_start, working_hours_end,
  working_days, weekly_offs, break_duration_minutes, timezone
) VALUES (
  'TeamFlow', 'Design Department', 'Design Lead',
  '09:00', '18:00',
  ARRAY['monday','tuesday','wednesday','thursday','friday','saturday'],
  ARRAY['sunday'],
  60, 'Asia/Kolkata'
) ON CONFLICT DO NOTHING;
