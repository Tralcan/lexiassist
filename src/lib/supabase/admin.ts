import { createClient } from '@supabase/supabase-js'

// IMPORTANT: This should be used ONLY in server-side code that needs elevated privileges.
// It requires the `SUPABASE_SERVICE_ROLE_KEY` environment variable to be set.
export const createAdminClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase credentials for admin client. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment variables.');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
