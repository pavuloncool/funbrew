# MVP Candidate Assessment (funcup)

Data oceny: 2026-05-07  
Zakres: `apps/web` + `apps/consumer-mobile`

## 1) Co działa dziś (potwierdzony trzon MVP)

### A. Wejście i role aplikacji
- `apps/web` prowadzi tylko ścieżkę roastera (entry -> auth -> roaster hub).
- `apps/consumer-mobile` prowadzi tylko ścieżkę consumera (entry -> auth -> tabs).
- Bramka roli działa po obu stronach (konto consumer nie wejdzie do web roastera i odwrotnie).

### B. Główny loop produktu (scan -> coffee -> log -> analytics)
- Consumer skanuje QR i przechodzi do strony kawy.
- Z poziomu strony kawy przechodzi do Tasting Log i zapisuje degustację.
- Dane degustacji pojawiają się po stronie roastera w analytics batcha.
- Roaster ma działający pipeline publikacji batcha z QR i podglądem/pobraniem kodu.

### C. Ostatni fix Tasting Log (stabilność zapisu)
- Przywrócony został pewny zapis degustacji i twardsza obsługa błędów sync.
- Działa fallback endpointu `log_tasting` / `coffee/log-tasting`.
- Offline queue i retry są obsługiwane z rozróżnieniem błędów retryable/non-retryable.
- Smoke testy shared dla warstwy tasting/offline: PASS (51 testów, 15 plików).

## 2) Wniosek: czy to jest MVP candidate?

Tak: **repo jest MVP-candidate funkcjonalnie**.  
Nie: **repo nie jest jeszcze beta-ready** bez domknięcia obszarów jakościowych i release-gate.

## 3) Blockery do beta-release

### P0 (must-have przed beta)
- Domknięcie QA/release gate z backlogu `010-034..010-038` (manual + automatyczne dowody przejścia).
- Ujednolicenie design-system basics (`010-007..010-011`) na kluczowych ekranach, aby uniknąć regresji UX między web/mobile.
- Kontrakty błędów i polityka komunikatów dla scan/log/analytics (`010-030..010-033`) jako jedno źródło prawdy dla UI.
- End-to-end scenariusz krytyczny (US1) jako powtarzalny checklist/runbook dla buildów RC.

### P1 (should-have dla stabilnej bety)
- Dokończenie responsywności i nawigacji web w ekranach roasterowych (`010-029` domknięcie).
- Dodatkowe sanity dla offline UX (kolejka, retry, stany failed sync) na realnych urządzeniach.
- Cross-app observability (minimum: spójne logowanie błędów flow scan/log/analytics).

## 4) Proponowany plan dalszych działań do beta

### Etap 1: Release hardening (P0)
1. Zablokować scope beta do kanonicznego flow: publish batch -> scan -> log -> analytics.
2. Sfinalizować `010-030..010-033` i udokumentować mapę błędów UI.
3. Zrealizować `010-034..010-038` z dowodami (checklisty + wyniki testów).

**Kryteria done Etapu 1**
- Każdy scenariusz US1/US2/US6 ma status PASS z datą i dowodem.
- Brak otwartych blockerów P0 w backlogu release.
- RC build przechodzi smoke web + mobile + shared bez ręcznych hotfixów.

### Etap 2: UX consistency (P1)
1. Domknąć brakujące elementy `010-007..010-011` na ekranach o najwyższym ruchu.
2. Ustabilizować finalny routing i responsywność web (domknięcie `010-029`).
3. Uzupełnić runbook operacyjny dla beta (rollback, known issues, triage).

**Kryteria done Etapu 2**
- Spójne komponenty i stany loading/empty/error na kluczowych ekranach.
- Brak krytycznych rozjazdów nawigacji między dokumentacją a kodem.
- Gotowy pakiet release notes + known limitations dla beta.

## 5) Ryzyka, które trzeba monitorować podczas bety
- Zależność od Supabase functions (`scan_qr`, `log_tasting`, `update_coffee_stats`) i ich środowiskowego stanu.
- Niejednorodne dane historyczne (legacy vs canonical) mogą powodować edge-case’y w prezentacji.
- Offline queue wymaga monitorowania liczby pending/failed na dłuższych sesjach terenowych.

## 6) Status update P0 (2026-05-07)

### Zrealizowane
- `010-030`: ujednolicony kontrakt błędów + mapa UI copy dla `scan/log/analytics` w [BETA_ERROR_CONTRACTS.md](./BETA_ERROR_CONTRACTS.md).
- `010-033`: analytics refresh policy udokumentowany i wdrożony (`refetchInterval=30s` + komunikat UI) w web batch analytics.
- Krytyczny smoke flow RC dodany i uruchamialny przez `scripts/beta-smoke-tests.sh`; runbook: [BETA_SMOKE_RUNBOOK.md](./BETA_SMOKE_RUNBOOK.md).

### Częściowo / otwarte
- `010-034..010-037`: pozostają manualne evidence QA (US4/US5 device audit, accessibility pass, performance sanity) — status i kryteria w [BETA_RELEASE_CHECKLIST.md](./BETA_RELEASE_CHECKLIST.md).
- `010-031`: wymaga backend decision dla sygnałów duplicate-log hints (nie domknięte w tym zakresie kodowym).
- `010-032`: brak wdrożonej warstwy rate-limit w backend functions (kontrakt UI gotowy, enforcement backend nadal do domknięcia).
