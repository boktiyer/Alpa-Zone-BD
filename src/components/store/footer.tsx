import Link from 'next/link';
import { getI18n } from '@/i18n/server';
import { tr } from '@/i18n/config';
import { getCategories } from '@/lib/queries';
import { formatPrice } from '@/lib/format';
import { site, whatsappLink } from '@/config/site';
import { DELIVERY_CHARGE } from '@/types/database';
import { Logo } from '@/components/logo';
import { FacebookIcon, InstagramIcon, PhoneIcon, WhatsAppIcon } from '@/components/icons';

export async function Footer() {
  const [{ locale, t }, categories] = await Promise.all([getI18n(), getCategories()]);
  const topCategories = categories.filter((category) => !category.parent_id);
  const social =
    'grid size-10 place-items-center rounded-full bg-black/10 text-ink transition hover:bg-maroon hover:text-white';

  return (
    <footer className="mt-10 bg-sand text-zinc-800">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="inline-block">
            <Logo tone="light" className="h-24 w-auto" />
          </Link>
          <p className="mt-3 text-sm">{t.footer.about}</p>
        </div>

        <div>
          <p className="font-semibold text-ink">{t.nav.categories}</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {topCategories.map((category) => (
              <li key={category.id}>
                <Link href={`/category/${category.slug}`} className="hover:text-maroon hover:underline">
                  {tr(category, 'name', locale)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold text-ink">{t.footer.quickLinks}</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li>
              <Link href="/products" className="hover:text-maroon hover:underline">
                {t.nav.shop}
              </Link>
            </li>
            <li>
              <Link href="/track-order" className="hover:text-maroon hover:underline">
                {t.nav.track}
              </Link>
            </li>
            <li>
              <Link href="/account/orders" className="hover:text-maroon hover:underline">
                {t.nav.orders}
              </Link>
            </li>
            <li>
              {t.product.deliveryDhaka}: {formatPrice(DELIVERY_CHARGE.dhaka, locale)} ·{' '}
              {t.product.deliveryOutside}: {formatPrice(DELIVERY_CHARGE.outside, locale)}
            </li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-ink">{t.footer.contact}</p>
          <ul className="mt-2 space-y-2 text-sm">
            <li>
              <a
                href={`tel:${site.phone}`}
                className="inline-flex items-center gap-2 hover:text-maroon hover:underline"
              >
                <PhoneIcon className="size-4" />
                {site.phone}
              </a>
            </li>
            <li>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-maroon hover:underline"
              >
                <WhatsAppIcon className="size-4" />
                WhatsApp
              </a>
            </li>
          </ul>

          <p className="mt-4 font-semibold text-ink">{t.footer.follow}</p>
          <div className="mt-2 flex gap-2">
            <a
              href={site.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className={social}
            >
              <FacebookIcon className="size-5" />
            </a>
            {site.instagram && (
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className={social}
              >
                <InstagramIcon className="size-5" />
              </a>
            )}
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className={social}
            >
              <WhatsAppIcon className="size-5" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-black/10">
        <p className="container-page py-4 text-center text-xs text-zinc-700">
          © {new Date().getFullYear()} Alpa Zone BD. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
