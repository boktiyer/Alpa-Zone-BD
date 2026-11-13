'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { login, signup, type FormState } from '@/app/auth/actions';
import { useI18n } from '@/i18n/provider';

export function AuthForm({
  mode,
  next,
  initialError,
}: {
  mode: 'login' | 'signup';
  next?: string;
  initialError?: string;
}) {
  const { t } = useI18n();
  const isSignup = mode === 'signup';
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    isSignup ? signup : login,
    initialError ? { error: initialError } : null,
  );

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold">{isSignup ? t.auth.signupTitle : t.auth.loginTitle}</h1>

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

      <form action={formAction} className="mt-5 space-y-4">
        {next && <input type="hidden" name="next" value={next} />}

        {isSignup && (
          <>
            <label className="block text-sm font-medium">
              {t.auth.fullName}
              <input name="full_name" required autoComplete="name" className="field mt-1" />
            </label>
            <label className="block text-sm font-medium">
              {t.auth.phone}
              <input
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
                className="field mt-1"
              />
            </label>
          </>
        )}

        <label className="block text-sm font-medium">
          {t.auth.email}
          <input name="email" type="email" required autoComplete="email" className="field mt-1" />
        </label>

        <label className="block text-sm font-medium">
          {t.auth.password}
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            className="field mt-1"
          />
          {isSignup && (
            <span className="mt-1 block text-xs font-normal text-zinc-500">
              {t.auth.passwordHint}
            </span>
          )}
        </label>

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? t.auth.pleaseWait : isSignup ? t.auth.signupButton : t.auth.loginButton}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-600">
        {isSignup ? t.auth.haveAccount : t.auth.noAccount}{' '}
        <Link
          href={isSignup ? '/login' : '/signup'}
          className="font-semibold text-brand hover:underline"
        >
          {isSignup ? t.nav.login : t.nav.signup}
        </Link>
      </p>
    </div>
  );
}
