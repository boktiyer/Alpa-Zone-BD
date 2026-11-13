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

  async redirects() {
    return [
      // The baby category moved to /category/kids (see src/lib/category-url.ts).
      { source: '/category/babys', destination: '/category/kids', permanent: true },
    ];
  },
};

export default nextConfig;
