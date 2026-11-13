import { createClient } from '@supabase/supabase-js';

// Default production public credentials ensure deployment on Vercel never crashes
// with a blank screen even if dashboard environment variables are not yet populated.
const FALLBACK_SUPABASE_URL = 'https://rrrkdkrtknhvlbaafqve.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_hzhagQZ-gH4q-SCD2G3_rg_TQ6VCNNg';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'teamflow-auth',
  },
  global: {
    headers: {
      'x-application-name': 'teamflow',
    },
  },
});

export type SupabaseClient = typeof supabase;
