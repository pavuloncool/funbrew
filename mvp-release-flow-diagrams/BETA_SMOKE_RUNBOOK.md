# Beta Smoke Runbook

Data: 2026-05-07
Script: `scripts/beta-smoke-tests.sh`

## Purpose
Powtarzalny smoke gate dla RC obejmujący krytyczny flow US1 + regression US2/US6 logic.

## Commands
Uruchomienie pełnego smoke:

```bash
bash scripts/beta-smoke-tests.sh
```

Skrypt uruchamia:

1. Shared tasting/offline
```bash
pnpm -C packages/shared test -- src/services/tastingService.test.ts src/services/offlineTastingQueue.test.ts src/services/offlineTasting.integration.test.ts
```

2. Shared coffee-page normalization
```bash
pnpm -C packages/shared test -- src/coffeePage/normalizeCoffeePage.test.ts
```

3. Web key logic tests
```bash
pnpm -C apps/web test -- src/lib/canonicalBatchFlow.test.ts src/lib/uploadCoffeeLabel.test.ts
```

4. Web e2e smoke (optional environment gate)
```bash
pnpm -C apps/web test:e2e -- --grep "coffee-bank|qr|analytics"
```

## Optional e2e fallback behavior
Jeśli krok 4 nie przejdzie lokalnie (np. brak przeglądarek Playwright lub brak lokalnego stacku), skrypt:
- loguje jawny reason (ostatnie linie błędu),
- uruchamia fallback smoke:

```bash
pnpm -C apps/web test -- src/lib/canonicalBatchFlow.test.ts src/lib/uploadCoffeeLabel.test.ts
```

## Exit code policy
- `exit 1`: dowolny required smoke/fallback fail.
- `exit 0`: required smoke PASS; optional e2e może mieć WARN, jeśli fallback PASS.

## Reporting template
Po każdym uruchomieniu dopisz do raportu RC:
- data/czas,
- wynik per krok (PASS/FAIL/WARN),
- reason dla każdego WARN/FAIL,
- link do commit SHA RC.
