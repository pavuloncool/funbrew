Kontekst:
Ekran My Coffee House (`product/apps/consumer-mobile/app/(tabs)/hub/index.tsx`) to:
• ekran główny aplikacji consumer-mobile;
• punkt startowy do przejścia do innych content-full ekranów (coffee rating, coffee history, discover roasters, education etc.) oraz do ekranu Settings (`product/apps/consumer-mobile/app/(tabs)/profile/index.tsx`).
Na ten ekran:
    • nowy consumer przechodzi po uzupełnieniu danych podczas rejestracji (register > complete-profile > profile i tu przycisk Go to My Coffee House (to jest de facto strona /hub/index.tsx));
    • wylogowany consumer przechodzi z ekranu product/apps/consumer-mobile/app/(auth)/login-form.tsx;
    • zalogowany consumer z aktywnym tokenem sesji wchodzi od razu po zakończeniu initial animated splash.

Zadanie:
1. Stwórz layout ekranu My Coffee House zachowując dolny tabbar.
2. Layout ekranu My Coffee House polega na prostokątnych przyciskach z nazwami ekranów docelowych (zobacz screenshot):
    • Coffee Log
    • Discover Roasters
    • Brew Your Skills
    • Settings
3. Zachowaj stylistykę opartą o design system aplikacji funcup.
4. Podłącz do przycisków istniejące ekrany:
    • (istniejący) **Coffee Log** > ekran Journal (`product/apps/consumer-mobile/app/(tabs)/journal`);
    • (mock-up) **Discover Roasters**: na teraz pusta strona, docelowo lista zaobserwowanych palarni i palarni, których kawy consumer ocenił; 
    • (mock-up) **Brew Your Skills**: na teraz pusta strona, docelowo gateway do warstwy edukacyjnej: brewing, coffee origins, coffee growing, farms itp.
    • (istniejący) **Settings** (`product/apps/consumer-mobile/app/(tabs)/profile/index.tsx`)

Zadawaj pytania o wyjaśnienia w przypadku wątpliwości decyzyjnych.

W toku planowania potwierdź, czy ekran  (`product/apps/consumer-mobile/app/roaster/[id]/index.tsx`) może stanowić format 'wizytówki' roastera dla consumera, dostępnej z poziomu ekranu Discover Roasters?