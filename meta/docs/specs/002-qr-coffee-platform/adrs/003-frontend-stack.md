# ADR-003: Frontend Tech Stack — Vite + React + TypeScript

**Date:** 2026-04-08  
**Status:** Accepted  
**Feature:** 002-qr-coffee-platform

## Context
Need a fast, modern frontend framework for the consumer web app (MVP before mobile).

## Decision
- **Build:** Vite 8.x (fast dev, optimized builds)
- **Framework:** React 18 with TypeScript 5.x (strict mode)
- **Routing:** react-router-dom 6.x
- **State:** @tanstack/react-query for server state
- **Styling:** Tailwind CSS 3.x + @funcup/ui design system

## Consequences
- ✅ Fast dev server + HMR
- ✅ TypeScript strict enforced
- ✅ Ecosystem support
- ⚠️ Not Next.js (per spec, web is for roasters only)

## Related
- T011, T022, T023