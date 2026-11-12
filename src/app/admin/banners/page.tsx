import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { tr } from '@/i18n/config';
import { getAdminI18n, requireAdmin } from '@/lib/admin';
import type { Banner } from '@/types/database';
import { deleteBanner, saveBanner, toggleBanner } from '@/app/admin/actions';
import { ConfirmButton, SingleImageField, SubmitButton } from '@/components/admin/client';
import { card, Notice, PageTitle } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Banners' };

export default async function AdminBannersPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; ok?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { locale, t, L } = await getAdminI18n();
  const supabase = await requireAdmin();

  const { data } = await supabase.from('banners').select('*').order('sort_order');
  const banners = (data as Banner[] | null) ?? [];
  const editing = banners.find((item) => item.id === params.edit);
  const label = 'block text-sm font-medium';

  return (
    <>
      <Notice params={params} okText={L('সেভ হয়েছে।', 'Saved.')} />
      <PageTitle title={t.admin.banners} />

      <form
        key={editing?.id ?? 'new'}
        action={saveBanner}
        className={`${card} mb-6 grid gap-4 p-4 sm:grid-cols-2`}
      >
        <h2 className="font-semibold sm:col-span-2">
          {editing ? L('ব্যানার এডিট', 'Edit banner') : L('নতুন ব্যানার', 'New banner')}
        </h2>
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="sm:col-span-2">
          <p className={label}>
            {L('ব্যানারের ছবি (চওড়া ছবি ভালো, যেমন ১৬০০×৬০০)', 'Banner picture (wide works best, e.g. 1600×600)')} *
          </p>
          <div className="mt-1">
            <SingleImageField name="image_url" bucket="banners" initial={editing?.image_url ?? ''} />
          </div>
        </div>

        <label className={label}>
          {L('শিরোনাম (বাংলা)', 'Title (Bangla)')}
          <input name="title_bn" defaultValue={editing?.title_bn ?? ''} className="field mt-1" />
        </label>
        <label className={label}>
          {L('শিরোনাম (English)', 'Title (English)')}
          <input name="title_en" defaultValue={editing?.title_en ?? ''} className="field mt-1" />
        </label>
        <label className={label}>
          {L('ছোট লেখা (বাংলা)', 'Subtitle (Bangla)')}
          <input name="subtitle_bn" defaultValue={editing?.subtitle_bn ?? ''} className="field mt-1" />
        </label>
        <label className={label}>
          {L('ছোট লেখা (English)', 'Subtitle (English)')}
          <input name="subtitle_en" defaultValue={editing?.subtitle_en ?? ''} className="field mt-1" />
        </label>
        <label className={label}>
          {L('ক্লিক করলে কোথায় যাবে', 'Link when clicked')}
          <input
            name="link_url"
            defaultValue={editing?.link_url ?? ''}
            placeholder="/category/womens-clothing"
            className="field mt-1"
          />
        </label>
        <label className={label}>
          {L('ক্রম (ছোট সংখ্যা আগে)', 'Order (small number first)')}
          <input
            name="sort_order"
            type="number"
            min={0}
            defaultValue={editing?.sort_order ?? banners.length + 1}
            className="field mt-1"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={editing?.is_active ?? true}
            className="size-4 accent-royal-600"
          />
          {L('সাইটে দেখাবে', 'Visible on the site')}
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <SubmitButton>{t.account.save}</SubmitButton>
          {editing && (
            <Link href="/admin/banners" className="btn-outline">
              {L('বাতিল', 'Cancel')}
            </Link>
          )}
        </div>
      </form>

      <ul className="grid gap-4 sm:grid-cols-2">
        {banners.map((banner) => (
          <li key={banner.id} className={`${card} overflow-hidden ${banner.is_active ? '' : 'opacity-60'}`}>
            <span className="relative block aspect-[16/6] bg-zinc-100">
              <Image src={banner.image_url} alt="" fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
            </span>
            <div className="p-3 text-sm">
              <p className="font-semibold">
                #{banner.sort_order} · {tr(banner, 'title', locale) || '—'}
              </p>
              <p className="text-zinc-600">{banner.link_url}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <form action={toggleBanner}>
                  <input type="hidden" name="id" value={banner.id} />
                  <input type="hidden" name="active" value={banner.is_active ? '0' : '1'} />
                  <SubmitButton className="btn-outline px-3 py-1 text-sm">
                    {banner.is_active ? L('বন্ধ করুন', 'Turn off') : L('চালু করুন', 'Turn on')}
                  </SubmitButton>
                </form>
                <Link
                  href={`/admin/banners?edit=${banner.id}`}
                  className="font-semibold text-royal-700 hover:underline"
                >
                  {L('এডিট', 'Edit')}
                </Link>
                <form action={deleteBanner}>
                  <input type="hidden" name="id" value={banner.id} />
                  <ConfirmButton message={L('ব্যানারটি মুছবেন?', 'Delete this banner?')}>
                    {L('মুছুন', 'Delete')}
                  </ConfirmButton>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
