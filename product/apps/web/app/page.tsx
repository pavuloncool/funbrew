import type { Metadata } from 'next';

import PartnerProgramLanding from '@/components/public/PartnerProgramLanding';

export const metadata: Metadata = {
  title: 'fun•brew — Program Partnerów Branżowych dla palarni specialty',
  description:
    'fun•brew pomaga palarniom sprawdzić, jak kawa jest parzona, oceniana i rozumiana po zakupie. Szukamy kilku palarni do programu walidacji danych konsumenckich w kawie specialty.',
};

export default function HomePage() {
  return <PartnerProgramLanding />;
}
