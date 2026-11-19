'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/provider';
import { promptInstall, usePlatform, usePwaInstall } from '@/components/store/use-pwa-install';

// Always-available "Install app" button (footer and phone menu).
// Chrome/Android: opens the browser's install dialog.
// iPhone, or a browser that has not offered a dialog: shows how to install by hand.
// Hidden once the site is already installed and opened as the app.

export function ShareIcon() {
  return (
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
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  );
}

const styles = {
  footer:
    'inline-flex items-center gap-2 rounded-full border border-gold/60 px-4 py-2 text-sm font-semibold text-gold transition-colors duration-300 hover:bg-gold hover:text-brand-dark',
  menu: 'flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark',
};

export function InstallAppButton({ variant }: { variant: keyof typeof styles }) {
  const { t } = useI18n();
  const platform = usePlatform();
  const { event, installed } = usePwaInstall();
  const [help, setHelp] = useState(false);

  if (!platform || platform === 'installed' || installed) return null;

  const onClick = async () => {
    if (event) await promptInstall();
    else setHelp(true);
  };

  return (
    <>
      <button type="button" onClick={onClick} className={styles[variant]}>
        <DownloadIcon />
        {t.pwa.button}
      </button>

      {help && (
        <div className="fixed inset-0 z-[60] grid place-items-end bg-footer/60 p-3 sm:place-items-center" onClick={() => setHelp(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.pwa.helpTitle}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm animate-fade-in rounded-2xl bg-ivory p-5 text-ink shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <img src="/icons/icon-192.png" alt="" width={44} height={44} className="size-11 rounded-xl" />
              <p className="font-semibold text-brand-dark">{t.pwa.helpTitle}</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink/80">
              {platform === 'ios' ? (
                <>
                  {t.pwa.iosStep1} <ShareIcon /> {t.pwa.iosStep2}
                </>
              ) : (
                t.pwa.otherHelp
              )}
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => setHelp(false)}
              className="mt-4 w-full rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {t.pwa.ok}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
