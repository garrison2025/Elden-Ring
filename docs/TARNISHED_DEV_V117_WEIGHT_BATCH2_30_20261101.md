# Tarnished.dev v1.17 — 30 more directly repeated original-missing weapon weights (2026-11-01)

## Scope, comparator and exact evidence

Primary comparator: **the public website Tarnished.dev v1.17 Build Calculator**, not other community databases, not a simulated game client.

- Read only the rendered `Equip Load` input value for one selected weapon with character STR=60, DEX=60, INT=30, FAI=30, ARC=30, Smithing=0, Somber=0, Two-handed off, rune/physick off; no armor/talisman/other weapons.
- Compare to an empty build (0) and the same public Longsword control in left and right hands (both 3.5), which **both passed** in two independently opened Chromium reads.
- Verify the exact item, Standard affinity, non-empty numeric total AR and public v1.17 marker before treating a nonzero Equip Load value as an observed weight; a dropdown selection or zero load alone is insufficient.
- **Real two-pass primary-site log**: https://github.com/garrison2025/Elden-Ring/actions/runs/41257934288 — `total:30`, `weightObserved:30`, `sourceMissingObserved:30`, `notObserved:0`, `sameAsLocal:0`, `differentFromLocal:0`, all 30 `inputsConfirmed:true` and `COMPETITOR_WEIGHT_OBSERVED`. Both rounds independently checked exact source values.
- Exact candidate list is `scripts/tarnished-v117-weight-batch2-candidates.mjs`. Numeric observations are in `public/src/tarnished-v117-public-weights.mjs` with evidenceRun 41257934288; unit tests lock them to their source names and confirm the original community values remain NULL.

## All 30 direct v1.17 comparator observations

| Public-site weapon / shield | Original local community weight | Tarnished.dev v1.17 observed weight | Result |
|---|---:|---:|---|
| Bandit's Curved Sword | NULL | **5.0** | directly observed twice |
| Banished Knight's Shield | NULL | **6.0** | directly observed twice |
| Beast Crest Heater Shield | NULL | **3.5** | directly observed twice |
| Beastman's Jar-Shield | NULL | **5.0** | directly observed twice |
| Black Leather Shield | NULL | **3.0** | directly observed twice |
| Blue Crest Heater Shield | NULL | **3.5** | directly observed twice |
| Blue-Gold Kite Shield | NULL | **5.0** | directly observed twice |
| Blue-White Wooden Shield | NULL | **2.0** | directly observed twice |
| Briar Greatshield | NULL | **8.5** | directly observed twice |
| Buckler | NULL | **1.5** | directly observed twice |
| Candletree Wooden Shield | NULL | **3.5** | directly observed twice |
| Carian Knight's Shield | NULL | **4.5** | directly observed twice |
| Crossed-Tree Towershield | NULL | **15.5** | directly observed twice |
| Cuckoo Greatshield | NULL | **15.0** | directly observed twice |
| Distinguished Greatshield | NULL | **16.0** | directly observed twice |
| Dragon Towershield | NULL | **16.5** | directly observed twice |
| Eclipse Crest Greatshield | NULL | **15.0** | directly observed twice |
| Eclipse Crest Heater Shield | NULL | **3.5** | directly observed twice |
| Flame Crest Wooden Shield | NULL | **3.5** | directly observed twice |
| Gilded Greatshield | NULL | **16.5** | directly observed twice |
| Gilded Iron Shield | NULL | **3.0** | directly observed twice |
| Haligtree Crest Greatshield | NULL | **17.0** | directly observed twice |
| Hawk Crest Wooden Shield | NULL | **3.5** | directly observed twice |
| Heater Shield | NULL | **3.5** | directly observed twice |
| Horse Crest Wooden Shield | NULL | **3.5** | directly observed twice |
| Ice Crest Shield | NULL | **3.0** | directly observed twice |
| Inverted Hawk Heater Shield | NULL | **3.5** | directly observed twice |
| Inverted Hawk Towershield | NULL | **15.5** | directly observed twice |
| Iron Roundshield | NULL | **3.0** | directly observed twice |
| Kite Shield | NULL | **4.5** | directly observed twice |

## Real site change

Exactly these 30 new nonduplicate item weights are added to the separate and explicitly labelled `TARNISHED_V117_DIRECT_WEIGHT_EVIDENCE` table; no upstream third-party raw parameter data is bundled, and no local canonical community rows or dispute flags are altered.

The existing Build Planner 6-slot loadout, standalone individual weapon reference, and Weapon Database item details all use the same `getTarnishedV117DirectWeight` function, **preferring these 30 exact public v1.17 observations when a manual override is absent**. Source labels explicitly identify that these are direct competitor v1.17 values, not current game-client certified stats; unknown items remain unknown, never zero.

## Accurate coverage and unresolved scope

- Before the two weight audits: 72 / 487 **canonical** records had no original primary attack or weight.
- Previous round: 5 of the 72 had direct competitor weight observations; another 4 weapon weight fields had direct comparisons including Stone-Sheathed Sword community 3.5 vs Tarnished v1.17 **5.0** (one numeric mismatch).
- **This round: +30 missing-weight entries**, 30/30 observed twice, zero failed cases. **Cumulative 35/72 originally missing weights now have versioned primary-website readings in the separate comparator layer**; **37** original-missing entries still lack direct Tarnished weight observations.
- Total distinct direct item-weight facts: **39** (35 formerly missing + 3 community matches + 1 real comparator mismatch). The 72 raw source-only catalog records remain canonical exactly as they were; do not conflate comparator overlay coverage with updated community-source data.
- Prior weapon AR same-input parity: **86 cases across 48 different weapon names**. No AR maths was modified by this weight batch.
- No direct website verification of individual +0 elemental attack components, minimum STR/DEX/INT/FAI/ARC requirements, spells, active effects, enemy damage or full armor data in this audit. Mark these NOT_OBSERVED.
- Free browser/static hosting only; third-party redistribution rights and SEO/noindex approvals remain separate.
