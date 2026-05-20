You are a senior frontend architect specializing in cross-platform React (Next.js + Expo React Native).

Your task is to refactor the styling system into a scalable Cross-Platform Design System with a strict Single Source of Truth.

## CURRENT STATE

* Styles are defined inline in components (page.tsx / RN screens)
* No consistency between web and mobile
* No design tokens
* Poor maintainability and no reuse

## TARGET ARCHITECTURE (MANDATORY)

Create a layered design system:

1. DESIGN TOKENS (Single Source of Truth)
2. THEME (semantic mapping)
3. PLATFORM STYLE ADAPTERS (RN / Web)
4. SCREEN-LEVEL STYLES (authScreenStyles)

---

## 1. DESIGN TOKENS (CORE – SINGLE SOURCE OF TRUTH)

Create:

* /styles/tokens.ts

This file MUST contain ONLY raw design values:

```ts
export const tokens = {
  colors: {
    primary: '#0A84FF',
    background: '#FFFFFF',
    text: '#111111',
    muted: '#6B7280',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 20,
  },
  typography: {
    fontSize: {
      sm: 14,
      md: 16,
      lg: 20,
    }
  }
}
```

❌ No component-specific styles here
❌ No platform-specific logic

---

## 2. THEME LAYER (SEMANTIC)

Create:

* /styles/theme.ts

Map tokens → semantic meaning:

```ts
import { tokens } from './tokens'

export const theme = {
  colors: {
    screenBackground: tokens.colors.background,
    textPrimary: tokens.colors.text,
    buttonPrimary: tokens.colors.primary,
  },
  spacing: tokens.spacing,
  radius: tokens.radius,
  typography: tokens.typography,
}
```

---

## 3. PLATFORM ADAPTERS

### React Native:

* /styles/createNativeStyles.ts

```ts
import { StyleSheet } from 'react-native'

export const createNativeStyles = (styles) => StyleSheet.create(styles)
```

### Web (Next.js):

* /styles/createWebStyles.ts

```ts
export const createWebStyles = (styles) => styles
```

❌ Do NOT introduce Tailwind or new libraries
❌ Keep system minimal and predictable

---

## 4. SCREEN STYLES (AUTH)

Create:

* /styles/authScreenStyles.ts

This file MUST:

* Use theme
* Be platform-agnostic
* Export a factory function

```ts
import { theme } from './theme'

export const authScreenStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.screenBackground,
    padding: theme.spacing.lg,
  },
  form: {
    gap: theme.spacing.md,
  },
  input: {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
}
```

---

## 5. PLATFORM USAGE

### React Native:

```ts
import { createNativeStyles } from '@/styles/createNativeStyles'
import { authScreenStyles } from '@/styles/authScreenStyles'

const styles = createNativeStyles(authScreenStyles)
```

### Next.js:

```ts
import { createWebStyles } from '@/styles/createWebStyles'
import { authScreenStyles } from '@/styles/authScreenStyles'

const styles = createWebStyles(authScreenStyles)
```

---

## 6. COMPONENT RULES (CRITICAL)

* ❌ No inline styles

* ❌ No hardcoded values (colors, spacing, etc.)

* ❌ No StyleSheet.create inside components

* ❌ No duplication of tokens

* ✅ Components import styles ONLY

* ✅ Components contain ONLY logic + JSX

---

## 7. OPTIONAL (IF POSSIBLE)

* Add dark mode support via theme switch
* Normalize spacing scale (8pt grid)
* Ensure naming consistency across all layers

---

## OUTPUT REQUIREMENTS

1. BEFORE → AFTER refactor example
2. Full file structure
3. tokens.ts
4. theme.ts
5. authScreenStyles.ts
6. Example RN screen
7. Example Next.js page
8. Highlight removed duplication

---

## DEFINITION OF DONE

* Tokens are the ONLY source of raw values
* Zero inline styles in entire codebase
* Same design system used by RN and Next.js
* Clean separation: tokens → theme → styles → components
* No platform leakage into tokens/theme

Do NOT explain theory. Execute the refactor.
