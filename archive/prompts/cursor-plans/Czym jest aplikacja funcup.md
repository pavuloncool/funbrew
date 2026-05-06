# Czym jest aplikacja **funcup**?
Aplikacja **funcup** jest areną **wymiany informacji** pomiędzy dwoma środowiskami:
1. `roaster` – palarnie kawy specialty;
2. `consumer` – konsumenci kawy specialty.
Oba środowiska łączy wspólna pasja: **kawa specialty**.
`roaster` jest przedsiębiorcą, wypala kawę i pakuje ją w opakowania detaliczne.
`consumer` jest konsumentem, który nabywa kawę – kupuje ją online lub stacjonarnie albo otrzymuje w prezencie.

# Dwie warstwy aplikacji
Aplikacja **funcup** zbudowana jest na architekturze Expo React i obsługuje dwie warstwy funkcjonalne:
1. `roaster-app`: strony, routing, funkcjonalności i UI/UX dedykowane do obsługi użytkownika `roaster`, dostępne wyłącznie w przeglądarce web browser;
2. `consumer-app`: strony, routing, funkcjonalności i UI/UX dedykowane dla użytkownika `consumer`, dostępne wyłącznie jako aplikacja iOS/Android na urządzeniach mobile.

## Separation of Concerns – Routing Core
`roaster-app` nie posiada wersji mobile, a jedynie wersję web browser.
`consumer-app` nie posiada wersji web, a jedynie wersję mobile iOS/Android.

# Metoda wymiany informacji pomiędzy `roaster` a `consumer`
Nośnikiem informacji pomiędzy środowiskami jest **kod QR**.
Kod QR może zostać wygenerowany wyłącznie w aplikacji (self-hosted QR model).
Kod QR jest generowany przez `roaster` i odczytowany przez `consumer`.