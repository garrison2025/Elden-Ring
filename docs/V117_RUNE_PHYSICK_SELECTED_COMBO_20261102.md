# Build selected Great Rune + Physick, twice checked, 2026-11-02

[Real browser comparison](https://github.com/garrison2025/Elden-Ring/actions/runs/41368151680) recorded **two independent** real Tarnished.dev public v1.17 Build sessions. Each started Wretch with exactly eight 10s and no other equipped items, then selected Godrick's Great Rune and Intelligence-knot Crystal Tear. Both returned final eight attributes **15/15/15/15/15/25/15/15** with weight 0 and poise 0, matching independently summed original isolated effects **+5 to each attribute and +10 more Intelligence**.

**Critical limitation:** Both reference **Activate Great Rune** and **Activate Physick** checkboxes remained OFF even after attempted activation; the observed change is a reference site's *selected-item display state* and CANNOT certify active in-game buffs or activation semantics. A fail-closed exact-case helper now exposes only the direct Wretch10 selected-items scenario. Other classes, stats, equipment, multipliers, HP, AR, defenses, effect durations and arbitrary stacks remain unsupported without same-input evidence.

Existing 487 weapon/568 armor base records and 18 original Astrologer's Staff cases are untouched.
