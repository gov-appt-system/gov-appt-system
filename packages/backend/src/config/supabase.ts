import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

// Singleton Supabase client using the service role key for backend operations.
// The service role key bypasses RLS — use only in trusted server-side code.
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Wake up the Supabase database on startup so the first real request
// doesn't hit a cold-start delay (free-tier projects pause after inactivity).
(async () => {
  try {
    const start = Date.now();
    await supabase.from('users').select('id').limit(1);
    logger.info(`Supabase warm-up completed in ${Date.now() - start}ms`);
  } catch (err) {
    logger.warn('Supabase warm-up query failed — first request may be slow', {
      error: (err as Error).message,
    });
  }
})();
