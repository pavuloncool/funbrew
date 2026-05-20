# ADR-009: Animated Entry — Tap to Bean (Splash Screen)

**Date:** 2026-04-08  
**Status:** Accepted  
**Feature:** 002-qr-coffee-platform

## Context
FR-012 mandates the splash screen animation: fingerprint → burst → coffee bean. This is the user's first interaction with the app **on open** (launch into the shell). It does not repeat on every in-app route or tab change after the app has loaded.

## Decision
Implement AnimatedSplash.jsx with:
- Fingerprint SVG → tap triggers press → burst → dissolve
- Canvas-based particle effect sampling fingerprint pixels
- Coffee bean SVG appears mid-animation with scale/rotate/blur animation
- Framer Motion for all transitions
- Haptic feedback via navigator.vibrate

## Consequences
- ✅ Conforms to FR-012 spec
- ✅ Protected interaction (no engineering effort after)
- ✅ Visual signature of the app

## Related
- 08 Backlog & Tasks, spec FR-012