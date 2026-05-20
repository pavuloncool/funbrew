---
# yaml-language-server: $schema=schemas/page.schema.json
Object type:
    - Page
Creation date: "2026-05-06T12:00:00Z"
Created by:
    - Codex
Emoji: ✅
---

# Phase 010-006 Entry Gate Sign-off — 2026-05-06

Scope:

- `product/apps/consumer-mobile/app/index.tsx`
- `product/apps/consumer-mobile/src/components/entry/MobileEntrySplash.tsx`
- `product/packages/shared/src/entry/entryState.ts`
- [08-entry-ux-spec-fr012.md](../funcup-src-docs/02-specs/08-entry-ux-spec-fr012.md)

## Attestation

FR-012 sequence unchanged from normative `Canonical beats`:

1. `entry.white`
2. `entry.fingerprint`
3. `entry.tap`
4. `entry.confetti`
5. `entry.beanRise`
6. `entry.beanDissolve`
7. `entry.mainReveal`

Any deviation from this order requires explicit approval.
Current implementation introduces only:

- post-entry routing hook after `entry.mainReveal`
- reduced-motion simplification without beat reorder
- session rule: replay only after full process restart

## Checklist

- [x] Sequence order in code matches FR-012 beat list.
- [x] Splash owner is isolated to `app/index.tsx` + `MobileEntrySplash`.
- [x] Splash does not replay on tab/stack navigation inside an active app session.
- [x] Post-entry route resolves to auth stack or main tabs from restored auth state.
- [x] Reduced-motion path preserves the same semantic beat order.
- [x] Shared state contract exists for `splashPhase`, `splashComplete`, `minDisplayMs`.
- [x] Explicit approval field exists below for any future deviation.

## Evidence

- Code path verification:
  - [index.tsx](/Users/pa/projects/funcup/product/apps/consumer-mobile/app/index.tsx)
  - [MobileEntrySplash.tsx](/Users/pa/projects/funcup/product/apps/consumer-mobile/src/components/entry/MobileEntrySplash.tsx)
  - [entryState.ts](/Users/pa/projects/funcup/product/packages/shared/src/entry/entryState.ts)
- Automated checks:
  - `pnpm -C product/packages/shared test`
  - `pnpm -C product/apps/consumer-mobile typecheck`
- Runtime verification:
  - `pnpm -C product/apps/consumer-mobile start -- --port 8081`
  - entry server boots and compiles with the updated entry flow

## Explicit Approval Field

- Deviation approved for any FR-012 beat reorder or substitution: `NO`
- Approved by:
- Approval date:
- Change reference:
