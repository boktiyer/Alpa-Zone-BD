import { tr } from '@/i18n/config';
import { getAdminI18n } from '@/lib/admin';
import { getCategories } from '@/lib/queries';
import type { ProductDetail } from '@/types/database';
import { deleteProduct, saveProduct } from '@/app/admin/actions';
import { ConfirmButton, ImagesField, SubmitButton } from '@/components/admin/client';
import { PriceFields, VariantsField } from '@/components/admin/product-fields';

/** Add / edit product form. `product` is undefined when adding. */
export async function ProductForm({ product }: { product?: ProductDetail }) {
  const [{ locale, L }, categories] = await Promise.all([getAdminI18n(), getCategories()]);
  const label = 'block text-sm font-medium';
  const section = 'rounded-xl border border-border bg-white p-4 sm:p-5';
  const heading = 'mb-3 flex items-center gap-2 text-base font-semibold';
  const step = 'grid size-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white';

  const images = [...(product?.product_images ?? [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((image) => image.url);

  // The database keeps "what the customer pays" + "crossed-out old price";
  // the form shows it as "price" + "discount price".
  const regular = product ? (product.compare_at_price ?? product.price) : null;
  const discount = product?.compare_at_price ? product.price : null;

  return (
    <div className="mx-auto max-w-3xl">
      <form action={saveProduct} className="space-y-4">
        {product && <input type="hidden" name="id" value={product.id} />}

        <section className={section}>
          <h2 className={heading}>
            <span className={step}>1</span>
            {L('ছবি', 'Pictures')}
          </h2>
          <ImagesField initial={images} />
        </section>

        <section className={section}>
          <h2 className={heading}>
            <span className={step}>2</span>
            {L('নাম ও বিবরণ', 'Name & details')}
          </h2>
          <div className="grid gap-4">
            <label className={label}>
              {L('প্রোডাক্টের নাম', 'Product name')} *
              <input
                name="name_en"
                required
                defaultValue={product?.name_en}
                placeholder={L('যেমন: Stylish Design Winter Hoodie', 'e.g. Stylish Design Winter Hoodie')}
                className="field mt-1"
              />
            </label>
            <label className={label}>
              {L('কোন কালেকশনে যাবে?', 'Which collection?')}
              <select name="category_id" defaultValue={product?.category_id ?? ''} className="field mt-1">
                <option value="">{L('— বেছে নিন —', '— choose —')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.parent_id ? '— ' : ''}
                    {tr(category, 'name', locale)}
                  </option>
                ))}
              </select>
            </label>
            <label className={label}>
              {L('বিবরণ (ফেব্রিক, সাইজ চার্ট ইত্যাদি)', 'Description (fabric, size chart, etc.)')}
              <textarea
                name="description_bn"
                rows={8}
                defaultValue={product?.description_bn ?? ''}
                placeholder={L(
                  'এখানে প্রোডাক্টের বিবরণ পেস্ট করুন',
                  'Paste the product description here',
                )}
                className="field mt-1"
              />
            </label>
          </div>
        </section>

        <section className={section}>
          <h2 className={heading}>
            <span className={step}>3</span>
            {L('দাম ও ডিসকাউন্ট', 'Price & discount')}
          </h2>
          <PriceFields regular={regular} discount={discount} />
        </section>

        <section className={section}>
          <h2 className={heading}>
            <span className={step}>4</span>
            {L('সাইজ, রং ও স্টক', 'Sizes, colours & stock')}
          </h2>
          <VariantsField
            productStock={product?.stock ?? 0}
            initial={(product?.product_variants ?? []).map((variant) => ({
              id: variant.id,
              size: variant.size ?? '',
              color: variant.color ?? '',
              stock: variant.stock,
              price: variant.price,
            }))}
          />
        </section>

        <section className={`${section} space-y-3`}>
          <label className="flex items-start gap-3 text-sm font-medium">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={product?.is_active ?? true}
              className="mt-0.5 size-5 accent-brand"
            />
            <span>
              {L('সাইটে দেখাবে', 'Show on the site')}
              <span className="block text-xs font-normal text-zinc-500">
                {L(
                  'টিক তুলে দিলে প্রোডাক্ট লুকানো থাকবে, মুছবে না।',
                  'Untick to hide the product without deleting it.',
                )}
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm font-medium">
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={product?.is_featured ?? false}
              className="mt-0.5 size-5 accent-brand"
            />
            {L('ফিচার্ড প্রোডাক্ট', 'Featured product')}
          </label>
        </section>

        <details className={section}>
          <summary className="cursor-pointer text-sm font-semibold text-zinc-700">
            {L('আরও অপশন (না দিলেও চলবে)', 'More options (not required)')}
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={label}>
              {L('বাংলা নাম', 'Bangla name')}
              <input
                name="name_bn"
                defaultValue={product && product.name_bn !== product.name_en ? product.name_bn : ''}
                className="field mt-1"
              />
            </label>
            <label className={label}>
              {L('কোড (SKU)', 'SKU')}
              <input name="sku" defaultValue={product?.sku ?? ''} className="field mt-1" />
            </label>
            <label className={`${label} sm:col-span-2`}>
              {L('ইংরেজি বিবরণ', 'English description')}
              <textarea
                name="description_en"
                rows={5}
                defaultValue={product?.description_en ?? ''}
                className="field mt-1"
              />
            </label>
            <label className={`${label} sm:col-span-2`}>
              {L('লিংকের নাম (slug) — ফাঁকা রাখলে নিজে তৈরি হবে', 'Slug — leave empty to create it automatically')}
              <input name="slug" defaultValue={product?.slug ?? ''} className="field mt-1" />
            </label>
          </div>
        </details>

        {/* Always within reach, also on a phone. */}
        <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
          <SubmitButton className="btn-primary w-full py-3 text-base sm:w-auto sm:px-10">
            {product ? L('সেভ করুন', 'Save changes') : L('প্রোডাক্ট যোগ করুন', 'Add product')}
          </SubmitButton>
        </div>
      </form>

      {product && (
        <form action={deleteProduct} className="mt-6 border-t border-border pt-4">
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
    </div>
  );
}
