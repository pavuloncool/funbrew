Poniżej masz scaloną, jednoznaczną odpowiedź na Twoje pierwotne pytania — w formie prompta/specyfikacji decyzyjnej, gotowej do przekazania zespołowi lub implementacji.

---

## 🧭 Architektura generacji QR – odpowiedzi i decyzje (funcup)

### 1. Co oznacza „self-hosted na serwerze funcup”

**Definicja:**
„Self-hosted” oznacza, że generator QR działa **wewnątrz aplikacji funcup**, a nie jako Supabase Edge Function ani osobny serwis.

**Decyzja:**

* implementacja:

  * **Next.js Route Handler**
  * lokalizacja: `apps/web/app/api/qr/route.ts`
* runtime:

  * **Node.js (nie Edge)**

**Odpowiedzi szczegółowe:**

* ❓ Next.js vs osobny serwis vs VPS
  → **Next.js Route Handler (apps/web)**

* ❓ czy osobny host/API
  → **ta sama domena co aplikacja web (np. funcup.app/api/qr)**

* ❓ wymagania środowiskowe
  → **Node runtime (pełne wsparcie bibliotek QR, brak ograniczeń Edge)**

---

### 2. Relacja do `generate_qr` (Supabase Edge)

**Stan obecny:**

* istnieje:

  * `POST /functions/v1/generate_qr`
  * używany w `QRDownloadButton.tsx`
  * testy: `generate-qr.spec.ts`

**Decyzja:**

* ❌ nie proxy
* ❌ nie równolegle
* ✅ **pełne zastąpienie**

Nowy endpoint:

```http
POST /api/qr
```

**Konsekwencje:**

* usunięcie Edge Function
* uproszczony flow auth
* brak zależności od Supabase Functions
* testy wymagają aktualizacji (breaking change zaakceptowany)

---

### 3. Kontrakt danych QR (zawartość kodu)

**Decyzja:**
QR zawiera wyłącznie URL:

```id="qr-url"
https://funcup.app/q/{public_hash}
```

**Zasady:**

* brak JSON w QR
* brak custom payloadów
* pełna zgodność ze skanowaniem (mobile + web)

**Konsekwencja:**

* nie łamie istniejącego flow `/q/{hash}`
* QR jest stabilny i uniwersalny

---

### 4. Kontekst encji: `roaster_coffee_tag`

QR jest generowany dla:

```id="entity"
roaster_coffee_tag
```

Nie używamy `coffee_batch`.

---

### 5. Identyfikator (`public_hash`)

**Źródło:**

* tabela: `roaster_coffee_tag`

```sql id="public-hash"
public_hash TEXT UNIQUE NOT NULL
```

**Zasady:**

* generowany przy zapisie
* immutable
* jedyny identyfikator używany w QR

---

### 6. Kiedy i skąd bierze się identyfikator

**Flow:**

#### Krok 1 — zapis

Frontend zapisuje:

```json
roaster_coffee_tag
```

Powstaje:

* `id`
* `public_hash`

---

#### Krok 2 — generacja QR

Frontend wywołuje:

```json id="request"
POST /api/qr
{
  "tagId": "<id>"
}
```

**Decyzja:**

* ✅ tylko `id`
* ❌ nie pełny payload formularza

**Źródło prawdy:**

* baza danych (Supabase)

---

### 7. Autoryzacja i bezpieczeństwo

**Mechanizm:**

* Supabase Auth (JWT)
* użycie w Route Handler

```ts id="auth"
const { data: { user } } = await supabase.auth.getUser()
```

**Walidacja:**

```ts id="ownership"
tag.roaster_id === user.id
```

**Decyzje:**

* endpoint dostępny tylko dla zalogowanych
* brak publicznego tokenu
* brak użycia service role po stronie klienta

---

### 8. Format odpowiedzi i storage

**Format odpowiedzi:**

```json id="response"
{
  "svg": "<string>",
  "png": "<base64>",
  "url": "https://funcup.app/q/{public_hash}"
}
```

**Rendering:**

* PNG → `<img>`
* SVG → download

---

**Storage:**

**Decyzja:**

* ❌ brak zapisu do Supabase Storage

**Uzasadnienie:**

* QR jest deterministyczny
* brak potrzeby przechowywania plików
* uproszczenie systemu

---

### 9. Idempotentność

**Zasada:**

* ten sam `public_hash` → ten sam QR

**Efekt:**

* brak potrzeby dodatkowego mechanizmu

---

### 10. UI / copy / layout

**Flow:**

1. przycisk:

   * „Zapisz dane”
2. po zapisie:

   * „Generuj kod QR”
3. po kliknięciu:

   * preview PNG
   * przycisk „Pobierz SVG”

**Zasady UI:**

* QR widoczny dopiero po drugim kroku
* brak sticky panelu na start

**Copy:**

* rekomendacja:

  * używać kluczy i18n (np. `qr.generate`, `qr.download`)
  * unikać mieszania PL/EN hardcoded

---

### 11. Routing i scan flow

Wymagany route:

```ts id="route"
/app/q/[hash]/page.tsx
```

**Flow:**

1. użytkownik skanuje QR
2. trafia na:

   ```
   /q/{public_hash}
   ```
3. frontend pobiera `roaster_coffee_tag`
4. render danych

---

### 12. Folder `supabase/functions/coffee`

**Stan:**

* zawiera:

  * `get-coffee.ts`
  * `log-tasting.ts`
  * `update-coffee-stats.ts`

**Decyzja:**

* traktować jako:

  * referencję stylu (Supabase client, auth)
* ❌ nie używać do QR

**Współdzielenie kodu:**

* brak potrzeby (Edge QR usunięty)
* `packages/shared` opcjonalne, nie wymagane

---

### 13. Testy i kryteria ukończenia

**Decyzja:**

* dopuszczona zmiana kontraktu

---

**Testy:**

#### Unit:

* `/api/qr` zwraca:

  * svg
  * png
  * poprawny URL (`/q/{public_hash}`)

#### E2E:

* zapis `roaster_coffee_tag`
* generacja QR
* poprawny render

---

**Istniejące testy:**

* `generate-qr.spec.ts` → do aktualizacji

---

## ✅ Finalna odpowiedź na „ask first”

**Gdzie stoi generator?**
→ **Next.js Route Handler (`apps/web/app/api/qr`)**

**Czy zastępuje `generate_qr`?**
→ **Tak, w pełni zastępuje (brak równoległej ścieżki)**

---

## 🧭 Finalna architektura (skrót)

* generator QR:

  * Next.js (Node runtime)
* encja:

  * `roaster_coffee_tag`
* identyfikator:

  * `public_hash`
* QR:

  * `/q/{public_hash}`
* auth:

  * Supabase JWT + ownership check
* storage:

  * brak
* Edge Functions:

  * usunięte (dla QR)

---

Ta specyfikacja zamyka wszystkie punkty decyzyjne i pozwala przejść bezpośrednio do implementacji.
