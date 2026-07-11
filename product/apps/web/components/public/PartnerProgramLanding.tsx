import PublicLeadForm from '@/components/public/PublicLeadForm';

const RESEARCH_QUESTIONS = [
  'Czy feedback konsumenta pomaga lepiej opisać kawę?',
  'Czy klienci rozumieją profil sensoryczny tak, jak zakłada palarnia?',
  'Czy metoda parzenia wpływa na ocenę produktu?',
  'Czy klient wie, po którą kawę wróciłby ponownie?',
  'Które dane są przydatne dla palarni, a które tylko obciążają formularz?',
] as const;

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Wybierasz 2–3 produkty',
    copy: 'Palarnia wskazuje kawy, które mają wejść do pilotażu.',
  },
  {
    step: '02',
    title: 'Konsument skanuje QR',
    copy: 'Kod prowadzi do prostego flow feedbacku po zakupie lub konsumpcji.',
  },
  {
    step: '03',
    title: 'Zbieramy uporządkowany feedback',
    copy: 'Konsument ocenia kawę, sposób parzenia, odbiór profilu i intencję ponownego wyboru.',
  },
  {
    step: '04',
    title: 'Sprawdzamy wartość danych',
    copy: 'Wspólnie oceniamy, które dane pomagają w decyzjach produktowych, sensorycznych i komunikacyjnych.',
  },
] as const;

const PROGRAM_PARAMETERS = [
  ['Zakres', '2–3 produkty'],
  ['Format', 'kontrolowany pilotaż'],
  ['Udział', 'krótkie discovery, konfiguracja produktów, test, review wyników'],
  ['Cel', 'walidacja wartości danych, nie sprzedaż gotowego SaaS-u'],
  ['Liczba miejsc', 'ograniczona'],
] as const;

const BENEFITS = [
  {
    title: 'Wcześniejszy dostęp do wersji komercyjnej',
    copy: 'Partnerzy programu będą mogli jako pierwsi zobaczyć kierunek wersji live.',
  },
  {
    title: 'Preferencyjne warunki membership',
    copy: 'Palarnie biorące udział w programie otrzymają preferencyjne warunki membership po uruchomieniu wersji live.',
  },
  {
    title: 'Wpływ na zakres danych',
    copy: 'Partnerzy pomagają określić, które dane powinny znaleźć się w produkcie, a które są zbędne.',
  },
  {
    title: 'Test na realnych produktach',
    copy: 'Program zakłada pracę na 2–3 kawach, a nie na abstrakcyjnym demo.',
  },
  {
    title: 'Materiał do decyzji produktowych i komunikacyjnych',
    copy: 'Sprawdzamy, czy feedback konsumentów pomaga lepiej opisać kawę, dopasować komunikację i zrozumieć odbiór profilu sensorycznego.',
  },
] as const;

const CRITERIA = [
  'mają aktywną ofertę kaw specialty',
  'mogą wskazać 2–3 produkty do pilotażu',
  'sprzedają online, stacjonarnie lub przez partnerów',
  'chcą lepiej rozumieć odbiór swoich kaw po zakupie',
  'są gotowe porozmawiać o tym, jakie dane naprawdę pomagają podejmować decyzje',
  'nie oczekują jeszcze gotowego systemu enterprise, tylko kontrolowanego programu współtworzenia',
] as const;

const PARTICIPATION_STEPS = [
  ['Zgłoszenie palarni', 'Wypełniasz krótki formularz.'],
  ['Rozmowa discovery', 'Sprawdzamy, czy profil palarni pasuje do pierwszego etapu programu.'],
  ['Wybór 2–3 produktów', 'Określamy, które kawy mają wejść do pilotażu.'],
  ['Test feedbacku konsumenckiego', 'Sprawdzamy, jak konsumenci reagują na flow i jakie dane zostawiają.'],
  ['Review wyników', 'Omawiamy, które dane mają wartość decyzyjną, a które są zbędne.'],
] as const;

function SectionHeading(props: { eyebrow?: string; title: string; lead?: string }) {
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

function DataCard(props: { label: string; value: string }) {
  return (
    <div className="border-t border-vs-border-strong pt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-vs-text-muted">{props.label}</p>
      <p className="mt-2 text-lg font-semibold text-vs-text-primary">{props.value}</p>
    </div>
  );
}

export default function PartnerProgramLanding() {
  return (
    <main className="bg-[#f5f1df] text-vs-text-primary">
      <section className="mx-auto grid min-h-[calc(100vh-74px)] w-full max-w-[1600px] gap-10 border-x border-vs-border-strong px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
        <div>
          <div className="inline-flex rounded-full border border-vs-border-strong bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] shadow-vs-sm">
            Program Partnerów Branżowych
          </div>
          <p className="mt-5 max-w-xl text-sm font-semibold uppercase tracking-[0.12em] text-vs-text-muted">
            Dla palarni, które chcą współtworzyć standard danych konsumenckich w kawie specialty.
          </p>
          <h1 className="mt-6 max-w-5xl font-display text-[48px] uppercase leading-[0.9] text-vs-text-primary sm:text-[72px] lg:text-[92px]">
            Zobacz, co dzieje się z Twoją kawą po zakupie.
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-relaxed text-vs-text-secondary sm:text-xl">
            fun•brew pomaga palarniom zobaczyć, co dzieje się z kawą po zakupie: jak jest parzona,
            oceniana, konsumowana i rozumiana przez klientów.
          </p>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-vs-text-secondary sm:text-lg">
            Szukamy kilku palarni, które pomogą zweryfikować, jakie dane są naprawdę użyteczne w
            decyzjach produktowych, sensorycznych i komunikacyjnych.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#zgloszenie" className="vs-button-primary inline-flex text-sm font-semibold sm:text-base">
              Zgłoś palarnię do programu
            </a>
            <a href="#co-testujemy" className="vs-button-secondary inline-flex text-sm font-semibold sm:text-base">
              Zobacz, co testujemy
            </a>
          </div>
        </div>

        <div className="rounded-vs-md border border-vs-border-strong bg-white/80 p-5 shadow-vs-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-vs-text-muted">
            QR na opakowaniu → feedback konsumenta → insight dla palarni
          </p>
          <div className="mt-6 grid gap-4">
            <div className="rounded-vs-md border border-vs-border-strong bg-[#fbfaf4] p-4">
              <p className="text-sm font-semibold text-vs-text-muted">Produkt pilotażowy</p>
              <p className="mt-2 text-2xl font-semibold">Kolumbia, washed, 250 g</p>
              <p className="mt-4 inline-flex rounded border border-vs-border-strong px-3 py-2 font-mono text-sm">
                QR / batch / feedback
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <DataCard label="Zakres programu" value="2–3 produkty" />
              <DataCard label="Cel" value="walidacja danych" />
              <DataCard label="Feedback" value="parzenie, odbiór, powrót" />
              <DataCard label="Format" value="kontrolowany pilotaż" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1600px] gap-8 border-x border-t border-vs-border-strong px-5 py-14 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
        <SectionHeading title="Po sprzedaży paczki kawa znika z pola widzenia palarni." />
        <div className="space-y-6 text-lg leading-relaxed text-vs-text-secondary">
          <p>
            Palarnia wie, co wypaliła, jak opisała profil i gdzie produkt trafił. Zwykle nie wie
            jednak, jak kawa została zaparzona, czy klient zrozumiał profil sensoryczny, co realnie
            wpłynęło na ocenę i po którą kawę wróciłby ponownie.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              'Czy klienci parzą kawę zgodnie z rekomendacją?',
              'Czy rozumieją profil sensoryczny tak, jak zakłada palarnia?',
              'Co wpływa na ocenę: kawa, metoda, opis, oczekiwanie, kontekst?',
              'Które informacje pomagają klientowi wrócić po właściwy produkt?',
            ].map(question => (
              <p key={question} className="rounded-vs-md border border-vs-border-strong bg-white/70 p-4">
                {question}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1600px] border-x border-t border-vs-border-strong px-5 py-14 sm:px-8 lg:py-20">
        <SectionHeading
          title="QR na opakowaniu. Feedback od konsumenta. Dane, które mają prowadzić do decyzji."
          lead="Mechanika programu jest ograniczona celowo: ma pomóc sprawdzić, które dane z realnej konsumpcji kawy są użyteczne, a które tylko dodają szumu."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PROCESS_STEPS.map(item => (
            <article key={item.step} className="rounded-vs-md border border-vs-border-strong bg-white/80 p-5">
              <p className="font-display text-[32px] font-semibold uppercase leading-[0.95] text-vs-text-muted sm:text-[44px]">
                {item.step}
              </p>
              <h3 className="mt-4 text-xl font-semibold text-vs-text-primary">{item.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-vs-text-secondary">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="program" className="mx-auto grid w-full max-w-[1600px] gap-8 border-x border-t border-vs-border-strong px-5 py-14 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <SectionHeading
          eyebrow="Program"
          title="Program Partnerów Branżowych"
          lead="Dla palarni, które chcą współtworzyć standard danych konsumenckich w kawie specialty."
        />
        <div>
          <p className="text-lg leading-relaxed text-vs-text-secondary">
            Program jest przeznaczony dla kilku palarni, które chcą sprawdzić fun•brew na
            ograniczonym zakresie produktów i pomóc określić, jakie dane z realnej konsumpcji kawy
            są rzeczywiście przydatne.
          </p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            {PROGRAM_PARAMETERS.map(([label, value]) => (
              <div key={label} className="rounded-vs-md border border-vs-border-strong bg-white/80 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-vs-text-muted">{label}</dt>
                <dd className="mt-2 font-semibold text-vs-text-primary">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="co-testujemy" className="mx-auto w-full max-w-[1600px] border-x border-t border-vs-border-strong px-5 py-14 sm:px-8 lg:py-20">
        <SectionHeading
          eyebrow="Research questions"
          title="Nie testujemy, czy aplikacja się podoba. Testujemy, czy dane pomagają palarni podjąć decyzję."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {RESEARCH_QUESTIONS.map(question => (
            <article key={question} className="rounded-vs-md border border-vs-border-strong bg-[#fbfaf4] p-5">
              <p className="text-lg font-semibold leading-snug text-vs-text-primary">{question}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1600px] border-x border-t border-vs-border-strong px-5 py-14 sm:px-8 lg:py-20">
        <SectionHeading title="Co zyskuje palarnia uczestnicząca w programie" />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {BENEFITS.map(item => (
            <article key={item.title} className="rounded-vs-md border border-vs-border-strong bg-white/80 p-5">
              <h3 className="text-xl font-semibold text-vs-text-primary">{item.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-vs-text-secondary">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="dla-palarni" className="mx-auto grid w-full max-w-[1600px] gap-8 border-x border-t border-vs-border-strong px-5 py-14 sm:px-8 lg:grid-cols-2 lg:py-20">
        <SectionHeading title="Dla jakich palarni jest ten program" />
        <ul className="grid gap-3">
          {CRITERIA.map(item => (
            <li key={item} className="rounded-vs-md border border-vs-border-strong bg-white/80 p-4 text-base leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-[1600px] border-x border-t border-vs-border-strong px-5 py-14 sm:px-8 lg:py-20">
        <SectionHeading title="Jak wygląda udział w programie" />
        <div className="mt-10 grid gap-4 md:grid-cols-5">
          {PARTICIPATION_STEPS.map(([title, copy], index) => (
            <article key={title} className="rounded-vs-md border border-vs-border-strong bg-[#fbfaf4] p-4">
              <p className="font-display text-[32px] font-semibold uppercase leading-[0.95] text-vs-text-muted sm:text-[44px]">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-vs-text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-vs-text-secondary">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="zgloszenie" className="mx-auto grid w-full max-w-[1600px] gap-8 border-x border-t border-vs-border-strong px-5 py-14 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:py-20">
        <SectionHeading
          title="Zgłoś palarnię do programu"
          lead="Szukamy kilku palarni, które pomogą zweryfikować, jakie dane z realnej konsumpcji kawy są przydatne w decyzjach produktowych, sensorycznych i komunikacyjnych."
        />
        <PublicLeadForm
          variant="partnerProgram"
          formTitle="Zgłoś palarnię do programu"
          formDescription="Zgłoszenie nie oznacza automatycznego przyjęcia do programu. Szukamy kilku palarni, które mogą realnie pomóc sprawdzić, jakie dane z konsumpcji kawy są przydatne w decyzjach produktowych, sensorycznych i komunikacyjnych."
          submitLabel="Zgłoś palarnię do programu"
          successMessage="Dziękujemy za zgłoszenie. Odezwiemy się w sprawie udziału w programie. Ekipa fun•brew."
        />
      </section>
    </main>
  );
}
