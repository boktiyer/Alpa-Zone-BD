import type { Metadata, Viewport } from 'next';
import { Hind_Siliguri, Poppins } from 'next/font/google';
import { getI18n } from '@/i18n/server';
import { I18nProvider } from '@/i18n/provider';
import './globals.css';

const hind = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hind',
  display: 'swap',
});

// English headings. Bangla letters fall back to Hind Siliguri (see --font-display).
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: { default: `${t.brand} — ${t.tagline}`, template: `%s | ${t.brand}` },
    description: t.footer.about,
    openGraph: {
      siteName: t.brand,
      type: 'website',
      images: ['/brand/logo-wide.jpg'],
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#6d0f2b',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getI18n();

  return (
    <html lang={locale} className={`${hind.variable} ${poppins.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <I18nProvider locale={locale} t={t}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
