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
    <nav aria-label="Admin" className="border-b border-zinc-200 bg-white print:hidden">
      <ul className="container-page no-scrollbar flex gap-1 overflow-x-auto py-1.5 text-sm font-medium">
        {items.map((item) => {
          const active =
            item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`block whitespace-nowrap rounded-md px-3 py-1.5 ${
                  active ? 'bg-royal-600 text-white' : 'hover:bg-royal-50 hover:text-royal-700'
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
function ImagesField({ initial }: { initial: string[] }) {
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
                  index === 0 ? 'border-royal-600' : 'border-zinc-200'
                }`}
              >
                <Image src={url} alt="" fill sizes="112px" className="object-cover" />
              </span>
              {index === 0 ? (
                <span className="mt-1 block font-semibold text-royal-700">
                  {L('মূল ছবি', 'Main picture')}
                </span>
              ) : (
                <button
                  type="button"
                  className="mt-1 block w-full font-medium text-royal-700 hover:underline"
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

      <label className="btn-outline cursor-pointer">
        {busy ? L('আপলোড হচ্ছে…', 'Uploading…') : L('+ ছবি যোগ করুন', '+ Add pictures')}
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

// ---------------------------------------------------------------------
// Product form parts: pictures + size/colour/stock/price variants
// ---------------------------------------------------------------------

export type VariantRow = {
  id?: string;
  size: string;
  color: string;
  stock: number;
  price: number | null;
};

function VariantsField({ initial }: { initial: VariantRow[] }) {
  const L = useL();
  const [rows, setRows] = useState<(VariantRow & { key: string })[]>(
    initial.map((row) => ({ ...row, key: row.id ?? crypto.randomUUID() })),
  );
  const update = (key: string, patch: Partial<VariantRow>) =>
    setRows(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <div>
      <input
        type="hidden"
        name="variants"
        value={JSON.stringify(rows.map(({ key: _key, ...row }) => row))}
      />

      {rows.length > 0 && (
        <div className="mb-3 space-y-2">
          {rows.map((row) => (
            <div
              key={row.key}
              className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 p-2 sm:grid-cols-[1fr_1fr_6rem_8rem_auto]"
            >
              <input
                aria-label={L('সাইজ', 'Size')}
                placeholder={L('সাইজ (M, 42…)', 'Size (M, 42…)')}
                value={row.size}
                onChange={(event) => update(row.key, { size: event.target.value })}
                className="field"
              />
              <input
                aria-label={L('রং', 'Colour')}
                placeholder={L('রং', 'Colour')}
                value={row.color}
                onChange={(event) => update(row.key, { color: event.target.value })}
                className="field"
              />
              <input
                type="number"
                min={0}
                step={1}
                aria-label={L('স্টক', 'Stock')}
                placeholder={L('স্টক', 'Stock')}
                value={row.stock}
                onChange={(event) => update(row.key, { stock: Number(event.target.value) })}
                className="field"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                aria-label={L('আলাদা দাম', 'Own price')}
                placeholder={L('আলাদা দাম', 'Own price')}
                value={row.price ?? ''}
                onChange={(event) =>
                  update(row.key, {
                    price: event.target.value === '' ? null : Number(event.target.value),
                  })
                }
                className="field"
              />
              <button
                type="button"
                onClick={() => setRows(rows.filter((item) => item.key !== row.key))}
                className="col-span-2 text-sm font-semibold text-red-700 hover:underline sm:col-span-1"
              >
                {L('সরান', 'Remove')}
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="btn-outline"
        onClick={() =>
          setRows([
            ...rows,
            { key: crypto.randomUUID(), size: '', color: '', stock: 0, price: null },
          ])
        }
      >
        {L('+ ভ্যারিয়েন্ট যোগ করুন', '+ Add variant')}
      </button>
      <p className="mt-1 text-xs text-zinc-500">
        {L(
          '"আলাদা দাম" ফাঁকা রাখলে প্রোডাক্টের দামই ধরা হবে। ভ্যারিয়েন্ট থাকলে উপরের স্টক ব্যবহার হয় না।',
          'Leave "own price" empty to use the product price. With variants, the stock field above is not used.',
        )}
      </p>
    </div>
  );
}

export function ProductMediaFields({
  images,
  variants,
}: {
  images: string[];
  variants: VariantRow[];
}) {
  const L = useL();
  return (
    <>
      <fieldset className="rounded-xl border border-zinc-200 bg-white p-4">
        <legend className="px-1 font-semibold">{L('ছবি', 'Pictures')}</legend>
        <ImagesField initial={images} />
      </fieldset>
      <fieldset className="rounded-xl border border-zinc-200 bg-white p-4">
        <legend className="px-1 font-semibold">
          {L('সাইজ / রং / স্টক', 'Size / colour / stock')}
        </legend>
        <VariantsField initial={variants} />
      </fieldset>
    </>
  );
}
