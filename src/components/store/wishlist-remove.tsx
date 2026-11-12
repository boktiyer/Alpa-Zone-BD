'use client';

import { useTransition } from 'react';
import { toggleWishlist } from '@/app/(store)/actions';
import { useI18n } from '@/i18n/provider';
import { TrashIcon } from '@/components/icons';

/** "Remove" button under a product on the wishlist page. */
export function WishlistRemove({ productId }: { productId: string }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleWishlist(productId);
        })
      }
      className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-white py-2 text-sm font-medium text-zinc-700 hover:border-red-300 hover:text-red-700 disabled:opacity-60"
    >
      <TrashIcon className="size-4" />
      {t.cart.remove}
    </button>
  );
}
