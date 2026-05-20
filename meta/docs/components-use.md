# funcup Visual Primitives: Usage Guide

## Cel
Ten dokument opisuje, jak stosować nową warstwę wizualną opartą o `@funcup/shared` oraz prymitywy mobile z `product/apps/consumer-mobile/src/components/ui/primitives.tsx`.

## Źródło prawdy
- Tokeny i role: `product/packages/shared/src/visualSystem.ts`
- Kompatybilność legacy: `product/packages/shared/src/visualTokens.ts`
- Prymitywy RN: `product/apps/consumer-mobile/src/components/ui/primitives.tsx`
- Tabbar shell: `product/apps/consumer-mobile/src/components/ui/AppTabBar.tsx`

## Zasady użycia
1. Nie wpisuj nowych kolorów hex w ekranach user-facing.
2. Używaj `AppScreen` jako kontenera ekranu.
3. Używaj `AppText` zamiast surowego `Text` dla typografii i tonu.
4. Używaj `AppInput` dla pól formularza.
5. Używaj `AppButton` dla akcji (wariant `primary` lub `secondary`).
6. Używaj `AppCard` dla bloków treści i sekcji.
7. Dla list tagów/chipów używaj `AppChip`.

## API prymitywów
- `AppScreen(props)`
- `AppPanel(props & { padded?: boolean })`
- `AppText(props & { variant?: 'hero'|'h1'|'h2'|'h3'|'body'|'bodySm'|'caption'; tone?: 'primary'|'secondary'|'muted'|'onPrimary'|'danger'|'success'; weight?: '400'|'500'|'600'|'700'|'800' })`
- `AppCard(props & { elevated?: boolean })`
- `AppButton({ label, onPress, disabled?, variant?: 'primary'|'secondary', accessibilityLabel? })`
- `AppInput(props & { hasError?: boolean })`
- `AppChip({ label })`

## Przykład ekranu
```tsx
import { AppButton, AppCard, AppInput, AppScreen, AppText } from '../src/components/ui/primitives';

export function ExampleScreen() {
  return (
    <AppScreen>
      <AppText variant="h2" weight="700">Logowanie</AppText>
      <AppCard>
        <AppText variant="bodySm" weight="600">Email</AppText>
        <AppInput placeholder="name@example.com" />
        <AppButton label="Zaloguj" onPress={() => {}} />
      </AppCard>
    </AppScreen>
  );
}
```

## Reguły tabbara
- Kompozycja centralnego przycisku `Scan Coffee` jest zarządzana przez `AppTabBar`.
- Widoczność tabbara wynika z `appShellRules` w `visualSystem.ts`.
- Nie twórz lokalnych wariantów FAB/tabbara poza `AppTabBar`.

## Checklista dla nowego ekranu
1. Kontener: `AppScreen`.
2. Nagłówki/opisy: `AppText` z odpowiednimi `variant` i `tone`.
3. Formularz: `AppInput` + `AppButton`.
4. Sekcje danych: `AppCard`.
5. Brak inline hex oraz duplikowania stylów przycisków/inputów.
6. Jeśli potrzebny nowy wariant, dodaj go w prymitywie lub `visualSystem.ts`.
