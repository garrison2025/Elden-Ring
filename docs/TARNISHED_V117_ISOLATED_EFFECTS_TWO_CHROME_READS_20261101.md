# Public v1.17 real Build isolated talisman / Great Rune / Physick effects — 2026-11-01

Two INDEPENDENT actual Chromium sessions per case, all Wretch 10×8, no other gear/effects. [Live evidence run](https://github.com/garrison2025/Elden-Ring/actions/runs/41289643394), two jobs per kind:

| Single selected item (exact visible name) | Observed after selection | Item weight | Activated-checkbox observation | Evidence job IDs |
|---|---|---|---|---|
| Starscourge Heirloom, 1 talisman | STR = 15, other stats 10 | 0.8 | No activation switch for talisman | 124798010798, 124798010663 |
| Godrick's Great Rune, 1 rune selected | 15 in all eight stats | 0 | Activate Great Rune checkbox visibly **false** despite changed attributes | 124798010836, 124798010915 |
| Intelligence-knot Crystal Tear, 1 selected tear | INT = 20, other stats 10 | 0 | Activate Physick checkbox visibly **false** despite changed attributes | 124798010824, 124798010834 |

**Hard distinction**: These are real reference-site **selected-item output** observations, NOT game-client active state, actual rune-arc consumption, Physick activation, stackability, timed effects or damage/defense formulas. The reference shows changed stats even with the UI toggle off; don't claim the activation mechanic is verified. No other talisman, rune or tear coefficients were inferred from names or borrowed from other websites.

Implementation: `public/src/v117-isolated-effect-goldens.mjs` has exactly those three proven numerical changes; `public/src/v117-selected-build-effects.mjs` only directly certifies the exact Wretch 10 baseline, or arithmetic-only preview with unverified mixed conditions, with a stat-cap fail gate. No bonuses are silently applied to HP, AR, enemy defense, spells or all-equipment totals.

**Talisman weight correction**: A chosen Starscourge Heirloom has a source-confirmed 0.8 weight and is now counted. Other named talismans without individual verified source weight are UNKNOWN; they cannot silently be treated as weightless or produce an exact equip load.
