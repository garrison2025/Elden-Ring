# DLC weapon inventory and AR data gate – 2026-10-30

This report audits the **102** Shadow of the Erdtree weapon/shield entries referenced from the community expansion roster. It is a *reference inventory*, not a certified 1.17.3 regulation dataset or a representation of Tarnished Pack additions.

| Field / gate | Source-backed rows | Still unknown |
| --- | ---: | ---: |
| Weapon/shield name and category | 102 | 0 within selected reference roster |
| All five attribute requirements | 61 | 41 |
| +0 physical/elemental attack arrays | 9 | 93 |
| Weight | 9 | 93 |
| Critical and +0 letter grades | 9 | 93 |
| Exact reinforcement attack/scaling multipliers | **0** | **102** |
| Exact affinity/infusion parameter profiles | **0** | **102** |
| Current regulation validated exact AR | **0** | **102** |

### Already cross-checked +0 reference entries

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
