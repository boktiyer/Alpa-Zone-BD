import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { site, whatsappLink } from '@/config/site';
import { InfoPage } from '@/components/store/info-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.footer.aboutUs };
}

export default async function AboutPage() {
  const { locale, t } = await getI18n();
  const bn = locale === 'bn';
  const link = 'font-semibold text-brand hover:underline';

  return (
    <InfoPage title={t.footer.aboutUs} homeLabel={t.nav.home}>
      <p>
        {bn
          ? 'Alpa Zone BD একটি অনলাইন ফ্যাশন শপ। আমরা মেয়েদের, ছেলেদের ও শিশুদের পোশাক এবং ফ্যাশন এক্সেসরিজ সারা বাংলাদেশে পৌঁছে দিই।'
          : 'Alpa Zone BD is an online fashion shop. We deliver clothing and fashion accessories for women, men and kids all over Bangladesh.'}
      </p>

      <section>
        <h2>{bn ? 'আমরা যা করি' : 'What we do'}</h2>
        <ul>
          <li>
            {bn
              ? 'বাছাই করা ট্রেন্ডি পোশাক, সাশ্রয়ী দামে।'
              : 'Hand-picked, trendy clothing at affordable prices.'}
          </li>
          <li>
            {bn
              ? 'ঢাকার ভিতরে ও বাইরে সব জেলায় ডেলিভারি।'
              : 'Delivery to every district, inside and outside Dhaka.'}
          </li>
          <li>
            {bn
              ? 'বিকাশ, নগদ অথবা ক্যাশ অন ডেলিভারিতে পেমেন্ট।'
              : 'Pay with bKash, Nagad or Cash on Delivery.'}
          </li>
        </ul>
      </section>

      <section>
        <h2>{t.footer.contact}</h2>
        <ul>
          <li>
            {bn ? 'ফোন' : 'Phone'}:{' '}
            <a href={`tel:${site.phone}`} className={link}>
              {site.phone}
            </a>
          </li>
          <li>
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className={link}>
              WhatsApp
            </a>
          </li>
          <li>
            <a href={site.facebook} target="_blank" rel="noopener noreferrer" className={link}>
              Facebook
            </a>
          </li>
        </ul>
      </section>
    </InfoPage>
  );
}
