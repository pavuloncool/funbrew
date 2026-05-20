**Kontekst**
`consumer`, który nie ma konta w aplikacji `consumer-mobile` kieruje się do rejestracji na `product/apps/consumer-mobile/app/(auth)/register.tsx`. Do rejestracji podaje email i hasło plus powtórzenie hasła, a dane te – po ostatnim zadaniu – są zapamiętywane w urządzeniu iOS/Android.
Kolejnym ekranem po rejestracji musi być ekran uzupełnienia profilu użytkownika, optymalnie `product/apps/consumer-mobile/app/(auth)/complete-profile.tsx`.
Ekran `complete-profile.tsx` wyświetla jako string wcześniej uzupełnioną na `product/apps/consumer-mobile/app/(auth)/register.tsx` nazwę użytkownika i jego email.

**Zadanie**
Ekran `complete-profile` musi zawierać następujące pola, które `consumer` uzupełnia po rejestracji, a przed wyświetleniem przez aplikację pierwszego ekranu:
1. `avatar-pick` – aplet generacji awatara dla `consumera` według instrukcji:
    Create a cross-platform avatar selector component in React Native (iOS + Android).
    Requirements:
    - Use DiceBear JS library (@dicebear/core + a human avatar collection like "lorelei" or similar)
    - Do NOT depend on external APIs (must work offline / self-hosted)
    - Render avatars using react-native-svg (preferred) or Image (fallback)

    UI:
    - Grid: 2 columns x 4 rows (8 avatars total)
    - Each avatar is selectable (Pressable)
    - Selected state: visible border + subtle scale animation
    - Accessible (focus + screen reader labels)

    Data:
    - Use a predefined list of 8 seeds (curated for diversity: different skin tones, hairstyles, gender expression)
    - Do NOT generate random avatars at runtime

    Architecture:
    - Create AvatarTile component (pure)
    - Create AvatarGrid component (handles selection state)
    - Keep avatar generation logic separate (avatarFactory.ts)

    Design constraints:
    - Avatars must be visually inclusive (race, gender-neutral options)
    - Avoid stereotypes (no exaggerated features)
    - Keep style consistent across all avatars

    Output:
    - Fully typed TypeScript
    - No inline styles (use StyleSheet or design system tokens)

2. `fav-brew-method` (ulubiona metoda parzenia) – @react-native-picker/picker importujący metody parzenia z re-useable komponent `brew-methods`;
    • Przeszukaj pliki dokumentacji i zidentyfikuj określone pierwotnie brew methods – zapytaj o potwierdzenie swojego wywboru;
    • Wygeneruj re-useable komponent `brew-methods` z metodami parzenia, które będą importowane przez `fav-brew-method` oraz – w kolejnych etapach – przez inne komponenty aplikacji (np. na ekranie ratingu kawy.). Na potrzeby tworzenia komponentu `brew-methods` użyj metod parzenia zawartych w pliku 
    • Dodaj komponent `fav-brew-method` do `complete-profile`.
3. `fav-tasting-notes` – logika i zadania identycznie jak w przypadku `fav-brew-method`, ale dla tasting notes

4. Po zapisaniu danych aplikacja wyświetla dotychczasowy ekran profilu użytkownika – potwierdź, że to `product/apps/consumer-mobile/app/(tabs)/profile/index.tsx`. Jeśli to prawda, uzupełnij ten ekran o przycisk `Go to My Coffe House` prowadzący do `product/apps/consumer-mobile/app/(tabs)/hub/index.tsx`.

5. Do ekranu profilu użytkownika (tego z wypełnionymi danymi consumera) dodaj poniżej wszystkich pozycji danych odnośnik 'Log out' – stwórz potrzebą logikę, podepnij ją pod aktualny (auth), aby użytkownik po wylogowaniu trafiał na stronę logowania.
