-- ============================================================
-- TEAMFLOW — DESIGN LEAD SELF-ASSIGNMENT & EMPLOYEE PROFILE LINKING
-- Additive migration: Preserves all existing tables and data
-- ============================================================

-- 1. Ensure user_id and is_lead columns exist on employees
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_lead BOOLEAN DEFAULT false;

-- 2. Performance index on user_id
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);

-- 3. Provision / Link Abishek as Design Lead Employee
DO $$
DECLARE
  design_dept_id UUID;
  admin_user_id UUID;
  abishek_id UUID;
BEGIN
  -- 3a. Resolve Design Department ID
  SELECT id INTO design_dept_id 
  FROM public.departments 
  WHERE name ILIKE '%design%' 
  ORDER BY created_at ASC 
  LIMIT 1;

  IF design_dept_id IS NULL THEN
    SELECT id INTO design_dept_id FROM public.departments LIMIT 1;
  END IF;

  -- 3b. Resolve Admin User ID from admin_profiles
  SELECT user_id INTO admin_user_id 
  FROM public.admin_profiles 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- 3c. Check if Abishek already exists in employees
  SELECT id INTO abishek_id 
  FROM public.employees 
  WHERE name ILIKE 'Abishek%' OR designation ILIKE '%Design Lead%' 
  LIMIT 1;

  IF abishek_id IS NULL THEN
    INSERT INTO public.employees (
      id,
      name,
      designation,
      department_id,
      initials,
      status,
      email,
      notes,
      user_id,
      is_lead
    ) VALUES (
      '00000000-0000-0000-0000-000000000099',
      'Abishek',
      'Design Lead',
      design_dept_id,
      'AB',
      'active',
      COALESCE((SELECT email FROM public.admin_profiles WHERE user_id = admin_user_id LIMIT 1), 'lead@designteam.com'),
      'Design Lead & Principal Product Architect (Administrator + Employee)',
      admin_user_id,
      true
    )
    RETURNING id INTO abishek_id;
  ELSE
    UPDATE public.employees
    SET name = 'Abishek',
        designation = 'Design Lead',
        department_id = COALESCE(department_id, design_dept_id),
        initials = 'AB',
        status = 'active',
        user_id = COALESCE(user_id, admin_user_id),
        is_lead = true
    WHERE id = abishek_id;
  END IF;

  -- 3d. Synchronise admin_profiles with Abishek
  IF admin_user_id IS NOT NULL THEN
    UPDATE public.admin_profiles
    SET name = 'Abishek',
        updated_at = NOW()
    WHERE user_id = admin_user_id;
  END IF;

END $$;
