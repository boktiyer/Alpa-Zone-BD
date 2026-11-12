import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { TrackForm } from '@/components/store/track-form';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.track.title, description: t.track.intro };
}

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const [{ t }, params] = await Promise.all([getI18n(), searchParams]);

  return (
    <div className="container-page max-w-3xl pt-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t.track.title}</h1>
      <p className="mt-2 text-zinc-600">{t.track.intro}</p>
      <div className="mt-5">
        <TrackForm defaultOrderNumber={typeof params.order === 'string' ? params.order : ''} />
      </div>
    </div>
  );
}
