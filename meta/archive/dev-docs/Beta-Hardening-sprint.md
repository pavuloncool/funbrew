Najbliższy sensowny etap: **“Beta Hardening + Controlled Beta Ops”** (nie nowe feature’y).

Proponuję kolejność:

1. **Domknięcie gate quality (teraz)**
- Naprawić `010-036` (focus keyboard na `Sign in` i `Create one`).
- Domknąć `010-034` (Community evidence albo jasny fallback).
- Domknąć `010-031/010-032` (backend flags + rate-limit behavior).
- Wyjście: wszystkie krytyczne checklisty bez `FAIL`, max `PARTIAL` z planem.

2. **Feature freeze + release candidate discipline**
- Zamrozić scope produktu (tylko bugfix/hardening).
- Każdy RC: obowiązkowy `beta-smoke-tests.sh` + manual mini-gate.
- Wyjście: 2–3 kolejne RC bez regresji flow publish → scan → log → analytics.

3. **Observability i operacyjność bety**
- Dashboardy i alerty dla `scan_qr`, `log_tasting`, `update_coffee_stats`.
- Error budget i triage SLA (np. P0 <24h fix/rollback).
- Wyjście: wykrywasz i diagnozujesz awarie bez ręcznego “grzebania” w logach.

4. **Controlled beta (mała kohorta)**
- 10–30 roasterów + 50–200 consumerów.
- Mierzyć: activation, scan→log conversion, sync failure rate, crash-free sessions.
- Wyjście: decyzja “go/no-go” do public beta na danych, nie intuicji.

Jeśli chcesz, mogę rozpisać Ci teraz konkretny **2‑tygodniowy plan sprintu hardeningowego** (dzień po dniu, z Definition of Done).