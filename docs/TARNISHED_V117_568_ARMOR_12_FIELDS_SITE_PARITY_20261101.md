# Tarnished.dev actual armor damage-negation and resistance field audit (2026-11-01)

**Only numeric comparison standard:** [Tarnished.dev real public Build Calculator v1.17](https://www.tarnished.dev/build-planner). No community-sourced old armor numbers were used as a gold standard.

[All 15 shards × two independent real Chromium runs](https://github.com/garrison2025/Elden-Ring/actions/runs/41275364824). The same verified input method and 568 candidate records as the completed [543/568 Weight + Poise audit](TARNISHED_V117_568_ARMOR_WIDE_DIRECT_EVIDENCE_20261101.md) were used, with 12 additional rendered final-character fields:

- Eight damage negations: Physical, Strike, Slash, Pierce, Magic, Fire, Lightning, Holy.
- Four resistances: Immunity, Robustness, Focus, Vitality.

| Acceptance tier | Result |
|---|---:|
| All legacy armor names attempted as actual UI selections | **568** |
| Actual selectable items whose 12 displayed fields agreed on both independent reads | **543** |
| Total independently repeated visible field values | **6,516 = 543 × 12** |
| Of those, items with **unchanged eight final character stats** | **514** |
| Per-piece field values safe to derive from same Wretch baseline | **6,168 = 514 × 12** |
| Items that modify character attributes, NOT accepted as general per-piece armor values | **29** |
| Site-unobservable/ambiguous item selections | **25** |
| Malformed or missing numeric values in the 514 stat-neutral items | **0** |

## Exactly how the 514 × 12 safe per-piece values are derived

- Wretch base attributes 10/10/10/10/10/10/10/10, no other equipment, Great Rune, Physick, or active buffs. This is an exact-input comparator, not a claim of all-game-context parity.
- The observed eight **damage-negation baseline values are zero**, so a single worn stat-neutral item yields its displayed site negations directly. Values may be signed for items with negative defense (e.g., Scarabs).
- Four base-character resistance inputs were independently measured as **Immunity 90, Robustness 90, Focus 90, Vitality 100**. A single stat-neutral armor piece yields its additive resistance contribution as the observed site value minus the matching baseline.
- The two browser runs must show **exactly the same output and baseline** on each field. Any malformed/absent field would be rejected, never zero-filled.
- The extra safety check explicitly compares all eight final character attribute outputs before and after each armor is selected. For **29 stat-modifying items**, no per-piece defense/resistance override is accepted even though their 12 complete *contextual Wretch outputs* were also observed twice.
- The original 25 items with invalid/missing direct site selection remain unverified.

## Integration with the real site

The existing user-initiated armor source fetch now uses **Tarnished.dev-only numeric overrides**: Weight + Poise from 543 directly observed items, plus 12 additional defense/resistance values on 514 no-stat-change armor items. Item IDs, slots, names and numeric provenance are checked; the other 29 items and the 25 unavailable items retain source-only values with no claim of site agreement.

`public/src/tarnished-v117-armor-12-fields.mjs` contains **only** 514×12 derived numeric values that meet the above two-pass acceptance. The full contextual site observations and excluded-item evidence are recorded in `scripts/tarnished-v117-armor-12-metric-site-observations.json`; no other site's numbers are used as the numeric pass/fail standard.

**Not covered:** character-altering equipment interaction across different base attributes, full four-piece armor optimizer best-combination parity, spell/buff effects or selected-enemy actual damage. These require independent exact-input public-site output comparisons. Production web indexing and data usage rights are separate from numeric acceptance.
