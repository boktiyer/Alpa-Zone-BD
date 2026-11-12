'use client';

import { useActionState } from 'react';
import { applyCoupon, removeCoupon, type FormState } from '@/app/(store)/actions';
import { useI18n } from '@/i18n/provider';

export function CouponForm({ appliedCode }: { appliedCode: string | null }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState<FormState, FormData>(applyCoupon, null);

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
        <span>
          {t.cart.couponApplied} <span className="font-bold">{appliedCode}</span>
        </span>
        <form action={removeCoupon}>
          <button type="submit" className="font-semibold underline">
            {t.cart.removeCoupon}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <label htmlFor="coupon-code" className="text-sm font-medium">
        {t.cart.coupon}
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="coupon-code"
          name="code"
          autoCapitalize="characters"
          autoComplete="off"
          className="field uppercase"
        />
        <button type="submit" disabled={pending} className="btn-outline shrink-0">
          {pending ? '…' : t.cart.applyCoupon}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
