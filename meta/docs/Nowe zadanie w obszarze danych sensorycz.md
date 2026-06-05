Nowe zadanie w obszarze danych sensorycznych.
Zadanie dotknie zarówno apps/web (w pierwszej kolejności), jak i apps/consumer-mobile (zgodnie z zasadą data-endpoints mirroring).

Na potrzeby tego zadania i całej aplikacji zmieniamy pojęcie Telemetry na Sensory Core.

**Sensory Core** to zestaw 5 podstawowych (Core) parametrów sensorycznych (Sensory), deklarowanych przez roastera w http://localhost:3000/roaster-hub/batches/new i ocenianych przez consumera w Tasting Log, na skali od 1 do 5. Parametry te to:
    1. **Acidity**: '1' = 'naturally plain', '5' = 'bright and lifting';
    2. **Sweet**: '1' = 'dimmed and earthy', '5' = 'ripe and crunchy';
    3. **Body**: '1' = 'subtle and tea-like', '5' = 'syrupy and smooth';
    4. **Bitter**: '1' = 'dry tobacco', '5' = 'pleasant cocoa';
    5. **Aftertaste**: '1' = 'faint and elusive', '5' = 'long and pleasant';

W `product/apps/web/src/components/roaster-hub/BatchPublicationEditor.tsx` zamień
odpowiednie ScoreFields dla Acidity, Sweet i Body na ScorePickers od 1 do 5, takie jak w `product/apps/consumer-mobile/app/coffee-log/[logId].tsx`, z etyketami po obu stronach skali:
[scale label][1][2][3][4][5][scale label]

Identycznie modyfikuj komponent oceny telemetrii (Sensory Core od teraz) w consumer-mobile `product/apps/consumer-mobile/app/coffee-log/[logId].tsx`.

W kolejnym kroku dostosuj radar chart w http://localhost:3000/roaster-hub/analytics/* w taki sposób, aby uzupełnić brakujące wierzchołki wykresu o nowo dodane **Bitter** i **Aftertaste**.