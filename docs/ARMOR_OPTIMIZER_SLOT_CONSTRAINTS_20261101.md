# Armor optimizer: mandatory slot locks and empty slots (2026-11-01)

Base: PR #136 / `81141593`. This is a **new independent function**; no previously accepted weapon AR or armor field goldens have been re-fetched or recalculated. The existing 549 Weight/Poise and 514×12 stat-stable armor field evidence remains unchanged.

## User-visible change

After explicitly loading the pinned reference, each of Head / Chest / Arms / Legs now supports:
- **Any item or empty** (prior behavior, default).
- **Keep slot empty**, meaning the slot cannot contribute to objective, weight or Poise.
- **Lock: exact armor name**, meaning this piece is mandatory for that slot. There is no implicit empty fallback.

The selected objective (one of 13), strict light/medium/heavy equipment-load limit, reserved non-armor weight, optional minimum combined Poise, source exclusions and opt-in site-verified subset selection continue to apply together.

If a locked piece is excluded by name, belongs to a different slot, is unavailable in the chosen source subset, or lacks a required field (including Poise when minimum is active), the optimizer **fails closed**, with no invented numerical result or silent alternate piece. An impossible weight cap returns **no solution**. Both exact algorithms reuse their existing DP; no floating-point rounding or comparator AR change.

## Evidence and parity boundary

`tests/armor-slot-restrictions.test.mjs` compares every objective against small exhaustive 4-slot enumeration under locking, disabled slots, load thresholds and Poise constraints, and covers malformed and unverified locks. Existing 50 AR goldens and Icerind 8 remain historical regression gates, not new live-site observations.

**Still NOT parity-certified against Tarnished.dev armor optimizer**: its arbitrary per-stat minima/maxima, scoring multipliers, roll/equipment effects and special armor interaction semantics are not modeled here. The four-piece recommendation is an exact optimum **only for the implemented local source-data objective and constraints**; no same-input actual optimizer UI golden has been established.

No new pay-per-use API, server, database, source-art redistribution, indexable pages or synthetic combat values are introduced.
