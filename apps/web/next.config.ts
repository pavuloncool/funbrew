import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/dashboard/roaster/setup',
        destination: '/roaster-hub/setup',
        permanent: true,
      },
      {
        source: '/dashboard/coffees',
        destination: '/coffee-bank',
        permanent: true,
      },
      {
        source: '/dashboard/coffees/new',
        destination: '/roaster-hub/coffees/new',
        permanent: true,
      },
      {
        source: '/dashboard/coffees/:id',
        destination: '/roaster-hub/coffees/:id',
        permanent: true,
      },
      {
        source: '/dashboard/coffees/:id/batches/new',
        destination: '/roaster-hub/coffees/:id/batches/new',
        permanent: true,
      },
      {
        source: '/dashboard/coffees/:id/batches/:batchId',
        destination: '/roaster-hub/coffees/:id/batches/:batchId',
        permanent: true,
      },
      {
        source: '/dashboard/analytics/:batchId',
        destination: '/roaster-hub/analytics/:batchId',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
};

export default nextConfig;
