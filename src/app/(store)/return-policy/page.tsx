import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { site, whatsappLink } from '@/config/site';
import { InfoPage } from '@/components/store/info-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.footer.returnPolicy };
}

// NOTE FOR THE SHOP OWNER: this text is a starting draft. Read every line and
// change the number of days and the conditions to match what you really offer.
const RETURN_DAYS = 3;

export default async function ReturnPolicyPage() {
  const { locale, t } = await getI18n();
  const bn = locale === 'bn';
  const days = bn ? RETURN_DAYS.toLocaleString('bn-BD') : String(RETURN_DAYS);

  return (
    <InfoPage title={t.footer.returnPolicy} homeLabel={t.nav.home}>
      <p>
        {bn
          ? 'আমরা চাই আপনি আপনার কেনাকাটায় সন্তুষ্ট থাকুন। প্রোডাক্ট নিয়ে কোনো সমস্যা হলে নিচের নিয়মে রিটার্ন বা এক্সচেঞ্জ করতে পারবেন।'
          : 'We want you to be happy with your order. If there is a problem with a product, you can return or exchange it under the rules below.'}
      </p>

      <section>
        <h2>{bn ? 'কখন রিটার্ন বা এক্সচেঞ্জ করা যাবে' : 'When you can return or exchange'}</h2>
        <ul>
          <li>
            {bn
              ? 'ভুল প্রোডাক্ট, ভুল সাইজ বা ভুল রং পাঠানো হলে।'
              : 'We sent the wrong product, size or colour.'}
          </li>
          <li>
            {bn
              ? 'প্রোডাক্ট ছেঁড়া, নষ্ট বা ত্রুটিপূর্ণ অবস্থায় পেলে।'
              : 'The product arrived torn, damaged or defective.'}
          </li>
          <li>
            {bn
              ? `পার্সেল হাতে পাওয়ার ${days} দিনের মধ্যে আমাদের জানাতে হবে।`
              : `You must tell us within ${days} days of receiving the parcel.`}
          </li>
        </ul>
      </section>

      <section>
        <h2>{bn ? 'শর্ত' : 'Conditions'}</h2>
        <ul>
          <li>
            {bn
              ? 'প্রোডাক্ট অব্যবহৃত, না-ধোয়া এবং ট্যাগ ও প্যাকেটসহ থাকতে হবে।'
              : 'The product must be unused, unwashed and in its packet with tags.'}
          </li>
          <li>
            {bn
              ? 'ডেলিভারিম্যানের সামনে পার্সেল খুলে দেখে নেওয়ার অনুরোধ রইল।'
              : 'Please open and check the parcel in front of the delivery person.'}
          </li>
          <li>
            {bn
              ? 'পছন্দ না হওয়া বা মত বদলের কারণে রিটার্নে ডেলিভারি চার্জ ক্রেতাকে বহন করতে হবে।'
              : 'For a change of mind, the delivery charge is paid by the customer.'}
          </li>
        </ul>
      </section>

      <section>
        <h2>{bn ? 'কীভাবে রিটার্ন করবেন' : 'How to return'}</h2>
        <ul>
          <li>
            {bn
              ? 'অর্ডার নম্বর ও প্রোডাক্টের ছবিসহ আমাদের WhatsApp-এ মেসেজ করুন অথবা কল করুন।'
              : 'Message us on WhatsApp or call us with your order number and a photo of the product.'}
          </li>
          <li>
            {bn
              ? 'আমরা যাচাই করে এক্সচেঞ্জ বা রিফান্ডের ব্যবস্থা করব।'
              : 'We will check it and arrange an exchange or a refund.'}
          </li>
        </ul>
        <p className="mt-4 flex flex-wrap gap-2">
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
            WhatsApp
          </a>
          <a href={`tel:${site.phone}`} className="btn-outline">
            {site.phone}
          </a>
        </p>
      </section>
    </InfoPage>
  );
}
