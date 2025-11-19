import type { User } from '@supabase/supabase-js';

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'admin' | 'user' | null;
  access_expires_at: string | null;
};

export type UserWithProfile = User & {
  profile: Profile | null;
};
