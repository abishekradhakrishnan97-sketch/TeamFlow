# TeamFlow Database Migrations

## How to Apply

### Option 1: Supabase SQL Editor (Recommended)
1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/rrrkdkrtknhvlbaafqve
2. Navigate to: SQL Editor
3. Apply each migration file in order:
   - 20261101000001_create_extensions.sql
   - 20261101000002_create_tables.sql
   - 20261101000003_create_indexes.sql
   - 20261101000004_create_functions.sql
   - 20261101000005_rls_policies.sql
   - 20261101000006_seed_data.sql
   - 20261101000007_storage_setup.sql

### Option 2: Supabase CLI
```bash
npx supabase db push
```

## Storage Buckets
After applying migrations, go to Storage in your Supabase dashboard and verify these 3 private buckets exist:
- teamflow-reports
- teamflow-backups  
- teamflow-assets

## First Admin Account
After running migrations:
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User" and create the Design Lead account
3. OR use the app's login page (if signup is temporarily enabled)
4. After creating the user, disable signup in Authentication > Settings

## Admin Profile Setup
After creating your auth user, insert your admin profile:
```sql
INSERT INTO public.admin_profiles (user_id, name, email)
VALUES (
  'YOUR-AUTH-USER-UUID-HERE',
  'Design Lead',
  'your-email@example.com'
);
```
