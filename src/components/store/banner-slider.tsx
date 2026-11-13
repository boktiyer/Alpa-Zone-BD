'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { tr } from '@/i18n/config';
import { useI18n } from '@/i18n/provider';
import type { Banner } from '@/types/database';

const AUTOPLAY_MS = 5000;

/** Banner slider: swipe, dots, and auto-advance every 5 seconds. */
export function BannerSlider({ banners }: { banners: Banner[] }) {
  const { locale, t } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = (index: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  };

  useEffect(() => {
    if (paused || banners.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => goTo((active + 1) % banners.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [active, paused, banners.length]);

  if (banners.length === 0) return null;

  return (
    <section
      aria-label="Banners"
      className="container-page pt-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div className="relative">
        <div
          ref={track}
          onScroll={(event) => {
            const el = event.currentTarget;
            setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl"
        >
          {banners.map((banner, index) => {
            const title = tr(banner, 'title', locale);
            const subtitle = tr(banner, 'subtitle', locale);

            // A banner without a title is finished artwork (its text is part of
            // the picture): show all of it, undarkened, and make it one big link.
            if (!title && !subtitle) {
              const art = (
                <>
                  <Image
                    src={banner.image_url}
                    alt=""
                    aria-hidden
                    fill
                    sizes="128px"
                    className="scale-110 object-cover blur-2xl"
                  />
                  <Image
                    src={banner.image_url}
                    alt=""
                    fill
                    priority={index === 0}
                    sizes="(min-width: 1280px) 1248px, 100vw"
                    className="object-contain"
                  />
                </>
              );
              const artClass =
                'relative block aspect-[2/1] w-full shrink-0 snap-center overflow-hidden bg-royal-900';

              return banner.link_url ? (
                <Link
                  key={banner.id}
                  href={banner.link_url}
                  aria-label={t.home.shopNow}
                  className={artClass}
                >
                  {art}
                </Link>
              ) : (
                <div key={banner.id} className={artClass}>
                  {art}
                </div>
              );
            }

            return (
              <div
                key={banner.id}
                className="relative aspect-[2/1] w-full shrink-0 snap-center overflow-hidden bg-royal-900"
              >
                <Image
                  src={banner.image_url}
                  alt=""
                  fill
                  priority={index === 0}
                  sizes="(min-width: 1280px) 1248px, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />

                <div className="absolute inset-0 flex flex-col items-start justify-center gap-2 p-5 text-white sm:gap-3 sm:p-10">
                  {title && (
                    <h2 className="max-w-xl text-2xl font-bold leading-tight sm:text-4xl">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="max-w-md text-sm text-white/90 sm:text-lg">{subtitle}</p>
                  )}
                  {banner.link_url && (
                    <Link
                      href={banner.link_url}
                      className="mt-1 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-royal-700 hover:bg-royal-50 sm:text-base"
                    >
                      {t.home.shopNow}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {banners.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`${index + 1} / ${banners.length}`}
                aria-current={index === active}
                onClick={() => goTo(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === active ? 'w-7 bg-white' : 'w-2.5 bg-white/55 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
