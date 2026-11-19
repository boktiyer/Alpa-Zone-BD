import type { MetadataRoute } from 'next';

// Web app manifest: lets phones install the site to the home screen.
// Served at /manifest.webmanifest; Next.js adds the <link> tag itself.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Alpa Zone BD',
    short_name: 'Alpa Zone BD',
    description:
      'Alpa Zone BD — নারী, পুরুষ ও শিশুদের পোশাক এবং ফ্যাশন অ্যাক্সেসরিজ। সারা বাংলাদেশে ডেলিভারি, ক্যাশ অন ডেলিভারি।',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FFFCF8',
    theme_color: '#6D0F2B',
    lang: 'bn',
    categories: ['shopping', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
