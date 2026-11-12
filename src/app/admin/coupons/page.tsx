import type { Metadata } from 'next';
import Link from 'next/link';
import { dhakaDay, getAdminI18n, requireAdmin } from '@/lib/admin';
import { formatDate, formatNumber, formatPrice } from '@/lib/format';
import type { Coupon } from '@/types/database';
import { deleteCoupon, saveCoupon } from '@/app/admin/actions';
import { ConfirmButton, SubmitButton } from '@/components/admin/client';
import { card, Notice, PageTitle, TableWrap, td, th } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Coupons' };

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; ok?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { locale, t, L } = await getAdminI18n();
  const supabase = await requireAdmin();

  const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  const coupons = (data as Coupon[] | null) ?? [];
  const editing = coupons.find((item) => item.id === params.edit);
  const label = 'block text-sm font-medium';
  const now = Date.now();

  return (
    <>
      <Notice params={params} okText={L('সেভ হয়েছে।', 'Saved.')} />
      <PageTitle title={L('কুপন', 'Coupons')} />

      <form
        key={editing?.id ?? 'new'}
        action={saveCoupon}
        className={`${card} mb-6 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4`}
      >
        <h2 className="font-semibold sm:col-span-2 lg:col-span-4">
          {editing ? L('কুপন এডিট', 'Edit coupon') : L('নতুন কুপন', 'New coupon')}
        </h2>
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <label className={label}>
          {L('কোড', 'Code')} *
          <input
            name="code"
            required
            defaultValue={editing?.code}
            placeholder="EID20"
            className="field mt-1 uppercase"
          />
        </label>
        <label className={label}>
          {L('ছাড়ের ধরন', 'Discount type')}
          <select name="discount_type" defaultValue={editing?.discount_type ?? 'percent'} className="field mt-1">
            <option value="percent">{L('শতাংশ (%)', 'Percent (%)')}</option>
            <option value="fixed">{L('নির্দিষ্ট টাকা (৳)', 'Fixed amount (৳)')}</option>
          </select>
        </label>
        <label className={label}>
          {L('ছাড়ের পরিমাণ', 'Discount value')} *
          <input
            name="discount_value"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={editing?.discount_value}
            className="field mt-1"
          />
        </label>
        <label className={label}>
          {L('সর্বনিম্ন অর্ডার (৳)', 'Minimum order (৳)')}
          <input
            name="min_order_amount"
            type="number"
            min={0}
            defaultValue={editing?.min_order_amount ?? 0}
            className="field mt-1"
          />
        </label>
        <label className={label}>
          {L('সর্বোচ্চ ছাড় (৳) — ঐচ্ছিক', 'Maximum discount (৳) — optional')}
          <input
            name="max_discount"
            type="number"
            min={0}
            defaultValue={editing?.max_discount ?? ''}
            className="field mt-1"
          />
        </label>
        <label className={label}>
          {L('কতবার ব্যবহার করা যাবে — ঐচ্ছিক', 'Usage limit — optional')}
          <input
            name="usage_limit"
            type="number"
            min={1}
            step={1}
            defaultValue={editing?.usage_limit ?? ''}
            className="field mt-1"
          />
        </label>
        <label className={label}>
          {L('মেয়াদ শেষ — ঐচ্ছিক', 'Expiry date — optional')}
          <input
            name="expires_at"
            type="date"
            defaultValue={editing?.expires_at ? dhakaDay(editing.expires_at) : ''}
            className="field mt-1"
          />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={editing?.is_active ?? true}
            className="size-4 accent-royal-600"
          />
          {L('চালু', 'Active')}
        </label>
        <label className={`${label} sm:col-span-2 lg:col-span-4`}>
          {L('নোট (শুধু আপনার জন্য)', 'Note (only for you)')}
          <input name="description" defaultValue={editing?.description ?? ''} className="field mt-1" />
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
          <SubmitButton>{t.account.save}</SubmitButton>
          {editing && (
            <Link href="/admin/coupons" className="btn-outline">
              {L('বাতিল', 'Cancel')}
            </Link>
          )}
        </div>
      </form>

      {coupons.length > 0 && (
        <TableWrap>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className={th}>{L('কোড', 'Code')}</th>
                <th className={th}>{t.cart.discount}</th>
                <th className={th}>{L('সর্বনিম্ন অর্ডার', 'Min order')}</th>
                <th className={th}>{L('ব্যবহার', 'Used')}</th>
                <th className={th}>{L('মেয়াদ', 'Expires')}</th>
                <th className={th}>{t.admin.status}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {coupons.map((coupon) => {
                const expired = coupon.expires_at ? Date.parse(coupon.expires_at) < now : false;
                return (
                  <tr key={coupon.id}>
                    <td className={`${td} font-mono font-bold`}>{coupon.code}</td>
                    <td className={td}>
                      {coupon.discount_type === 'percent'
                        ? `${formatNumber(coupon.discount_value, locale)}%`
                        : formatPrice(coupon.discount_value, locale)}
                      {coupon.max_discount !== null && (
                        <span className="block text-xs text-zinc-500">
                          {L('সর্বোচ্চ', 'max')} {formatPrice(coupon.max_discount, locale)}
                        </span>
                      )}
                    </td>
                    <td className={td}>{formatPrice(coupon.min_order_amount, locale)}</td>
                    <td className={td}>
                      {formatNumber(coupon.used_count, locale)}
                      {coupon.usage_limit !== null && ` / ${formatNumber(coupon.usage_limit, locale)}`}
                    </td>
                    <td className={td}>
                      {coupon.expires_at ? formatDate(coupon.expires_at, locale) : '—'}
                    </td>
                    <td className={td}>
                      {expired
                        ? L('মেয়াদ শেষ', 'Expired')
                        : coupon.is_active
                          ? L('চালু', 'Active')
                          : L('বন্ধ', 'Off')}
                    </td>
                    <td className={`${td} whitespace-nowrap text-right`}>
                      <Link
                        href={`/admin/coupons?edit=${coupon.id}`}
                        className="mr-3 text-sm font-semibold text-royal-700 hover:underline"
                      >
                        {L('এডিট', 'Edit')}
                      </Link>
                      <form action={deleteCoupon} className="inline">
                        <input type="hidden" name="id" value={coupon.id} />
                        <ConfirmButton message={L('কুপনটি মুছবেন?', 'Delete this coupon?')}>
                          {L('মুছুন', 'Delete')}
                        </ConfirmButton>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      )}
    </>
  );
}
