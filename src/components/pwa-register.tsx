'use client';

import { useEffect } from 'react';

// Registers the service worker (public/sw.js). Only in production builds, so
// `next dev` never serves old cached files while you work.
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
  }, []);
  return null;
}
