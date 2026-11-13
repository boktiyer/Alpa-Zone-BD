'use client';

import { useEffect } from 'react';

/**
 * Safety net for the password-reset email link.
 *
 * The link should open /reset-password, but if that address is not in
 * Supabase's allowed redirect list, Supabase sends the visitor to the home
 * page instead (with the one-time login still attached after the "#").
 * Wherever they land, move them to /reset-password and keep the "#..." part.
 */
export function RecoveryLinkCatcher() {
  useEffect(() => {
    const { hash, pathname } = window.location;
    if (pathname === '/reset-password') return;
    if (hash.includes('type=recovery') && hash.includes('access_token=')) {
      window.location.replace(`/reset-password${hash}`);
    }
  }, []);

  return null;
}
