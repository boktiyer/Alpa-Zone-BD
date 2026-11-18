'use client';

import { useLinkStatus } from 'next/link';

/**
 * Feedback after a product card is tapped, until the product page starts to show.
 * Both pieces must sit inside the card's <Link> (useLinkStatus reads that Link).
 * They are always rendered and only fade in, so nothing on the card moves.
 */

/** Soft veil + gold spinner over the product photo. */
export function CardImagePending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-[1] grid place-items-center bg-white/45 backdrop-blur-[2px] transition-opacity duration-300 ${
        pending ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span className="size-9 animate-spin rounded-full border-[3px] border-gold/30 border-t-brand" />
    </span>
  );
}

/** Gold ring around the whole card. */
export function CardRingPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-[2] rounded-xl ring-2 ring-gold transition-opacity duration-300 ${
        pending ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}
