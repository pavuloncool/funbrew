Profil danych dla palarni

Pytanie sprowadza się do zaprojektowania **dwustronnej wartości danych**: użytkownik dostarcza dane niskim kosztem (UX), a palarnia dostaje **operacyjnie użyteczne insighty**, których nie jest w stanie łatwo pozyskać offline.

Poniżej masz **propozycję struktury danych**, zaprojektowaną stricte pod potrzeby palarni (product, roasting, marketing, dystrybucja).

---

# 1. Warstwa identyfikacji produktu (baseline)

To musi być absolutny standard – umożliwia joinowanie danych.

**Źródło: QR od palarni**

* `roastery_id`
* `coffee_id` (unikalna partia / lot)
* `origin` (kraj, region, farma)
* `processing_method` (washed, natural, honey, anaerobic, etc.)
* `varietal`
* `roast_profile` (light / omni / espresso + timestamp palenia)
* `intended_brew_methods` (deklarowane przez palarnię)
* `cupping_notes_roastery` (deklarowane nuty)

👉 To tworzy referencję do porównań: **deklaracja vs percepcja użytkownika**

---

# 2. Profil użytkownika (segmentacja rynkowa)

Minimalny, ale diagnostyczny – bez przesady z tarciem.

### Twarde dane:

* `experience_level` (beginner / intermediate / advanced)
* `primary_brew_method` (espresso / pour-over / immersion / mixed)
* `equipment_class`

  * basic (V60, French press)
  * prosumer (Gaggia, Sage)
  * pro (La Marzocco, EK43 etc.)
* `consumption_frequency` (cups/day, bags/month)

### Miękkie:

* `taste_preference_vector` (np. skala 1–5):

  * acidity
  * sweetness
  * bitterness
  * body
  * funkiness

👉 To pozwala palarni odpowiedzieć na pytanie:

> „Czy ta kawa nie działa, czy trafia w zły segment?”

---

# 3. Dane przygotowania (kluczowa warstwa insightów)

Największa wartość dla palarni — realne użycie produktu.

* `brew_method_actual`
* `grind_size` (kategoryczne lub liczba klików)
* `brew_ratio` (np. 1:16)
* `water_temp`
* `brew_time`
* `water_type` (tap / filtered / mineralized)

👉 To umożliwia:

* wykrycie **błędów w recepcie**
* optymalizację rekomendacji na opakowaniu

---

# 4. Percepcja sensoryczna (core value)

Najważniejsza warstwa – ale musi być dobrze zaprojektowana UX-owo.

### Struktura:

* `overall_rating` (1–5 lub 1–10)

* `flavor_notes_detected` (multi-select)

* `intensity_map`:

  * acidity
  * sweetness
  * bitterness
  * body
  * aftertaste length

* `defect_flags`:

  * sour (underextracted)
  * bitter (overextracted)
  * flat
  * hollow

👉 Kluczowy insight:
**delta między cuppingiem palarni a realnym odbiorem**

---

# 5. Kontekst konsumpcji (często ignorowany, bardzo cenny)

To jest warstwa, której palarnie praktycznie nie mają.

* `consumption_context`:

  * morning / work / leisure / social
* `drink_format`:

  * black / milk / iced
* `location_type`:

  * home / cafe / office
* `repeat_purchase_intent` (yes/no)

👉 Pozwala odpowiedzieć:

> „Czy ta kawa jest daily driverem czy ciekawostką?”

---

# 6. Zachowania zakupowe (feedback rynkowy)

* `purchase_channel`:

  * roastery direct / cafe / retail / online marketplace
* `price_band`
* `perceived_value_for_money`

👉 Bezpośredni wpływ na pricing i dystrybucję.

---

# 7. Metryki kohortowe (generowane przez system)

To już nie input, ale output dla palarni:

* **brew success rate** (% ocen > X)
* **recipe variance vs rating**
* **segment performance** (np. beginners vs advanced)
* **flavor consistency index**
* **repurchase likelihood**
* **time-to-peak (degassing curve insight)**

---

# 8. Co faktycznie „sprzedaje” palarniom tę aplikację

## A. Insighty, których dziś nie mają:

* jak kawa zachowuje się w realnych warunkach
* jak różne segmenty ją odbierają
* gdzie tracą jakość (np. złe parametry parzenia)

## B. Use case’y operacyjne:

* optymalizacja profilu palenia
* poprawa opisów sensorycznych
* dopasowanie do sprzętu klientów
* redukcja zwrotów / niezadowolenia

## C. Warstwa marketingowa:

* “crowd-validated tasting notes”
* social proof na poziomie partii (lot-level, nie brand-level)
* segmentowane rekomendacje

---

# 9. Krytyczny aspekt: tarcie vs jakość danych

Jeśli przesadzisz z inputem → brak danych.

**Rekomendacja:**

* 3 poziomy inputu:

  1. **Quick log (5 sek)** → rating + brew method
  2. **Standard log (20 sek)** → + parametry
  3. **Advanced log (60 sek)** → pełny profil

---

# 10. Minimalny zestaw MVP (jeśli trzeba ciąć)

Jeśli chcesz walidować szybko:

* brew_method
* overall_rating
* 3 sensory sliders (acidity, sweetness, body)
* repeat_purchase_intent
* experience_level

👉 Już to daje wartość dla palarni.

---

# Podsumowanie (esencja)

Twoja aplikacja powinna być dla palarni czymś w rodzaju:

> **“post-sale telemetry system for coffee”**

Jeśli dane:

* są powiązane z konkretnym lotem
* mają kontekst przygotowania
* są segmentowalne

→ palarnie dostają coś, czego nie mają nawet przy własnych cuppingach.

---

Jeśli chcesz, mogę przejść krok dalej i zaprojektować:

* schemat bazy danych (ERD)
* event model (tracking)
* albo dashboard dla palarni (co dokładnie zobaczą i dlaczego za to zapłacą)

Poniżej masz **produkcyjny schemat ERD** zaprojektowany pod:

* powiązanie danych użytkownika z **konkretnym lotem kawy (QR)**
* zbieranie **telemetrii przygotowania**
* generowanie **insightów dla palarni (segmentacja, jakość, receptury)**

Model jest zoptymalizowany pod **analitykę + skalowalność (event-based + relacyjny core)**.

---

# 1. Założenia architektoniczne

* **Relacyjny core (PostgreSQL)** → spójność, relacje, joiny
* **Event layer (append-only)** → analityka (opcjonalnie: BigQuery / ClickHouse)
* **Denormalizacja selektywna** → pod dashboardy palarni
* **Wersjonowanie danych produktu** → batch/lot jako klucz

---

# 2. Główne encje (ERD – poziom logiczny)

```
User ───< BrewLog >─── CoffeeLot ─── Coffee ─── Roastery
             │              │
             │              └── QRCode
             │
             ├── BrewParameters
             ├── SensoryEvaluation
             ├── ConsumptionContext
             └── PurchaseInfo
```

---

# 3. Definicje tabel (DDL-like)

## 3.1 User & segmentacja

```sql
users (
  id UUID PK,
  created_at TIMESTAMP,
  experience_level ENUM('beginner','intermediate','advanced'),
  primary_brew_method ENUM,
  equipment_class ENUM('basic','prosumer','pro'),
  consumption_frequency INT
);
```

```sql
user_taste_profile (
  user_id UUID PK FK,
  acidity_pref FLOAT,
  sweetness_pref FLOAT,
  bitterness_pref FLOAT,
  body_pref FLOAT,
  funkiness_pref FLOAT,
  updated_at TIMESTAMP
);
```

---

## 3.2 Roastery & produkt

```sql
roasteries (
  id UUID PK,
  name TEXT,
  country TEXT,
  created_at TIMESTAMP
);
```

```sql
coffees (
  id UUID PK,
  roastery_id UUID FK,
  name TEXT,
  origin_country TEXT,
  origin_region TEXT,
  farm TEXT,
  varietal TEXT,
  processing_method TEXT
);
```

```sql
coffee_lots (
  id UUID PK,
  coffee_id UUID FK,
  roast_profile ENUM('light','omni','espresso'),
  roast_date DATE,
  cupping_notes TEXT[],
  intended_brew_methods TEXT[],
  created_at TIMESTAMP
);
```

👉 **Lot = jednostka analityczna** (nie coffee)

---

## 3.3 QR jako punkt wejścia

```sql
qr_codes (
  id UUID PK,
  coffee_lot_id UUID FK,
  code TEXT UNIQUE,
  created_at TIMESTAMP,
  is_active BOOLEAN
);
```

---

## 3.4 BrewLog (centralna tabela faktów)

```sql
brew_logs (
  id UUID PK,
  user_id UUID FK,
  coffee_lot_id UUID FK,
  created_at TIMESTAMP,

  brew_method ENUM,
  overall_rating FLOAT,
  repeat_purchase_intent BOOLEAN
);
```

👉 To jest **fact table** do większości zapytań

---

## 3.5 Parametry parzenia

```sql
brew_parameters (
  brew_log_id UUID PK FK,
  grind_size TEXT,
  brew_ratio FLOAT,
  water_temp FLOAT,
  brew_time INT,
  water_type ENUM('tap','filtered','mineralized')
);
```

---

## 3.6 Sensoryka

```sql
sensory_evaluations (
  brew_log_id UUID PK FK,
  acidity FLOAT,
  sweetness FLOAT,
  bitterness FLOAT,
  body FLOAT,
  aftertaste FLOAT
);
```

```sql
flavor_notes (
  id SERIAL PK,
  name TEXT UNIQUE
);
```

```sql
brew_log_flavor_notes (
  brew_log_id UUID FK,
  flavor_note_id INT FK,
  PRIMARY KEY (brew_log_id, flavor_note_id)
);
```

```sql
defect_flags (
  brew_log_id UUID PK FK,
  sour BOOLEAN,
  bitter BOOLEAN,
  flat BOOLEAN,
  hollow BOOLEAN
);
```

---

## 3.7 Kontekst konsumpcji

```sql
consumption_contexts (
  brew_log_id UUID PK FK,
  time_of_day ENUM('morning','afternoon','evening'),
  context ENUM('work','leisure','social'),
  drink_format ENUM('black','milk','iced'),
  location_type ENUM('home','cafe','office')
);
```

---

## 3.8 Zakup

```sql
purchase_info (
  brew_log_id UUID PK FK,
  purchase_channel ENUM('roastery','cafe','retail','online'),
  price_band ENUM('low','mid','high'),
  value_for_money FLOAT
);
```

---

# 4. Relacje (kluczowe zależności)

### Kardynalność:

* `User 1:N BrewLog`
* `CoffeeLot 1:N BrewLog`
* `Coffee 1:N CoffeeLot`
* `Roastery 1:N Coffee`

### 1:1 rozszerzenia BrewLog:

* BrewParameters
* SensoryEvaluation
* ConsumptionContext
* PurchaseInfo

👉 Dzięki temu:

* masz **modularność (różne poziomy logowania)**
* brak NULL-hell w jednej tabeli

---

# 5. Warstwa eventowa (opcjonalna, ale rekomendowana)

```sql
events (
  id UUID PK,
  user_id UUID,
  event_type TEXT,
  entity_id UUID,
  payload JSONB,
  created_at TIMESTAMP
);
```

### Przykłady:

* `qr_scanned`
* `brew_logged`
* `rating_submitted`

👉 Umożliwia:

* analizę funneli
* debug UX
* future ML

---

# 6. Indeksy (krytyczne dla wydajności)

```sql
CREATE INDEX idx_brew_logs_coffee_lot ON brew_logs(coffee_lot_id);
CREATE INDEX idx_brew_logs_user ON brew_logs(user_id);
CREATE INDEX idx_brew_logs_created_at ON brew_logs(created_at);

CREATE INDEX idx_coffee_lots_coffee ON coffee_lots(coffee_id);
```

---

# 7. Przykładowe zapytania (wartość dla palarni)

### 1. Średnia ocena per lot

```sql
SELECT coffee_lot_id, AVG(overall_rating)
FROM brew_logs
GROUP BY coffee_lot_id;
```

### 2. Rating vs brew ratio

```sql
SELECT brew_ratio, AVG(overall_rating)
FROM brew_logs bl
JOIN brew_parameters bp ON bl.id = bp.brew_log_id
GROUP BY brew_ratio;
```

### 3. Segmentacja userów

```sql
SELECT u.experience_level, AVG(bl.overall_rating)
FROM brew_logs bl
JOIN users u ON bl.user_id = u.id
GROUP BY u.experience_level;
```

---

# 8. Kluczowe decyzje projektowe (dlaczego tak)

## 1. BrewLog jako centralny fakt

→ umożliwia OLAP-like queries bez komplikacji

## 2. CoffeeLot zamiast Coffee

→ palarnie operują na batchach, nie produktach

## 3. Rozbicie na tabele 1:1

→ elastyczność UX (partial logging)

## 4. Flavor notes jako M:N

→ skalowalne + analityczne

---

# 9. Co można dodać w V2

* `brew_recipe_templates` (palarnia → user)
* `user_follow_roastery`
* `coffee_favorites`
* `ml_predictions` (np. recommended brew)

---

# Podsumowanie

Ten ERD:

* odwzorowuje **realny lifecycle kawy po sprzedaży**
* umożliwia **precyzyjną analitykę dla palarni**
* jest gotowy pod **skalowanie i ML**

---

Jeśli chcesz, kolejnym krokiem może być:

* fizyczny diagram (np. w formie grafu)
* albo projekt dashboardu (jak palarnia konsumuje te dane i za co płaci)


Poniżej masz **projekt dashboardu dla palarni** zaprojektowany jako narzędzie operacyjne (nie “ładne wykresy”). Każdy moduł odpowiada na konkretne pytania biznesowe: *czy kawa działa, dla kogo, dlaczego nie, co zmienić*.

---

# 0. Struktura produktu (IA dashboardu)

**Nawigacja główna:**

1. Overview
2. Lots (batch-level analytics)
3. Brew Insights
4. Sensory vs Declared
5. Segments
6. Market & Pricing
7. Alerts
8. Recipes Lab (V2)

---

# 1. OVERVIEW (executive snapshot)

### Cel:

Szybka diagnoza portfela

### Komponenty:

#### KPI strip

* Avg rating (global)
* Brew success rate (% ocen > 4)
* Repurchase intent (%)
* Active users (7/30 dni)
* Logs per lot

#### Portfolio heatmap

* X: loty
* Y: rating / repurchase
* kolor: wolumen logów

👉 Natychmiast widać:

* które loty są “hitami”
* które są problematyczne

#### Trendy

* rating w czasie
* aktywność użytkowników

---

# 2. LOT DETAIL (core view – najważniejszy ekran)

### Cel:

Diagnoza konkretnego batcha

---

## 2.1 Summary

* Avg rating
* Repurchase %
* # logs
* Distribution (histogram ocen)

---

## 2.2 Degassing curve (unikalna wartość)

* X: dni od roast_date
* Y: rating

👉 odpowiada na:

> kiedy kawa osiąga peak?

---

## 2.3 Brew variability

* wykres:

  * X: brew_ratio
  * Y: rating

* dodatkowo:

  * water temp vs rating
  * brew time vs rating

👉 wykrywa:

* czy kawa jest “wrażliwa”
* czy wymaga precyzyjnej receptury

---

## 2.4 Defect analysis

* %:

  * sour
  * bitter
  * flat

👉 szybka diagnoza:

* underextraction vs overextraction vs roast issue

---

# 3. BREW INSIGHTS

### Cel:

Jak użytkownicy faktycznie parzą kawę

---

## 3.1 Method distribution

* espresso / pour-over / immersion

## 3.2 Parametry (boxplots)

* grind size
* brew ratio
* temp

## 3.3 “Best performing recipe”

* top 10% logów → median recipe

👉 Output:

> rekomendowana receptura oparta na danych

---

# 4. SENSORY vs DECLARED (kluczowy moduł)

### Cel:

Sprawdzenie rozjazdu między marketingiem a rzeczywistością

---

## 4.1 Radar chart

* deklaracja palarni vs user perception:

  * acidity
  * sweetness
  * body

## 4.2 Flavor notes overlap

* % użytkowników, którzy wykryli nuty deklarowane

👉 KPI:

* **Flavor Accuracy Score**

---

## 4.3 Unexpected notes

* najczęściej zgłaszane nuty spoza deklaracji

👉 insight:

* czy kawa jest źle opisana?

---

# 5. SEGMENTS

### Cel:

Zrozumienie *dla kogo* działa kawa

---

## 5.1 Rating by segment

Tabela:

| segment  | rating | repurchase |
| -------- | ------ | ---------- |
| beginner | 3.2    | 20%        |
| advanced | 4.5    | 65%        |

---

## 5.2 Equipment impact

* prosumer vs pro vs basic

---

## 5.3 Brew method vs rating

👉 kluczowe pytanie:

> czy kawa jest “espresso-first” czy “filter-first” w praktyce?

---

# 6. MARKET & PRICING

### Cel:

Decyzje komercyjne

---

## 6.1 Channel performance

* cafe vs retail vs direct

## 6.2 Price vs value perception

* perceived_value_for_money vs price_band

👉 wykrywa:

* overpriced / underpriced

---

## 6.3 Repurchase drivers

* korelacje:

  * rating vs repurchase
  * sensory vs repurchase

---

# 7. ALERTS (automatyzacja)

### Cel:

System wczesnego ostrzegania

---

### Przykłady alertów:

* 🔴 Rating spadł >20% w 7 dni
* 🔴 Wysoki % “sour” → problem z ekstrakcją
* 🟡 Niska zgodność nut smakowych
* 🟢 Nowy segment odkryty (np. beginners overperform)

---

# 8. DATA EXPORT / API

Palarnia płaci też za:

* eksport CSV
* API do własnych systemów
* integrację z e-commerce

---

# 9. Model monetizacji (za co płacą)

## Tier 1 – Basic (free / low)

* dostęp do Overview
* podstawowe statystyki lotów

## Tier 2 – Pro

* pełny Lot Detail
* Brew Insights
* Segments

## Tier 3 – Advanced

* Sensory vs Declared
* Alerts
* API access

## Tier 4 – Enterprise

* custom dashboards
* ML recommendations
* benchmarking vs inne palarnie (anonimizowane)

---

# 10. Kluczowa przewaga produktu

Dashboard nie sprzedaje “danych”.

On sprzedaje:

> **redukcję niepewności po wypuszczeniu kawy na rynek**

---

# 11. Krytyczne UX zasady

* każda sekcja musi odpowiadać na pytanie:

  * *co zrobić dalej?*
* unikać vanity metrics
* preferować:

  * korelacje
  * segmentację
  * porównania

---

# Podsumowanie

Ten dashboard:

* zamienia logi użytkowników w **decyzje produkcyjne**
* daje palarni coś, czego nie mają:

  * real-world feedback loop
* uzasadnia płatność poprzez:

  * optymalizację roastów
  * poprawę sprzedaży
  * redukcję błędów

---

Jeśli chcesz, mogę:

* rozrysować konkretny layout (wireframe ekranów)
* albo zaprojektować metryki typu “Flavor Accuracy Score” czy “Brew Stability Index” w sposób formalny (z wzorami)


Poniżej masz **konkretne wireframe’y (low-fidelity)** dla kluczowych ekranów dashboardu palarni. Układ jest zoptymalizowany pod **szybkie decyzje operacyjne**, nie eksplorację.

Konwencja:

* `[ ]` komponent
* `—` separatory
* `→` flow/akcja
* (KPI) = metryka pierwszego rzędu

---

# 1. GLOBAL LAYOUT (shell aplikacji)

```
┌──────────────────────────────────────────────────────────────┐
│ LOGO | Roastery Name ▼        Date Range ▼   Export   Alerts │
├───────────────┬──────────────────────────────────────────────┤
│               │                                              │
│  NAVIGATION   │               MAIN CONTENT                   │
│               │                                              │
│  Overview     │                                              │
│  Lots         │                                              │
│  Brew Insights│                                              │
│  Sensory      │                                              │
│  Segments     │                                              │
│  Market       │                                              │
│  Alerts       │                                              │
│               │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

---

# 2. OVERVIEW (dashboard główny)

```
┌──────────────────────────────────────────────────────────────┐
│ OVERVIEW                                                     │
├──────────────────────────────────────────────────────────────┤

[KPI ROW]
[ Avg Rating ] [ Brew Success % ] [ Repurchase % ] [ # Logs ]

--------------------------------------------------------------

[ PORTFOLIO HEATMAP ]
X: Coffee Lots
Y: Rating
Color: Volume

--------------------------------------------------------------

[ TRENDS ]
[ Rating over time ]   [ Active users ]

--------------------------------------------------------------

[ TOP / WORST LOTS ]
Top 5 ↑                     Worst 5 ↓
- Lot A (4.6)              - Lot D (3.1)
- Lot B                    - Lot F

→ klik → przejście do LOT DETAIL
```

**Decyzja, którą wspiera:**

* gdzie interweniować natychmiast

---

# 3. LOT DETAIL (najważniejszy ekran)

```
┌──────────────────────────────────────────────────────────────┐
│ LOT: Ethiopia Guji #124     Roast: 2026-03-01                │
├──────────────────────────────────────────────────────────────┤

[KPI STRIP]
[ Avg Rating ] [ Repurchase % ] [ # Logs ] [ Flavor Accuracy ]

--------------------------------------------------------------

[ HISTOGRAM RATINGS ]
(rozrzut ocen)

--------------------------------------------------------------

[ DEGASSING CURVE ]
X: days since roast
Y: rating

→ insight: peak day

--------------------------------------------------------------

[ BREW VARIABILITY ]
[ brew ratio vs rating ]   [ temp vs rating ]

--------------------------------------------------------------

[ DEFECTS ]
Sour: 35%   Bitter: 10%   Flat: 5%

⚠ Insight banner:
"High sour rate → possible underextraction or roast profile issue"

--------------------------------------------------------------

[ QUICK ACTIONS ]
[ Generate Recipe ]  [ Compare with other lot ]  [ Export ]
```

---

# 4. BREW INSIGHTS

```
┌──────────────────────────────────────────────────────────────┐
│ BREW INSIGHTS                                                │
├──────────────────────────────────────────────────────────────┤

[ METHOD DISTRIBUTION ]
Espresso 60% | Pour-over 30% | Other 10%

--------------------------------------------------------------

[ PARAMETER DISTRIBUTIONS ]
[ Grind size boxplot ]
[ Brew ratio boxplot ]
[ Temperature boxplot ]

--------------------------------------------------------------

[ BEST RECIPE (DATA-DRIVEN) ]

Top 10% brews:
- Ratio: 1:16
- Temp: 94°C
- Time: 2:45

[ Apply as official recommendation ] (CTA)

--------------------------------------------------------------

[ VARIANCE ALERT ]
"High variance in grind size → inconsistent outcomes"
```

---

# 5. SENSORY vs DECLARED

```
┌──────────────────────────────────────────────────────────────┐
│ SENSORY vs DECLARED                                          │
├──────────────────────────────────────────────────────────────┤

[ RADAR CHART ]
Declared vs Actual:
- Acidity
- Sweetness
- Body

--------------------------------------------------------------

[ FLAVOR MATCH ]

Declared: Citrus, Jasmine, Tea
Detected:
✔ Citrus (70%)
✖ Jasmine (20%)
✔ Tea (60%)

Flavor Accuracy Score: 62%

--------------------------------------------------------------

[ UNEXPECTED NOTES ]
- Chocolate (40%)
- Nutty (25%)

⚠ Insight:
"Product perceived as heavier than declared profile"

--------------------------------------------------------------

[ ACTION ]
[ Update tasting notes suggestion ]
```

---

# 6. SEGMENTS

```
┌──────────────────────────────────────────────────────────────┐
│ SEGMENTS                                                     │
├──────────────────────────────────────────────────────────────┤

[ RATING BY EXPERIENCE ]

Beginner:     3.2
Intermediate: 4.0
Advanced:     4.6

--------------------------------------------------------------

[ EQUIPMENT IMPACT ]

Basic:     3.3
Prosumer:  4.2
Pro:       4.7

--------------------------------------------------------------

[ BREW METHOD PERFORMANCE ]

Espresso:    3.5
Pour-over:   4.5

⚠ Insight:
"Coffee underperforms in espresso → misaligned expectation?"

--------------------------------------------------------------

[ SEGMENT OPPORTUNITY ]
"Advanced pour-over users show highest repurchase intent"

[ CTA: Target this segment ]
```

---

# 7. MARKET & PRICING

```
┌──────────────────────────────────────────────────────────────┐
│ MARKET & PRICING                                             │
├──────────────────────────────────────────────────────────────┤

[ CHANNEL PERFORMANCE ]

Cafe:     Rating 4.5
Retail:   3.8
Direct:   4.2

--------------------------------------------------------------

[ PRICE vs VALUE ]

High price band → Value score: 3.1

⚠ Insight:
"Perceived as overpriced in retail channel"

--------------------------------------------------------------

[ REPURCHASE DRIVERS ]

Correlation:
- Sweetness ↑ → Repurchase ↑
- Bitterness ↑ → Repurchase ↓

--------------------------------------------------------------

[ ACTION ]
[ Adjust pricing ] [ Adjust distribution ]
```

---

# 8. ALERTS

```
┌──────────────────────────────────────────────────────────────┐
│ ALERTS                                                       │
├──────────────────────────────────────────────────────────────┤

🔴 Rating dropped 25% in last 7 days (Lot #124)

🔴 Sour defect spike (+40%)

🟡 Flavor mismatch increasing

🟢 New segment discovered: Beginners rating ↑

--------------------------------------------------------------

[ FILTER ]
Severity: All ▼    Lot ▼

--------------------------------------------------------------

→ klik → drilldown do LOT DETAIL
```

---

# 9. KLUCZOWE INTERAKCJE (flow)

### Flow 1: problem z kawą

```
Overview → klik Lot ↓
→ Lot Detail → widzi high sour %
→ Brew Insights → widzi złe ratio
→ decyzja: zmiana rekomendacji
```

---

### Flow 2: marketing mismatch

```
Sensory vs Declared
→ niski Flavor Accuracy
→ update tasting notes
→ test w kolejnych batchach
```

---

### Flow 3: segment discovery

```
Segments
→ advanced users love product
→ target kampanii / komunikacji
```

---

# 10. Zasady projektowe (dlaczego to działa)

## 1. “Insight-first UI”

Każdy ekran zawiera:

* dane
* interpretację (banner)
* akcję

## 2. Minimalna liczba wykresów na ekran

→ redukcja overloadu

## 3. Drill-down zamiast eksploracji

→ szybkie przejście:
Overview → Problem → Przyczyna

## 4. CTA przy każdym insightcie

→ dashboard jako narzędzie decyzyjne

---

# Podsumowanie

Ten wireframe:

* prowadzi użytkownika od **sygnału → diagnozy → decyzji**
* maksymalizuje wartość danych zebranych od użytkowników
* bezpośrednio uzasadnia płatność (operacyjny wpływ na produkt)

---
