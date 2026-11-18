'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/provider';

const useL = () => {
  const { locale } = useI18n();
  return (bn: string, en: string) => (locale === 'bn' ? bn : en);
};

const label = 'block text-sm font-medium';

// ---------------------------------------------------------------------
// Price: "regular price" + optional "discount price", the way the shop
// owner thinks about it. The server turns these into price / compare_at_price.
// ---------------------------------------------------------------------

export function PriceFields({
  regular: initialRegular,
  discount: initialDiscount,
}: {
  regular: number | null;
  discount: number | null;
}) {
  const L = useL();
  const [regular, setRegular] = useState(initialRegular === null ? '' : String(initialRegular));
  const [discount, setDiscount] = useState(initialDiscount === null ? '' : String(initialDiscount));

  const regularValue = Number(regular);
  const discountValue = Number(discount);
  const hasRegular = regular !== '' && regularValue >= 0;
  const hasDiscount = discount !== '';
  const badDiscount = hasDiscount && hasRegular && !(discountValue < regularValue);
  const saved = regularValue - discountValue;
  const percent = regularValue > 0 ? Math.round((saved / regularValue) * 100) : 0;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          {L('দাম (৳)', 'Price (৳)')} *
          <input
            name="regular_price"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            required
            value={regular}
            onChange={(event) => setRegular(event.target.value)}
            placeholder="750"
            className="field mt-1 text-lg font-semibold"
          />
        </label>
        <label className={label}>
          {L('ডিসকাউন্ট দাম (৳) — ছাড় না থাকলে ফাঁকা রাখুন', 'Discount price (৳) — leave empty for no discount')}
          <input
            name="discount_price"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={discount}
            onChange={(event) => setDiscount(event.target.value)}
            placeholder="650"
            className="field mt-1 text-lg font-semibold"
          />
        </label>
      </div>

      {badDiscount ? (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
          {L(
            'ডিসকাউন্ট দাম মূল দামের চেয়ে কম হতে হবে।',
            'The discount price must be lower than the price.',
          )}
        </p>
      ) : (
        hasRegular && (
          <p className="mt-3 rounded-lg bg-blush p-3 text-sm text-brand-dark">
            {L('কাস্টমার দেখবে:', 'Customers will see:')}{' '}
            <strong className="text-base">৳{hasDiscount ? discountValue : regularValue}</strong>
            {hasDiscount && (
              <>
                {' '}
                <span className="text-zinc-500 line-through">৳{regularValue}</span>{' '}
                <span className="font-semibold text-green-700">
                  {L(`৳${saved} ছাড় (${percent}%)`, `৳${saved} off (${percent}%)`)}
                </span>
              </>
            )}
          </p>
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Sizes / colours / stock
// ---------------------------------------------------------------------

export type VariantRow = {
  id?: string;
  size: string;
  color: string;
  stock: number;
  price: number | null;
};

const COMMON_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
const splitList = (value: string) =>
  value
    .split(/[,،\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

export function VariantsField({
  initial,
  productStock,
}: {
  initial: VariantRow[];
  productStock: number;
}) {
  const L = useL();
  const [rows, setRows] = useState<(VariantRow & { key: string })[]>(
    initial.map((row) => ({ ...row, key: row.id ?? crypto.randomUUID() })),
  );
  const update = (key: string, patch: Partial<VariantRow>) =>
    setRows(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  // Quick builder
  const [sizes, setSizes] = useState<string[]>([]);
  const [otherSizes, setOtherSizes] = useState('');
  const [colors, setColors] = useState('');
  const [stock, setStock] = useState('10');

  const addFromBuilder = () => {
    const sizeList = [...new Set([...sizes, ...splitList(otherSizes)])];
    const colorList = [...new Set(splitList(colors))];
    if (sizeList.length === 0 && colorList.length === 0) return;

    const stockValue = Math.max(0, Math.round(Number(stock) || 0));
    const taken = new Set(rows.map((row) => `${row.size.trim()}|${row.color.trim()}`));
    const added: (VariantRow & { key: string })[] = [];
    // Colour by colour, so each colour's sizes sit together.
    for (const color of colorList.length > 0 ? colorList : ['']) {
      for (const size of sizeList.length > 0 ? sizeList : ['']) {
        if (taken.has(`${size}|${color}`)) continue;
        added.push({ key: crypto.randomUUID(), size, color, stock: stockValue, price: null });
      }
    }
    setRows([...rows, ...added]);
    setSizes([]);
    setOtherSizes('');
    setColors('');
  };

  const total = rows.reduce((sum, row) => sum + (Number(row.stock) || 0), 0);

  return (
    <div>
      <input
        type="hidden"
        name="variants"
        value={JSON.stringify(rows.map(({ key: _key, ...row }) => row))}
      />

      {/* Quick builder */}
      <div className="rounded-xl bg-zinc-50 p-3 sm:p-4">
        <p className="text-sm font-semibold">
          {L('১. কোন কোন সাইজ আছে? চাপ দিয়ে বেছে নিন', '1. Which sizes do you have? Tap to pick')}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {COMMON_SIZES.map((size) => {
            const on = sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                aria-pressed={on}
                onClick={() => setSizes(on ? sizes.filter((item) => item !== size) : [...sizes, size])}
                className={`min-w-12 rounded-lg border px-3 py-2 text-sm font-semibold ${
                  on
                    ? 'border-brand bg-brand text-white'
                    : 'border-border bg-white hover:border-brand'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_8rem]">
          <label className={label}>
            {L('অন্য সাইজ (কমা দিয়ে)', 'Other sizes (comma separated)')}
            <input
              value={otherSizes}
              onChange={(event) => setOtherSizes(event.target.value)}
              placeholder={L('যেমন: 1-2Y, 2-3Y, 42', 'e.g. 1-2Y, 2-3Y, 42')}
              className="field mt-1"
            />
          </label>
          <label className={label}>
            {L('২. রং (কমা দিয়ে)', '2. Colours (comma separated)')}
            <input
              value={colors}
              onChange={(event) => setColors(event.target.value)}
              placeholder={L('যেমন: Black, Maroon', 'e.g. Black, Maroon')}
              className="field mt-1"
            />
          </label>
          <label className={label}>
            {L('৩. প্রতিটির স্টক', '3. Stock of each')}
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              className="field mt-1"
            />
          </label>
        </div>

        <button type="button" onClick={addFromBuilder} className="btn-outline mt-3 w-full bg-white sm:w-auto">
          {L('+ তালিকায় যোগ করুন', '+ Add to the list')}
        </button>
      </div>

      {/* The list */}
      {rows.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold">
            {L(`তালিকা — মোট স্টক ${total}`, `List — total stock ${total}`)}
          </p>
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.key}
                className="grid grid-cols-2 items-end gap-2 rounded-lg border border-border p-2 sm:grid-cols-[1fr_1fr_6rem_8rem_auto]"
              >
                <label className="text-xs font-medium text-zinc-600">
                  {L('সাইজ', 'Size')}
                  <input
                    value={row.size}
                    onChange={(event) => update(row.key, { size: event.target.value })}
                    className="field mt-0.5 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-zinc-600">
                  {L('রং', 'Colour')}
                  <input
                    value={row.color}
                    onChange={(event) => update(row.key, { color: event.target.value })}
                    className="field mt-0.5 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-zinc-600">
                  {L('স্টক', 'Stock')}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={row.stock}
                    onChange={(event) => update(row.key, { stock: Number(event.target.value) })}
                    className="field mt-0.5 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-zinc-600">
                  {L('আলাদা দাম (ইচ্ছা হলে)', 'Own price (optional)')}
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={row.price ?? ''}
                    onChange={(event) =>
                      update(row.key, {
                        price: event.target.value === '' ? null : Number(event.target.value),
                      })
                    }
                    className="field mt-0.5 text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setRows(rows.filter((item) => item.key !== row.key))}
                  className="col-span-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 sm:col-span-1"
                >
                  {L('সরান', 'Remove')}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {L(
              '"আলাদা দাম" ফাঁকা রাখলে প্রোডাক্টের দামই ধরা হবে।',
              'Leave "own price" empty to use the product price.',
            )}
          </p>
          <input type="hidden" name="stock" value={productStock} />
        </div>
      ) : (
        <label className={`${label} mt-4 max-w-xs`}>
          {L('সাইজ/রং না থাকলে — মোট স্টক', 'No sizes or colours? Total stock')}
          <input
            name="stock"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            defaultValue={productStock}
            className="field mt-1"
          />
        </label>
      )}
    </div>
  );
}
