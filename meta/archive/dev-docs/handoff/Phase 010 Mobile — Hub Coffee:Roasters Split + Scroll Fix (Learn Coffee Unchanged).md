Plan

Phase 010 Mobile — Hub Coffee/Roasters Split + Scroll Fix (Learn Coffee Unchanged)
Summary
Wdrażamy uproszczenie IA:
Hub ma kafle Coffee i Roasters (oraz bez zmian istniejący Learn Coffee).
Coffee otwiera ekran z 2 listami: Rated Coffees + Discover Coffees.
Roasters otwiera ekran z 2 listami: Followed Roasters + Discover Roasters.
Naprawiamy brak scrolla na Hub i Tasting Log.
Nie ruszamy Learn Coffee route ani kafla.
Implementation Changes
Hub i routing:

W /(tabs)/hub/index:
zostawić istniejący kafel/CTA Learn Coffee bez zmian,
dodać/utrzymać kafel Coffee -> /(tabs)/coffee,
dodać/utrzymać kafel Roasters -> /(tabs)/roasters.
Dodać hidden-tab route /(tabs)/coffee/index:
sekcja Rated Coffees: reuse obecnej logiki Journal (useJournal).
sekcja Discover Coffees: reuse useDiscoverCoffees + placeholder copy o rekomendacjach.
Dodać hidden-tab route /(tabs)/roasters/index:
sekcja Followed Roasters (isFollowed === true),
sekcja Discover Roasters (isFollowed === false),
zachować follow/unfollow i link do profilu roastera.
Compat routing:
/(tabs)/journal/index -> redirect do /(tabs)/coffee (rated-first).
/(tabs)/discover-roasters/index -> redirect do /(tabs)/roasters.
Aktualizacje shell:
app/(tabs)/_layout.tsx: dodać screeny coffee/index i roasters/index z href: null.
app/_layout.tsx: rozszerzyć mapowanie segmentów, aby coffee i roasters miały poprawny active tab.
Scroll fix:

product/apps/consumer-mobile/app/(tabs)/hub/index.tsx: przejście z AppScreen na AppScrollScreen + usunięcie blokującego flex:1 wrappera.
product/apps/consumer-mobile/app/coffee/[id]/log.tsx: przejście z AppScreen na AppScrollScreen, content container + bottom padding pod chrome.
Reuse i porządek kodu:

Wydzielić sekcję listy rated z obecnego Journal, aby użyć ją na ekranie Coffee.
Reuse DiscoverCoffeesTab i DiscoverRoastersTab jako bloki sekcyjne, bez zmiany kontraktów hooków.
Public APIs / Interfaces
Brak zmian DB/schema/backend.
Zmiana kontraktu nawigacji mobile:
Nowe surface routes: /(tabs)/coffee, /(tabs)/roasters.
Legacy: journal i discover-roasters działają jako wejścia kompatybilności (redirect).
Learn Coffee pozostaje bez zmian (/(tabs)/brew-your-skills i kafel w Hub).
Test Plan
Scroll:
Hub i Tasting Log przewijają się przy długim contencie.
Navigation:
Kafel Coffee -> ekran z Rated + Discover Coffees.
Kafel Roasters -> ekran z Followed + Discover Roasters.
Kafel Learn Coffee działa jak wcześniej (brak regresji).
journal i discover-roasters redirectują poprawnie.
Functional MVP:
historia tastingów działa jak wcześniej,
discover coffees/roasters loading-empty-error działają,
follow/unfollow i przejścia do profilu roastera bez regresji.
Assumptions
Journal jako samodzielny ekran UX zostaje zastąpiony sekcją Rated Coffees na ekranie Coffee, ale dane i zachowanie pozostają te same.
Brak wdrożenia search roasterów w tej paczce.
Learn Coffee niezmienione na poziomie layoutu, routingu i copy.
