'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { requestPasswordReset, updatePassword, type FormState } from '@/app/auth/actions';
import { useI18n } from '@/i18n/provider';

const card =
  'mx-auto w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8';

function Notice({ state }: { state: FormState }) {
  return (
    <>
      {state?.error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      {state?.message && (
        <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          {state.message}
        </p>
      )}
    </>
  );
}

/** Step 1: ask for the account email and send the reset link. */
export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    requestPasswordReset,
    null,
  );

  return (
    <div className={card}>
      <h1 className="text-2xl font-bold">{t.auth.forgotTitle}</h1>
      <p className="mt-2 text-sm text-zinc-600">{t.auth.forgotIntro}</p>

      <Notice state={state} />

      <form action={formAction} className="mt-5 space-y-4">
        <label className="block text-sm font-medium">
          {t.auth.email}
          <input name="email" type="email" required autoComplete="email" className="field mt-1" />
        </label>
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? t.auth.pleaseWait : t.auth.forgotButton}
        </button>
      </form>

      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="font-semibold text-brand hover:underline">
          {t.auth.backToLogin}
        </Link>
      </p>
    </div>
  );
}

type LinkState =
  | { status: 'checking' }
  | { status: 'invalid' }
  | { status: 'ready'; accessToken: string; refreshToken: string };

/**
 * Step 2: the page the email link opens. The link carries a one-time login
 * after the "#" in the address (never sent to the server by the browser), so
 * it is read here and posted together with the new password.
 */
export function ResetPasswordForm({ loggedIn }: { loggedIn: boolean }) {
  const { t } = useI18n();
  const [link, setLink] = useState<LinkState>({ status: 'checking' });
  const [state, formAction, pending] = useActionState<FormState, FormData>(updatePassword, null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = params.get('access_token') ?? '';
    const refreshToken = params.get('refresh_token') ?? '';

    if (accessToken && refreshToken) {
      // Take the one-time login out of the address bar and browser history.
      window.history.replaceState(null, '', window.location.pathname);
      setLink({ status: 'ready', accessToken, refreshToken });
    } else if (loggedIn && !params.get('error') && !params.get('error_code')) {
      setLink({ status: 'ready', accessToken: '', refreshToken: '' });
    } else {
      setLink({ status: 'invalid' });
    }
  }, [loggedIn]);

  const done = Boolean(state?.message);

  return (
    <div className={card}>
      <h1 className="text-2xl font-bold">{t.auth.resetTitle}</h1>

      {link.status === 'checking' && (
        <p className="mt-4 text-sm text-zinc-500">{t.auth.pleaseWait}</p>
      )}

      {link.status === 'invalid' && (
        <>
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {t.auth.resetLinkError}
          </p>
          <Link href="/forgot-password" className="btn-primary mt-5 w-full">
            {t.auth.requestNewLink}
          </Link>
        </>
      )}

      {link.status === 'ready' && (
        <>
          <Notice state={state} />

          {done ? (
            <Link href="/" className="btn-primary mt-5 w-full">
              {t.auth.continueShopping}
            </Link>
          ) : (
            <form action={formAction} className="mt-5 space-y-4">
              <input type="hidden" name="access_token" value={link.accessToken} />
              <input type="hidden" name="refresh_token" value={link.refreshToken} />

              <label className="block text-sm font-medium">
                {t.auth.newPassword}
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="field mt-1"
                />
                <span className="mt-1 block text-xs font-normal text-zinc-500">
                  {t.auth.passwordHint}
                </span>
              </label>

              <label className="block text-sm font-medium">
                {t.auth.confirmPassword}
                <input
                  name="confirm"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="field mt-1"
                />
              </label>

              <button type="submit" disabled={pending} className="btn-primary w-full">
                {pending ? t.auth.pleaseWait : t.auth.resetButton}
              </button>

              {state?.error === t.auth.resetLinkError && (
                <p className="text-center text-sm">
                  <Link
                    href="/forgot-password"
                    className="font-semibold text-brand hover:underline"
                  >
                    {t.auth.requestNewLink}
                  </Link>
                </p>
              )}
            </form>
          )}
        </>
      )}
    </div>
  );
}
