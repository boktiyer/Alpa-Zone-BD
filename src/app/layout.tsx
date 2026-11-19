import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, DM_Sans, Hind_Siliguri } from 'next/font/google';
import { getI18n } from '@/i18n/server';
import { I18nProvider } from '@/i18n/provider';
import { RecoveryLinkCatcher } from '@/components/recovery-link-catcher';
import { PwaRegister } from '@/components/pwa-register';
import './globals.css';

// Bangla text (body and headings).
const hind = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hind',
  display: 'swap',
});

// English body text. Bangla letters fall back to Hind Siliguri (see --font-sans).
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm',
  display: 'swap',
});

// English headings. Bangla letters fall back to Hind Siliguri (see --font-display).
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: { default: `${t.brand} — ${t.tagline}`, template: `%s | ${t.brand}` },
    description: t.metaDescription,
    applicationName: t.brand,
    openGraph: {
      siteName: t.brand,
      type: 'website',
      locale: locale === 'bn' ? 'bn_BD' : 'en_US',
      images: ['/brand/logo-wide.jpg'],
    },
    twitter: { card: 'summary_large_image' },
    formatDetection: { telephone: false },
    // Installed on an iPhone home screen: open full screen like an app.
    appleWebApp: { capable: true, title: 'Alpa Zone', statusBarStyle: 'default' },
    // Next.js now writes only "mobile-web-app-capable"; older iPhones still read this one.
    other: { 'apple-mobile-web-app-capable': 'yes' },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#6D0F2B',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getI18n();

  return (
    <html lang={locale} className={`${hind.variable} ${dmSans.variable} ${cormorant.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <I18nProvider locale={locale} t={t}>
          <RecoveryLinkCatcher />
          <PwaRegister />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
