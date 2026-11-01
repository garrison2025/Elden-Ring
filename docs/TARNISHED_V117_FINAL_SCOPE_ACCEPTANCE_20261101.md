# Tarnished.dev v1.17 — complete scope-accounting and actual numeric acceptance status
Date: 2026-11-01. Production: https://elden-ring-5i9.pages.dev
Reference: https://www.tarnished.dev (public version marker v1.17).

## This is a FINITE AUDIT of observed work, NOT 100% numerical parity

Never translate a passing CI run, a working frontend, a real reference row, or identical total Poise into a blanket claim of equivalence. The baseline remains Tarnished.dev public v1.17 under matching class, 8 base stats, actual selected item, reinforcement, grip, gear weight, constraints, enemy, NG, active effects and published result. Its Damage and Spell views are self-described as incomplete/experimental. v1.17 public-site parity is **not** the same as independently verified game client regulation 1.17.3 parity.

| Area | Actual evidence | What passed | What has NOT passed / cannot be asserted |
|---|---|---|---|
| Original weapon source | 487 source-weight cases, 460+ requirements, validated AR cases and exact Icerind float edge from prior CI | accepted previously validated fields only | All possible affinity/upgrade/stat/buff combinations, game-client proof |
| Original armor | 568 legacy entries, 549 unique Weight+Poise double-reads | 549 original site-derived Weight+Poise | The other 19 entries are not selectable / duplicate / wrong-slot, not fake mismatches |
| Original neutral armor attributes | 514 original standalone entries × 12 stats | 514 original 12-field site observations | Stat-changing armor conditional effects and other non-neutral cases |
| Separately verified DLC | Circlet of Light, 1.0 Weight, 5 Poise; Gravebird Bracelets 1.7 Weight, 3 Poise | Both DLC Weight+Poise independently twice-read; **551** total directly verified Poise candidates | Full DLC catalog missing; Circlet’s other 12 isolated armor fields remain unknown because it changes attributes |
| Gravebird 12 properties | Two separate actual Chrome jobs, 2026-11-01, run 41285823650 | Physical/Strike/Slash/Pierce/Magic/Fire/Lightning/Holy = 1.6/1.7/1.7/1.5/2.1/1.9/2.3/2.3%; Immunity/Robustness/Focus/Vitality = +17/+8/+13/+12. **515** total complete 12-field candidates | Contextual equipment buff effects / downstream combat outcomes |
| Poise-only armor optimizer | Same Wretch 10/10 baseline, normal roll, maximum load 48.176, zero reserved, 13 non-Poise multipliers 0 | Exact real reference **70 Poise**; local source solver **70**; local best 33.3 weight. The reference’s rank 2 with Gravebird/Circlet/Tree Sentinel 33.3/70 is now constructible and covered by synthetic combination regression | Reference order/ties still DIFFER: its rank 1 Preceptor Gloves 33.7/70; local optimum currently Godskin Noble Bracelets 33.3/70. Full identical candidate and sort/score behavior **NOT certified** |
| Weighted 13-metric optimizer | Independent declared log-negation plus additive resistance/Poise objective, min/max per attribute, locks, excludes, strict roll cap | Pure functional exact optimizer, bounded search, regression brute force, browser Worker click end-to-end | **Not** the unpublished reference weighted scoring or tie-breaking. Missing full candidate pool and reference-default maxima equality |
| Build base vitals | 360 direct numerical base readings: VIG/MND/END 10..99, no items | HP/FP/Stamina/display load shown and tested in real browser | Under-10 inputs and arbitrary buffed/gear-equipped final defense/resistance/catalyst values |
| Isolated Build attribute effect | Circlet of Light, public Wretch eight base 10 and other slots empty | INT/FAI/ARC each +1, twice directly observed; source-identity-gated preview | All other armor, talisman, Physick, active spell and Great Rune stack combinations |
| Damage AR example | Wretch STR15 DEX20 others 10, Standard Uchigatana +25, no effect; direct reference row | **376 reference AR = 376 independent pinned v1.17 AR calculation**, delta zero | Reference DPS 464/547 displayed but real attack animations/frame time & per-moveset damage not modeled, as are enemy+NG/PvP/poise/motion |
| Spell example | Wretch INT25 others 10; Astrologer's Staff + Glintstone Pebble; zero-defense enemy, default reinforcement | Reference public row genuinely observed: magic **242**, FP **7**, bullet count **1** | No independent production staff scaling + exact spell coefficient model; 242 has **not** been reproduced by our site's own algorithm |
| Remaining source data | Audited pinned external library of 169 spells, 87 talismans and 221 bosses/creatures | Roster/FP cost/requirements metadata as reported, and explicit missing-field inventory | Zero authoritative structured spell motion/damage multipliers, zero numeric talisman stacking coefficients, zero enemy defense/negation fields from that source. This makes general damage/spell parity UNPROVABLE from current inputs |

## Exact DLC numeric evidence

Two independent Weight+Poise browser jobs: [run 41285325858](https://github.com/garrison2025/Elden-Ring/actions/runs/41285325858), jobs 124785346388 and 124785346531. Both saw Gravebird Arms / 1.7 / 3 with all eight Wretch final attributes unchanged.

Two independent 12-field browser jobs: [run 41285823650](https://github.com/garrison2025/Elden-Ring/actions/runs/41285823650), jobs 124786798063 and 124786798232. Both saw exactly the same four Wretch baseline resistances (90,90,90,100), then (107,98,103,112) after equipping, with eight baseline damage negations all zero and eight equipped negations exactly 1.6/1.7/1.7/1.5/2.1/1.9/2.3/2.3.

Source and tests: `public/src/tarnished-v117-dlc-gravebird.mjs`, `tests/armor-gravebird-direct-v117.test.mjs`. Both are constrained to the exact proven scenario; do not infer any weapon/catalyst/active effect from these observations.

## Original 19 unsupported records are accounted for, NOT quietly verified

- Brave's Battlewear (2), Brave's Bracer, Brave's Cord Circlet, Brave's Leather Helm, Brave's Legwraps: six previous-source rows unavailable in the actual site selector.
- Ragged Armor (2), Ragged Gloves, Ragged Hat (2), Ragged Loincloth: six unavailable old names.
- Deathbed Smalls, Golden Prosthetic, Grass Hair Ornament, Millicent's Gloves, Old Sorcerer Legwraps: five other unavailable names.
- Champion Gauntlets and Redmane Knight Helm (Arms): duplicates/miscategorized against the actual site source.

The source-only entries remain excluded in site-verified mode. Their absence is not a regression that can be repaired by inventing numeric goldens.

## Acceptance rule before anyone declares FULL parity

FULL parity would require all of the following, and **NONE is currently met in full**:
1. All selectable base+DLC armor candidates with standalone site-verified slot/weight/Poise and 12 metrics; stat-changing pieces tracked by separately observed context.
2. Same-input 13-metric combined optimization score, every bound and 5-row rank/tie order under the same candidate pool, and roll/weight adjustments from effects.
3. Build full equipment, passive, active buff, Physick, rune effect cross-product, defenses, resistances and stacking.
4. Damage all enemy/NG/moveset/PvP paths using versioned typed defense/negation and frame-data sources, with actual numeric sample agreement beyond AR.
5. Spell/catalyst scaling and all spell coefficients, status/passive combinations with independent numerical reference rows.

**Decision: partially verified, NOT all checked/finished.** No unsupported upstream code/game assets/data imported solely to make these gates appear complete. A larger public third-party project advertises many of these tables but its GitHub repository does not declare a license; neither redistribution rights nor Tarnished.dev version equivalence may be presumed.

## References in this repository

- `docs/TARNISHED_REMAINING_LIVE_COMPARE_20261101.md`: real optimizer results and missing candidate pool.
- `docs/TARNISHED_REMAINING_DERIVED_AUDIT_20261101.md`: 360 base readings and 4 observed Build defense cases.
- `docs/TARNISHED_DAMAGE_SPELL_LIVE_TABLE_AUDIT_20261101.md`: actual weapon/spell row selection and observed figures.
- `docs/TARNISHED_GRAVEBIRD_TWO_DIRECT_READS_20261101.md`: newly verified DLC metrics.
- `docs/SPELL_TALISMAN_ENEMY_PINNED_SOURCE_COVERAGE_20261101.md`: exact missing source data.
- `docs/TARNISHED_V117_REMAINING_ONLY_FINAL_AUDIT_20261101.md`: the 19 unsupported legacy armor identities and the Icerind precision boundary.
