# DLC weapon inventory and AR data gate – 2026-10-30

This report audits the **102** Shadow of the Erdtree weapon/shield entries referenced from the community expansion roster. It is a *reference inventory*, not a certified 1.17.3 regulation dataset or a representation of Tarnished Pack additions.

| Field / gate | Source-backed rows | Still unknown |
| --- | ---: | ---: |
| Weapon/shield name and category | 102 | 0 within selected reference roster |
| All five attribute requirements | 73 | 29 |
| +0 physical/elemental attack arrays | 21 | 81 |
| Weight | 21 | 81 |
| Critical and +0 letter grades | 21 | 81 |
| Community-published +0–+10 integer BASE attack tables | **4** | **98** |
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
