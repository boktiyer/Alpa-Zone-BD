'use client';

import { useSyncExternalStore } from 'react';

// Shared "install as app" state for the banner (install-prompt.tsx) and the
// install button (install-app-button.tsx).
// Chrome/Android fires `beforeinstallprompt` once; we keep that event here so
// either component can open the browser's install dialog later.

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type State = { event: InstallEvent | null; installed: boolean };

let state: State = { event: null, installed: false };
const listeners = new Set<() => void>();

function update(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    update({ event: e as InstallEvent });
  });
  window.addEventListener('appinstalled', () => update({ event: null, installed: true }));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const serverState: State = { event: null, installed: false };

export function usePwaInstall() {
  return useSyncExternalStore(subscribe, () => state, () => serverState);
}

// Opens the browser's install dialog. 'unavailable' when the browser has not offered one.
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const event = state.event;
  if (!event) return 'unavailable';
  await event.prompt();
  const { outcome } = await event.userChoice;
  // A prompt event can only be used once.
  update({ event: null, installed: outcome === 'accepted' });
  return outcome;
}

// 'installed' when already opened as the app, 'ios' on iPhone/iPad, otherwise 'other'.
// null during server rendering and the first paint.
export type Platform = 'installed' | 'ios' | 'other';

function detectPlatform(): Platform {
  const installed =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (installed) return 'installed';
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  return ios ? 'ios' : 'other';
}

const noSubscribe = () => () => {};

export function usePlatform(): Platform | null {
  return useSyncExternalStore(noSubscribe, detectPlatform, () => null);
}
