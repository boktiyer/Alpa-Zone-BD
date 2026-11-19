import { Header } from '@/components/store/header';
import { Footer } from '@/components/store/footer';
import { MobileNav } from '@/components/store/mobile-nav';
import { Toaster } from '@/components/store/toast';
import { InstallPrompt } from '@/components/store/install-prompt';
import { getCurrentProfile } from '@/lib/auth';
import { getCartCount } from '@/lib/cart';

// Customer-facing site. The admin panel has its own layout in src/app/admin.
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [profile, cartCount] = await Promise.all([getCurrentProfile(), getCartCount()]);

  return (
    // One background colour for the whole page (bg-page on <body>).
    // pb-16 on phones leaves room for the bottom navigation bar.
    <div className="flex min-h-dvh flex-col pb-16 md:pb-0">
      <Header />
      <main className="min-h-[50vh] flex-1 animate-fade-in pb-10">{children}</main>
      <Footer />
      <MobileNav cartCount={cartCount} loggedIn={Boolean(profile)} />
      <Toaster />
      <InstallPrompt />
    </div>
  );
}
