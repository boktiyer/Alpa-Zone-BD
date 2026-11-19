import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Product and banner pictures uploaded to Supabase Storage.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Widths the image optimizer may produce. The default list goes up to 3840px,
    // which made phones with sharp screens download huge banner files; our
    // pictures are never wider than about 1500px, so 1920 is plenty.
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1600, 1920],
  },

  async headers() {
    return [
      {
        // The service worker must never be cached by the browser, so updates reach phones at once.
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // The baby category moved to /category/kids (see src/lib/category-url.ts).
      { source: '/category/babys', destination: '/category/kids', permanent: true },
    ];
  },
};

export default nextConfig;
