'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/provider';

// "Install as app" banner.
// Android/Chrome: uses the browser's install prompt (beforeinstallprompt).
// iPhone/iPad: shows "Share → Add to Home Screen" steps (iOS has no prompt).
// Closing it hides it for 30 days. Never shown once the app is installed.

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const KEY = 'pwa-install-dismissed-at';
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(KEY));
    return at > 0 && Date.now() - at < THIRTY_DAYS;
  } catch {
    return false;
  }
}

function rememberDismiss() {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    // Private mode: nothing to remember, the banner just comes back next visit.
  }
}

export function InstallPrompt() {
  const { t } = useI18n();
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    const installed =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (installed || dismissedRecently()) return;

    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
    if (isIos) {
      // Give the page a moment before showing the tip.
      const timer = setTimeout(() => setShowIos(true), 3000);
      return () => clearTimeout(timer);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!installEvent && !showIos) return null;

  const close = () => {
    rememberDismiss();
    setInstallEvent(null);
    setShowIos(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'dismissed') rememberDismiss();
    setInstallEvent(null);
  };

  return (
    <div
      role="dialog"
      aria-label={t.pwa.title}
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 animate-fade-in rounded-2xl border border-border bg-ivory p-4 shadow-xl md:inset-x-auto md:bottom-5 md:right-5 md:w-96"
    >
      <div className="flex items-start gap-3">
        <img src="/icons/icon-192.png" alt="" width={44} height={44} className="size-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-brand-dark">{t.pwa.title}</p>
          {showIos ? (
            <p className="mt-1 text-sm leading-relaxed text-ink/80">
              {t.pwa.iosStep1}{' '}
              <svg
                viewBox="0 0 24 24"
                aria-label="Share"
                className="inline size-4 align-text-bottom text-[#007aff]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
              </svg>{' '}
              {t.pwa.iosStep2}
            </p>
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-ink/80">{t.pwa.body}</p>
          )}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={t.pwa.close}
          className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-ink/60 hover:bg-blush hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      {installEvent && (
        <button
          type="button"
          onClick={install}
          className="mt-3 w-full rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          {t.pwa.install}
        </button>
      )}
    </div>
  );
}
