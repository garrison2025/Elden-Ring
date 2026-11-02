# Exact 13-metric weighted armor top-five — 2026-11-02

## Scope completed in this change
- The opt-in weighted optimizer now returns **up to five distinct four-slot combinations** instead of only its highest-scoring local solution. This is a real algorithmic extension, not a static reference list.
- **Unconstrained weighted objectives:** an integer-gram-weight dynamic program keeps the five best score-prefixes at each exact occupied weight. This is exact because every future suffix adds the same score and weight to all prefixes sharing the same state.
- **Multi-metric minima/maxima:** exact bounded branch-and-bound retains five complete solutions and prunes on the **fifth** score only after five candidates exist. It respects locks, disabled slots, exclusions, per-metric limits, minimum Poise, reserved equipment and strict light/medium/heavy load thresholds.
- Ranking rule: weighted **independent** score descending; exact occupied weight ascending; stable item ID signature ascending. Community resistances and Poise sum; each damage-negation type uses the explicitly documented negative-log transform and reconstructs multiplicative percent totals.
- A hard worker budget still **fails closed**. Exceeding the node cap never returns partial results labelled as exact. The UI exposes the scored ranking and displays the algorithm's local-only caveat.

## Regression contract
- `tests/armor-weighted-top-five.test.mjs` compares all five ranks against an independent four-slot brute-force enumeration across three load tiers and multiple objectives, including negative input negation values.
- Additional oracle cases cover joint upper/lower bounds, reserved equipment, disabled and locked slots, the original top-one API, invalid topK and bounded-search exhaustion.
- Existing site-verified source-field intersection and the 2026-11-02 baseline closure remain unchanged: **do not re-audit** 487 weights / 568 historic armor / 18 spell cases.

## Explicit NOT certified
The score function above is independently defined, **not** Tarnished.dev's unpublished 13-metric scoring algorithm. This PR does not add missing DLC armor candidates, replicate site tie/rank order, or establish external same-input top-five numeric parity. The entire Armor Optimizer remains **NOT_PARITY_CERTIFIED**, while the new local weighted top-five may pass its separate algorithmic test gate.

No paid API, backend, server, synthetic source fields or extra indexable URL is added. `/armor-optimizer/` remains noindex.
