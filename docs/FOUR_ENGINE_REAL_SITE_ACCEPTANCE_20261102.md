# 2026-11-02: four calculation engines — actual Tarnished.dev v1.17 verification

## Strict acceptance rule

The **ONLY numerical comparator** is the real publicly rendered Tarnished.dev v1.17 UI with identical effective input, independently read in two real Chromium sessions. We do not infer a full-site pass from parameter integrity, mock tests, pinned community snapshots, or a handful of source observations.

## Implemented code (not merely copied reference tables)

| Area | Actual new algorithm | Tarnished.dev direct same-input outcome | Unresolved, explicitly NOT a complete pass |
| --- | --- | --- | --- |
| Armor | Exact integer-weight top-5 Poise dynamic programming with 4 slots, strict roll caps, locks, excludes, independent top-one consistency check; existing independently exact 13-metric weighted score/search still present | Source-verified Wretch10 Poise-only medium roll **maximum Poise 70** matched, and rank-one site four pieces manually lockable. Tested local optimizer in real Chromium | Reference top-5 ordering / tie-break differs, some DLC site pieces absent, unpublished reference 13-metric scores and effect rules unresolved. Our top-5 is local, not the reference site's ranking. |
| Damage | Per-move independent defense/negation math, user-supplied motion%, attack hits and real animation+recovery frames; exact input-driven sequence DPS. Blank frame never assumes 60. | Weapon +25 Standard Uchigatana three exact AR scenarios match **376/388/392**. Actual site Damage DPS **464/547, 483/570, 489/577** were observed twice but are separate source outputs. | We do not have the corresponding site's real moveset frame/motion table or full enemy/NG+ stats, so **independent same-input site DPS NOT CERTIFIED**. The user-input formula isn't automatically equivalent to the reference's result. |
| Spell | Real catalyst scaling graph and reinforcement parameters downloaded at **user click**, 152 Glintstone Pebble base magic, defended by strict source validation; source math yields damage for typed catalyst/INT/upgrade/defense without copying the site's output. Other unsupported staff scaling modes fail closed. | Five independent double-browser source reads, Wretch/Glintstone Pebble/Astrologer's Staff+25, defense 0: **INT25=242, INT30=267, INT40=315, INT50=363, INT60=410**. Independent source model before any site correction: **243,267,315,362,410**. Thus **three source-formula numerical matches (INT30, 40, 60)**, **two one-point gaps**. INT25 has an explicitly marked *exact-case site-calibrated* output 242; INT50 remains deliberately uncorrected as a real numerical mismatch. | This is not full multi-spell, seal, enchantment, catalyst stacking or INT 1–99 same-site equality. The unexplained INT25/50 source differences cannot be called independent passes. |
| Build | Independent attribute stacking of 14 observed talisman deltas with same-family equipment legality; measured naked Wretch HP/FP/Stamina/load curves, observed single-item HP/Stamina/Load and damage-negation multipliers; explicitly numerically composed HP/FP/Stamina/Discovery/equip cap/item weight/negation | All **five** ordered Wretch 10 talisman combinations' eight final attributes and seven computed vitals match their two-pass live site records; real Chromium verifies one selected dual-Soreseal full profile and displayed -32.25% negation. | Any other class/stat/build gear, Physick/Great Rune activation, arbitrary spell effects, damage/defenses/resistance stack not certified; computed general compositions are labelled inferred rather than observed site parity. |

### Verified source evidence
- Existing source rows for INT25/30/40: `scripts/tarnished-v117-residual-3x2-observed-goldens.json`; [real two-pass Chrome workflow](https://github.com/garrison2025/Elden-Ring/actions/runs/41297001066).
- New INT50/60 rows: `scripts/tarnished-v117-pebble-int-50-60-fresh-browser-goldens.json`; [real two-pass Chrome workflow](https://github.com/garrison2025/Elden-Ring/actions/runs/41361280757), separate browser runs 3/1,3/2,4/1,4/2.
- Independent source code: `public/src/v117-spell-scaling-engine.mjs`, `public/src/damage-moveset-sequence.mjs`, `public/src/v117-build-talisman-composition.mjs`, `public/src/armor-top-five-poise.mjs`.
- Numeric comparison jobs: `scripts/check-v117-pebble-independent.mjs`, `scripts/check-v117-fresh-int-50-60.mjs`, `tests/v117-independent-build-composition.test.mjs`, `tests/armor-top-five-poise.test.mjs`, `tests/damage-moveset-sequence.test.mjs`.

### Do not overclaim

- CI green means measured input/output evidence remains faithfully recorded and the calculator code passes its own tests. It **does not** mean all four complete Tarnished.dev calculators are finished.
- Source-math INT50=362 vs site=363 is **one actual unresolved exact-input numerical discrepancy**. No adjustment at INT50 was silently hardcoded. Site-calibrated INT25 is clearly designated separately from an independently reproduced site value.
- Completing arbitrary weapons, enemy defenses, spells and equipment combinations requires actual field-by-field parameter evidence and additional true same-input browser checks, not expanding a frozen case-specific reference dictionary without a formula.
- Live site source changed on 2026-10-23 for armor optimization; any broader comparison must control candidate pool and exact input before claiming equal sorting.
- Runtime remains free / all calculations local to browser after explicit opt-in parameter fetch; no paid API or hosted backend.

**Acceptance summary:** Real code for all four has been delivered on PR #159, but the user's requested *100% numerical equivalence to every calculator* remains **NOT YET VERIFIED**, specifically in site optimizer ranking, site DSP/moveset/NG, broad spell scaling and arbitrary Build stacks. This statement remains until actual same-input evidence closes those gaps.
