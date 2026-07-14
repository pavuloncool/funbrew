import PublicLeadForm from '@/components/public/PublicLeadForm';
import type { ReactNode } from 'react';

const RESEARCH_QUESTIONS = [
  { key: 'describe-feedback', content: 'Czy feedback konsumenta pomaga lepiej opisać kawę?' },
  {
    key: 'funbrew-workflow',
    content: (
      <>
        Jak wpisać workflow <b>fun•brew</b> w codzienną pracę palarni?
      </>
    ),
  },
  {
    key: 'sensory-profile',
    content: 'Czy klienci odnajdują profil sensoryczny deklarowany przez roastera?',
  },
  { key: 'brewing-method', content: 'Czy metoda parzenia wpływa na ocenę produktu?' },
  { key: 'repeat-choice', content: 'Po którą kawę klient wróciłby ponownie?' },
  {
    key: 'useful-data',
    content: 'Które dane są przydatne dla palarni, a które tylko obciążają formularz?',
  },
] as const;

const PROBLEM_QUESTIONS = [
  'Jak dany batch oceniają użytkownicy o różnym stopniu doświadczenia sensorycznego?',
  'Jak profil sensoryczny deklarowany przez palarnię pokrywa się z odbiorem konsumenta?',
  'Jakie metody parzenia rekomenduje roaster, a jakie realnie wybiera klient?',
  'Co wpływa na ocenę produktu: metoda parzenia, przepis, oczekiwania, kontekst?',
  'Które informacje pomagają klientowi wrócić po właściwy produkt?',
  'Które dane są przydatne dla palarni, a które tylko obciążają formularz?'
] as const;

const CRITERIA = [
  'posiada aktywną ofertę kaw specialty w sprzedaży detalicznej;',
  'chce dotrzeć do danych posprzedażowych z realnej konsumpcji;',
  'jest gotowa współtworzyć branżowy standard feedbacku konsumenckiego;',
  'chce mieć wpływ na kształt platformy, zamiast używać szablonowych systemów.',
] as const;

const COMMITMENTS = [
  ['Poznajemy się', 'Jak działa roaster, jak działa fun•brew. Jakie dane są dostępne na ten moment. Decyzja o udziale w pilotażu.'],
  ['Precyzujemy roaster data', 'Uzupełniamy i modyfikujemy zakres danych i inputów. Definiujemy przyszły workflow pod kątem roastera.'],
  ['Dopinamy mobile', 'Spinamy dane z panelu roastera we wspólny flow z aplikacją kliencką na iOS i Android. Testujemy QR kody.'],
  ['Odpalamy beta appki', 'Beta aplikacji klienckiej trafia do wybranych konsumentów. Zbieramy realny feedback i dane na temat kawy.'],
  ['Omawiamy feedback i wyniki', 'Oddzielamy kluczowe dane od szumu. Walidujemy wnioski i rekomendacje. Decydujemy o adopcji fun•brew w palarni.'],
] as const;

const BENEFITS = [
  {
    title: 'Preferencyjny dostęp do wersji produkcyjnej',
    copy: (
      <>
        Palarnie uczestniczące w pilotażu zyskują preferencyjny dostęp do funkcji i usług <b>fun•brew</b> po uruchomieniu.
      </>
    ),
  },
  {
    title: 'Wpływ na zakres ekspozycji danych w aplikacji klienckiej',
    copy: 'Partnerzy mają realny wpływ na to, które moduły, metryki i raporty powinny znaleźć się w pierwszej wersji produktu.',
  },
  {
    title: 'Bieżący wgląd w wyniki pilotażu własnych produktów',
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
          <div className="inline-flex rounded-full border border-vs-border-strong bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] shadow-vs-sm">
            Program Partnerów Branżowych
          </div>
          <p className="mt-5 max-w-xl text-sm font-semibold uppercase tracking-[0.12em] text-vs-text-muted">
            Dla palarni specialty, które chcą wiedzieć więcej.
          </p>
          <h1
            className="mt-6 max-w-5xl font-display text-[48px] uppercase leading-[0.9] text-vs-text-primary sm:text-[72px] lg:text-[92px]"
            aria-label="Plus feedback. Plus dane. Plus decyzje."
          >
            (+) feedback
            <br />
            (+) dane
            <br />
            (+) decyzje
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-relaxed text-vs-text-secondary sm:text-xl">
            Testujemy <b>fun•brew</b>: prototyp platformy analitycznej dla palarni specialty,
            <br />
            która pozwoli roasterom odzyskać dane konsumenckie.
            <br />
            Zgłoś swoją palarnię do programu Partnerów Brażowych.
          </p>
            <div className="mt-8 flex flex-wrap gap-3">
            <a href="#zgloszenie" className="vs-button-primary inline-flex text-sm font-semibold sm:text-base">
              Zgłoś palarnię do programu
            </a>
            <a href="#co-testujemy" className="vs-button-secondary inline-flex text-sm font-semibold sm:text-base">
              Co badamy?
            </a>
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

      <section className="mx-auto grid w-full max-w-[1600px] gap-8 border-x border-t border-vs-border-strong px-5 py-8 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
        <SectionHeading 
        eyebrow="Problem wyjściowy"
        title="Odzyskać dane + Uporządkować feedback" />
        <div className="space-y-6 text-lg leading-relaxed text-vs-text-secondary">
          <p>
            Zadaniem <b>fun•brew</b> jest pomóc palarniom odzyskać dane posprzedażowe, które na dzisiaj są rozproszone, przypadkowe i często niedostępne. Na etapie prototypu zakres danych obejmuje insighty, które odpowiadają na pytania:
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {PROBLEM_QUESTIONS.map(question => (
              <li key={question} className="rounded-vs-md border border-vs-border-strong bg-white/70 p-4">
                {question}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="co-testujemy" className="mx-auto grid w-full max-w-[1600px] gap-8 border-x border-t border-vs-border-strong px-5 py-8 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
        <SectionHeading
          eyebrow="Zakres pilotażu"
          title="zakres insightów + workflow fun•brew"
        />
        <div className="space-y-6 text-lg leading-relaxed text-vs-text-secondary">
          <p>
            Chcemy wspólnie w wybranymi palarniami doprecyzować branżowy standard danych do wykorzystania w realnym procesie produkcji. Pytamy o miejsce <b>fun•brew</b> w toku codziennej pracy roastera, próbując ustalić:
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {RESEARCH_QUESTIONS.map(question => (
              <li key={question.key} className="rounded-vs-md border border-vs-border-strong bg-white/70 p-4">
                {question.content}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="zgloszenie" className="mx-auto grid w-full max-w-[1600px] gap-8 border-x border-t border-vs-border-strong px-5 py-8 sm:px-8 lg:grid-cols-2 lg:py-20">
        <div>
          <SectionHeading 
          eyebrow="Adresaci programu"
          title="Jeśli działasz w palarni, która:" />
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

      <section className="mx-auto w-full max-w-[1600px] border-x border-t border-vs-border-strong px-5 py-8 sm:px-8 lg:py-20">
        <SectionHeading
          eyebrow="Jak to działa"
          title={
            <>
            Gdzie zaczynamy
            <br /> 
           + na czym kończymy
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

      <section className="mx-auto w-full max-w-[1600px] border-x border-t border-vs-border-strong px-5 py-8 sm:px-8 lg:py-20">
        <SectionHeading
          eyebrow="Korzyści dla palarni"
          title="Co otrzymuje palarnia"
          lead="Udział w programie daje realny wpływ na produkt i dostęp do efektów pracy po uruchomieniu fun•brew."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {BENEFITS.map(item => (
            <article key={item.title} className="rounded-vs-md border border-vs-border-strong bg-white/80 p-5">
              <h3 className="text-xl font-semibold text-vs-text-primary">{item.title}</h3>
              <p className="mt-3 text-lg leading-relaxed text-vs-text-secondary">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

    </main>
  );
}
