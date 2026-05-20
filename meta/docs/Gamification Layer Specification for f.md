# Gamification Layer Specification for `fun•brew` (wcześniej `funcup` - wszelkie odniesienia do `fun•brew` oznaczają odniesienia do aplikacji, którą uprzednio nazywaliśmy `funcup`)
## Input for Codex Agent (Planning Mode)

---

## 0. Context

`fun•brew` is a consumer mobile application in the specialty coffee domain.

Gamification is **not** used to artificially increase engagement.
Gamification is used to **deepen the user’s understanding and experience of coffee**.

> `fun•brew` is not a dopamine engine.
> It is a structured environment for developing taste, memory, and sensory literacy.

---

## 1. Core Principle

**Gamification must enhance the coffee experience, not compete with it.**

### Design Filter (apply to every feature)

A mechanic is valid only if it:
- increases **sensory awareness**
- improves **user understanding**
- reinforces **real-world coffee behavior**

Reject any mechanic that:
- optimizes for screen time
- creates artificial pressure (streaks, FOMO)
- rewards activity without meaning

---

## 2. System Overview

Gamification is structured into three layers:

### Layer 1 (Core)
- Sensory Progression
- Coffee Collection

### Layer 2
- Coffee Geography (primary expansion layer)

### Layer 3
- Community Reputation (lightweight, quality-focused)

---

## 3. High-Value Mechanics (Product-Aligned)

---

### 3.1 Sensory Progression (Core System)

#### Objective
Develop user’s tasting ability over time.

#### Mechanics

- Taster Levels:
  - Novice
  - Explorer
  - Taster
  - Connoisseur

- Controlled Vocabulary Unlocking:
  - Early: chocolate, nuts, caramel
  - Mid: citrus, stone fruit
  - Advanced: bergamot, florals, fermentation notes

- Structured Feedback:
  - Example:
    "Your notes are becoming more precise"
    "You are consistently identifying acidity"

#### System Behavior

- Vocabulary availability is gated by progression
- User cannot overuse advanced descriptors early
- Feedback is qualitative, not gamified

#### Implementation Notes

- No points
- No XP bars
- Progress is implicit, not gamified visually

---

### 3.2 Coffee Collection (Collection Loop)

#### Objective
Encourage exploration through structured discovery.

#### Mechanics

User builds a personal collection across:

- Origins:
  - Ethiopia, Colombia, Panama, etc.

- Processing Methods:
  - Washed
  - Natural
  - Anaerobic

- Flavor Notes:
  - Derived from tasting logs

#### System Behavior

- Each scanned coffee updates collection
- System surfaces patterns:
  - "You tend to prefer washed Ethiopian coffees"
- Collection acts as a knowledge map

#### UX Model

- Album / archive
- Not a checklist
- No completion pressure

---

### 3.3 Contextual Missions (Light Challenges)

#### Objective
Guide exploration without pressure.

#### Examples

- "Try 3 African coffees this month"
- "Compare washed vs natural"
- "Brew the same coffee using two methods"

#### Reward Model

- Insight-based:
  - comparison results
  - taste differences explained

- Optional badge (low emphasis)

#### Constraints

- No time pressure enforcement
- No penalty for non-completion
- Missions are suggestions, not tasks

---

### 3.4 Reputation System (Community Layer)

#### Objective
Increase quality of shared knowledge.

#### Mechanics

- "Helpful" votes on reviews
- Reputation score based on:
  - quality of notes
  - community validation

#### Effects

- Higher reputation unlocks:
  - advanced vocabulary
  - higher visibility of reviews
  - potential moderation influence

#### Constraints

- No public leaderboard
- No gamified competition
- No vanity metrics

---

### 3.5 Immediate Feedback (Micro-reward Layer)

#### Objective
Reinforce interaction loop without addiction patterns.

#### Trigger

After QR scan / coffee log.

#### Feedback Examples

- "+1 coffee logged"
- "This is your 5th Ethiopian coffee"
- subtle animation (already implemented)

#### Constraints

- No reward stacking
- No streak systems
- No artificial bonuses

---

## 4. Thematic Framework (Universe)

---

### 4.1 Primary Direction: Coffee Geography

#### Model
User as explorer.

#### Structure

- World map of coffee regions
- Regions act as discovery zones
- Coffees = discoveries

#### Benefits

- Educational
- Product-aligned
- Scalable
- Culturally neutral

#### Implementation Notes

- Map is a visualization layer, not a game map
- No territory conquest mechanics

---

### 4.2 Secondary Direction: Craft / Mastery

**Lower priority than Geography**

#### Model
User develops expertise.

#### Dimensions

- Brewing
- Tasting
- Origin knowledge

#### Mechanics

- Competency levels
- Soft certifications (non-official)

#### Role in System

- Supports sensory progression
- Adds depth for advanced users

---

## 5. UX Tone and Interaction Model

### Required Tone

- calm
- editorial
- premium
- reflective

### Avoid

- arcade UI
- bright gamified visuals
- aggressive notifications
- reward-heavy interfaces

### Reference Mental Model

- magazine + personal journal
- not a game
- not social media

---

## 6. Anti-Patterns (Strictly Forbidden)

Do NOT implement:

- streak systems
- daily rewards
- coins / gems / currencies
- lootboxes
- global leaderboards
- forced engagement loops
- push notifications designed for retention

---

## 7. Success Criteria

Gamification is successful if:

- users describe coffee more precisely over time
- users explore more origins and processes
- reviews become higher quality
- users return because of coffee, not the app

---

## 8. Implementation Plan (Phased)

---

### Phase 1 — Foundation

Scope:
- Sensory progression system
- Controlled vocabulary gating
- Basic coffee collection (origins + methods)

Deliverables:
- DB schema for:
  - user_progression
  - vocabulary_unlocks
  - coffee_collection
- API endpoints:
  - log_coffee
  - update_progression
- UI:
  - minimal progression indicators
  - collection view (list-based)

---

### Phase 2 — Enrichment

Scope:
- Flavor collection layer
- Contextual missions
- Insight engine

Deliverables:
- mission system (optional, non-blocking)
- insight generation logic
- expanded collection UI (grouped by origin/process)

---

### Phase 3 — Geography Layer

Scope:
- Map-based visualization

Deliverables:
- region mapping (origin → coordinates)
- interactive map view
- discovery highlighting

Constraints:
- visualization only
- no game mechanics

---

### Phase 4 — Reputation System

Scope:
- helpful votes
- reputation scoring

Deliverables:
- review voting system
- ranking logic (internal)
- visibility weighting

Constraints:
- no public ranking UI

---

### Phase 5 — Refinement

Scope:
- tone calibration
- UX polish
- removal of unnecessary gamification signals

Deliverables:
- UI simplification
- feedback tuning
- system balancing

---

## 9. Engineering Constraints

- All systems must be:
  - modular
  - optional (can be hidden/disabled)
  - non-blocking to core flow (scan → log → review)

- No mechanic can interrupt:
  - scanning
  - logging
  - tasting flow

---

## 10. Final Directive

If a feature increases engagement but does not improve coffee understanding:

**do not implement it.**