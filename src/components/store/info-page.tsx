import type { ReactNode } from 'react';
import Link from 'next/link';

/** Shared look of the About / Return policy / Terms pages. */
export function InfoPage({
  title,
  homeLabel,
  children,
}: {
  title: string;
  homeLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="container-page pt-6">
      <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-brand">
          {homeLabel}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">{title}</span>
      </nav>

      <article className="mx-auto mt-4 max-w-3xl rounded-2xl border border-border bg-white p-5 sm:p-8">
        <h1 className="text-2xl font-bold text-brand sm:text-3xl">{title}</h1>
        <div className="mt-5 space-y-5 leading-relaxed text-zinc-700 [&_h2]:mb-1.5 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-brand-dark [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
          {children}
        </div>
      </article>
    </div>
  );
}
