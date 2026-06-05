# Screen-Field Parity Matrix (Pre-Beta Stock-Taking)

Data snapshot: 2026-05-08  
Scope: `product/apps/web`, `product/apps/consumer-mobile`, `product/packages/shared`  
Status legend: `wired` (działa end-to-end), `partial` (działa z ograniczeniem), `missing` (brak połączenia)

## US1 Critical Flow (publish -> scan -> coffee -> log -> analytics)

| Domain | Source (table/function) | Shared/service layer | Destination screen.field | Status | Notes / Owner |
|---|---|---|---|---|---|
| Publish | `coffees.name` | web form model + Supabase client | Web `/roaster-hub/coffees/new`.coffeeName | wired | MVP publish path aktywny |
| Publish | `roast_batches.lot_number` | web form model + Supabase client | Web `/roaster-hub/coffees/new`.lotNumber | wired | Klucz lot identity |
| Publish | `roast_batches.qr_hash` -> `qr_codes.hash` | `/api/batch-qr` | Web `/roaster-hub/batches/[batchId]` QR actions | wired | QR do scan flow |
| Scan | Function `scan_qr(hash)` | `parseFuncupQrScanPayload` + normalized coffee model | Mobile `/q/[hash]` -> `/coffee/[id]` | wired | Canonical resolver |
| Coffee page | `coffees`,`roasters`,`roast_batches`,`tasting_notes` | `normalizeCoffeePage` + `useCoffeePage` | Mobile `/coffee/[id]` product sections | wired | Shared normalization |
| Log | Function `log_tasting` | `tastingService.logTasting` + `normalizeFlowError` | Mobile `/coffee/[id]/log`.submit | wired | Online + retry fallback |
| Log | `coffee_logs.rating` | `useJournal` | Mobile `/(tabs)/coffee` Rated row rating | wired | Lista wpisów |
| Log | `coffee_logs.free_text_notes` | `useJournal` | Mobile `/(tabs)/coffee` Rated row notes | wired | Notes preview |
| Stats | Function `update_coffee_stats` -> `coffee_stats` | `updateCoffeeStats` | Web `/roaster-hub/analytics/[batchId]`.summary | wired | Auto-refresh 30s |
| Analytics | `coffee_log_tasting_notes` | `useRoasterAnalytics` | Web `/roaster-hub/analytics/[batchId]`.topNotes | wired | Ranking nut |

## Roaster Data Profile (MVP Core)

| MVP core field | Source | Shared contract | Destination | Status | Notes / Owner |
|---|---|---|---|---|---|
| `brew_method` | `coffee_logs.brew_method_id` + `brew_methods` | `RoasterTelemetryCoreInput.brewMethodId` | Mobile log + detail edit | wired | Quick-log compatible |
| `overall_rating` | `coffee_logs.rating` | `RoasterTelemetryCoreInput.overallRating` | Mobile log + detail edit + analytics aggregate | wired | 1..5 |
| `sensory_acidity` | `coffee_log_telemetry_core.sensory_acidity` | `RoasterTelemetryCoreInput.sensoryAcidity` | Mobile log + detail edit | wired | 1..5 slider |
| `sensory_sweetness` | `coffee_log_telemetry_core.sensory_sweetness` | `RoasterTelemetryCoreInput.sensorySweetness` | Mobile log + detail edit | wired | 1..5 slider |
| `sensory_body` | `coffee_log_telemetry_core.sensory_body` | `RoasterTelemetryCoreInput.sensoryBody` | Mobile log + detail edit | wired | 1..5 slider |
| `repurchase_intent` | `coffee_log_telemetry_core.repurchase_intent` | `RoasterTelemetryCoreInput.repurchaseIntent` | Mobile log + detail edit | wired | yes/no/unsure |
| `experience_level` | `users.sensory_level` fallback -> `coffee_log_telemetry_core.experience_level` | `RoasterTelemetryCoreInput.experienceLevel` | Telemetry save path | partial | Fallback działa; brak oddzielnego UX wyboru poziomu w logu |

## Navigation + Mobile product-like polish

| Flow | Source | Destination | Status | Notes / Owner |
|---|---|---|---|---|
| Rated list -> detail | `coffee_logs.id` | Mobile `/coffee-log/[logId]` | wired | Nowy entrypoint z listy Rated Coffees |
| Detail -> save edit | `coffee_logs`,`reviews`,`coffee_log_telemetry_core` | Mobile detail actions | wired | Save refreshuje stats |
| Detail -> delete | `coffee_logs` | Powrót do `/(tabs)/coffee` | wired | Delete + stats refresh |
| Roasters search by name/city | Local query string | `/(tabs)/roasters` Followed + Discover | wired | case-insensitive contains(name\|city) |
| Empty/error/loading consistency | react-query states + EmptyState/ScreenError/Skeleton | `/(tabs)/coffee`, `/(tabs)/roasters`, `/coffee-log/[logId]` | partial | Działają; copy do dalszego polishingu po beta |

## Post-MVP backlog hooks (from roaster profile proposal)

| Field group (post-MVP) | Integration point prepared | Status | Next owner step |
|---|---|---|---|
| `equipment_class`, `consumption_frequency` | `users` profile extension | missing | Add columns + profile form |
| Brew telemetry (`grind_size`,`brew_ratio`,`water_temp`,`brew_time`) | Extend `coffee_log_telemetry_core` or sibling table | missing | Migration + UX level Standard/Advanced log |
| Sensory extras (`bitterness`,`aftertaste`,`defect_flags`) | Extend telemetry schema + analytics aggregations | missing | Add columns + analytics widgets |
| Context (`drink_format`,`location_type`,`consumption_context`) | New table linked by `coffee_log_id` | missing | Add optional form step |
| Purchase signals (`purchase_channel`,`value_for_money`) | New post-log survey table | missing | Event design + retention experiment |
