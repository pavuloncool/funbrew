# ADR: Offline-First Tasting Architecture

**Date**: 2026-04-08
**Status**: Implemented
**Related**: US-1 (QR Scan + Log), US-5 (Offline Support)

---

## Context

Specialty coffee is consumed in environments (cafés, markets, travel) where connectivity is unreliable. The spec requires offline-first operation for the tasting log flow (US-5, FR-009).

## Decision

Implement client-side offline queue with auto-sync:

1. **Local Storage Queue**: Store pending tastings in localStorage (`funcup_pending_tastings`)
2. **Auto-Sync**: Every 30 seconds when online, attempt to sync pending items
3. **Visual Feedback**: Show "Offline" badge on tasting form when disconnected
4. **Success State**: Different message for offline vs online submissions

## Implementation

### Hook: `useLocalStorageSync`

```typescript
const { pendingTastings, isOnline, addPendingTasting, syncPendingTastings } = useLocalStorageSync()
```

- `pendingTastings: PendingTasting[]` — Queue of unsynced tastings
- `isOnline: boolean` — Current network status
- `addPendingTasting(tasting)` — Add to queue (called on form submit when offline)
- `syncPendingTastings(getAuthToken)` — Manual sync trigger
- `pendingCount: number` — Queue size for UI indicators

### Queue Structure

```typescript
interface PendingTasting {
  id: string;           // local UUID
  batch_id: string;
  rating: number;
  brew_method_id?: string;
  brew_time_seconds?: number;
  flavor_note_ids: string[];
  free_text_notes?: string;
  review?: string;
  created_at: string;   // ISO timestamp
}
```

### Limits

- Max queue size: 50 entries (per spec edge case)
- Auto-sync interval: 30 seconds (spec US-5 AC-3)

## Tradeoffs

- **Pros**: Simple implementation, works with existing API, no backend changes needed
- **Cons**: LocalStorage is browser-specific (works in web, needs migration for native mobile), no conflict resolution UI

## Status

Implemented in `product/apps/frontend/src/hooks/useLocalStorageSync.ts`. Used by `CoffeePage.tsx` for tasting form.

---

## Related: Scan History

Also implemented `useScanHistory` hook for tracking scanned coffees:

- Stored in localStorage (`funcup_scan_history`)
- Max 50 entries
- Updates timestamp on re-scan (moves to top)
- Used by CoffeePage to record scans