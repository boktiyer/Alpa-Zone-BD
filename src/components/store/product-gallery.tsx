'use client';

import Image from 'next/image';
import { useState } from 'react';

type GalleryImage = { id: string; url: string; alt: string | null };

/** Main picture + thumbnails. Clicking a thumbnail shows it large. */
export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0];

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-royal-50">
        {main && (
          <Image
            key={main.id}
            src={main.url}
            alt={main.alt || name}
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        )}
      </div>

      {images.length > 1 && (
        <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                aria-label={`${name} ${index + 1}`}
                aria-current={index === active}
                onClick={() => setActive(index)}
                className={`relative block size-20 overflow-hidden rounded-lg border-2 bg-royal-50 ${
                  index === active ? 'border-royal-600' : 'border-transparent hover:border-royal-300'
                }`}
              >
                <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
