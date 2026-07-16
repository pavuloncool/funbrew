import type { Metadata } from 'next';

import PartnerProgramLanding from '@/components/public/PartnerProgramLanding';

export const metadata: Metadata = {
  title: 'fun•brew — aplikacja analityczna dla palarni specialty',
  description:
    'Dzięki fun•brew dowiesz się, jak klient parzy, ocenia i odbiera Twoją kawę po zakupie.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return <PartnerProgramLanding />;
}
