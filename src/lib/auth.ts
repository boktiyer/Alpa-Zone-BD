import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';

/**
 * The logged-in visitor's profile (with role), or null for guests.
 * Cached per request, so the header and the page share one lookup.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (data) return data as Profile;

  // Logged in but the profile row is missing (01_schema.sql not run yet).
  return {
    id: user.id,
    email: user.email ?? null,
    full_name: null,
    phone: null,
    address: null,
    district: null,
    role: 'customer',
    created_at: user.created_at,
    updated_at: user.created_at,
  };
});
