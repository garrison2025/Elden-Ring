# DLC weapon inventory and AR data gate – 2026-10-30

This report audits the **102** Shadow of the Erdtree weapon/shield entries referenced from the community expansion roster. It is a *reference inventory*, not a certified 1.17.3 regulation dataset or a representation of Tarnished Pack additions.

| Field / gate | Source-backed rows | Still unknown |
| --- | ---: | ---: |
| Weapon/shield name and category | 102 | 0 within selected reference roster |
| All five attribute requirements | 102 | 0 |
| Source-reported +0 physical/elemental base attack arrays | 101 | 1 |
| Individual-weapon weights (community sourced, not game certified) | 102 | 0 |
| Critical and +0 grades (three disputed grade letters marked '?') | 101 | 1 |
| Community-published +0–+10 integer BASE attack tables | **6** | **96** |
| Exact reinforcement attack/scaling multipliers | **0** | **102** |
| Exact affinity/infusion parameter profiles | **0** | **102** |
| Current regulation validated exact AR | **0** | **102** |

### October 30 follow-up: additional source-checked DLC +0 facts

The following nine entries advanced from name-only to +0 reference-only. All sourced stats are for individual weapon pages, not full AR:

| Weapon | Physical | Magic | Fire | Holy | Weight | Source |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Spear of the Impaler | 85 | 0 | 102 | 0 | 9.5 | [Eldenpedia](https://eldenring.wiki.gg/wiki/Spear_of_the_Impaler) |
| Sword of Night | 110 | 33 | 0 | 0 | 6.5 | [Eldenpedia](https://eldenring.wiki.gg/wiki/Sword_of_Night) |
| Star-Lined Sword | 82 | 82 | 0 | 0 | 5.0 | [Eldenpedia](https://eldenring.wiki.gg/wiki/Star-Lined_Sword) |
| Obsidian Lamina | 120 | 0 | 0 | 0 | 6.5 | [Eldenpedia](https://eldenring.wiki.gg/wiki/Obsidian_Lamina) |
| Poleblade of the Bud | 131 | 0 | 0 | 0 | 10.0 | [Eldenpedia](https://eldenring.wiki.gg/wiki/Poleblade_of_the_Bud) |
| Queelign's Greatsword | 117 | 0 | 35 | 0 | 7.5 | [Eldenpedia](https://eldenring.wiki.gg/wiki/Queelign%27s_Greatsword) |
| Shadow Sunflower Blossom | 114 | 0 | 0 | 114 | 16.0 | [Eldenpedia](https://eldenring.wiki.gg/wiki/Shadow_Sunflower_Blossom) |
| Pata | 104 | 0 | 0 | 0 | 4.0 | [Eldenpedia](https://eldenring.wiki.gg/wiki/Pata) |
| Repeating Crossbow | 74 | 0 | 0 | 0 | 6.0 | [Eldenpedia](https://eldenring.wiki.gg/wiki/Repeating_Crossbow) |

Separately, published somber base-attack progression arrays (+0 through +10) were added for **Sword of Night** (physical 110→269, magic 33→80), **Rakshasa's Great Katana** (physical 155→379) and **Repeating Crossbow** (physical 74→259). These page-published rounded base-attack integers **are not numerical reinforcement multipliers**; no interpolated values or AR projections are allowed. These source tables are not game-verified under the latest regulation.

### Existing cross-checked +0 reference entries

- **Milady** — physical 116, weight 6.5, critical 100; [source](https://eldenring.wiki.gg/wiki/Milady)
- **Backhand Blade** — physical 105, weight 2, critical 100; [source](https://eldenring.wiki.gg/wiki/Backhand_Blade)
- **Great Katana** — physical 145, weight 9, critical 100; [source](https://eldenring.wiki.gg/wiki/Great_Katana)
- **Dragon-Hunter's Great Katana** — physical 152, weight 10.5, critical 100; [source](https://eldenring.wiki.gg/wiki/Dragon-Hunter%27s_Great_Katana)
- **Dueling Shield** — physical 125, weight 9, critical 100; [source](https://eldenring.wiki.gg/wiki/Dueling_Shield)
- **Rellana's Twin Blades** — physical 103, other attack [magic,fire,lightning,holy] = [66, 66, 0, 0], weight 8, critical 100; [source](https://eldenring.wiki.gg/wiki/Rellana%27s_Twin_Blades)
- **Rakshasa's Great Katana** — physical 155, weight 9.5, critical 100; [source](https://eldenring.wiki.gg/wiki/Rakshasa%27s_Great_Katana)
- **Smithscript Dagger** — physical 67, weight 1.5, critical 100; [source](https://eldenring.wiki.gg/wiki/Smithscript_Dagger)
- **Smithscript Cirque** — physical 100, weight 2, critical 100; [source](https://eldenring.wiki.gg/wiki/Smithscript_Cirque)

### Required next data import

Use individually verified regulation tables (weapon row + reinforcement + attribute correction + affinity eligibility) with explicit license permission, version, source checksum and affected weapon ID. Run `npm run audit:regulation` **only** against a locally and legitimately obtained JSON snapshot. Follow with at least 50 real in-game golden comparisons across ordinary/somber, infused/uninfused, paired weapons and special damage rules before publishing game-accurate AR.

The wiki +0 values are community-reported; do not silently claim official 1.17.3 certification or import absent multipliers.

### Later 2026-10-30 addition: 3 further cited weapons

Spread Crossbow (physical 68, weight 5.0), Spirit Sword (physical 92 + magic 59, weight 2.5), and Tooth Whip (physical 109, weight 3.0) have individualized source links and base stats. Tooth Whip also has an 11-level source-published somber attack table. No accuracy upgrade for AR is claimed.

### Nine additional individually sourced DLC base reference rows

- **Ancient Meteoric Ore Greatsword** — +0 [154, 46, 0, 0, 0], weight 22, critical 100, requirements [35, 10, 0, 0, 19], scaling [D, E, -, -, D] — [per-weapon reference](https://eldenring.wiki.gg/wiki/Ancient_Meteoric_Ore_Greatsword)
- **Greatsword of Solitude** — +0 [120, 0, 0, 0, 0], weight 15.5, critical 100, requirements [27, 13, 0, 0, 0], scaling [B, E, -, -, -] — [per-weapon reference](https://eldenring.wiki.gg/wiki/Greatsword_of_Solitude)
- **Black Steel Greathammer** — +0 [140, 0, 0, 0, 42], weight 12, critical 100, requirements [25, 11, 0, 17, 0], scaling [C, E, -, D, -] — [per-weapon reference](https://eldenring.wiki.gg/wiki/Black_Steel_Greathammer)
- **Bloodfiend's Arm** — +0 [147, 0, 0, 0, 0], weight 20, critical 100, requirements [28, 11, 0, 0, 16], scaling [D, E, -, -, D] — [per-weapon reference](https://eldenring.wiki.gg/wiki/Bloodfiend%27s_Arm)
- **Euporia** — +0 [84, 0, 0, 0, 100], weight 8.5, critical 100, requirements [16, 16, 0, 24, 0], scaling [D, D, -, D, -] — [per-weapon reference](https://eldenring.wiki.gg/wiki/Euporia)
- **Greatsword of Damnation** — +0 [123, 0, 0, 0, 79], weight 8, critical 100, requirements [20, 15, 0, 20, 0], scaling [D, E, -, D, -] — [per-weapon reference](https://eldenring.wiki.gg/wiki/Greatsword_of_Damnation)
- **Black Steel Greatshield** — +0 [119, 0, 0, 0, 0], weight 18, critical 100, requirements [35, 0, 0, 0, 0], scaling [D, -, -, -, -] — [per-weapon reference](https://eldenring.wiki.gg/wiki/Black_Steel_Greatshield)
- **Carian Sorcery Sword** — +0 [69, 69, 0, 0, 0], weight 2.5, critical 110, requirements [10, 19, 16, 0, 0], scaling [E, D, D, -, -] — [per-weapon reference](https://eldenring.wiki.gg/wiki/Carian_Sorcery_Sword)
- **Ansbach's Longbow** — +0 [74, 0, 0, 0, 0], weight 4.5, critical 100, requirements [9, 43, 0, 0, 0], scaling [E, D, -, -, -] — [per-weapon reference](https://eldenring.wiki.gg/wiki/Ansbach%27s_Longbow)

**Euporia somber +0–+10 source-published integer base attack:** physical [84,96,108,120,132,144,157,169,181,193,205]; holy [100,114,129,143,158,172,187,201,216,230,245]. These are NOT exact reinforcement coefficients, current version AR, or game golden samples. The Ancient Meteoric Ore Greatsword table is not imported because of an inconsistent +3 magic attack observation in the reference. Ansbach's Longbow per-weapon wiki contradicts previous list DEX 18: corrected to **DEX 43** with primary per-item source.

### Later 2026-10-30 completion note

The table above is the current snapshot: **102/102 DLC five-stat requirements and single-item weights**, **43 source-linked complete +0 base records**, **59 requirements-and-weight-only records**, with unknown attack/critical/scaling deliberately null; **5** published somber base attack progressions, and **0** exact AR regulation parameter profiles. Sources and individual links are described in `docs/COMMUNITY_WEAPON_DATA.md`. The sections above this note record earlier incremental work and their old counts should not be taken as current.

### Second individual source reconciliation, 2026-10-30

57 of 102 DLC have per-item +0 reference facts; remaining 45 retain null attack/critical/scaling, but sourced weight and requirements. Three per-item weight corrections and the Stone-Sheathed Sword source conflict are detailed in `docs/COMMUNITY_WEAPON_DATA.md`. Do not interpret second-source fields or infobox attack as full AR under Regulation 1.17.3.

### Late 2026-10-30: seven more individually cited +0 records

64 of 102 DLC have linked individual +0 facts; 38 retain unknown attack/critical/scaling. All 102 have community-sourced requirements and weight; six source-published somber integer base tables, **zero current regulation AR verified**. See `docs/COMMUNITY_WEAPON_DATA.md` for exact sources.

### Latest DLC numeric sourcing scope

**101/102** DLC items now have community-sourced +0 BASE physical/elemental attack integers; **68** are named weapon-page sourced and **33** class comparison-table sourced, with item name/weight/requirements matched. The remaining Stone-Sheathed Sword has *conflicting* +0 observations and stays null. Three other items keep a disputed scaling grade as '?'. This does not constitute full reinforcement data, infusions, current-patch game testing or correct final AR. See `docs/DLC_BASE_SOURCE_AUDIT_20261030.md` for row-by-row source links.
