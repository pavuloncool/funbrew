# Prompt dla Codex z rozbiciem na sub-agentów

## Summary
Poniższy prompt wymusza pracę wieloagentową z jawnym podziałem odpowiedzialności i jednym wspólnym kontraktem integracyjnym. Celem jest ochrona cross-app assumptions między `apps/web`, `apps/consumer-mobile`, `packages/shared` i `supabase`, tak aby żaden agent nie potraktował bety jako web-only scope.

## Prompt
```md
Pracujesz w repo `funcup`. Masz zrealizować plan dojścia do `beta-funcup` jako systemu dwuwarstwowego:
- `apps/web` dla roasterów i public web entry,
- `apps/consumer-mobile` dla consumer flow,
- `packages/shared` jako wspólne kontrakty i logika,
- `supabase` jako wspólny backend danych, auth i functions.

Masz obowiązkowo rozbić pracę na sub-agentów, bo celem jest uniknięcie sytuacji, w której jeden agent zgubi kontrakt cross-app albo nadpisze assumptions drugiej warstwy.

## Zasada nadrzędna
Beta nie może zostać potraktowana jako deploy samego `apps/web`.
Każda zmiana musi utrzymać wspólny data plane dla:
- publish batch,
- QR generation / resolution,
- consumer scan,
- tasting log,
- analytics po stronie roastera,
- auth i role gate.

## Globalny sposób pracy

### 1. Najpierw ustal kontrakt integracyjny
Zanim ruszysz z implementacją, lokalnie zbierz i spisz jeden wspólny integration contract obejmujący:
- role i auth boundaries,
- shared env assumptions,
- wspólne tabele i functions Supabase,
- kontrakt `/q/{hash}`,
- zależność mobile log -> web analytics,
- public vs protected web routes,
- wymagany wspólny backend beta dla web i mobile.

Ten integration contract ma być punktem odniesienia dla wszystkich sub-agentów.

### 2. Potem uruchom sub-agentów o rozłącznych odpowiedzialnościach
Użyj sub-agentów z następującym ownership:

#### Agent 1: Frontend Web
Ownership:
- `apps/web/app`
- `apps/web/components`
- `apps/web/src` w zakresie public entry, landing, CTA routing, contact form UI
Cel:
- wprowadzić publiczny one-pager po splashu,
- dodać `My Roaster Hub`,
- zachować istniejącą logikę check-if-user-logged-in,
- nie uszkodzić `/q/{hash}` ani roaster-only routes,
- nie zmieniać shared kontraktów samodzielnie bez synchronizacji z Agentem 3 i 6.

#### Agent 2: Mobile
Ownership:
- `apps/consumer-mobile`
Cel:
- sprawdzić, czy mobile nadal poprawnie wskazuje wspólny backend beta,
- potwierdzić env assumptions i deep link assumptions,
- ocenić wpływ zmian host/domain na QR scan i app routing,
- wprowadzić tylko minimalne zmiany potrzebne do zgodności z beta backendem,
- nie przebudowywać consumer UX poza niezbędnym zakresem.

#### Agent 3: Shared Contracts
Ownership:
- `packages/shared`
- kontrakty i dokumentacja shared flow
Cel:
- pilnować wspólnych typów, flow contracts, error contracts i assumptions między warstwami,
- wykrywać miejsca, gdzie web lub mobile próbuje lokalnie „obejść” shared contract,
- zatwierdzić spójność log_tasting / analytics / auth role assumptions,
- być głównym recenzentem cross-app compatibility.

#### Agent 4: Supabase Infra
Ownership:
- `supabase/migrations`
- `supabase/functions`
- konfiguracja storage / schema / backend persistence dla contact form
Cel:
- przygotować wspólny projekt Supabase beta dla web i mobile,
- dodać wymagane migracje i backend dla leads/contact form,
- nie łamać istniejących tabel, functions i data flows,
- utrzymać zgodność z mobile i web clients.

#### Agent 5: Auth
Ownership:
- web auth flow,
- role gate,
- session checking,
- auth env / redirect assumptions
Cel:
- dopilnować, że `My Roaster Hub` używa istniejącej logiki auth,
- zachować consumer rejection on web,
- sprawdzić zgodność auth config dla beta deploy,
- nie dopuścić do rozjazdu auth policy między web, mobile i Supabase.

#### Agent 6: QR / Deep Links
Ownership:
- kontrakt `/q/{hash}`,
- QR generation assumptions,
- host/domain/deep-link compatibility
Cel:
- zweryfikować, że beta host nie odcina mobile scan flow,
- ocenić wpływ Vercel domain / custom domain / beta subdomain,
- dopilnować zgodności public web resolver + mobile deep link flow,
- zaktualizować kontrakt QR, jeśli zmieni się host lub routing.

#### Agent 7: Deployment
Ownership:
- env matrix,
- Vercel setup,
- shared beta backend wiring,
- release verification sequence
Cel:
- przygotować konkretny plan wdrożenia `apps/web` na Vercel i wspólnego backendu beta,
- uwzględnić także beta config dla mobile,
- spisać dokładne env vars i kolejność deployu,
- nie traktować mobile jako out-of-scope dependency.

#### Agent 8: Release Docs
Ownership:
- `mvp-release-flow-diagrams`
- readiness / checklist / runbook / assessment docs
Cel:
- zaktualizować dokumentację tak, by jasno opisywała beta jako system web + mobile + shared Supabase,
- dopisać ryzyka, smoke checks i final deploy checklist,
- wyłapać rozjazdy między kodem a dokumentacją.

### 3. Reguły koordynacji między agentami
Każdy agent musi działać tak, jakby nie był sam w codebase.
Nie wolno:
- nadpisywać assumptions innego agenta bez jawnego zgłoszenia konfliktu,
- wprowadzać lokalnych shortcutów ignorujących shared contracts,
- traktować własnego obszaru jako source of truth dla całego systemu.

Każdy agent ma w raporcie końcowym podać:
- co sprawdził,
- jakie assumptions potwierdził,
- jakie assumptions innych warstw są dla niego krytyczne,
- jakie ryzyko wykrył,
- jakie pliki zmienił.

### 4. Krytyczne pytania integracyjne, które mają zostać rozstrzygnięte
Na poziomie głównego agenta dopilnuj, żeby sub-agenci odpowiedzieli na te pytania:
- Czy web landing po splashu nie psuje istniejącego roaster auth flow?
- Czy mobile nadal korzysta z tego samego beta Supabase co web?
- Czy `/q/{hash}` działa poprawnie dla browsera i mobile po zmianie hosta/deploy target?
- Czy analytics web nadal czyta dane generowane przez consumer-mobile?
- Czy nowy contact form nie wprowadza backendowych zależności, które naruszają obecne security boundaries?
- Czy release docs opisują betę jako wspólny system, a nie web-only deploy?

## Cel implementacyjny
Zrealizuj następujący zakres:

### A. Publiczny web entry
- Po `AnimatedSplash` pokaż publiczny one-pager.
- One-pager ma tłumaczyć roasterom działanie i korzyści z funcup.
- W prawym górnym rogu umieść przycisk `My Roaster Hub`.
- `My Roaster Hub`:
  - jeśli user zalogowany jako `roaster` -> `/roaster-hub`
  - jeśli brak sesji -> `/login`
  - jeśli user zalogowany, ale to consumer -> sign-out local + login z `consumer_mobile_only`
- Nie psuj `/q/{hash}` ani roaster-only protected routes.

### B. Contact form
- Dodaj formularz kontaktowy do autorów aplikacji.
- Formularz ma:
  - zapisywać lead do Supabase,
  - wysyłać email notification do autorów,
  - mieć loading / success / error states,
  - degradację typu DB success + email fail = success dla usera, failure tylko w logach.

### C. Wspólny backend beta
- Przygotuj beta setup tak, by `apps/web` i `apps/consumer-mobile` wskazywały na ten sam nowy projekt Supabase.
- Uwzględnij:
  - env vars dla web,
  - env vars dla mobile,
  - auth redirect assumptions,
  - edge functions,
  - storage,
  - QR/public URL contract.

### D. Release readiness
- Zaktualizuj roadmapę i checklisty deployowe.
- Dodaj jawny rozdział o cross-app compatibility.
- Upewnij się, że smoke verification obejmuje nie tylko web, ale cały loop:
  - publish batch,
  - QR resolve,
  - mobile log,
  - analytics visibility.

## Kolejność wykonania
1. Główny agent: repo audit + integration contract.
2. Sub-agenci równolegle: frontend web, mobile, shared contracts, Supabase infra, auth, QR/deep links, deployment, release docs.
3. Główny agent: zebranie konfliktów i rozstrzygnięcie ich przed finalnymi zmianami.
4. Implementacja i integracja tylko po sprawdzeniu zgodności cross-app.
5. Testy i smoke checks.
6. Finalny raport.

## Finalny wynik ma zawierać
- listę wykonanych zmian,
- listę sub-agent findings,
- potwierdzenie, czy cross-app contract został zachowany,
- listę pozostałych ryzyk,
- checklistę live deploy dla beta,
- checklistę smoke verification dla web + mobile + shared backend.

## Ważne ograniczenia
- Nie wolno traktować bety jako web-only demo.
- Nie wolno odpiąć mobile od wspólnego backendu.
- Nie wolno zmieniać shared kontraktów bez oceny wpływu na obie warstwy.
- Nie wolno psuć publicznego QR flow.
- Nie wolno nadpisywać changes innych agentów ani cofać unrelated changes.
- Priorytetem jest zachowanie spójności systemowej, nie lokalna optymalizacja jednej warstwy.
```

## Test Plan
- Sprawdzić, czy prompt wymusza osobne ownership dla: web, mobile, shared, supabase, auth, QR, deployment, docs.
- Sprawdzić, czy prompt wymusza wspólny integration contract przed implementacją.
- Sprawdzić, czy prompt blokuje web-only assumptions i wymaga cross-app smoke verification.
- Sprawdzić, czy każdy agent ma jawnie określony zakres zmian i ograniczenia.

## Assumptions
- Sub-agenci będą używani dopiero w trybie wykonawczym, nie w obecnym Plan Mode.
- Największe ryzyko to utrata wspólnego backend contract i QR/deep-link compatibility; prompt został pod to zoptymalizowany.
