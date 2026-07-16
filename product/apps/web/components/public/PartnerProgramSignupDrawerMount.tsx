'use client';

import { usePathname } from 'next/navigation';

import PartnerProgramSignupDrawer from '@/components/public/PartnerProgramSignupDrawer';

const PARTNER_PROGRAM_DRAWER_ROUTES = new Set([
  '/',
  '/stan-na-dzisiaj',
  '/co-badamy',
  '/jak-to-robimy',
  '/co-w-zamian',
  '/kogo-zapraszamy',
]);

export default function PartnerProgramSignupDrawerMount() {
  const pathname = usePathname();

  if (!PARTNER_PROGRAM_DRAWER_ROUTES.has(pathname)) {
    return null;
  }

  return <PartnerProgramSignupDrawer />;
}
