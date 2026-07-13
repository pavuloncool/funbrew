import PublicInfoPage, { PUBLIC_BODY_COPY_CLASS } from '@/components/public/PublicInfoPage';

const DATA_SCOPE = [
  'nazwa palarni',
  'osoba kontaktowa',
  'adres e-mail',
  'strona internetowa lub profil Instagram',
  'aktywne kanały sprzedaży',
  'odpowiedź tekstowa dotycząca oczekiwanych insightów',
  'dane techniczne przekazywane podczas wysyłki formularza: origin, user-agent, referer oraz forwarded-for/IP',
] as const;

const DATA_RIGHTS = [
  'dostępu do danych',
  'sprostowania danych',
  'usunięcia danych',
  'ograniczenia przetwarzania',
  'wniesienia sprzeciwu wobec przetwarzania',
  'wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych',
] as const;

export default function PrivacyPage() {
  return (
    <PublicInfoPage
      eyebrow="RODO"
      title="Polityka prywatności"
      intro="Ta polityka opisuje, jak przetwarzamy dane osobowe przekazywane przez formularz zgłoszeniowy do Programu Partnerów Branżowych fun•brew."
    >
      <div className="grid gap-4">
        <section className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm">
          <h2 className="text-xl font-semibold text-vs-text-primary">Administrator danych</h2>
          <p className={`mt-3 ${PUBLIC_BODY_COPY_CLASS}`}>
            Administratorem danych osobowych jest Paweł Kuligowski, osoba fizyczna prowadząca
            projekt fun•brew. Kontakt: ul. Argentyńska 5/17, Warszawa, roaster@funbrew.site.
          </p>
        </section>

        <section className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm">
          <h2 className="text-xl font-semibold text-vs-text-primary">Cel i podstawa przetwarzania</h2>
          <p className={`mt-3 ${PUBLIC_BODY_COPY_CLASS}`}>
            Dane przetwarzamy w celu obsługi zgłoszenia i kontaktu w sprawie Programu Partnerów
            Branżowych fun•brew. Podstawą prawną przetwarzania jest art. 6 ust. 1 lit. f RODO,
            czyli prawnie uzasadniony interes administratora polegający na obsłudze zgłoszeń,
            kwalifikacji palarni do programu i prowadzeniu kontaktu B2B.
          </p>
        </section>

        <section className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm">
          <h2 className="text-xl font-semibold text-vs-text-primary">Zakres danych</h2>
          <p className={`mt-3 ${PUBLIC_BODY_COPY_CLASS}`}>
            Formularz zgłoszeniowy może obejmować następujące dane:
          </p>
          <ul className="mt-4 grid gap-2">
            {DATA_SCOPE.map(item => (
              <li key={item} className={PUBLIC_BODY_COPY_CLASS}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm">
          <h2 className="text-xl font-semibold text-vs-text-primary">Odbiorcy i transfer danych</h2>
          <p className={`mt-3 ${PUBLIC_BODY_COPY_CLASS}`}>
            Dane mogą być przetwarzane przez dostawców usług technicznych używanych do obsługi
            formularza i komunikacji, w szczególności dostawców hostingu, Supabase/backendu, poczty
            e-mail oraz narzędzi technicznych obsługujących zgłoszenia.
          </p>
          <p className={`mt-3 ${PUBLIC_BODY_COPY_CLASS}`}>
            Jeżeli dostawcy infrastruktury lub narzędzi przetwarzają dane poza Europejskim Obszarem
            Gospodarczym, transfer odbywa się z zastosowaniem mechanizmów wymaganych przez RODO,
            takich jak standardowe klauzule umowne lub inne właściwe zabezpieczenia.
          </p>
        </section>

        <section className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm">
          <h2 className="text-xl font-semibold text-vs-text-primary">Okres przechowywania</h2>
          <p className={`mt-3 ${PUBLIC_BODY_COPY_CLASS}`}>
            Dane ze zgłoszenia przechowujemy przez 12 miesięcy od wysłania formularza, chyba że
            wcześniej wniesiono skuteczny sprzeciw albo dłuższe przechowywanie jest potrzebne do
            ustalenia, dochodzenia lub obrony roszczeń.
          </p>
        </section>

        <section className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm">
          <h2 className="text-xl font-semibold text-vs-text-primary">Prawa osoby, której dane dotyczą</h2>
          <p className={`mt-3 ${PUBLIC_BODY_COPY_CLASS}`}>Przysługują Ci prawa do:</p>
          <ul className="mt-4 grid gap-2">
            {DATA_RIGHTS.map(item => (
              <li key={item} className={PUBLIC_BODY_COPY_CLASS}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm">
          <h2 className="text-xl font-semibold text-vs-text-primary">Dobrowolność i automatyzacja</h2>
          <p className={`mt-3 ${PUBLIC_BODY_COPY_CLASS}`}>
            Podanie danych jest dobrowolne, ale konieczne do obsługi zgłoszenia i kontaktu w sprawie
            programu. Dane z formularza nie są wykorzystywane do zautomatyzowanego podejmowania
            decyzji ani profilowania.
          </p>
        </section>
      </div>
    </PublicInfoPage>
  );
}
