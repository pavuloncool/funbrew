# ADR-001: Monorepo with Turborepo

**Date:** 2026-04-08  
**Status:** Accepted  
**Feature:** 002-qr-coffee-platform

## Context
Need to organize code for consumer mobile app (Expo) + roaster web dashboard (Next.js) + shared packages. Required efficient CI/CD, shared tooling, and independent deployability.

## Decision
Use Turborepo monorepo with npm workspaces:
```
product/apps/
  mobile/     # Expo app — consumers
  web/        # Next.js app — roasters
product/packages/
  shared/     # Supabase client, hooks, constants
  types/      # TypeScript interfaces
  utils/      # Utility functions
  tsconfig/   # Shared TypeScript configs
  eslint-config/
  ui/         # Design system components
  logger/     # Logging utilities
  i18n/       # Internationalization
```

## Consequences
- ✅ Shared tooling (lint, typecheck, build)
- ✅ Independent app builds via Turbo
- ✅ Shared @funcup/* packages across apps
- ⚠️ Need to install deps at root level for Turbo

## Related
- T001, T002