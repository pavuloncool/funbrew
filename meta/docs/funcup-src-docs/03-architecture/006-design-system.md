# ADR-006: Design System with @funcup/ui Package

**Date:** 2026-04-08  
**Status:** Accepted  
**Feature:** 002-qr-coffee-platform

## Context
Need reusable UI components for consistent look and feel across the app.

## Decision
Create @funcup/ui package with:
- **Theme:** colors (stone, amber), spacing, typography, borderRadius, shadows
- **Components:** Button, Card, Input, Badge
- **Export pattern:** components/*/index.ts

## Consequences
- ✅ Consistent design language
- ✅ Storybook for component development
- ✅ Theme-based styling

## Related
- T011, T022