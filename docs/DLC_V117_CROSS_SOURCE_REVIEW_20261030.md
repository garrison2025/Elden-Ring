# DLC community reference vs raw pinned v1.17 sources — 2026-10-30

Data sources: (1) 102-row selected DLC references in `public/data/community-weapon-catalog.json`, individually attributed to wiki.gg category/per-item references; (2) public v1.17 parameters at `ThomasJClark/elden-ring-weapon-calculator` commit `3539d87e446f3b9d5b94157f8a2023e28ffea7d2`. This is **two source snapshots**, not independent current in-game validation.

All **102** DLC names matched one uninfused or unique weapon record by exact normalized name. At +0, source `attack` pairs are the **pre-reinforcement values**: compare community +0 facts to `rawAttack * reinforceTypes[reinforceTypeId][0].attack`. A naive comparison against `rawAttack` alone produces false discrepancies (e.g., shields). Once this correction is made, six +0 attack differences and one requirement difference remain.

| DLC weapon | Community +0 physical / other element | Pinned v1.17 +0 physical / other element | Status |
| --- | --- | --- | --- |
| Fire Knight's Shortsword | 75 physical, 32 fire | 75 physical, 22 fire | +0 source disagreement |
| Greatsword of Radahn (Light) | 129 physical, 83 magic | 127 physical, 82 magic | +0 source disagreement |
| Greatsword of Radahn (Lord) | 129 physical, 83 magic | 127 physical, 82 magic | +0 source disagreement |
| Queelign's Greatsword | 117 physical, 35 fire | 122 physical, 36 fire | +0 source disagreement |
| Smithscript Axe | 133 physical | 131 physical | +0 source disagreement |
| Smithscript Dagger | 67 physical | 62 physical | +0 source disagreement |
| Madding Hand | Requirements STR8/DEX8/INT13/FAI13 | Requirements STR8/DEX8/INT13/FAI20 | Requirement source disagreement |

No community data was silently overwritten. The seven catalog records have review flags and front-end caution messages. They **cannot be deemed fixed** by the 13,184-case formula parity pass (that pass compared two algorithms using the SAME v1.17 parameters). Verify patch-specific game files and matching in-game equipment screens before selecting one side as authoritative.

`npm run audit:real-v117` now also compares the whole selected DLC inventory to the pinned source during GitHub Actions. It outputs only anonymized counts to `.audit/v117-catalog-source-review.json`. New or stale conflict flags fail the audit rather than silently producing authoritative values. No game source data is committed or redistributed.

Source: https://github.com/ThomasJClark/elden-ring-weapon-calculator/blob/3539d87e446f3b9d5b94157f8a2023e28ffea7d2/public/regulation-vanilla-v1.17.js
