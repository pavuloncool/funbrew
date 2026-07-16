import Link from 'next/link';

import PartnerProgramSectionHeading from '@/components/public/PartnerProgramSectionHeading';
import PartnerProgramSignupButton from '@/components/public/PartnerProgramSignupButton';
import {
  BENEFITS,
  COMMITMENTS,
  CRITERIA,
  PARTNER_PROGRAM_SECTIONS,
  PROBLEM_QUESTIONS,
  RESEARCH_QUESTIONS,
  getPartnerProgramSection,
  type PartnerProgramSectionSlug,
} from '@/components/public/partnerProgramContent';

function SectionBody({ slug }: { slug: PartnerProgramSectionSlug }) {
  if (slug === 'stan-na-dzisiaj') {
    return (
      <ul className="grid gap-3 sm:grid-cols-2">
        {PROBLEM_QUESTIONS.map(question => (
          <li key={question} className="rounded-vs-md border border-vs-border-strong bg-white/70 p-4">
            {question}
          </li>
        ))}
      </ul>
    );
  }

  if (slug === 'co-badamy') {
    return (
      <ul className="grid gap-3 sm:grid-cols-2">
        {RESEARCH_QUESTIONS.map(question => (
          <li key={question.key} className="rounded-vs-md border border-vs-border-strong bg-white/70 p-4">
            {question.content}
          </li>
        ))}
      </ul>
    );
  }

  if (slug === 'jak-to-robimy') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {COMMITMENTS.map(([title, copy], index) => (
          <article key={title} className="rounded-vs-md border border-vs-border-strong bg-white/80 p-5">
            <p className="font-display text-[24px] uppercase leading-[0.95] text-vs-text-primary sm:text-[32px]">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h3 className="mt-3 text-lg font-semibold text-vs-text-primary">{title}</h3>
            <p className="mt-3 text-lg leading-relaxed text-vs-text-secondary">{copy}</p>
          </article>
        ))}
      </div>
    );
  }

  if (slug === 'co-w-zamian') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {BENEFITS.map(item => (
          <article key={item.title} className="rounded-vs-md border border-vs-border-strong bg-white/80 p-5">
            <h3 className="text-lg font-semibold text-vs-text-primary">{item.title}</h3>
            <p className="mt-3 text-lg leading-relaxed text-vs-text-secondary">{item.copy}</p>
          </article>
        ))}
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {CRITERIA.map(item => (
        <li key={item} className="rounded-vs-md border border-vs-border-strong bg-white/80 p-4 text-lg leading-relaxed">
          {item}
        </li>
      ))}
    </ul>
  );
}

function getNeighborSections(slug: PartnerProgramSectionSlug) {
  const currentIndex = PARTNER_PROGRAM_SECTIONS.findIndex(section => section.slug === slug);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const previousIndex = safeIndex === 0 ? PARTNER_PROGRAM_SECTIONS.length - 1 : safeIndex - 1;
  const nextIndex = safeIndex === PARTNER_PROGRAM_SECTIONS.length - 1 ? 0 : safeIndex + 1;

  return [
    { label: 'Poprzednia sekcja', section: PARTNER_PROGRAM_SECTIONS[previousIndex] },
    { label: 'Następna sekcja', section: PARTNER_PROGRAM_SECTIONS[nextIndex] },
  ];
}

function DetailPageBottomModule({ slug }: { slug: PartnerProgramSectionSlug }) {
  const neighbors = getNeighborSections(slug);

  return (
    <section className="mx-auto grid w-full max-w-[1600px] flex-1 items-start gap-8 border-x border-t border-vs-border-strong px-5 py-8 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:pb-16">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-vs-text-muted">
          Dalej w programie
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-[28px] uppercase leading-[0.95] text-vs-text-primary sm:text-[36px]">
          Przejdź do kolejnego kontekstu
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {neighbors.map(item => (
            <Link
              key={item.section.slug}
              href={item.section.href}
              className="block rounded-vs-md border border-vs-border-strong bg-white/75 p-4 transition hover:-translate-y-0.5 hover:bg-white"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-vs-text-muted">
                {item.label}
              </span>
              <span className="mt-3 block text-lg font-semibold text-vs-text-primary">
                {item.section.eyebrow}
              </span>
              <span className="mt-3 inline-flex text-sm font-semibold text-vs-text-primary underline underline-offset-4">
                Czytaj dalej
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-vs-text-muted">
          Kontakt / zgłoszenie
        </p>
        <h2 className="mt-3 font-display text-[28px] uppercase leading-none tracking-[-0.03em] text-vs-text-primary sm:text-[32px]">
          Porozmawiajmy o udziale
        </h2>
        <p className="mt-4 text-base leading-relaxed text-vs-text-secondary">
          Napisz, zadzwoń albo zgłoś palarnię przez formularz.
        </p>
        <div className="mt-4 space-y-2 text-base font-medium text-vs-text-primary">
          <p>
            <span className="font-semibold">Email:</span>{' '}
            <a href="mailto:roasters@funbrew.site?subject=Web%20Inquiry%20from%20Landing" className="underline">
              roasters@funbrew.site
            </a>
          </p>
          <p>
            <span className="font-semibold">Telefon:</span>{' '}
            <a href="tel:+48573363234" className="underline">
              +48 573 363 234
            </a>
          </p>
          <p>
            <span className="font-semibold">WhatsApp:</span>{' '}
            <a href="https://wa.me/48573363234" className="underline">
              +48 573 363 234
            </a>
          </p>
        </div>
        <PartnerProgramSignupButton className="vs-button-primary mt-5 inline-flex w-fit text-sm font-semibold">
          Zgłoś palarnię
        </PartnerProgramSignupButton>
      </div>
    </section>
  );
}

export default function PartnerProgramDetailPage({ slug }: { slug: PartnerProgramSectionSlug }) {
  const section = getPartnerProgramSection(slug);

  return (
    <main className="flex min-h-[calc(100vh-128px)] flex-col bg-vs-program-canvas text-vs-text-primary">
      <section className="mx-auto grid w-full max-w-[1600px] gap-8 border-x border-vs-border-strong px-5 py-8 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:pb-20 lg:pt-16">
        <div>
          <Link href="/" className="text-sm font-semibold text-vs-text-primary underline underline-offset-4">
            Wróć do Programu Partnerów
          </Link>
          <div className="mt-8">
            <PartnerProgramSectionHeading eyebrow={section.eyebrow} title={section.title} lead={section.lead} />
          </div>
        </div>
        <div className="text-lg leading-relaxed text-vs-text-secondary">
          <SectionBody slug={slug} />
        </div>
      </section>
      <DetailPageBottomModule slug={slug} />
    </main>
  );
}
