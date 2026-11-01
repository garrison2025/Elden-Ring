# Tarnished.dev remaining comparison — 13-metric weighted local solver (2026-11-01)

**New implementation:** `public/src/armor-weighted-optimizer.mjs` and a second, optional weighted mode in `/armor-optimizer/`. Existing single-metric optimizer and verified 70-Poise reference are unchanged.

- Thirteen selected metrics may each carry a nonnegative multiplier, optional minimum and optional maximum. Combined negation bounds apply to the multiplicative whole-set value; resistance/Poise are additive. Minimum Poise from the existing form is also enforced.
- Four slot locks / forced empties and exclusions are preserved, and roll caps remain strict 30/70/100%.
- Weights are **our explicit objective**, not a verified reconstruction of Tarnished.dev's unpublished 13-stat scoring algorithm. Negation score = multiplier × negative log of the per-piece surviving damage fraction; resistance / Poise score = multiplier × source points. Consequently the optimizer's score **MUST NOT** be presented as the Tarnished.dev result. Do not compare its default all-metric objective to the reference's default unless proven equivalent.
- A single-metric objective still uses the existing independently tested dynamic programming engine. Weighted no-extra-bound mode uses exact weight DP; mixed min/max mode uses exact branch-and-bound with a deterministic 1.5 million node budget (or smaller explicit test setting). If this bound is hit, an **error** is displayed, not a fabricated optimum.
- In the default 'site-verified' mode, only the intersection of individually double-read armor fields used by active multipliers or bounds is eligible. The 550 verified Poise rows are eligible for Poise-only objective; 514 stat-stable original rows for any non-Poise objective. `Circlet of Light` has independently double-read Weight/Poise only, plus verified INT/FAI/ARC +1; other numeric armor metrics are `null`.
- All 13-stat min/max semantics, scoring/ties and full DLC roster in the live Tarnished.dev comparator remain **NOT numerically verified as equal**. Other blockers: Build derived defense/resistances with equipment effects, conditional talismans/Physick/Great Runes, real enemy/NG/moveset damage, spell/catalyst scaling. The pinned community data has no authoritative current-version structured multipliers for those features. Any such number inferred from this data would be invented.

## Evidence and regression gates

See `tests/armor-weighted-optimizer.test.mjs` for exhaustive brute-force comparisons on mixed constraints (including simultaneous Poise/negation/Immunity bounds), strict equipment weight, unique slot locks, unknown-field exclusion, budget failure, and user-facing Worker integration. Earlier audits: `docs/TARNISHED_REMAINING_LIVE_COMPARE_20261101.md` and `docs/TARNISHED_REMAINING_DERIVED_AUDIT_20261101.md`. The test's synthetic items validate algorithm integrity, **not** competitor scoring parity.

Release requirement: `npm run check` and Chromium smoke must pass before merging. No licensed third-party asset or paid API is imported.
