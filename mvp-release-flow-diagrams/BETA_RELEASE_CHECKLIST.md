# Beta Release Checklist (Phase 010 gate 010-034..010-038)

Data: 2026-05-07
Owner: `mvp-release-candidate`

## Scope lock (must stay true)
- [x] Scope beta ograniczony do kanonicznego flow: publish batch -> scan -> coffee page -> tasting log -> analytics.
- [x] Krytyczne kontrakty błędów (`scan/log/analytics`) zmapowane do UI-copy (`BETA_ERROR_CONTRACTS.md`).

## PASS/FAIL criteria

### 010-034 US4 UX audit (mobile)
- PASS when:
  - brak progress-bar/unlock-toast w reputation path,
  - Community/Profile pokazują subtelny expert state bez gamification noise.
- Status: **OPEN (manual QA required on device)**
- Evidence gap: brak świeżego zapisu sesji urządzenia dla bieżącego RC.

### 010-035 US5 offline UX audit (mobile)
- PASS when:
  - coffee page czytelna offline,
  - pending sync indicator widoczny,
  - reconnect sync czyści kolejkę <= 30s.
- Status: **PARTIAL**
- Evidence: auto-sync interval 30s i queue handling w kodzie działa; brak świeżego device run z timestampem.

### 010-036 Cross accessibility pass
- PASS when:
  - kontrast/etykiety/focus sprawdzone dla touched screens web+mobile.
- Status: **OPEN (manual accessibility pass pending)**

### 010-037 Cross performance sanity
- PASS when:
  - brak blockerów wydajnościowych na kluczowych listach i obrazach,
  - journal/coffee list utrzymuje płynność w smoke.
- Status: **OPEN (profiling run pending)**

### 010-038 Final release sign-off
- PASS when:
  - US1/US2/US6 smoke ma dowody PASS,
  - blocker P0 mają status resolved albo jawnie opisany plan.
- Status: **IN PROGRESS**
- Evidence: `BETA_SMOKE_RUNBOOK.md` + `scripts/beta-smoke-tests.sh` + `BETA_READINESS_REPORT_2026-05-07.md`.

## Hard gate summary
- Gate result: **CONDITIONAL PASS**
- Warunki do pełnego PASS:
  - zakończyć 010-034/036/037 manual evidence,
  - dołączyć device captures i accessibility/profiling checklist.
