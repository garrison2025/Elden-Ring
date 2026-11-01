# Real Wretch Build defensive-stat data — direct cases vs inferred estimates

Source evidence: eight axis shards [41286665550](https://github.com/garrison2025/Elden-Ring/actions/runs/41286665550), seven levels 90–713 shards [41287082373](https://github.com/garrison2025/Elden-Ring/actions/runs/41287082373), 16 independently held-out mixed builds from four actual Chrome jobs. All source rows had the final eight Wretch stats, no gear/active effect, Poise 0 and zero worn gear checked before their ten numeric defense/resistance/Discovery values were accepted.

- 720 Wretch one-axis profiles: `public/src/v117-wretch-defense-one-axis-direct.mjs`.
- 624 distinct Wretch full-level profiles: `public/src/v117-wretch-level-direct.mjs`. There were 6 duplicate border profiles, and **all six agree numerically and on full input**.
- 16 independent mixed Wretch exact real-site profiles: `public/src/v117-wretch-holdout-direct.mjs`.
- 4 old mixed real-site profiles: `scripts/tarnished-v117-derived-four-observed.json`.

**Important non-equivalence**: a naive sum of *integer* attribute deltas on top of a *rounded* level base was independently held out against 160 site cells (16×10). It matched 142/160 exactly, and the other 18 cells differed by ±1. Therefore the additive integer decomposition CANNOT be certified as exact for arbitrary mixed builds; it requires separate fractional correction or an actual typed game version source. Do not call an unobserved mixed prediction directly verified. Preserve true directly observed profiles and show provenance accurately. Neither buffed/talisman/rune/armor effects nor alternative character origins are part of these Wretch profiles.
