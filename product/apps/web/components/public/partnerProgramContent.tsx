import type { ReactNode } from 'react';

export type PartnerProgramSectionSlug =
  | 'stan-na-dzisiaj'
  | 'co-badamy'
  | 'jak-to-robimy'
  | 'co-w-zamian'
  | 'kogo-zapraszamy';

export type PartnerProgramSection = {
  slug: PartnerProgramSectionSlug;
  href: `/${PartnerProgramSectionSlug}`;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
};

export const PROBLEM_QUESTIONS = [
  'Jaki rating ma dana kawa wśród użytkowników na różnym poziomie doświadczenia sensorycznego?',
  'Jak profil sensoryczny deklarowany przez palarnię pokrywa się z odbiorem konsumenta?',
  'Jakie metody parzenia rekomenduje roaster versus jakie realnie wybiera klient?',
  'W jakim stopniu na ocenę produktu wpływa metoda parzenia, przepis, oczekiwania, kontekst?',
  'Które informacje pomagają klientowi wrócić po właściwy produkt?',
  'Które dane są przydatne dla palarni, a które tylko obciążają formularz?',
] as const;

export const RESEARCH_QUESTIONS = [
  { key: 'describe-feedback', content: 'Jaki rodzaj feedbacku może zwiększyć codzienną ekspozycję na kupujących?' },
  { key: 'needs-and-deliver', content: 'Jak odpowiadać na oczekiwania odbiorców i dowozić produkt, który trafia w sedno?' },
  { key: 'new-horizons', content: 'Czy można otwierać nowe horyzonty, nie ryzykując utraty lojalnych klientów?' },
  {
    key: 'build-relations',
    content: (
      <>
        Jak wykorzystać insighty z <b>fun•brew</b>, żeby wzmacnianiać relacje roaster - konsument?
      </>
    ),
  },
  {
    key: 'useful-data',
    content: 'Jakie jeszcze dane i informacje mogą wspierać palarnię w codziennej działalności?',
  },
  {
    key: 'funbrew-workflow',
    content: (
      <>
        Jak wpisać workflow <b>fun•brew</b> w codzienną pracę i doświadczenie palarni?
      </>
    ),
  },
] as const;

export const CRITERIA = [
  'posiadają aktywną ofertę specialty w sprzedaży detalicznej;',
  'chcą wiedzieć, jak klienci parzą, piją i oceniają ich kawę;',
  'mogą odbyć kilka spotkań w ramach programu;',
  'chcą mieć wpływ na aplikację, która usprawni ich workflow.',
] as const;

export const COMMITMENTS = [
  ['Poznajemy się', 'Jak działa roaster, jak działa fun•brew. Jakie dane są dostępne na ten moment. Decyzja o udziale w pilotażu.'],
  ['Precyzujemy roaster data', 'Uzupełniamy i dopinamy zakres danych i raportów. Definiujemy przyszły workflow pod kątem roastera.'],
  ['Dostrajamy mobile', 'Spinamy dane z panelu roastera we wspólny flow z aplikacją kliencką na iOS i Android. Testujemy QR kody.'],
  ['Odpalamy beta appki', 'Beta aplikacji klienckiej trafia do wybranych konsumentów. Zbieramy realny feedback i dane na temat kawy.'],
  ['Omawiamy feedback', 'Oddzielamy kluczowe dane od szumu. Walidujemy wnioski i rekomendacje. Decydujemy o adopcji fun•brew w palarni.'],
] as const;

export const BENEFITS = [
  {
    title: 'Preferencyjny dostęp',
    copy: (
      <>
        Dostęp na specjalnych warunkach do funkcji, danych i raportów dostępnych po uruchomieniu aplikacji.
      </>
    ),
  },
  {
    title: 'Wpływ na zakres i format feedbacku',
    copy: 'Partnerskie palarnie realnie kształtują moduły, metryki i raporty dostępne w pierwszej wersji produktu.',
  },
  {
    title: 'Bieżący wgląd w wyniki',
    copy: 'W trakcie programu palarnia na bieżąco śledzi feedback na temat swoich kaw i kontekst wyników.',
  },
  {
    title: 'Udział w tworzeniu standardu',
    copy: 'Program pozwala współtworzyć branżowy standard feedbacku konsumenckiego dla kawy specialty.',
  },
] as const;

export const PARTNER_PROGRAM_SECTIONS: PartnerProgramSection[] = [
  {
    slug: 'stan-na-dzisiaj',
    href: '/stan-na-dzisiaj',
    eyebrow: 'Stan na dzisiaj',
    title: (
      <>
        odzyskać dane +<br />uporządkować feedback
      </>
    ),
    lead:
      'Chcemy razem z palarniami odzyskać informacje, które znikają z radaru, kiedy kawa trafia na rynek. Prototyp aplikacji odpowiada na pytania:',
  },
  {
    slug: 'co-badamy',
    href: '/co-badamy',
    eyebrow: 'Co badamy?',
    title: (
      <>
        zakres insightów +<br />workflow fun•brew
      </>
    ),
    lead: (
      <>
        Wspólnie ustalimy, które dane niosą największą realną wartość dla roastera. Zapytamy o miejsce <b>fun•brew</b> w codziennej pracy palarni, próbując ustalić:
      </>
    ),
  },
  {
    slug: 'jak-to-robimy',
    href: '/jak-to-robimy',
    eyebrow: 'Jak to robimy?',
    title: (
      <>
        Gdzie zaczynamy +<br /> na czym kończymy
      </>
    ),
    lead: 'Pilotaż jest kilkuetapowy, z kilkoma punktami kontrolnymi po drodze. Zasadniczo obejmuje następujące kroki:',
  },
  {
    slug: 'co-w-zamian',
    href: '/co-w-zamian',
    eyebrow: 'Co w zamian?',
    title: 'Benefity dla palarni',
    lead: (
      <>
        Udział w pilotażu to okazja, by zyskać realny wpływ na produkt i dostęp do efektów pracy po uruchomieniu <b>fun•brew</b>.
      </>
    ),
  },
  {
    slug: 'kogo-zapraszamy',
    href: '/kogo-zapraszamy',
    eyebrow: 'Kogo zapraszamy?',
    title: 'Palarnie, które:',
    lead: 'Zapraszamy palarnie specialty gotowe przetestować prototyp, omówić dane i współtworzyć praktyczny workflow.',
  },
];

export function getPartnerProgramSection(slug: PartnerProgramSectionSlug): PartnerProgramSection {
  const section = PARTNER_PROGRAM_SECTIONS.find(item => item.slug === slug);

  if (!section) {
    throw new Error(`Unknown partner program section: ${slug}`);
  }

  return section;
}
