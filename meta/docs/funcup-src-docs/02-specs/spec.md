# Feature Specification: funcup — QR-Driven Specialty Coffee Discovery Platform

**Feature Branch**: `001-platform-mvp`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "funcup — QR-driven specialty coffee discovery platform. Core interaction: scan QR → identify batch → coffee as digital object → rate, log, discover."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Consumer Scans QR and Logs a Tasting (Priority: P1)

A consumer picks up a bag of specialty coffee. They open the funcup mobile app, tap Scan, point the camera at the QR code printed on the bag, and within seconds see the digital coffee page for that specific roasting batch — origin, farm, variety, processing method, roast date. They brew the coffee, then return to the app to log their tasting: a 1–5 rating, selected flavor notes, their brew method, and an optional review. The entry is saved to their personal coffee journal.

**Why this priority**: This is the entire north star of the platform in one flow. Every other feature either feeds into this moment (roaster data, QR) or builds on top of it (reputation, discovery). A working QR scan + tasting log is a deployable MVP by itself.

**Independent Test**: One roaster account + one published batch with QR + one consumer account. Scan the QR, verify coffee page loads, log a tasting, confirm it appears in the consumer's journal.

**Acceptance Scenarios**:

1. **Given** a consumer has the app open and a coffee bag with a funcup QR code, **When** they tap Scan and aim at the code, **Then** the Coffee Page for that specific batch loads within 5 seconds, showing Product, Brewing, Story, and Community sections.
2. **Given** a consumer is on the Coffee Page, **When** they open the tasting log form and submit a rating (1–5), at least one flavor note, a brew method, and an optional review, **Then** the tasting is saved and immediately visible in their personal journal.
3. **Given** a consumer scans a QR code that belongs to an archived or deleted batch, **When** the app resolves the code, **Then** the user sees the last known coffee profile with a clear notice that the batch is no longer active.
4. **Given** a consumer has already logged a tasting for this batch, **When** they scan the same QR again, **Then** the app shows their previous tasting and offers to add a new entry (same coffee, different brew session).
5. **Given** a consumer scans a QR code not registered in funcup, **When** the app fails to resolve it, **Then** a clear message is shown explaining the coffee isn't in the system, with an option to share the code with funcup.

---

### User Story 2 — Roaster Publishes a Coffee and Generates a Batch QR (Priority: P2)

A verified roaster logs into the funcup web app. They create a new coffee profile — entering origin country and region, farm name, variety, processing method, and altitude. They then create a roasting batch for this coffee, entering roast date and batch/lot number. The system generates a unique QR code they can download (PNG and SVG) and print on packaging before shipping.

**Why this priority**: Without roasters publishing verified product data and QR codes, consumers have nothing to scan. This is the supply side of the ecosystem and is independent of any consumer activity.

**Independent Test**: One roaster account (post-verification). Create a coffee → create a batch → download QR → confirm QR resolves to the correct coffee page in a browser.

**Acceptance Scenarios**:

1. **Given** a verified roaster is logged in, **When** they create a new coffee with all required fields (name, country, variety, process), **Then** the coffee is saved and visible in their product list.
2. **Given** a roaster has a published coffee, **When** they create a batch with a roast date and lot number, **Then** the system generates a unique QR code permanently linked to that batch.
3. **Given** a batch QR has been generated, **When** the roaster downloads it, **Then** they receive a print-ready PNG and SVG file.
4. **Given** a roaster updates product data (e.g., adds brewing notes), **When** they save the changes, **Then** the QR code remains unchanged and the updated data is immediately visible to consumers scanning it.
5. **Given** a roaster attempts to register without verification, **When** they submit their application, **Then** their account is placed in a pending state and they receive email confirmation; they cannot publish coffees until verified.

---

### User Story 3 — Consumer Navigates Coffee Hub and Discovers Coffees and Roasters (Priority: P3)

A consumer explores the app without scanning a QR. They browse Coffee Hub — switching between Discover Coffees (curated and trending), Discover Roasters (verified roasters with location and story), and Learn Coffee (educational content). They tap a coffee to see its page, follow a roaster, and save a coffee to their personal discovery feed for later.

**Why this priority**: Discovery gives the app value for users who don't yet have a funcup coffee at hand. It drives ongoing engagement between scanning sessions and supports new user onboarding. Depends on US-2 having published content.

**Independent Test**: A seeded database with at least 5 published coffees from 3 roasters. Verify browsing, filtering, roaster profile view, and follow action — no scanning required.

**Acceptance Scenarios**:

1. **Given** a consumer opens Coffee Hub, **When** they browse Discover Coffees, **Then** they see a list of coffees with name, roaster, origin, and average community rating, sortable by newest and most rated.
2. **Given** a consumer is in Discover Roasters, **When** they tap a roaster card, **Then** they see the roaster profile: name, location, description, and all their published coffees.
3. **Given** a consumer views a roaster profile, **When** they tap Follow, **Then** the roaster is added to their follow list and new batches from that roaster surface in their discovery feed.
4. **Given** a consumer browses the Learn Coffee section, **When** they open an article, **Then** they see structured educational content about coffee origin, processing, or brewing — authored or curated by funcup.

---

### User Story 4 — Consumer Builds Sensory Reputation Through Tastings (Priority: P4)

A consumer logs tastings over time. The system silently evaluates the depth and consistency of their tasting notes — vocabulary range, specificity, volume of entries. Their sensory reputation level (Beginner → Advanced → Expert) grows as they log more, without any visible progress bars, gates, or score counters. The level is surfaced only in their profile and subtly in Community sections of coffee pages.

**Why this priority**: Reputation incentivizes quality logging and differentiates funcup from simple rating apps. It requires US-1 to have data to evaluate. The "no visible barriers" rule means implementation must be progressive and non-intrusive.

**Independent Test**: A test account with a series of tasting entries of varying quality/depth. Verify that reputation level reflects logged activity and appears correctly in profile and on coffee community pages.

**Acceptance Scenarios**:

1. **Given** a new consumer logs their first tasting, **When** they view their profile, **Then** they see their sensory level as Beginner with no progress indicator or unlock message.
2. **Given** a consumer has logged sufficient tastings with detailed flavor notes, **When** the system evaluates their activity, **Then** their level advances without any prompt, gate, or notification — the change is visible only on their profile.
3. **Given** an Expert-level consumer leaves a tasting note on a coffee page, **When** other users view the Community section of that coffee, **Then** the Expert's note is visually distinguished from Beginner notes (e.g., subtle label), but no rating is blocked or hidden.

---

### User Story 5 — Consumer Logs a Tasting Offline (Priority: P5)

A consumer is in a café with no reliable internet connection. They scan a QR code, view a previously cached coffee page, and log a tasting entry. The entry is queued locally. When connectivity is restored, the tasting syncs automatically to the platform without any action required from the user.

**Why this priority**: Specialty coffee is consumed in environments (cafés, markets, travel) where connectivity is unreliable. Offline-first is a constitution principle (IV) and is essential for real-world MVP use. Depends on US-1 core flow.

**Independent Test**: Device in airplane mode with one cached coffee page. Log a tasting. Restore connection. Confirm the tasting appears in the journal and on the server.

**Acceptance Scenarios**:

1. **Given** a consumer has previously viewed a coffee page (it is cached), **When** they open the app with no internet connection, **Then** the cached coffee page is fully readable.
2. **Given** a consumer is offline and logs a tasting on a cached coffee page, **When** they submit the form, **Then** the entry is saved locally with a visual indicator that it is pending sync.
3. **Given** a pending tasting exists locally, **When** the device reconnects to the internet, **Then** the tasting syncs automatically within 30 seconds and the pending indicator is removed.
4. **Given** a sync conflict exists (consumer edited a pending tasting after partial sync), **When** the system resolves it, **Then** the server version wins and the consumer sees the resolved state without data loss.

---

### User Story 6 — Roaster Reads Consumer Feedback and Analytics (Priority: P6)

A verified roaster views aggregated consumer feedback for their coffees. For each batch they see: average rating, rating distribution, top flavor notes mentioned, and a list of anonymized tasting reviews. They can filter by brew method and batch. They use this data to understand how their products are received.

**Why this priority**: Closes the data loop of the ecosystem. Requires US-1 (consumer tastings) and US-2 (published coffees) to be in place. Feedback is the core value proposition for roasters participating in the platform.

**Independent Test**: A roaster account with 3 coffees, each having at least 5 mock tasting entries from different consumers. Verify that aggregated stats, rating distribution, and flavor note frequency display correctly.

**Acceptance Scenarios**:

1. **Given** a roaster views feedback for a batch with at least one tasting, **When** they open the analytics view, **Then** they see: total tastings count, average rating, rating distribution (1–5), and top 5 flavor notes by frequency.
2. **Given** a roaster filters feedback by brew method, **When** they select a method (e.g., V60), **Then** only tastings logged with that method are included in the stats and review list.
3. **Given** a batch has no tasting entries yet, **When** the roaster opens its analytics, **Then** they see an empty state with guidance to promote the QR code.
4. **Given** a tasting includes a review text, **When** the roaster views the review list, **Then** reviewer identity is fully anonymized — no name, username, or identifier is shown.

---

### Edge Cases

- What happens when the QR scanner cannot read a damaged or poorly printed code? → App surfaces a "Can't read code" state with option to search coffee by roaster name manually.
- What happens when two batches of the same coffee are active simultaneously? → Each batch has its own QR and its own tasting pool; they are listed separately under the parent coffee profile.
- What happens if a consumer's locally queued tastings exceed device storage limits? → Oldest pending entries are preserved; user is notified if the queue exceeds 50 entries without sync.
- What happens when a roaster's verification is revoked after coffees are published? → Existing coffee profiles and batch QRs remain accessible to consumers (historical integrity); roaster loses ability to publish new content.
- What happens when a consumer tries to log a tasting for a batch they've never scanned (e.g., found via Discovery)? → Tasting log is available from any coffee page — QR scan is the primary entry point but not the only one.
- What happens when the sensory reputation algorithm advances a user's level mid-session? → The level update is applied silently; no toast, modal, or interruption occurs during the current tasting flow.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Global UI/UX constraint — FR-012 entry animation (source of truth, all phases)

**Critical.** The rules below are **normative** for **every** phase of UI/UX design and implementation (discovery, MVP, polish, and any future tranche), across **all** consumer-facing clients (native mobile, web SPA, Next.js, or successors). Backlog items, design reviews, and QA MUST verify compliance.

- **Animated entry only on app launch:** The protected FR-012 sequence (fingerprint → tap → confetti → bean → dissolve → main shell) — or an approved accessibility/reduced-motion equivalent — MUST run **only** when the user **opens the app** into the interactive shell (cold/warm process start into the root experience). It MUST NOT be used as a decorative transition between feature screens.
- **No repeat on in-app navigation:** After the shell is active, **ordinary navigation inside the app** (tabs, stacks, drawers, client-side route changes, deep links handled without killing the shell) MUST **not** remount or replay the full FR-012 animation. Implementations MUST avoid full document reloads for internal navigation (e.g. use SPA `Link` / client routers, not `<a href>` to same-origin app routes) so entry state is not reset unintentionally.
- **Single spec line:** The canonical beat order and change control for the animation itself remain **FR-012** below; timing, assets, and platform notes are elaborated in [08-entry-ux-spec-fr012.md](./08-entry-ux-spec-fr012.md).

**Mobile App — Consumers**

- **FR-001**: The app MUST provide a QR code scanner as the primary entry point, accessible from the home screen with a single tap.
- **FR-002**: The app MUST resolve a scanned QR code to the corresponding batch and display the Coffee Page within 5 seconds on a standard mobile connection.
- **FR-003**: The Coffee Page MUST contain four sections: Product (origin, variety, process, altitude, roast date, batch), Brewing (roaster's brewing guides), Story (roaster narrative), and Community (consumer tastings, sorted by sensory reputation level).
- **FR-004**: Consumers MUST be able to log a tasting entry containing: rating (1–5 scale), flavor notes (predefined tags and free-text), brew method, brew time (optional), and a written review (optional).
- **FR-005**: The app MUST store all consumer tasting entries in a personal journal, accessible chronologically with filtering by rating and brew method.
- **FR-006**: Coffee Hub MUST provide four sections: Scan Coffee (primary CTA — opens QR scanner directly), Discover Coffees (curated and trending), Discover Roasters (verified roasters), and Learn Coffee (educational content). Scan Coffee MUST be the visually dominant element on the Hub screen.
- **FR-007**: Consumers MUST be able to follow roasters; followed roasters' new batches MUST surface in the consumer's discovery feed.
- **FR-008**: The sensory reputation system MUST silently advance a consumer's level (Beginner → Advanced → Expert) based on tasting volume and note quality, with no visible progress bar or score.
- **FR-009**: The app MUST operate offline for previously cached coffee pages; tasting entries MUST be queued locally when offline and synced automatically on reconnect.
- **FR-010**: Consumer accounts MUST support registration and login via email/password and OAuth (Google and Apple).
- **FR-011**: Coffee pages MUST be publicly accessible (no account required to view); logging a tasting MUST require an authenticated account.

**Mobile App — Entry Interaction (MVP, protected)**

- **FR-012**: The entry animation sequence (white screen → fingerprint → tap → confetti → bean slides up → bean dissolves → main screen slides in) MUST remain unchanged. No implementation task may alter this flow without a formal constitution amendment. **Scope:** this sequence is the **app opening** experience **only** — it runs when the consumer launches the app (cold/warm start into the shell) and MUST NOT replay on ordinary in-app navigation (tabs, stack screens, or deep-linked routes once the shell is already running). **Cross-phase source of truth:** the launch-only and no-repeat-on-navigation rules are stated authoritatively under **Global UI/UX constraint — FR-012 entry animation** above and MUST be applied to every UI/UX phase and every consumer client stack.

**Web App — Roasters**

- **FR-013**: Roasters MUST be able to register a business account and submit it for verification; unverified accounts MUST NOT be able to publish coffees.
- **FR-014**: Verified roasters MUST be able to create, edit, and archive coffee profiles with the following fields: name, country of origin, region, farm, variety, processing method, altitude, and producer notes.
- **FR-015**: Roasters MUST be able to create roasting batches linked to a coffee, with fields: roast date and batch/lot number.
- **FR-016**: The system MUST generate a unique, permanent QR code per batch at creation time; this QR MUST remain valid regardless of subsequent edits to the coffee profile.
- **FR-017**: Roasters MUST be able to download batch QR codes as PNG and SVG.
- **FR-018**: Roasters MUST have access to aggregated, anonymized consumer feedback per batch: total tastings, average rating, rating distribution, top flavor notes, and review texts without consumer identifiers.
- **FR-019**: Roasters MUST be able to filter feedback analytics by brew method.

**Data Integrity**

- **FR-020**: Archiving a coffee or batch MUST preserve all associated consumer tasting entries; data MUST NOT be deleted.
- **FR-021**: Only verified roasters MAY create or edit product data fields (origin, variety, process, roast date, batch). Consumers MUST NOT have write access to these fields.

### Key Entities

- **Roaster**: Verified business account. Attributes: name, country, city, description, website, verification status. Owns many Coffees.
- **Coffee**: Digital product profile. Attributes: name, country of origin, region, farm, variety, processing method, altitude, producer notes, status (active/archived). Belongs to one Roaster, has many Batches.
- **Batch**: A specific roasting run of a Coffee. Attributes: roast date, lot/batch number, QR code identifier, status. Belongs to one Coffee, has many Tastings.
- **Tasting**: A consumer's sensory experience. Attributes: rating (1–5), flavor notes (tags + free text), brew method, brew time, review text, logged date, sync status (local/synced). Belongs to one Consumer and one Batch.
- **Consumer**: App user. Attributes: display name, avatar, sensory reputation level (Beginner/Advanced/Expert), following list. Has many Tastings.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** *(North Star)*: Average coffees logged per active user per month increases month-over-month following launch.
- **SC-002**: A consumer can complete the full flow from QR scan to saved tasting entry in under 2 minutes.
- **SC-003**: The Coffee Page loads within 5 seconds of a successful QR scan on a standard 4G mobile connection.
- **SC-004**: A verified roaster can publish a new coffee and download its batch QR code in under 10 minutes from first login.
- **SC-005**: Offline tasting entries sync to the server within 30 seconds of internet connectivity being restored.
- **SC-006**: 90% of QR scans for active batches result in a successfully loaded Coffee Page (no error state).
- **SC-007**: Consumer tasting history remains performant (scrollable without lag) up to at least 500 entries per account.
- **SC-008**: Roaster feedback analytics reflect new consumer tastings within 5 minutes of submission.

---

## Assumptions

- QR codes are URL-based and generated by funcup; roasters print them on packaging independently.
- Roaster verification is a manual process handled by a funcup administrator via direct database access (no admin UI in MVP scope).
- Flavor notes in tasting entries are a combination of a predefined tag set (e.g., chocolate, citrus, floral) and an optional free-text field; the tag taxonomy is defined during planning.
- The sensory reputation algorithm (what constitutes "quality" note-taking) is defined during planning, not in this spec.
- Consumer following targets roasters only (not other consumers) in MVP scope.
- The Learn Coffee section in MVP contains static or manually curated content; dynamic CMS is post-MVP.
- Consumer authentication uses email/password and OAuth (Google + Apple); no phone-number auth in MVP.
- The entry animation (FR-012) is a fixed, protected sequence; it runs **once per app open** (launch into the shell), not on each in-app navigation. Engineering effort for entry UX is tracked in Phase 010.
- Social sharing of tastings (share to Instagram, export journal) is post-MVP.
- Roaster-to-consumer direct messaging is out of scope.
