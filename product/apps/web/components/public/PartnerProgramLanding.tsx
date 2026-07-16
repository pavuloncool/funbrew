import Link from 'next/link';

import PartnerProgramSectionHeading from '@/components/public/PartnerProgramSectionHeading';
import { PARTNER_PROGRAM_SECTIONS } from '@/components/public/partnerProgramContent';

export default function PartnerProgramLanding() {
  return (
    <main className="bg-vs-program-canvas text-vs-text-primary">
      <section className="mx-auto grid w-full max-w-[1600px] gap-10 border-x border-vs-border-strong px-5 py-8 sm:px-8 min-[1100px]:min-h-[calc(80vh-74px)] min-[1100px]:grid-cols-[1.05fr_0.95fr] min-[1100px]:items-start min-[1100px]:pb-20 min-[1100px]:pt-16">
        <div>
          <p className="mt-5 max-w-xl text-sm font-semibold uppercase tracking-[0.12em] text-vs-text-muted">
            Aplikacja dla palarni,<br className="min-[1100px]:hidden" /> które chcą wiedzieć więcej.
          </p>
          <h1
            className="mt-6 max-w-5xl font-display text-[48px] uppercase leading-[0.9] text-vs-text-primary sm:text-[72px] min-[1100px]:text-[92px]"
            aria-label="Plus feedback. Plus dane. Plus decyzje."
          >
            <span className="whitespace-nowrap">(+)&nbsp;dane</span>
            <br />
            <span className="whitespace-nowrap">(+)&nbsp;feedback</span>
            <br />
            <span className="whitespace-nowrap">(+)&nbsp;decyzje</span>
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-relaxed text-vs-text-secondary sm:text-xl">
            Testuj z nami prototyp aplikacji, która pokazuje roasterom, jak ich kawa jest parzona i oceniana przez odbiorców. Wspólnie zdefiniujmy najcenniejsze insighty.
          </p>
        </div>

        <div className="overflow-hidden rounded-vs-md border border-vs-border-strong bg-white/80 shadow-vs-sm">
          <p className="px-5 pt-5 text-xs font-semibold uppercase tracking-[0.18em] text-vs-text-muted sm:px-6 sm:pt-6">
            Zrzut dashboardu analityki
          </p>
          <img
            src="/roaster-analytics.png"
            alt="Dashboard funbrew z filtrami, zakładkami analityki i panelami insightów dla palarni"
            width={3104}
            height={1920}
            className="mt-4 block aspect-[3104/1920] h-auto w-full object-cover"
          />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1600px] gap-4 border-x border-t border-vs-border-strong px-5 py-8 sm:px-8 md:grid-cols-2 lg:pb-20 xl:grid-cols-5">
        {PARTNER_PROGRAM_SECTIONS.map(section => (
          <Link
            key={section.slug}
            href={section.href}
            className="block rounded-vs-md border border-vs-border-strong bg-white/75 p-5 shadow-vs-sm transition hover:-translate-y-0.5 hover:bg-white"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-vs-text-muted">
              {section.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-[24px] uppercase leading-[0.95] text-vs-text-primary sm:text-[28px]">
              {section.title}
            </h2>
            {section.lead ? (
              <p className="mt-4 text-base leading-relaxed text-vs-text-secondary">{section.lead}</p>
            ) : null}
            <span className="mt-5 inline-flex text-sm font-semibold text-vs-text-primary underline underline-offset-4">
              Czytaj więcej
            </span>
          </Link>
        ))}
      </section>

      <section id="kontakt" className="scroll-mt-[74px] mx-auto grid w-full max-w-[1600px] gap-8 border-x border-t border-vs-border-strong px-5 py-8 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:pb-20">
        <PartnerProgramSectionHeading
          eyebrow="Kontakt"
          title="Porozmawiajmy o udziale w programie"
          lead="Napisz, zadzwoń albo zgłoś palarnię przez formularz dostępny z krawędzi ekranu."
        />
        <div className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm sm:p-6">
          <h2 className="font-display text-[28px] uppercase leading-none tracking-[-0.03em] text-vs-text-primary sm:text-[32px]">
            Dane kontaktowe
          </h2>
          <div className="mt-4 space-y-3 text-base font-medium text-vs-text-primary sm:text-lg">
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
        </div>
      </section>
    </main>
  );
}
