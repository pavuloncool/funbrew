# @funcup/ui (Legacy)

`@funcup/ui` is kept for backward compatibility and tests, but it is no longer the runtime design-system source of truth for user-facing surfaces.

## Current source of truth

- Tokens: `@funcup/shared` (`visualSystemTokens`)
- Web primitives: `product/apps/web/src/components/ui/*`
- Mobile primitives: `product/apps/consumer-mobile/src/components/ui/primitives.tsx`

## Rule for new user-facing work

Do not introduce new user-facing components based on `@funcup/ui`.
Use `@funcup/shared` tokens and app-specific primitives instead.
