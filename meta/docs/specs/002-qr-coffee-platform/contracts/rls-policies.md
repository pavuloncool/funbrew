# Contract: Row Level Security Policies

**Date**: 2026-03-25
**Reference**: Constitution Principle II (Shared Data Contract) + Tech Stack Constraints

All tables MUST have RLS enabled. No table may be publicly writable without a policy.

---

## Policy Summary

### `users`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | Own row (full) | `auth.uid() = id` |
| SELECT | Public columns only | Any request — returns only `id, display_name, avatar_url, sensory_level` |
| INSERT | Via auth trigger | Handled by `handle_new_user()` trigger on `auth.users` INSERT |
| UPDATE | Own row | `auth.uid() = id`; `sensory_level` column excluded (service role only) |
| DELETE | Not permitted | — |

---

### `roasters`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | All rows | Public — for Discovery |
| INSERT | Own account | `auth.uid() = user_id` |
| UPDATE | Own row | `auth.uid() = user_id`; `verification_status` excluded (service role only) |
| DELETE | Not permitted | — |

---

### `origins`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | All rows | Public |
| INSERT | Verified roasters | `auth.uid() IN (SELECT user_id FROM roasters WHERE verification_status = 'verified')` |
| UPDATE | Verified roasters | Same as INSERT |
| DELETE | Not permitted | — |

---

### `coffees`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | Active coffees | `status = 'active'` (public) |
| SELECT | Own draft/archived | `auth.uid() = (SELECT user_id FROM roasters WHERE id = roaster_id)` |
| INSERT | Verified roaster owner | `auth.uid() = roaster.user_id AND roaster.verification_status = 'verified'` |
| UPDATE | Own coffee | `auth.uid() = roaster.user_id AND roaster.verification_status = 'verified'` |
| DELETE | Not permitted | — |

---

### `roast_batches`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | All rows | Public (archived batches still readable for QR resolution) |
| INSERT | Own coffee's roaster (verified) | `auth.uid() = coffee.roaster.user_id AND verified` |
| UPDATE | Own batch | `auth.uid() = coffee.roaster.user_id` |
| DELETE | Not permitted | — |

---

### `qr_codes`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | All rows | Public (QR resolution must be anonymous) |
| INSERT | Service role only | Via `generate_qr` Edge Function |
| UPDATE | Not permitted | Hash immutability guarantee (FR-016) |
| DELETE | Not permitted | — |

---

### `brew_methods`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | All rows | Public (taxonomy) |
| INSERT / UPDATE / DELETE | Not permitted | Managed via migrations only |

---

### `flavor_notes`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | All rows | Public (taxonomy) |
| INSERT / UPDATE / DELETE | Not permitted | Managed via migrations only |

---

### `coffee_logs`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | Own logs | `auth.uid() = user_id` (journal) |
| SELECT | Anonymised aggregate | Allowed in server-side aggregate queries (no user PII exposed) |
| INSERT | Own entry | `auth.uid() = user_id` |
| UPDATE | Own row (sync only) | `auth.uid() = user_id`; only `synced_at` and `updated_at` updatable post-insert |
| DELETE | Not permitted | FR-020 — data must be preserved |

---

### `tasting_notes`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | Via own coffee_log | `coffee_log_id IN (SELECT id FROM coffee_logs WHERE user_id = auth.uid())` |
| SELECT | Aggregate for stats | Permitted via service role |
| INSERT | Own coffee_log owner | `auth.uid() = (SELECT user_id FROM coffee_logs WHERE id = coffee_log_id)` |
| DELETE | Not permitted | — |

---

### `reviews`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | All (anonymised) | Public — no user identifier exposed in public queries |
| SELECT | Own review | `auth.uid() = (SELECT user_id FROM coffee_logs WHERE id = coffee_log_id)` |
| INSERT | Own coffee_log | `auth.uid() = coffee_log.user_id` |
| UPDATE | Own review | `auth.uid() = coffee_log.user_id` |
| DELETE | Not permitted | — |

**Anonymisation note**: Queries serving the Coffee Page Community section and Roaster analytics MUST join `reviews` without exposing `coffee_logs.user_id` or `users.display_name`. Aggregate and anonymised views should be implemented as PostgreSQL views with `security_definer` where needed.

---

### `review_votes`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | All (aggregate counts) | Public |
| INSERT | Authenticated, not own review | `auth.uid() ≠ (SELECT user_id FROM coffee_logs WHERE id = (SELECT coffee_log_id FROM reviews WHERE id = review_id))` |
| UPDATE | Not permitted | Votes are immutable |
| DELETE | Not permitted | — |

---

### `coffee_stats`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | All rows | Public — used by Coffee Page and Roaster analytics |
| INSERT / UPDATE | Service role only | Via `update_coffee_stats` Edge Function |
| DELETE | Not permitted | — |

---

## Storage Bucket Policies

| Bucket | Read | Write |
|--------|------|-------|
| `roasters/` | Public | Authenticated roaster (own folder) |
| `coffees/` | Public | Authenticated verified roaster (own coffee folder) |
| `users/` | Private (signed URLs) | Own user only |
| `qr/` | Public | Service role only (`generate_qr` Edge Function) |

---

## Cross-Cutting Rules

1. **No anonymous writes**: Every INSERT/UPDATE must have `auth.uid() IS NOT NULL` in the policy condition, except service role operations.
2. **Cascade deletes are prohibited** on tastings: `coffee_logs` has `ON DELETE RESTRICT` on `batch_id`, not CASCADE — preserving tasting history if a batch is archived (FR-020).
3. **`updated_at` triggers**: All tables with `updated_at` must have a `BEFORE UPDATE` trigger calling `set_updated_at()`.
4. **Service role operations**: Edge Functions always use the `service_role` client for writes. The service role key is never exposed to client apps.
