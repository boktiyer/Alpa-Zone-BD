import type { Metadata } from 'next';
import Link from 'next/link';
import { tr } from '@/i18n/config';
import { getAdminI18n, requireAdmin } from '@/lib/admin';
import type { Category } from '@/types/database';
import { deleteCategory, saveCategory } from '@/app/admin/actions';
import { ConfirmButton, SubmitButton } from '@/components/admin/client';
import { card, Notice, PageTitle, TableWrap, td, th } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Categories' };

/** Categories in tree order with their depth. */
function tree(all: Category[], parentId: string | null = null, depth = 0): [Category, number][] {
  return all
    .filter((item) => item.parent_id === parentId)
    .flatMap((item): [Category, number][] => [[item, depth], ...tree(all, item.id, depth + 1)]);
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; ok?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { locale, t, L } = await getAdminI18n();
  const supabase = await requireAdmin();

  const { data } = await supabase.from('categories').select('*').order('sort_order').order('name_en');
  const categories = (data as Category[] | null) ?? [];
  const editing = categories.find((item) => item.id === params.edit);
  const rows = tree(categories);
  // Anything whose parent was deleted still has to be listed.
  const orphans = categories.filter((item) => !rows.some(([row]) => row.id === item.id));
  const label = 'block text-sm font-medium';

  return (
    <>
      <Notice params={params} okText={L('সেভ হয়েছে। সাইটে সাথে সাথে দেখাবে।', 'Saved. It shows on the site right away.')} />
      <PageTitle title={t.admin.categories} />

      <form
        key={editing?.id ?? 'new'}
        action={saveCategory}
        className={`${card} mb-6 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3`}
      >
        <h2 className="font-semibold sm:col-span-2 lg:col-span-3">
          {editing ? L('ক্যাটাগরি এডিট', 'Edit category') : L('নতুন ক্যাটাগরি', 'New category')}
        </h2>
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <label className={label}>
          {L('নাম (বাংলা)', 'Name (Bangla)')} *
          <input name="name_bn" required defaultValue={editing?.name_bn} className="field mt-1" />
        </label>
        <label className={label}>
          {L('নাম (English)', 'Name (English)')} *
          <input name="name_en" required defaultValue={editing?.name_en} className="field mt-1" />
        </label>
        <label className={label}>
          {L('মূল ক্যাটাগরি (সাব-ক্যাটাগরি বানাতে)', 'Parent (to make a sub-category)')}
          <select name="parent_id" defaultValue={editing?.parent_id ?? ''} className="field mt-1">
            <option value="">{L('— নেই (মূল ক্যাটাগরি) —', '— None (top level) —')}</option>
            {rows
              .filter(([item]) => item.id !== editing?.id)
              .map(([item, depth]) => (
                <option key={item.id} value={item.id}>
                  {'— '.repeat(depth)}
                  {tr(item, 'name', locale)}
                </option>
              ))}
          </select>
        </label>
        <label className={label}>
          {L('ক্রম (ছোট সংখ্যা আগে)', 'Order (small number first)')}
          <input
            name="sort_order"
            type="number"
            min={0}
            defaultValue={editing?.sort_order ?? 0}
            className="field mt-1"
          />
        </label>
        <label className={label}>
          {L('slug — ফাঁকা রাখলে নিজে তৈরি হবে', 'Slug — leave empty for automatic')}
          <input name="slug" defaultValue={editing?.slug ?? ''} className="field mt-1" />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={editing?.is_active ?? true}
            className="size-4 accent-brand"
          />
          {L('সাইটে দেখাবে', 'Visible on the site')}
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
          <SubmitButton>{t.account.save}</SubmitButton>
          {editing && (
            <Link href="/admin/categories" className="btn-outline">
              {L('বাতিল', 'Cancel')}
            </Link>
          )}
        </div>
      </form>

      <TableWrap>
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-brand">
            <tr>
              <th className={th}>{t.list.category}</th>
              <th className={th}>slug</th>
              <th className={th}>{L('ক্রম', 'Order')}</th>
              <th className={th}>{t.admin.status}</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {[...rows, ...orphans.map((item): [Category, number] => [item, 0])].map(
              ([category, depth]) => (
                <tr key={category.id}>
                  <td className={`${td} font-medium`} style={{ paddingLeft: `${0.75 + depth * 1.5}rem` }}>
                    {depth > 0 && '↳ '}
                    {tr(category, 'name', locale)}
                  </td>
                  <td className={`${td} text-zinc-600`}>{category.slug}</td>
                  <td className={td}>{category.sort_order}</td>
                  <td className={td}>
                    {category.is_active ? L('চালু', 'Visible') : L('বন্ধ', 'Hidden')}
                  </td>
                  <td className={`${td} whitespace-nowrap text-right`}>
                    <Link
                      href={`/admin/categories?edit=${category.id}`}
                      className="mr-3 text-sm font-semibold text-brand hover:underline"
                    >
                      {L('এডিট', 'Edit')}
                    </Link>
                    <form action={deleteCategory} className="inline">
                      <input type="hidden" name="id" value={category.id} />
                      <ConfirmButton
                        message={L(
                          'ক্যাটাগরিটি মুছবেন? এর প্রোডাক্টগুলো থাকবে, শুধু ক্যাটাগরি ছাড়া হয়ে যাবে।',
                          'Delete this category? Its products stay, but without a category.',
                        )}
                      >
                        {L('মুছুন', 'Delete')}
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
