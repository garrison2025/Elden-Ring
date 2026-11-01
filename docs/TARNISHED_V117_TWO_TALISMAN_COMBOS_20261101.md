# Two-talismans: actual Tarnished.dev public v1.17 paired-item reference (2026-11-01)

Reference evidence: [real Chromium run 41291784868](https://github.com/garrison2025/Elden-Ring/actions/runs/41291784868). Exactly four ordered pair scenarios × two independent new Chromium sessions (eight successful jobs). Every job opened naked Wretch eight base stats 10, no armor, weapons, Great Rune or Physick; clicked both real visible talisman options sequentially; checked both selected label identities; read the intermediate and final eight displayed attributes, load, max load, HP, FP, stamina, Discovery, 8 damage-negation fields and 4 resistances. ALL eight jobs succeeded, paired final outputs matched exactly within each of the four pairs.

| Selected talisman sequence (order is part of source evidence) | Final base stats | Equipped weight | Max equip load | HP | Stamina | Physical negation |
|---|---|---:|---:|---:|---:|---:|
| Starscourge Heirloom + Radagon's Scarseal | VIG13/MND10/END13/STR18/DEX13/INT10/FAI10/ARC10 | 1.6 | 52.9 | 476 | 101 | -10% |
| Radagon's Scarseal + Marika's Scarseal | all 8 stats 13 | 1.6 | 52.9 | 476 | 101 | **-21%** |
| Great-Jar's Arsenal + Erdtree's Favor +2 | all 8 stats 10 | 3.0 | **61.9** | 430 | 105 | 0% |
| Crimson Amber Medallion +2 + Erdtree's Favor +2 | all 8 stats 10 | 1.8 | 52.0 | **465** | 105 | 0% |

**Important real finding:** Two individual -10% Scarseal damage-negation readouts combined into a reference display of -21%, not -20%. This is consistent with multiplicative *remaining damage* (1.1×1.1 = 1.21), but **only this explicit two-item pair was independently double-read**; the rule is not automatically extended to all sources, affinities, buffs, enemy effects, or undocumented controls.

Frozen numerical data in `public/src/v117-selected-talisman-pair-direct.mjs` include all eight combined attribute fields, twelve displayed negation/resistance values, HP/FP/stamina/discovery/defense values, weight/max load and two actual job identifiers for each. `public/src/v117-selected-pair-preview.mjs` refuses a 'direct source' badge for any origin except Wretch, any stats other than eight 10, any other equipped item/spell/rune/Physick, another talisman, different order or different names. The ordinary individual-item preview remains separate and is NOT a claim that source effects generically stack.

**Not covered**: other two-item talisman combinations, three/four talisman setups, permutations, Stat 99 caps, game client 1.17.3, real activation/expiration, exact PvP/enemy defense/spell damage, and the competitor's unpublished armor scoring. These remain non-parity until direct numeric evidence exists. No paid API, game assets or licensed third-party data were imported.
