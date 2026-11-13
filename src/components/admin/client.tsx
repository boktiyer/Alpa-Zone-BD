'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/i18n/provider';

const useL = () => {
  const { locale } = useI18n();
  return (bn: string, en: string) => (locale === 'bn' ? bn : en);
};

// ---------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------

export function AdminNav() {
  const L = useL();
  const pathname = usePathname();
  const items = [
    { href: '/admin', label: L('ড্যাশবোর্ড', 'Dashboard') },
    { href: '/admin/orders', label: L('অর্ডার', 'Orders') },
    { href: '/admin/products', label: L('প্রোডাক্ট', 'Products') },
    { href: '/admin/categories', label: L('ক্যাটাগরি', 'Categories') },
    { href: '/admin/stock', label: L('স্টক', 'Stock') },
    { href: '/admin/customers', label: L('কাস্টমার', 'Customers') },
    { href: '/admin/coupons', label: L('কুপন', 'Coupons') },
    { href: '/admin/banners', label: L('ব্যানার', 'Banners') },
    { href: '/admin/reports', label: L('রিপোর্ট', 'Reports') },
  ];

  return (
    <nav
      aria-label="Admin"
      className="bg-footer text-white/80 print:hidden lg:w-56 lg:shrink-0 lg:border-t lg:border-white/10"
    >
      <ul className="no-scrollbar flex gap-1 overflow-x-auto px-3 py-2 text-sm font-medium lg:sticky lg:top-0 lg:flex-col lg:overflow-visible lg:py-4">
        {items.map((item) => {
          const active =
            item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`block whitespace-nowrap rounded-xl px-3 py-2 transition-colors duration-200 ${
                  active ? 'bg-gold font-semibold text-brand-dark' : 'hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ---------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------

/** Submit button that shows "…" while its form is being saved. */
export function SubmitButton({
  children,
  className = 'btn-primary',
}: {
  children: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? '…' : children}
    </button>
  );
}

/** Submit button that asks "are you sure?" first (for delete). */
export function ConfirmButton({
  children,
  message,
  className = 'text-sm font-semibold text-red-700 hover:underline',
}: {
  children: ReactNode;
  message: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {pending ? '…' : children}
    </button>
  );
}

export function PrintButton({ children }: { children: ReactNode }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-outline print:hidden">
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------
// Image upload (browser → Supabase Storage; only admins are allowed by RLS)
// ---------------------------------------------------------------------

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function uploadImages(bucket: string, files: File[]): Promise<{ urls: string[]; error?: string }> {
  const supabase = createClient();
  const urls: string[] = [];

  for (const file of files) {
    if (!IMAGE_TYPES.includes(file.type)) return { urls, error: `${file.name}: JPG, PNG or WebP only.` };
    if (file.size > MAX_IMAGE_BYTES) return { urls, error: `${file.name}: larger than 5 MB.` };

    const extension = file.type.split('/')[1].replace('jpeg', 'jpg');
    const path = `${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, cacheControl: '31536000' });
    if (error) return { urls, error: error.message };

    urls.push(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl);
  }
  return { urls };
}

/** Several pictures for a product. The first one is the main picture. */
export function ImagesField({ initial }: { initial: string[] }) {
  const L = useL();
  const [images, setImages] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      {images.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-3">
          {images.map((url, index) => (
            <li key={url} className="w-28 text-center text-xs">
              <span
                className={`relative block aspect-square overflow-hidden rounded-lg border-2 bg-zinc-100 ${
                  index === 0 ? 'border-brand' : 'border-zinc-200'
                }`}
              >
                <Image src={url} alt="" fill sizes="112px" className="object-cover" />
              </span>
              {index === 0 ? (
                <span className="mt-1 block font-semibold text-brand">
                  {L('মূল ছবি', 'Main picture')}
                </span>
              ) : (
                <button
                  type="button"
                  className="mt-1 block w-full font-medium text-brand hover:underline"
                  onClick={() => setImages([url, ...images.filter((item) => item !== url)])}
                >
                  {L('মূল ছবি করুন', 'Make main')}
                </button>
              )}
              <button
                type="button"
                className="block w-full font-medium text-red-700 hover:underline"
                onClick={() => setImages(images.filter((item) => item !== url))}
              >
                {L('সরান', 'Remove')}
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center font-semibold text-brand hover:border-brand hover:bg-blush">
        <span className="text-2xl leading-none" aria-hidden>
          +
        </span>
        {busy
          ? L('আপলোড হচ্ছে…', 'Uploading…')
          : L('এখানে চাপ দিয়ে ছবি দিন', 'Tap here to add pictures')}
        <span className="text-xs font-normal text-zinc-500">
          {L(
            'একসাথে কয়েকটা ছবি দেওয়া যায়। প্রথম ছবিটাই মূল ছবি।',
            'You can pick several at once. The first picture is the main one.',
          )}
        </span>
        <input
          type="file"
          multiple
          accept={IMAGE_TYPES.join(',')}
          disabled={busy}
          className="sr-only"
          onChange={async (event) => {
            const files = [...(event.target.files ?? [])];
            event.target.value = '';
            if (files.length === 0) return;
            setBusy(true);
            setError(null);
            const result = await uploadImages('product-images', files);
            setImages((current) => [...current, ...result.urls]);
            setError(result.error ?? null);
            setBusy(false);
          }}
        />
      </label>
      <p className="mt-1 text-xs text-zinc-500">JPG / PNG / WebP · max 5 MB</p>
      {error && (
        <p role="alert" className="mt-1 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** One picture (banner). Stores its public URL in a hidden field. */
export function SingleImageField({
  name,
  bucket,
  initial,
}: {
  name: string;
  bucket: string;
  initial: string;
}) {
  const L = useL();
  const [url, setUrl] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      {url && (
        <span className="relative mb-2 block aspect-[16/6] w-full max-w-md overflow-hidden rounded-lg bg-zinc-100">
          <Image src={url} alt="" fill sizes="448px" className="object-cover" />
        </span>
      )}
      <label className="btn-outline cursor-pointer">
        {busy
          ? L('আপলোড হচ্ছে…', 'Uploading…')
          : url
            ? L('ছবি বদলান', 'Change picture')
            : L('ছবি আপলোড করুন', 'Upload picture')}
        <input
          type="file"
          accept={IMAGE_TYPES.join(',')}
          disabled={busy}
          className="sr-only"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            setBusy(true);
            setError(null);
            const result = await uploadImages(bucket, [file]);
            if (result.urls[0]) setUrl(result.urls[0]);
            setError(result.error ?? null);
            setBusy(false);
          }}
        />
      </label>
      {error && (
        <p role="alert" className="mt-1 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

