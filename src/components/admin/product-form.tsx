import { tr } from '@/i18n/config';
import { getAdminI18n } from '@/lib/admin';
import { getCategories } from '@/lib/queries';
import type { ProductDetail } from '@/types/database';
import { deleteProduct, saveProduct } from '@/app/admin/actions';
import { ConfirmButton, ProductMediaFields, SubmitButton } from '@/components/admin/client';

/** Add / edit product form. `product` is undefined when adding. */
export async function ProductForm({ product }: { product?: ProductDetail }) {
  const [{ locale, L }, categories] = await Promise.all([getAdminI18n(), getCategories()]);
  const label = 'block text-sm font-medium';

  const images = [...(product?.product_images ?? [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((image) => image.url);

  return (
    <>
      <form action={saveProduct} className="space-y-4">
        {product && <input type="hidden" name="id" value={product.id} />}

        <fieldset className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2">
          <legend className="px-1 font-semibold">{L('মূল তথ্য', 'Basics')}</legend>
          <label className={label}>
            {L('নাম (বাংলা)', 'Name (Bangla)')} *
            <input name="name_bn" required defaultValue={product?.name_bn} className="field mt-1" />
          </label>
          <label className={label}>
            {L('নাম (English)', 'Name (English)')} *
            <input name="name_en" required defaultValue={product?.name_en} className="field mt-1" />
          </label>
          <label className={label}>
            {L('ক্যাটাগরি', 'Category')}
            <select name="category_id" defaultValue={product?.category_id ?? ''} className="field mt-1">
              <option value="">—</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.parent_id ? '— ' : ''}
                  {tr(category, 'name', locale)}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            {L('কোড (SKU)', 'SKU')}
            <input name="sku" defaultValue={product?.sku ?? ''} className="field mt-1" />
          </label>
          <label className={`${label} sm:col-span-2`}>
            {L('লিংকের নাম (slug) — ফাঁকা রাখলে নিজে তৈরি হবে', 'Slug — leave empty to create it automatically')}
            <input name="slug" defaultValue={product?.slug ?? ''} className="field mt-1" />
          </label>
          <label className={`${label} sm:col-span-2`}>
            {L('বিবরণ (বাংলা)', 'Description (Bangla)')}
            <textarea
              name="description_bn"
              rows={3}
              defaultValue={product?.description_bn ?? ''}
              className="field mt-1"
            />
          </label>
          <label className={`${label} sm:col-span-2`}>
            {L('বিবরণ (English)', 'Description (English)')}
            <textarea
              name="description_en"
              rows={3}
              defaultValue={product?.description_en ?? ''}
              className="field mt-1"
            />
          </label>
        </fieldset>

        <fieldset className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-3">
          <legend className="px-1 font-semibold">{L('দাম ও স্টক', 'Price & stock')}</legend>
          <label className={label}>
            {L('বিক্রির দাম (৳)', 'Selling price (৳)')} *
            <input
              name="price"
              type="number"
              min={0}
              step="0.01"
              required
              defaultValue={product?.price}
              className="field mt-1"
            />
          </label>
          <label className={label}>
            {L('আগের দাম (৳) — ছাড় দেখাতে', 'Old price (৳) — shows a discount')}
            <input
              name="compare_at_price"
              type="number"
              min={0}
              step="0.01"
              defaultValue={product?.compare_at_price ?? ''}
              className="field mt-1"
            />
          </label>
          <label className={label}>
            {L('স্টক (ভ্যারিয়েন্ট না থাকলে)', 'Stock (if no variants)')}
            <input
              name="stock"
              type="number"
              min={0}
              step={1}
              defaultValue={product?.stock ?? 0}
              className="field mt-1"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={product?.is_active ?? true}
              className="size-4 accent-royal-600"
            />
            {L('সাইটে দেখাবে', 'Visible on the site')}
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={product?.is_featured ?? false}
              className="size-4 accent-royal-600"
            />
            {L('ফিচার্ড', 'Featured')}
          </label>
        </fieldset>

        <ProductMediaFields
          images={images}
          variants={(product?.product_variants ?? []).map((variant) => ({
            id: variant.id,
            size: variant.size ?? '',
            color: variant.color ?? '',
            stock: variant.stock,
            price: variant.price,
          }))}
        />

        <SubmitButton>{L('সেভ করুন', 'Save product')}</SubmitButton>
      </form>

      {product && (
        <form action={deleteProduct} className="mt-6 border-t border-zinc-200 pt-4">
          <input type="hidden" name="id" value={product.id} />
          <ConfirmButton
            message={L(
              'প্রোডাক্টটি মুছে ফেলবেন? এটা ফেরানো যাবে না।',
              'Delete this product? This cannot be undone.',
            )}
          >
            {L('প্রোডাক্ট মুছে ফেলুন', 'Delete product')}
          </ConfirmButton>
        </form>
      )}
    </>
  );
}
