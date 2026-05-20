# ADR-008: React Error Boundaries

**Date:** 2026-04-08  
**Status:** Accepted  
**Feature:** 002-qr-coffee-platform

## Context
Need to catch React rendering errors gracefully and provide recovery options.

## Decision
Implement ErrorBoundary component:
- Catches component errors via componentDidCatch
- Displays friendly error message with retry button
- Wraps entire app in App.tsx

## Consequences
- ✅ Prevents full app crashes
- ✅ User-friendly error UI
- ✅ Logging integration ready

## Related
- T024