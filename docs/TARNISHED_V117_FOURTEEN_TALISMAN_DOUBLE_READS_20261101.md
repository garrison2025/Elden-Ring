# 14 talismans — twice-direct real v1.17 Wretch selected-item baseline

**Actual source and provenance:** public Tarnished.dev v1.17 Build Planner, eight independent browser jobs: [run 41290440069](https://github.com/garrison2025/Elden-Ring/actions/runs/41290440069). Four named-item shards × two independent passes, **28 actual selected-item scenes**. The exact same-name item was selected in a newly loaded Wretch 10×8 with no weapons, other talismans, armor, Great Rune or Physick. Each of the two different browser executions captured eight final attributes, HP, FP, stamina, discovery, physical/magic defenses, four resistances, eight actual damage negations, talisman weight and max equip load. All **14 item pairs agreed exactly on every captured field**, not just attribute bonuses.

| Actual selected talisman | Verified weight | Wretch 10 attribute change | Other directly displayed Wretch10 reference values |
|---|---:|---|---|
| Starscourge Heirloom | 0.8 | STR +5 | No other change in baseline HP/FP/Stam |
| Prosthesis-Wearer Heirloom | 0.8 | DEX +5 | No other change in baseline HP/FP/Stam |
| Stargazer Heirloom | 0.6 | INT +5 | No other change in baseline HP/FP/Stam |
| Two Fingers Heirloom | 0.6 | FAI +5 | No other change in baseline HP/FP/Stam |
| Radagon's Scarseal | 0.8 | VIG/END/STR/DEX +3 | HP 476; Stamina 101; max equip load 52.9; all eight displayed damage negations -10% |
| Radagon's Soreseal | 0.8 | VIG/END/STR/DEX +5 | HP 522; Stamina 105; max equip load 56.1; all eight displayed damage negations -15% |
| Marika's Scarseal | 0.8 | MND/INT/FAI/ARC +3 | FP 88; Discovery 113; all eight displayed damage negations -10% |
| Marika's Soreseal | 0.8 | MND/INT/FAI/ARC +5 | FP 95; Discovery 115; all eight displayed damage negations -15% |
| Erdtree's Favor +2 | 1.5 | None of eight changed | HP 430; Stamina 105; max equip load 52.0 |
| Viridian Amber Medallion +2 | 0.3 | None of eight changed | Stamina 110 |
| Crimson Amber Medallion +2 | 0.3 | None of eight changed | HP 447 |
| Arsenal Charm | 1.5 | None of eight changed | Max equip load 55.4 |
| Great-Jar's Arsenal | 1.5 | None of eight changed | Max equip load 57.3 |
| Silver Scarab | 1.2 | None of eight changed | Discovery 185 |

The actual full numeric rows and two source job IDs per item are preserved in:
- `public/src/v117-talisman-isolated-part-a.mjs`
- `public/src/v117-talisman-isolated-part-b.mjs`
- `public/src/v117-talisman-isolated-matrix.mjs`

**Scope:** These are reference-site exact naked Wretch 10 **single-selection results**. They are not evidence of global talisman stacking/compatibility, mixed-class/level effects, active gameplay, PvP, damage coefficients, additive/percent mechanics, or 1.17.3 game-client equivalence. Particularly, no measured Wretch 10 output should be copied as HP, FP, stamina, discovery, max load or damage negation for another input or when multiple pieces are selected.

**Implementation:** The Build Loadout now shows these exact figures ONLY for the same item and no other effect on Wretch all 10. Other settings are at best isolated arithmetic attribute previews, labeled as non-parity. All fourteen exact individual weights count toward total equipment load; an unknown named talisman blocks a mathematically exact load tier instead of being treated as weight zero. The previously verified Godrick Great Rune/Intelligence-knot Crystal Tear selection-checkbox discrepancy remains explicitly disclosed, without falsely claiming active effects.
