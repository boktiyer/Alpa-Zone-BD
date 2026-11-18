import type { Metadata } from 'next';
import Link from 'next/link';
import { getI18n } from '@/i18n/server';
import { site, whatsappLink } from '@/config/site';
import { InfoPage } from '@/components/store/info-page';
import { FacebookIcon, InstagramIcon, PhoneIcon, WhatsAppIcon } from '@/components/icons';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.footer.contactUs,
    description: t.footer.contactIntro,
    alternates: { canonical: '/contact' },
  };
}

// Contact details come from src/config/site.ts only — change them there.
export default async function ContactPage() {
  const { t } = await getI18n();
  const row =
    'flex items-center gap-3 rounded-xl border border-border bg-page p-4 no-underline transition-colors hover:border-brand';
  const iconBox = 'grid size-11 shrink-0 place-items-center rounded-full bg-brand text-white';

  return (
    <InfoPage title={t.footer.contactUs} homeLabel={t.nav.home}>
      <p>{t.footer.contactIntro}</p>

      <ul className="!ml-0 grid gap-3 sm:grid-cols-2 [&>li]:!ml-0 [&>li]:!list-none">
        <li>
          <a href={`tel:${site.phone}`} className={row}>
            <span className={iconBox}>
              <PhoneIcon className="size-5" />
            </span>
            <span>
              <span className="block text-sm text-zinc-600">{t.footer.phone}</span>
              <span className="block font-semibold text-ink">{site.phone}</span>
            </span>
          </a>
        </li>
        <li>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className={row}>
            <span className={`${iconBox} !bg-whatsapp !text-ink`}>
              <WhatsAppIcon className="size-5" />
            </span>
            <span>
              <span className="block text-sm text-zinc-600">WhatsApp</span>
              <span className="block font-semibold text-ink">{t.footer.chatWhatsApp}</span>
            </span>
          </a>
        </li>
        <li>
          <a href={site.facebook} target="_blank" rel="noopener noreferrer" className={row}>
            <span className={iconBox}>
              <FacebookIcon className="size-5" />
            </span>
            <span>
              <span className="block text-sm text-zinc-600">Facebook</span>
              <span className="block font-semibold text-ink">{t.footer.follow}</span>
            </span>
          </a>
        </li>
        {site.instagram && (
          <li>
            <a href={site.instagram} target="_blank" rel="noopener noreferrer" className={row}>
              <span className={iconBox}>
                <InstagramIcon className="size-5" />
              </span>
              <span>
                <span className="block text-sm text-zinc-600">Instagram</span>
                <span className="block font-semibold text-ink">{t.footer.follow}</span>
              </span>
            </a>
          </li>
        )}
      </ul>

      <section>
        <h2>{t.footer.orderHelp}</h2>
        <p>
          {t.footer.orderHelpText}{' '}
          <Link href="/track-order" className="font-semibold text-brand hover:underline">
            {t.nav.track} →
          </Link>
        </p>
        <p className="mt-2">
          {t.footer.paymentNumber}: <span className="font-semibold text-ink">{site.paymentNumber}</span>
        </p>
      </section>
    </InfoPage>
  );
}
