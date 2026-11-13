'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toggleWishlist } from '@/app/(store)/actions';
import { useI18n } from '@/i18n/provider';
import { HeartIcon } from '@/components/icons';
import { toast } from '@/components/store/toast';

/** Heart in the corner of a product picture. Sends guests to the login page. */
export function WishlistHeart({
  productId,
  initial,
}: {
  productId: string;
  initial: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [inWishlist, setInWishlist] = useState(initial);
  const [pops, setPops] = useState(0);
  const [pending, startTransition] = useTransition();
  const label = inWishlist ? t.product.removeWishlist : t.product.addWishlist;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={inWishlist}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await toggleWishlist(productId);
          if (result.ok) {
            setInWishlist(result.inWishlist);
            setPops((value) => value + 1);
          } else if (result.needLogin) {
            router.push(`/login?next=${encodeURIComponent(pathname)}`);
          } else {
            toast({ text: result.error, tone: 'error' });
          }
        })
      }
      className={`absolute right-2 top-2 z-10 grid size-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors duration-300 hover:text-sale ${
        inWishlist ? 'text-sale' : 'text-ink'
      }`}
    >
      {/* A new key restarts the pop on every click. */}
      <span key={pops} className={pops > 0 ? 'animate-pop' : ''}>
        <HeartIcon filled={inWishlist} className="size-5" />
      </span>
    </button>
  );
}
