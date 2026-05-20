---
# yaml-language-server: $schema=schemas/page.schema.json
Object type:
    - Page
Backlinks:
    - funcup-the-first-structured-feedback-loop-4-co.md
Creation date: "2026-03-25T20:41:00Z"
Created by:
    - Pa Koolig
Emoji: "\U0001F5FA️"
id: bafyreic3qttp6s7x6brjnou7hnx7hnt6b2ql2rpdr7kpeivcdslapsbxoi
---
# 12 Spec Kit — Plan & Artifacts (002-qr-coffee-platform)   
## Status   
Plan wygenerowany 2026-03-25. Constitution Check: **9/9 PASS**.   
## Artefakty w repozytorium   
Wszystkie pliki na branchu `main` w katalogu `.specify/features/002-qr-coffee-platform/`:   
- `plan.md` — Technical Context + Constitution Check + monorepo source layout   
- `research.md` — 11 decyzji: Turborepo, expo-camera, MMKV queue, reputation algorithm, 36-tag flavor taxonomy, QR generation (qrcode + resvg-js), pg\_net analytics trigger, Supabase Auth + expo-auth-session, MDX for Learn Coffee, expo-image, consumer follows   
- `data-model.md` — 13 kanonicznych tabel: pola, typy, RLS, relacje, state transitions   
- `contracts/edge-function-scan-qr.md` — kontrakt + SLA (p95 < 500ms)   
- `contracts/edge-function-generate-qr.md` — kontrakt + idempotency + QR invariants   
- `contracts/edge-function-update-coffee-stats.md` — SQL agregacji + pg\_net trigger   
- `contracts/qr-url-contract.md` — URL pattern, deep link config, resolution flow, error states   
- `contracts/rls-policies.md` — pełna tabela RLS dla 13 tabel + Storage buckets   
- `quickstart.md` — local dev setup, full QR flow test, offline flow test   
   
## Open item   
`users.following\_roaster\_ids uuid[]` — proponowane dla FR-007. Zweryfikować względem Data Model v3 czy potrzebna junction table.   
## Następny krok   
Uruchomić `/speckit.tasks` w Claude Code.   
