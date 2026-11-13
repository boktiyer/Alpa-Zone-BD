import type { Metadata } from 'next';
import Link from 'next/link';
import { getI18n } from '@/i18n/server';
import { formatPrice } from '@/lib/format';
import { DELIVERY_CHARGE } from '@/types/database';
import { InfoPage } from '@/components/store/info-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.footer.terms };
}

// NOTE FOR THE SHOP OWNER: this text is a starting draft. Please read it and
// change anything that does not match how your shop really works.
export default async function TermsPage() {
  const { locale, t } = await getI18n();
  const bn = locale === 'bn';
  const dhaka = formatPrice(DELIVERY_CHARGE.dhaka, locale);
  const outside = formatPrice(DELIVERY_CHARGE.outside, locale);

  return (
    <InfoPage title={t.footer.terms} homeLabel={t.nav.home}>
      <p>
        {bn
          ? 'Alpa Zone BD থেকে অর্ডার করলে আপনি নিচের শর্তগুলোতে সম্মত হচ্ছেন।'
          : 'By ordering from Alpa Zone BD you agree to the terms below.'}
      </p>

      <section>
        <h2>{bn ? 'অর্ডার ও দাম' : 'Orders and prices'}</h2>
        <ul>
          <li>
            {bn
              ? 'সাইটে দেখানো দাম বাংলাদেশি টাকায় (৳)। দাম ও অফার যেকোনো সময় বদলাতে পারে; অর্ডার করার সময়ের দামই প্রযোজ্য।'
              : 'Prices are in Bangladeshi Taka (৳). Prices and offers may change; the price at the time of your order applies.'}
          </li>
          <li>
            {bn
              ? 'স্টক শেষ হয়ে গেলে বা তথ্য ভুল থাকলে আমরা অর্ডার বাতিল করে আপনাকে জানাব এবং অগ্রিম টাকা ফেরত দেব।'
              : 'If an item runs out of stock or the details are wrong, we may cancel the order, tell you, and refund any advance.'}
          </li>
          <li>
            {bn
              ? 'ছবির রং আলো ও স্ক্রিনের কারণে আসল প্রোডাক্টের সাথে সামান্য আলাদা দেখাতে পারে।'
              : 'Colours may look slightly different from the photos because of lighting and screens.'}
          </li>
        </ul>
      </section>

      <section>
        <h2>{bn ? 'ডেলিভারি ও পেমেন্ট' : 'Delivery and payment'}</h2>
        <ul>
          <li>
            {bn
              ? `ডেলিভারি চার্জ: ঢাকার ভিতরে ${dhaka}, ঢাকার বাইরে ${outside}।`
              : `Delivery charge: ${dhaka} inside Dhaka, ${outside} outside Dhaka.`}
          </li>
          <li>
            {bn
              ? 'পেমেন্ট করা যাবে বিকাশ, নগদ অথবা ক্যাশ অন ডেলিভারিতে। ক্যাশ অন ডেলিভারিতে ডেলিভারি চার্জ অগ্রিম দিতে হয়।'
              : 'You can pay with bKash, Nagad or Cash on Delivery. For Cash on Delivery the delivery charge is paid in advance.'}
          </li>
          <li>
            {bn
              ? 'সঠিক নাম, ফোন নম্বর ও ঠিকানা দেওয়া ক্রেতার দায়িত্ব।'
              : 'Giving a correct name, phone number and address is the responsibility of the customer.'}
          </li>
        </ul>
      </section>

      <section>
        <h2>{bn ? 'রিটার্ন' : 'Returns'}</h2>
        <p>
          {bn ? 'বিস্তারিত দেখুন: ' : 'See the details: '}
          <Link href="/return-policy" className="font-semibold text-brand hover:underline">
            {t.footer.returnPolicy}
          </Link>
        </p>
      </section>

      <section>
        <h2>{bn ? 'আপনার তথ্য' : 'Your information'}</h2>
        <p>
          {bn
            ? 'আপনার নাম, ফোন নম্বর ও ঠিকানা শুধু অর্ডার প্রসেস ও ডেলিভারির কাজে ব্যবহার করা হয়।'
            : 'Your name, phone number and address are used only to process and deliver your order.'}
        </p>
      </section>
    </InfoPage>
  );
}
