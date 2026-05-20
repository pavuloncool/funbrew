# ADR-002: PostgreSQL with Supabase

**Date:** 2026-04-08  
**Status:** Accepted  
**Feature:** 002-qr-coffee-platform

## Context
Need a backend database with RLS, auth, storage, and Edge Functions for the QR-driven coffee platform.

## Decision
Use Supabase (PostgreSQL + built-in Auth, Storage, Edge Functions):
- Single PostgreSQL instance with 13 tables
- Supabase Auth for user management
- Supabase Storage for images + QR assets
- Edge Functions (Deno) for server-side logic
- RLS policies for all tables

## Consequences
- ✅ Built-in auth + RLS
- ✅ Edge Functions for custom endpoints
- ✅ Storage for images
- ⚠️ Vendor lock-in (acceptable for MVP)

## Related
- T007, T008, T014, T015