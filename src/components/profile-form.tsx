'use client';

import { useActionState } from 'react';
import { updateProfile, type FormState } from '@/app/auth/actions';
import { useI18n } from '@/i18n/provider';
import type { Profile } from '@/types/database';

export function ProfileForm({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateProfile, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      {state?.message && (
        <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          {state.message}
        </p>
      )}

      <label className="block text-sm font-medium">
        {t.auth.email}
        <input value={profile.email ?? ''} disabled readOnly className="field mt-1" />
        <span className="mt-1 block text-xs font-normal text-zinc-500">
          {t.account.emailLocked}
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {t.auth.fullName}
          <input
            name="full_name"
            required
            defaultValue={profile.full_name ?? ''}
            autoComplete="name"
            className="field mt-1"
          />
        </label>
        <label className="block text-sm font-medium">
          {t.auth.phone}
          <input
            name="phone"
            type="tel"
            required
            defaultValue={profile.phone ?? ''}
            autoComplete="tel"
            className="field mt-1"
          />
        </label>
      </div>

      <label className="block text-sm font-medium">
        {t.account.address}
        <textarea
          name="address"
          rows={2}
          defaultValue={profile.address ?? ''}
          autoComplete="street-address"
          className="field mt-1"
        />
      </label>

      <label className="block text-sm font-medium">
        {t.account.district}
        <input name="district" defaultValue={profile.district ?? ''} className="field mt-1" />
      </label>

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? t.auth.pleaseWait : t.account.save}
      </button>
    </form>
  );
}
