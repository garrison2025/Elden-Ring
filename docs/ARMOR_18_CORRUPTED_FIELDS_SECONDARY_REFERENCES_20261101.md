# 18 remaining malformed armor source fields — secondary public reference audit

Date: 2026-11-01. Primary pinned source: deliton/eldenring-api commit `3d9cefcfcda7066796b9553825449039c2073926`. The original armor parser now correctly retains **41 valid negative negation percentages** (see PR #128) and still excludes **18 invalid or ambiguous source field labels**.

The following readings are from **a separate public armor site**, [tarnished.app](https://tarnished.app/armour), with direct per-item URLs. They are NOT proven to be from the exact same game regulation/build and must not be used to silently rewrite a broken primary source. Some conflict materially with its malformed candidate values.

| Pinned-source item | Missing field | Independent public value | Reading |
|---|---|---:|---|
| Blue Cloth Vest | Poise | **16** | [Source](https://tarnished.app/armour/blue-cloth-vest) |
| Fur Raiment | Physical negation | **6.1** | [Source](https://tarnished.app/armour/fur-raiment) |
| Gelmir Knight Armor | Magic negation | **10.9** | [Source](https://tarnished.app/armour/gelmir-knight-armor) |
| Champion Gauntlets (listed as Champion Bracers) | Strike negation | **2.1** | [Source](https://tarnished.app/armour/champion-bracers) |
| Godrick Knight Gauntlets | Strike negation | **2.9** | [Source](https://tarnished.app/armour/godrick-knight-gauntlets) |
| Godskin Noble Bracelets | Strike negation | **2.1** | [Source](https://tarnished.app/armour/godskin-noble-bracelets) |
| Haligtree Gauntlets | Strike negation | **2.9** | [Source](https://tarnished.app/armour/haligtree-gauntlets) |
| Nox Monk Bracelets (listed as Nox Bracelets) | Strike negation | **2.3** | [Source](https://tarnished.app/armour/nox-bracelets) |
| Sorcerer Manchettes | Poise | **1** | [Source](https://tarnished.app/armour/sorcerer-manchettes) |
| Sorcerer Manchettes | Vitality | **20** | [Source](https://tarnished.app/armour/sorcerer-manchettes) |
| Vulgar Militia Gauntlets | Strike negation | **2.1** | [Source](https://tarnished.app/armour/vulgar-militia-gauntlets) |
| Ash-of-war Scarab | Vitality | **26** | [Source](https://tarnished.app/armour/ash-of-war-scarab) |
| Bloodhound Knight Helm | Strike negation | **4** | [Source](https://tarnished.app/armour/bloodhound-knight-helm) |
| Blackflame Monk Greave (listed as Greaves) | Fire negation | **7.4** | [Source](https://tarnished.app/armour/blackflame-monk-greaves) |
| Godskin Noble Trousers | Fire negation | **6.5** | [Source](https://tarnished.app/armour/godskin-noble-trousers) |
| Nox Monk Greaves (listed as Nox Greaves) | Fire negation | **6.8** | [Source](https://tarnished.app/armour/nox-greaves) |
| Sorcerer Leggings | Poise | **3** | [Source](https://tarnished.app/armour/sorcerer-leggings) |
| Sorcerer Leggings | Vitality | **37** | [Source](https://tarnished.app/armour/sorcerer-leggings) |

## Why we must NOT automatically fill all 18

Several broken primary-source cells are **not** merely unambiguous typographical aliases:

- Blue Cloth Vest has `Pose:6` (a malformed primary label) but independent armor source displays Poise **16**, so `Pose` → `Poise` would silently publish an uncorroborated numerical error.
- Sorcerer Manchettes has `Death:17` and a blank `0` field; the independent armor source reports Vitality **20**, Poise **1**.
- Sorcerer Leggings has `Death:19` and a blank `0` field; independent site reports Vitality **37**, Poise **3**.
- Other primary source values are rounded or malformed (e.g. the other site reports 2.9 Strike while source incorrectly labels `StrEldenike:2`). A newly verified secondary decimal is **not** automatically equivalent to the original source's version/rounding scheme.
- Tarnished.app also lists individual 1.07 patch notes on some armor pages. These do not provide a credible universal Regulation 1.17.3 version guarantee.

## Engineering status

- Original source-level numerical completeness: **7,366 / 7,384** valid cells after PR #128, **18 unknown/malformed**.
- Distinct secondary public-site readings located: **18 / 18** (source-linked, not current-patch game goldens).
- Automatically substituted into production source: **0 / 18**. The parser continues to return `null` for all 18 instead of silently guessing, to prevent version/rounding/source conflicts.
- The CI script `scripts/audit-armor-18-secondary-triage.mjs` actively checks the 18 fields remain unknown in the original pinned source, and archives the separate research readings without duplicating the full 568-row community table.

**Next acceptance gate:** establish a current Regulation 1.17.3 versioned, reusable armor parameter source or original-game-menu screenshots for these exact 18 fields and systematically validate individual values before promoting them to a gameplay-certified output.
