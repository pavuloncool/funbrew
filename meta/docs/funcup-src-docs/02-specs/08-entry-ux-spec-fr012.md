---
# yaml-language-server: $schema=schemas/page.schema.json
Object type:
    - Page
Backlinks:
    - 14-tasks-003-phase-010-product-ux-ui-backlog.md
    - spec.md
Creation date: "2026-04-10T18:00:00Z"
Created by:
    - Pa Koolig
Emoji: 👆
---

# 08 Entry UX specification — FR-012 (Phase 010-001)

## Purpose

This document is the **authoritative UX specification** for the funcup mobile **protected entry experience** mandated by **FR-012** in [spec.md](./spec.md). It exists so engineering (**010-002** onward) can implement timing, motion, loading/error behavior, and accessibility **without changing the normative sequence** unless the constitution is formally amended.

**Related engineering ADR:** [specs/002-qr-coffee-platform/adrs/009-animated-splash.md](../../specs/002-qr-coffee-platform/adrs/009-animated-splash.md) (implementation stack may differ on React Native; this UX spec takes precedence for **order of beats** and **user-perceived flow**).

---

## Scope — app open only

The fingerprint → confetti → bean sequence is **strictly the app launch / opening sequence**. It establishes brand and handoff into the main shell (**`entry.mainReveal`**).

**In scope:** First presentation of this flow when the user opens the app from a **process start** (or agreed warm-start policy in **010-004** / **010-006** — e.g. replay only if the app was fully terminated).

**Out of scope (must not happen):** Re-running the full FR-012 animation on every **route change**, tab switch, `router.push` / `replace` between feature screens, or return from background **while the app process remains the shell**. Subsequent navigation uses normal transitions (design system / platform defaults), not a second splash.

Deep links and notifications MUST land in the target screen **without** forcing the full seven-beat sequence again if the user already completed entry in this session (see **010-004** for “already past splash” routing).

---

## Normative requirement (non-editable here)

From **FR-012** (`spec.md`):

> The entry animation sequence (**white screen → fingerprint → tap → confetti → bean slides up → bean dissolves → main screen slides in**) MUST remain unchanged. No implementation task may alter this flow without a formal constitution amendment.

This document **does not** redefine that sequence. It **names**, **times**, and **operationalizes** it for design QA and implementation.

---

## Canonical beats (ordered)

The following **seven beats** map one-to-one to FR-012. Names are stable for storyboards, tests, and analytics (see § State contract).

| # | Beat ID | FR-012 phrase | User-perceived intent |
|---|---------|---------------|------------------------|
| 1 | `entry.white` | white screen | App has launched; canvas is calm and branded-neutral. |
| 2 | `entry.fingerprint` | fingerprint | Fingerprint motif visible; user understands interaction is coming. |
| 3 | `entry.tap` | tap | User action completes the fingerprint moment (press/tap affordance). |
| 4 | `entry.confetti` | confetti | Celebration / transition energy after tap. |
| 5 | `entry.beanRise` | bean slides up | Coffee bean identity appears; brand payoff. |
| 6 | `entry.beanDissolve` | bean dissolves | Bean exits; focus clears for shell UI. |
| 7 | `entry.mainReveal` | main screen slides in | Primary app chrome (tabs / stack) is shown. |

**Rules**

- Beats **1–7** MUST occur in this order for the **default** (full motion) experience.
- No beat may be **skipped**, **reordered**, or **replaced** with a different metaphor in default mode without constitution amendment.
- **Parallel micro-motion** (e.g. subtle fingerprint idle pulse) is allowed only if it does not change the **semantic order** above (design review + **010-006** gate).

---

## Timing budgets (UX targets)

These are **targets** for product QA; exact milliseconds may vary by device. Implementation SHOULD stay within bands so the flow feels intentional, not sluggish.

| Beat ID | Min (ms) | Target (ms) | Max (ms) | Notes |
|---------|----------|-------------|----------|--------|
| `entry.white` | 200 | 400 | 900 | Avoid flash-of-unstyled content; if assets preload here, white may extend slightly. |
| `entry.fingerprint` | 400 | 800 | 2000 | User must recognize motif before tap hint peaks. |
| `entry.tap` | — | user-driven | — | Until tap: idle animation only; no forced auto-advance that skips tap. |
| `entry.confetti` | 300 | 600 | 1200 | Short enough to feel snappy; long enough to read as “reward”. |
| `entry.beanRise` | 400 | 700 | 1500 | Bean must be clearly visible before dissolve begins. |
| `entry.beanDissolve` | 300 | 500 | 900 | |
| `entry.mainReveal` | 350 | 600 | 1000 | Coordinate with navigator transition curve. |

**Total (excluding user tap wait):** typical cold start **~2.5–5.5 s** from launch to main reveal; MUST NOT exceed **~8 s** on mid-range devices without documented cause (e.g. first-launch asset unpack).

---

## Motion tokens (naming)

Use these token names in code comments, design files, and **010-005** shared contract so mobile and any tooling stay aligned.

| Token | Use |
|-------|-----|
| `motion.entry.easing.standard` | Default enter/exit (e.g. cubic-bezier approx. ease-out). |
| `motion.entry.easing.emphasis` | Confetti / bean peak moments. |
| `motion.entry.duration.beatShort` | 300–450 ms micro transitions. |
| `motion.entry.duration.beatMedium` | 500–800 ms primary transitions. |
| `motion.entry.duration.beatLong` | 900–1500 ms hero moments (bean rise). |
| `motion.entry.scale.beanIntro` | Bean scale curve (e.g. slight overshoot allowed if subtle). |
| `motion.entry.opacity.shell` | Main shell fade/slide paired with `entry.mainReveal`. |

Exact curve values live in implementation; tokens are **semantic**, not engine-specific (Reanimated, Moti, Skia, Lottie, etc.).

---

## Tap affordance

- **Visual:** Fingerprint beat MUST include a clear **tap hint** (e.g. pulse, ripple, or “Tap” affordance that matches brand — exact pixels in design handoff).
- **Hit target:** Minimum **44×44 pt** (iOS) / **48×48 dp** (Android) around the interactive fingerprint area.
- **Behavior:** First qualifying tap/press triggers transition **fingerprint → confetti**; accidental double-taps MUST NOT skip beats or restart the sequence in a way that violates order.
- **Haptics (optional):** Light impact on successful tap acknowledgment; MUST NOT be the only feedback (accessibility).

---

## Loading and slow assets

- **Preload window:** Prefer loading critical vectors/Lottie/texture data during `entry.white` and early `entry.fingerprint` so the sequence does not **stall mid-beat**.
- **If a beat cannot start on time:** Hold the **previous** beat’s end state (e.g. remain on white or last frame of fingerprint) with a **subtle** activity indicator only if unavoidable; do **not** jump forward in the sequence.
- **Timeout:** If assets fail after **~3 s** cumulative load attempt during entry, fall through to **Error fallback** (below) instead of infinite white screen.

---

## Error fallback copy (asset / runtime failure)

If the animated entry cannot run (missing assets, graphics crash, etc.):

- **Title (EN):** “Can’t play intro”
- **Body (EN):** “Continue to funcup.”
- **Primary action:** single **Continue** button → same post-entry route as a successful `entry.mainReveal` (auth vs main per **010-004**).
- **VoiceOver / TalkBack:** Announce “Intro unavailable. Continuing to app.” then move focus to **Continue**.

This path is **not** a replacement for FR-012 for users who **can** run the animation; it is a **degraded** path. It MUST NOT introduce a different **ordered metaphor** (no substitute animation sequence marketed as the same splash).

---

## Accessibility and reduced motion

**Default users:** full **beat 1–7** sequence per FR-012.

**Reduced motion / relevant platform settings:**

- **Requirement:** Respect system “reduce motion” (iOS) / “remove animations” (Android) / user preference flag in app settings if added later.
- **Allowed adaptation:** Same **semantic order** (`entry.white` → … → `entry.mainReveal`) with **simplified or shortened** motion (e.g. opacity fades, no confetti particles, static bean).
- **Disallowed:** Reordering beats, skipping `entry.tap` if the default flow requires user tap (may use **equivalent explicit action**: e.g. “Continue” button counts as tap acknowledgment only if product approves in **010-006** gate — prefer keeping tap on fingerprint region with reduced effects).
- **Screen reader:** After `entry.mainReveal`, focus moves to first logical element of the shell (e.g. hub title or first tab). Optional one-time announcement: “funcup” during `entry.white` — must not overlap critical transitions.

---

## Runtime routing policy (010-004)

The mobile runtime policy is now:

- process start on `/` mounts `MobileEntrySplash`
- after `entry.mainReveal`, route resolution happens from restored auth state:
  - unauthenticated or locked session -> `/(auth)/login`
  - authenticated without completed profile -> `/(auth)/complete-profile`
  - authenticated with completed profile -> `/(tabs)/hub`
- the splash is session-scoped and MUST NOT replay when the user navigates back to `/`, switches tabs, opens stacked routes, or follows deep links while the same app process remains alive
- a full process restart resets the session-scoped splash completion flag and allows the entry sequence to run again

This policy is implemented in:

- [index.tsx](/Users/pa/projects/funcup/product/apps/consumer-mobile/app/index.tsx)
- [MobileEntrySplash.tsx](/Users/pa/projects/funcup/product/apps/consumer-mobile/src/components/entry/MobileEntrySplash.tsx)

---

## State contract (preview for 010-005)

Implementation SHOULD expose machine-readable progression for QA and analytics (full detail in task **010-005**):

- `splashPhase`: enum matching beat IDs or `errorFallback`.
- `splashComplete`: boolean true after successful `entry.mainReveal` or error **Continue**.
- `minDisplayMs`: current product guard target is `400`.
- `sessionRule`: `per-process-start`.

Shared contract source:

- [entryState.ts](/Users/pa/projects/funcup/product/packages/shared/src/entry/entryState.ts)

---

## Design deliverables for sign-off (010-006)

- Storyboard or Figma frames for **beats 1–7** with **frame numbers** tied to beat IDs.
- One **screen recording** per platform (iOS, Android) of default flow.
- One recording with **reduce motion** enabled.
- Written attestation: **“FR-012 sequence unchanged from normative § Canonical beats.”**

---

## Change control

Any change to **order**, **number of beats**, or **replacement of fingerprint/confetti/bean metaphor** requires **constitution amendment** per FR-012. Changes to **durations, curves, copy, a11y, and error fallback** are normal Phase 010 work documented in PRs referencing this file.

---

## Document history

| Date | Task | Change |
|------|------|--------|
| 2026-04-10 | **010-001** | Initial Entry UX spec authored. |
| 2026-04-10 | **010-002** | Pierwotna implementacja: `product/apps/frontend/src/AnimatedSplash.jsx` + assety `public/assets/home-*.svg`. Next (`product/apps/web`): ten sam flow w `components/AnimatedSplash.tsx` + `AppOpenGate` w root layout (bez powtórzeń przy client-side navigacji). Expo mobile: bez duplikacji canvas/DOM — `app/index.tsx` → `/home`. |
| 2026-04-10 | Clarification | Documented: FR-012 splash is **app-open only**; does not repeat on in-app navigation. |
| 2026-04-10 | **010-003** | Mobile (`product/apps/consumer-mobile`): FR-012 entry via `MobileEntrySplash` + `AccessibilityInfo.isReduceMotionEnabled()` / `reduceMotionChanged`; shortened fades, no pulse, static bean translation when reduce motion; same beat order as web; optional SR announce on white + home landing. |
| 2026-05-06 | **010-004 / 010-005 / 010-006** | Mobile root route now resolves post-entry destination from restored auth state, keeps splash once per process start, exports shared contract (`splashPhase`, `splashComplete`, `minDisplayMs`, `sessionRule`), and references gate checklist: [PHASE010_010-006_ENTRY_GATE_SIGNOFF_2026-05-06.md](../../../DoR/PHASE010_010-006_ENTRY_GATE_SIGNOFF_2026-05-06.md). |
