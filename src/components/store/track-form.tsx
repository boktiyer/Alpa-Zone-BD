'use client';

import { useActionState } from 'react';
import { trackOrder, type TrackState } from '@/app/(store)/actions';
import { useI18n } from '@/i18n/provider';
import { OrderDetails } from '@/components/store/order-details';

export function TrackForm({ defaultOrderNumber }: { defaultOrderNumber: string }) {
  const { locale, t } = useI18n();
  const [state, formAction, pending] = useActionState<TrackState, FormData>(trackOrder, null);

  return (
    <>
      <form
        action={formAction}
        className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-5"
      >
        <label className="block text-sm font-medium">
          {t.track.orderNumber}
          <input
            name="order_number"
            required
            defaultValue={defaultOrderNumber}
            placeholder="AZ-1001"
            autoCapitalize="characters"
            autoComplete="off"
            className="field mt-1 uppercase"
          />
        </label>
        <label className="block text-sm font-medium">
          {t.track.phone}
          <input
            name="phone"
            type="tel"
            required
            inputMode="numeric"
            placeholder="01XXXXXXXXX"
            autoComplete="tel"
            className="field mt-1"
          />
        </label>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? t.track.searching : t.track.button}
        </button>
      </form>

      <div aria-live="polite" className="mt-5">
        {state?.error && (
          <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-800">
            {state.error}
          </p>
        )}
        {state?.order && <OrderDetails order={state.order} locale={locale} t={t} />}
      </div>
    </>
  );
}
