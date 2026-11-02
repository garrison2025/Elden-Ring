# Tarnished.dev v1.17 Spell: repaired 1-point source-model differences with a SINGLE mathematical pipeline

**Result:** the independent local Glintstone Pebble model now matches **18/18** twice-observed actual public Tarnished.dev v1.17 same-input results. The original 17 double-observed Chromium cases were captured in [run 41362826940](https://github.com/garrison2025/Elden-Ring/actions/runs/41362826940); the 18th (INT 20) in [run 41362855674](https://github.com/garrison2025/Elden-Ring/actions/runs/41362855674). Wretch, other 7 stats = 10, Astrologer's Staff +25, Glintstone Pebble, no effects, default 0 target defense and negation.

## Verified cause and exact fix

The old local arithmetic calculated from floating-point catalyst scaling until the final step and then used `Math.floor`, yielding 1-point discrepancies at 25, 35, 50, 98 INT. Inspection of **publicly served Tarnished.dev v1.17 application assets** showed two numerical steps missing locally:

1. **Truncate the catalyst sorcery scaling to an integer before using it as spell attack strength.** `S = Math.trunc(100 * [1 + reinforcementINTScaling * catalystINTCorrection * scalingCurve(INT)])`.
2. Multiply `S` by the Glintstone Pebble's spell attack coefficient `152/100`, apply the documented 0-defense factor `0.9`, and **round the final damage to the nearest integer**, not down. `Math.round(S * 1.52 * 0.9)`.

The actual implementation uses the user's **explicitly loaded and pinned** v1.17 staff parameters and the transparent independent enemy-defense math for nonzero defenses. The site only confirms **zero enemy defense and negation** for these 18 public scenarios. No per-INT golden overrides or previous INT25 site-calibration remain in the engine.

### Exact former one-point cases

| INT | Actual Tarnished.dev v1.17 | Previous unadjusted model | Corrected independent model | Match |
|---:|---:|---:|---:|---|
| 25 | 242 | 243 | **242** | Yes |
| 35 | 290 | 291 | **290** | Yes |
| 50 | 363 | 362 | **363** | Yes |
| 98 | 499 | 500 | **499** | Yes |

The other 14 previously observed INT inputs also match. A 17-case local fixture test recomputes each result from the exact pinned source curve parameters, and the CI workflow additionally downloads the actual pinned community catalyst JSON and recomputes all 17 cases without hardcoded damage. The INT20 reference match independently covers the eighteenth case.

## Reproducible acceptance

- `public/src/v117-spell-scaling-engine.mjs` — one general intermediate truncation + final-rounding pipeline.
- `scripts/tarnished-v117-spell-17-double-observed-goldens.json` — 17 raw real-site records, never overwritten.
- `scripts/check-v117-pebble-independent.mjs` and `.github/workflows/v117-stage-accurate-spell-parity.yml` — actual user-pinned v1.17 source fetched and all 17 vs source site compared.
- `tests/v117-spell-unified-17-reference.test.mjs` — exact source schema and mathematical unit tests, explicit four known former mismatches.
- `scripts/smoke-browser.mjs` — actual Chrome UI testing INT25, 35, 50, 98 and behavior of unverified INT51.
- The historic files documenting the OLD model's +1/-1 discrepancies remain unchanged as audit evidence. Their old formula numbers are not to be relabeled as newly observed site data.

## What is NOT claimed

This verifies **18 same-input public-site observations for one Astrologer's Staff +25 and Glintstone Pebble setting**; it does **not** certify all spells, catalyses, reinforcement levels, nonzero enemy defenses, Great Runes, sorcery-specific passive buffs or changes after v1.17. Nor does it resolve separate Armor Optimizer ranking, enemy/moveset DPS or arbitrary Build effects. All unobserved contexts remain clearly marked not same-input reference verified.
