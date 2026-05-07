# MVP Release Flow Diagrams

Folder zawiera diagramy przepływów i opisy ekranów dla:
- `apps/web`
- `apps/consumer-mobile`

## Jak czytać
- Otwórz plik `.mmd` w https://mermaidviewer.com.
- Dla opisu ekranów i ich roli biznesowej użyj `SCREEN_CATALOG.md`.
- Dla mapowania parity screen/field użyj `SCREEN_FIELD_PARITY_MATRIX.md`.
- Dla oceny gotowości MVP/Beta użyj `MVP_CANDIDATE_ASSESSMENT.md`.

## Diagramy
- `01_web_internal_flows.mmd`  
  Co pokazuje: wszystkie wewnętrzne przepływy ekranów web (entry/auth/roaster-hub/tag/coffee-bank/analytics) oraz ich zależności od danych.

- `02_mobile_internal_flows.mmd`  
  Co pokazuje: wszystkie wewnętrzne przepływy ekranów mobile (entry/auth/tabs/scan/coffee/log/profile), łącznie z offline queue dla logowania degustacji.

- `03_cross_app_canonical_flow.mmd`  
  Co pokazuje: główny cross-app loop produktu: publikacja batcha przez roastera -> skan i log degustacji przez consumera -> analityka roastera.

- `04_cross_app_tag_hash_flow.mmd`  
  Co pokazuje: alternatywny flow hash/tag: `/tag` + `/api/qr` + `/q/{hash}` + przejście do strony kawy.

- `05_error_offline_sync_flows.mmd`  
  Co pokazuje: ścieżki błędów i retry dla Tasting Log (online/offline, kolejka, rodzaje błędów, synchronizacja po odzyskaniu sieci).

- `06_screen_field_parity.mmd`  
  Co pokazuje: parity danych `apps/web` i `apps/consumer-mobile` na poziomie ekranów i kanonicznych pól (source -> shared/service -> destination).
