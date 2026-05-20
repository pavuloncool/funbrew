---
# yaml-language-server: $schema=schemas/page.schema.json
Object type:
    - Page
Backlinks:
    - funcup-the-first-structured-feedback-loop-4-co.md
Creation date: "2026-03-25T19:41:00Z"
Created by:
    - Pa Koolig
Emoji: "\U0001F4DC"
id: bafyreiesyuj7nqrjcoyegvtifxtimxxob74oumnb3wn43rxdxnshy3tw3q
---
# 11 Constitution v1.4.0 (Spec Kit)   
> Version: 1.4.0 | Ratified: 2026-03-25 | Last Amended: 2026-03-25   

> Source of truth: .specify/memory/constitution.md — branch 001-platform-mvp   

 --- 
## Founding Philosophy   
> Scan Coffee is the core of funcup — its symbol and the essence of the experience it enables.   

> It is visualised as a transformation: a fingerprint — something completely unique to a human being, and therefore to each user — transforms into a coffee bean, which is equally unique and unrepeatable.   

> Every feature, every screen, every interaction in funcup exists to serve one purpose:   

> to log an unrepeatable coffee experience.   

> This philosophy is the lens through which all product decisions must be mad   

## Core Principles   
### I. Mobile-First, Coffee-First   
Every screen and interaction MUST be designed for a 375 px mobile viewport before adapting to larger breakpoints.    
React Native (Expo) is the consumer product — used in coffee shops, stores, and homes.    
Next.js is the roaster product — used by verified coffee roasters to manage product data and read consumer feedback.    
Both share the same Supabase backend but serve entirely different users.   
Coffee domain language (origin, roast, tasting notes, brew method, rating) MUST be consistent across all surfaces. No generic CRUD labels may appear in user-facing copy. Brand voice is warm, knowledgeable, and sensory-rich.   
### II. Shared Data Contract   
Supabase/PostgreSQL is the single source of truth. Supabase-generated TypeScript types are the canonical entity definitions. Schema migrations MUST be versioned before any client code references a new column or table.   
### III. Dual-Product Architecture   
funcup to dwa osobne produkty obsługiwane przez jeden backend:   
- **iOS/Android (Expo)** — produkt konsumencki: skanowanie QR, ocenianie, odkrywanie kaw, historia tasting experience. Użytkownik korzysta wyłącznie na telefonie — w sklepie, w domu, w kawiarni.   
- **Next.js web** — produkt dla palarni (roasters): zarządzanie danymi kaw, publikowanie produktów, odczyt feedbacku.   
   
"Platform Parity" nie obowiązuje — funkcje nie muszą istnieć na obu platformach jednocześnie.   
### IV. Offline-Aware UX   
Aplikacja mobilna MUSI działać bez połączenia: cached content offline, oceny kolejkowane lokalnie i synchronizowane po reconnect, optimistic updates zamiast blocking loaders.   
### V. Animation with Intent   
Animacje MUSZĄ mieć cel UX: ≤400ms, 60fps na mid-range Android, respektuje `prefers-reduced-motion`.   
### VI. Type-Safe Across the Stack   
TypeScript strict mode wszędzie. Zakaz `any` bez `// TODO: type this`. Typy z Supabase — nie ręcznie pisane.   
### VII. QR-First Interaction   
Główna interakcja całej platformy to skanowanie QR kodu na opakowaniu kawy. Każda funkcja mobilna projektowana z perspektywy: "co dzieje się przed, w trakcie i po skanowaniu?"   
### VIII. Separation of Roles   
- **Palarnie** → dane produktowe (origin, farm, variety, processing, roast date, batch) — tylko zweryfikowane palarnie mogą edytować.   
- **Konsumenci** → dane sensoryczne (rating, tasting notes, brewing method, review).   
- **Platforma** → agregacja i analiza. To rozdzielenie jest nienaruszalne.   
   
### IX. Entry Interaction — Tap to Bean   
**MVP (zaimplementowane — NIE modyfikować):**   
Biały ekran → pojawia się czarny odcisk palca → dotknięcie → konfetti → spod spodu wyjeżdża ziarno kawy → ziarno rozpuszcza się w blur → wjeżdża główna strona aplikacji. Żaden etap implementacji nie może jej modyfikować bez formalnej poprawki do constitution.   
**Docelowa wizja (post-MVP):**   
Użytkownik widzi ziarno kawy → dotknięcie → ziarno animuje się w odcisk palca → gałęzie drzewa kawowego → każda gałąź odsłania obszar aplikacji.   
 --- 
## Tech Stack   
|        Layer |                 Technology |                                   Notes |
|:-------------|:---------------------------|:----------------------------------------|
|       Mobile |    React Native (Expo SDK) |             Managed workflow; EAS Build |
|          Web |       Next.js (App Router) |                        SSR dla roasters |
| Backend / DB |      Supabase + PostgreSQL | Auth, Realtime, Storage, Edge Functions |
|      Styling |  Tailwind CSS / NativeWind |                      Shared token names |
|    Animation | Framer Motion / Reanimated |                         See Principle V |
|     Language |          TypeScript strict |                        See Principle VI |

