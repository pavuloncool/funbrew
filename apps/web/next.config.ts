import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_STORE_URL: process.env.APP_STORE_URL,
    NEXT_PUBLIC_PLAY_STORE_URL: process.env.PLAY_STORE_URL,
  },
  async headers() {
    return [
      {
        source: '/apple-app-site-association',
        headers: [{ key: 'Content-Type', value: 'application/json; charset=utf-8' }],
      },
      {
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'Content-Type', value: 'application/json; charset=utf-8' }],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [{ key: 'Content-Type', value: 'application/json; charset=utf-8' }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/dashboard/roaster/setup',
        destination: '/roaster-hub/setup',
        permanent: true,
      },
      {
        source: '/dashboard/coffees',
        destination: '/roaster-hub/batches',
        permanent: true,
      },
      {
        source: '/dashboard/coffees/new',
        destination: '/roaster-hub/batches/new',
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
        destination: '/roaster-hub/batches/:batchId',
        permanent: true,
      },
      {
        source: '/dashboard/analytics/:batchId',
        destination: '/roaster-hub/batches/:batchId',
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
