import PublicLeadForm from '@/components/public/PublicLeadForm';
import type { ReactNode } from 'react';

const PROBLEM_QUESTIONS = [
  'Jaki rating ma dana kawa wśród użytkowników na różnym poziomie doświadczenia sensorycznego?',
  'Jak profil sensoryczny deklarowany przez palarnię pokrywa się z odbiorem konsumenta?',
  'Jakie metody parzenia rekomenduje roaster versus jakie realnie wybiera klient?',
  'W jakim stopniu na ocenę produktu wpływa metoda parzenia, przepis, oczekiwania, kontekst?',
  'Które informacje pomagają klientowi wrócić po właściwy produkt?',
  'Które dane są przydatne dla palarni, a które tylko obciążają formularz?'
] as const;

const RESEARCH_QUESTIONS = [
  {
    key: 'funbrew-workflow',
    content: (
      <>
        Jak wpisać workflow <b>fun•brew</b> w codzienną pracę i doświadczenie palarni?
      </>
    ),
  },
  { key: 'describe-feedback', content: 'Jaki rodzaj feedbacku może zwiększyć codzienną ekspozycję na kupujących?' },
  { key: 'needs-and-deliver', content: 'Jak odpowiadać na oczekiwania odbiorców i dowozić produkt, który trafia w sedno?' },
  { key: 'new-horizons', content: 'Czy można otwierać nowe horyzonty, nie ryzykując utraty lojalnych klientów?' },
  {
    key: 'build-relations',
    content: (
      <>
        Jak wykorzystać insighty z <b>fun•brew</b>, żeby wzmacnianiać relacji roaster – konsument?
      </>
    ),
  },
  {
    key: 'useful-data',
    content: 'Jakie jeszcze dane i informacje mogą wspierać palarnię w codziennej działalności?',
  },
] as const;

const CRITERIA = [
  'posiadają aktywną ofertę specialty w sprzedaży detalicznej;',
  'chcą wiedzieć, jak klienci parzą, piją i oceniają ich kawę;',
  'mogą odbyć kilka spotkań w ramach programu;',
  'chcą mieć wpływ na aplikację, która usprawni ich workflow.',
] as const;

const COMMITMENTS = [
  ['Poznajemy się', 'Jak działa roaster, jak działa fun•brew. Jakie dane są dostępne na ten moment. Decyzja o udziale w pilotażu.'],
  ['Precyzujemy roaster data', 'Uzupełniamy i dopinamy zakres danych i raportów. Definiujemy przyszły workflow pod kątem roastera.'],
  ['Dostrajamy mobile', 'Spinamy dane z panelu roastera we wspólny flow z aplikacją kliencką na iOS i Android. Testujemy QR kody.'],
  ['Odpalamy beta appki', 'Beta aplikacji klienckiej trafia do wybranych konsumentów. Zbieramy realny feedback i dane na temat kawy.'],
  ['Omawiamy feedback', 'Oddzielamy kluczowe dane od szumu. Walidujemy wnioski i rekomendacje. Decydujemy o adopcji fun•brew w palarni.'],
] as const;

const BENEFITS = [
  {
    title: 'Preferencyjny dostęp',
    copy: (
      <>
        Palarnie uczestniczące w programie zyskują preferencyjny dostęp do funkcji i usług <b>fun•brew</b> po uruchomieniu.
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

function SectionHeading(props: { eyebrow?: string; title: ReactNode; lead?: ReactNode }) {
  return (
    <div className="max-w-3xl">
      {props.eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-vs-text-muted">
          {props.eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 font-display text-[32px] uppercase leading-[0.95] text-vs-text-primary sm:text-[44px]">
        {props.title}
      </h2>
      {props.lead ? (
        <p className="mt-4 text-base leading-relaxed text-vs-text-secondary sm:text-lg">{props.lead}</p>
      ) : null}
    </div>
  );
}

export default function PartnerProgramLanding() {
  return (
    <main className="bg-[#f5f1df] text-vs-text-primary">
      <section className="mx-auto grid w-full max-w-[1600px] gap-10 border-x border-vs-border-strong px-5 py-8 sm:px-8 lg:min-h-[calc(80vh-74px)] lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          {/*<div className="inline-flex rounded-full border border-vs-border-strong bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] shadow-vs-sm">
            Program Partnerów Branżowych
          </div>*/}
          <p className="mt-5 max-w-xl text-sm font-semibold uppercase tracking-[0.12em] text-vs-text-muted">
            Aplikacja dla palarni,<br className="min-[1100px]:hidden" /> które chcą wiedzieć więcej.
          </p>
          <h1
            className="mt-6 max-w-5xl font-display text-[48px] uppercase leading-[0.9] text-vs-text-primary sm:text-[72px] lg:text-[92px]"
            aria-label="Plus feedback. Plus dane. Plus decyzje."
          >
            (+) dane
            <br />
            (+) feedback
            <br />
            (+) decyzje
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-relaxed text-vs-text-secondary sm:text-xl">
            Testuj z nami prototyp aplikacji, która pokazuje roasterom,<br className="max-[1100px]:hidden" /> jak ich kawa jest parzona i oceniana przez odbiorców.<br /> Wspólnie zdefiniujmy najcenniejsze insighty.
          </p>
            <div className="mt-8 flex flex-wrap gap-3">
            <a href="#zgloszenie" className="vs-button-primary inline-flex text-sm font-semibold sm:text-base">
              Zgłoś palarnię do programu
            </a>
            {/*<a href="#co-testujemy" className="vs-button-secondary inline-flex text-sm font-semibold sm:text-base">
              Co badamy?
            </a>*/}
          </div>
        </div>

        <div className="overflow-hidden rounded-vs-md border border-vs-border-strong bg-white/80 shadow-vs-sm">
          <p className="px-5 pt-5 text-xs font-semibold uppercase tracking-[0.18em] text-vs-text-muted sm:px-6 sm:pt-6">
            Dashboard analityki
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

      <section id="stan-zero" className="scroll-mt-[74px] mx-auto grid w-full max-w-[1600px] gap-8 border-x border-t border-vs-border-strong px-5 py-8 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:pb-20">
        <SectionHeading 
        eyebrow="Stan na dzisiaj"
        title="Odzyskać dane + Uporządkować feedback"
        lead="Chcemy razem z palarniami odzyskać informacje, które znikają z radaru po wypuszczeniu kawy w świat. Prototyp aplikacji odpowiada na pytania:" />
        <div className="text-lg leading-relaxed text-vs-text-secondary">
          <ul className="grid gap-3 sm:grid-cols-2">
            {PROBLEM_QUESTIONS.map(question => (
              <li key={question} className="rounded-vs-md border border-vs-border-strong bg-white/70 p-4">
                {question}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="co-testujemy" className="scroll-mt-[74px] mx-auto grid w-full max-w-[1600px] gap-8 border-x border-t border-vs-border-strong px-5 py-8 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:pb-20">
        <SectionHeading
          eyebrow="Co badamy?"
          title="zakres insightów + workflow fun•brew"
          lead={
            <>
            Wspólnie ustalimy, które dane niosą największą realną wartość dla roastera. Pytamy o miejsce <b>fun•brew</b> w codziennej pracy palarni, próbując ustalić: 
            </>
          }   
        />
        <div className="space-y-6 text-lg leading-relaxed text-vs-text-secondary">
          <ul className="grid gap-3 sm:grid-cols-2">
            {RESEARCH_QUESTIONS.map(question => (
              <li key={question.key} className="rounded-vs-md border border-vs-border-strong bg-white/70 p-4">
                {question.content}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="jak-to-robimy" className="scroll-mt-[74px] mx-auto w-full max-w-[1600px] border-x border-t border-vs-border-strong px-5 py-8 sm:px-8 lg:pb-20">
        <SectionHeading
          eyebrow="Jak to robimy?"
          title={
            <>
            Gdzie zaczynamy +
            <br /> 
            na czym kończymy
            </>
          }
          lead="Pilotaż jest krótki i kontrolowany. Zasadniczo obejmuje następujące kroki:"
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {COMMITMENTS.map(([title, copy]) => (
            <article key={title} className="rounded-vs-md border border-vs-border-strong bg-white/80 p-5">
              <h3 className="text-lg font-semibold text-vs-text-primary">{title}</h3>
              <p className="mt-3 text-lg leading-relaxed text-vs-text-secondary">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1600px] border-x border-t border-vs-border-strong px-5 py-8 sm:px-8 lg:pb-20">
        <SectionHeading
          eyebrow="Korzyści dla palarni"
          title="Co otrzymuje palarnia?"
          lead="Udział w programie daje realny wpływ na produkt i dostęp do efektów pracy po uruchomieniu fun•brew."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {BENEFITS.map(item => (
            <article key={item.title} className="rounded-vs-md border border-vs-border-strong bg-white/80 p-5">
              <h3 className="text-lg font-semibold text-vs-text-primary">{item.title}</h3>
              <p className="mt-3 text-lg leading-relaxed text-vs-text-secondary">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="zgloszenie" className="scroll-mt-[74px] mx-auto grid w-full max-w-[1600px] gap-8 border-x border-t border-vs-border-strong px-5 py-8 sm:px-8 lg:grid-cols-2 lg:pb-20">
        <div>
          <SectionHeading 
          eyebrow="Kogo zapraszamy?"
          title="Palarnie, które:" />
          <ul className="mt-8 grid gap-3">
            {CRITERIA.map(item => (
              <li key={item} className="rounded-vs-md border border-vs-border-strong bg-white/80 p-4 text-lg leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <PublicLeadForm
          variant="partnerProgram"
          formTitle="Zgłoś palarnię do programu"
          leadSource="partner_program_home"
          emailSubject="Web Inquiry from Landing"
          submitLabel="Zgłoś palarnię do programu"
          successMessage={
            <>
              Dziękujemy za zgłoszenie. Odezwiemy się w sprawie udziału w programie.
              <br />
              Ekipa <b>fun•brew</b>.
            </>
          }
        />
      </section>

    </main>
  );
}
