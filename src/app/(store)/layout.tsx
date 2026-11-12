import { Header } from '@/components/store/header';
import { Footer } from '@/components/store/footer';
import { MobileNav } from '@/components/store/mobile-nav';
import { getCurrentProfile } from '@/lib/auth';
import { getCartCount } from '@/lib/cart';

// Customer-facing site. The admin panel has its own layout in src/app/admin.
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [profile, cartCount] = await Promise.all([getCurrentProfile(), getCartCount()]);

  return (
    // pb-16 on phones leaves room for the bottom navigation bar.
    <div className="flex min-h-dvh flex-col pb-16 md:pb-0">
      <Header />
      <main className="flex-1 sm:px-4 sm:pt-4">
        {/* Light panel so text stays readable on top of the gradient background. */}
        <div className="mx-auto min-h-[50vh] max-w-[82rem] bg-white/85 pb-10 sm:rounded-2xl">
          {children}
        </div>
      </main>
      <Footer />
      <MobileNav cartCount={cartCount} loggedIn={Boolean(profile)} />
    </div>
  );
}
