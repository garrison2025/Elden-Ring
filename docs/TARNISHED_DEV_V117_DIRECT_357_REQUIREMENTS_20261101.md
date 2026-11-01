# Tarnished.dev public v1.17 — 487 weapon minimum-attribute requirements audit (2026-11-01)

## Source authority and effective-input correction

The **real public Tarnished.dev v1.17 Build Planner** was opened for **487 distinct local catalog weapon names** in 12 parallel GitHub Actions Chromium jobs, twice per item, with the exact selected name, affinity, version and all five controls checked. The browser actually **clamped** URL-requested STR/DEX/INT/FAI/ARC = 1 to default Wretch STR/DEX/INT/FAI/ARC = **10/10/10/10/10**. The initial automated check rightly refused to certify the requested nonexistent 1-point input, but the two real DOM observation logs preserve both actual control values and the website's directly displayed `Req: STR/DEX/INT/FAI/ARC` text.

- [12 direct double-read browser jobs — raw UI evidence](https://github.com/garrison2025/Elden-Ring/actions/runs/41263897966)
- [Independent pinned source vs direct Req comparison](https://github.com/garrison2025/Elden-Ring/actions/runs/41264643024)
- Source-controlled, versioned 487-row actual DOM observations: `scripts/tarnished-v117-direct-requirements-actual10.json`.

The recovered observations pass a separate strict validator requiring *identical Req* in both raw source logs, matching exact rendered weapon name/affinity, v1.17 site URL, actual five 10s, +0 upgrade and all buffs off. A missing Req is marked NOT_OBSERVED and is never filled from a secondary source.

## Actual numeric results, compared separately by origin

| Measure | Count |
|---|---:|
| Catalog unique weapon names attempted | **487** |
| Site directly displayed identical Req five-tuple in both observations | **357** |
| Site Req not visible / item not activated under Wretch base10 | **130** |
| **Direct site Req equals pinned v1.17 comparator requirements** | **357/357** |
| Direct site Req differs from pinned v1.17 comparator requirements | **0** |
| Direct site Req differs from original historical community catalog | **21** |
| Pinned v1.17 source unavailable for verified site Req | **0** |

**Important:** The 21 historical discrepancies are **already corrected in the separate active pinned-v1.17 comparator data layer**. They do NOT imply current effective v1.17 requirement values are incorrect. Do not overwrite the fixed source layer with the older community source.

Examples (STR/DEX/INT/FAI/ARC):

| Weapon | Tarnished.dev public v1.17 = pinned-v1.17 current | Old community original |
|---|---|---|
| Banished Knight's Greatsword | **17/9/0/0/0** | 17/0/0/0/0 |
| Clayman's Harpoon | **12/10/12/0/0** | 0/0/0/0/0 |
| Cleanrot Knight's Sword | **11/13/0/0/0** | 13/11/0/0/0 |
| Golden Order Greatsword | **16/21/0/28/0** | 16/21/0/18/0 |
| Madding Hand | **8/8/13/20/0** | 8/8/13/13/0 |
| Ringed Finger | **15/9/0/0/0** | 17/7/0/0/0 |

The 130 not directly observed are often weapons that *already meet* their low requirements at minimum supported Wretch stats; the competitor UI then renders scaling/AR instead of `Req:`. Other cases have unmatched names or unactivated public inputs. These **are not approved direct site requirement matches**, even if the pinned v1.17 data covers all 487 neutral names. The browser's valid minimum character inputs limit additional direct observations; no game-client data is required or substituted.

## Other independent gates

The source-aware weapon weight overlay has **481/487** directly twice-observed v1.17 weight facts, four discovered and effective-layer-corrected community weight disagreements, and six still unobservable weights.

The independent +0 total AR expansion has **347 matching among 348 directly read cases, one precisely documented Icerind Hatchet 183 vs direct public 184 disagreement**. Earlier distinct AR benchmark contains 86 same-input cases over 48 weapon names. The one-ULP whole-engine change was **reverted** because it caused six regressions out of 39,552 broader math cases; no global change was shipped.

**Nothing here certifies** 487/487 individual +0 physical/magic/fire/lightning/holy base components, every affinity/upgrade/grip/stat combination, active Build effects, Armor optimizer choices, Damage enemy/NG+/movesets, Spell damage, the current game-client 1.17.3 or data redistribution rights. These remain separate open gates under the user's public-v1.17-only acceptance standard.
