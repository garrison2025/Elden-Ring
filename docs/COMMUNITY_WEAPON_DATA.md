# Community weapon data – provenance and exact-AR boundary

Snapshot updated 2026-10-30. **409 unique-ID records:** 307 base-game community reference rows and 102 `Shadow of the Erdtree` weapon/shield entries.

## Evidence tiers

| Tier | DLC rows | Available | Unavailable |
| --- | ---: | --- | --- |
| `base-reference` | 30 | Name, weapon class, requirements, +0 physical/elemental attack, critical, weight and scaling **letters** cross-checked against individually linked Eldenpedia entries | Exact reinforcement table, affinity parameters, numeric stat curves, current-regulation game parity, AR |
| `requirements-only` | 44 | Name, class and community-reported 5-stat requirements | +0 attack, critical, weight, scaling, upgrades, affinities, AR |
| `name-category-only` | 28 | Name and class, checked against DLC roster | Requirements and all numerical combat properties |

**Every missing numeric field is null, not zero.** The 30 wiki +0 values are reference facts, **not** current patch game-tested AR.

Original nine sourced +0 references: Milady, Backhand Blade, Great Katana, Dragon-Hunter's Great Katana, Dueling Shield, Rellana's Twin Blades, Rakshasa's Great Katana, Smithscript Dagger and Smithscript Cirque.

Additional nine sourced +0 references: Spear of the Impaler, Sword of Night, Star-Lined Sword, Obsidian Lamina, Poleblade of the Bud, Queelign's Greatsword, Shadow Sunflower Blossom, Pata, and Repeating Crossbow. Each provides its individual `checkedWith` source URL.

Five individual weapons (Sword of Night, Rakshasa's Great Katana, Repeating Crossbow, Tooth Whip and Euporia) also contain community-published rounded **base-attack tables** for their somber +0–+10 path, each with its individual source. Their rows do **not** reveal the underlying exact reinforcement multipliers or scaling values and are never used to compute AR.

## Sources and rights

- Base-game factual sample: https://github.com/deliton/eldenring-api/blob/main/api/public/data/weapons.json (source commit `1d2626ceda5eb8c08997e345e303344a64edc106`), 307 entries. Upstream software license MIT applies to its software, **not necessarily to all game-derived data or media**.
- 57 original DLC names/types/requirements: https://consolepulse.com/multiplatform/elden-ring/guides/elden-ring-dlc-weapon-shield-locations . Its listed scaling is at MAX upgrade, not valid +0 scaling.
- Additional 45 DLC name/class references: https://eldenring.fandom.com/wiki/Weapons_(Shadow_of_the_Erdtree) . Its list includes shields. This snapshot tracks 102 entries and does not claim completeness of separate Tarnished Pack content.
- Individually checked factual +0 statistics and published integer base-attack tables where available: each record's `checkedWith` URL on https://eldenring.wiki.gg/ . The accessible wiki has CC BY-SA 4.0 licensing for page content; this repository does not copy artwork, descriptions, source layouts or prose.
- Existing base-game cross checks: Royal Greatsword, Serpentbone Blade, Star Fist. Twelve unverified '?' grades remain unknown. Erdtree Seal upstream duplicate remains flagged.

## AR validation gate

A weapon must not be presented as having exact AR merely because its +0 attack or letter grades are available. A publishable AR profile additionally needs:

1. Exact applicable game app/regulation identifiers and legal/source review.
2. Weapon's precise source affinity, base damage per type, **numeric** scaling coefficients, per-damage attribute correction graphs and element applicability.
3. Full legal reinforcement progression (regular +0 to +25, or somber +0 to +10), no interpolation of missing upgrades.
4. All supported affinity/infusion param records, with validity restrictions per weapon.
5. Two-hand/paired special rules, attribute requirements, rounding and split-damage semantics.
6. Independent in-game golden samples with precise character stats, upgrade, affinity and UI integer outputs; regressions fail closed.

Existing `public/src/regulation-import.mjs` and `scripts/audit-regulation.mjs` are **research-only** converters for independently sourced local inputs. They do not prove commercial redistribution rights, provide actual regulation params, or authorize publishing precise AR. Never upload personal or unlicensed param dumps to the public repo.

The public `weapon-database/` route remains noindex; `weapon-ar-lab/` is an isolated synthetic research facility, not player-ready AR. All DLC profiles still need parameter sourcing and independent game validation.

## Maintenance

On each official patch, mark affected rows for re-check, verify relevant param changes, rerun golden comparisons, and only then update the supported regulation identifier. When exact data is missing, retain the search reference but return `UNSUPPORTED` for precise AR.

### Additional source-linked DLC facts (2026-10-30)

- Spread Crossbow: +0 physical 68, weight 5.0, STR 11, DEX 17 — https://eldenring.wiki.gg/wiki/Spread_Crossbow
- Spirit Sword: +0 physical 92, magic 59, weight 2.5, STR 8, DEX 16, INT 16 — https://eldenring.wiki.gg/wiki/Spirit_Sword
- Tooth Whip: +0 physical 109, weight 3, STR 10, DEX 24; published somber +0 to +10 physical base attack 109,124,140,156,172,188,203,219,235,251,267 — https://eldenring.wiki.gg/wiki/Tooth_Whip

All numbers are community reference facts, not game-certified current-regulation AR.

### Independent base-game error correction and 2H usability gate

Eldenpedia's [Spiked Spear](https://eldenring.wiki.gg/wiki/Spiked_Spear) +0 record confirms DEX requirement **16**, not the malformed upstream 0, and critical **100**, not 0. Record updated with source and old suspicious flag removed. The community catalog's 307 base-game row count is unchanged.

Two-handing a Crossbow **can** satisfy reduced Strength requirements where a documented weapon displays the 1H/2H requirements: [Repeating Crossbow](https://eldenring.wiki.gg/wiki/Repeating_Crossbow) 13 STR (1H), 9 STR (2H); [Spread Crossbow](https://eldenring.wiki.gg/wiki/Spread_Crossbow) 11 STR (1H), 8 STR (2H). The requirement checker now permits the standard 1.5× effective STR rule for Crossbow; this is **not** a claim that crossbows gain Strength damage scaling or can fire without bolts. Bows and other categories remain conservative until independently checked.

New catalog integrity validation compares declared coverage counts against actual DLC tiers and published attack tables; mismatches fail the build. Neither corrected weapon facts nor new validation constitutes current regulation AR certification.

## Additional nine source-audited DLC +0 entries — later 2026-10-30

- **Ancient Meteoric Ore Greatsword** — attack [physical,magic,fire,lightning,holy] [154,46,0,0,0], weight 22, critical 100, requirements [STR,DEX,INT,FAI,ARC] [35,10,0,0,19], +0 scaling letters ["D","E","-","-","D"]. Source: https://eldenring.wiki.gg/wiki/Ancient_Meteoric_Ore_Greatsword
- **Greatsword of Solitude** — attack [physical,magic,fire,lightning,holy] [120,0,0,0,0], weight 15.5, critical 100, requirements [STR,DEX,INT,FAI,ARC] [27,13,0,0,0], +0 scaling letters ["B","E","-","-","-"]. Source: https://eldenring.wiki.gg/wiki/Greatsword_of_Solitude
- **Black Steel Greathammer** — attack [physical,magic,fire,lightning,holy] [140,0,0,0,42], weight 12, critical 100, requirements [STR,DEX,INT,FAI,ARC] [25,11,0,17,0], +0 scaling letters ["C","E","-","D","-"]. Source: https://eldenring.wiki.gg/wiki/Black_Steel_Greathammer
- **Bloodfiend's Arm** — attack [physical,magic,fire,lightning,holy] [147,0,0,0,0], weight 20, critical 100, requirements [STR,DEX,INT,FAI,ARC] [28,11,0,0,16], +0 scaling letters ["D","E","-","-","D"]. Source: https://eldenring.wiki.gg/wiki/Bloodfiend%27s_Arm
- **Euporia** — attack [physical,magic,fire,lightning,holy] [84,0,0,0,100], weight 8.5, critical 100, requirements [STR,DEX,INT,FAI,ARC] [16,16,0,24,0], +0 scaling letters ["D","D","-","D","-"]. Source: https://eldenring.wiki.gg/wiki/Euporia
- **Greatsword of Damnation** — attack [physical,magic,fire,lightning,holy] [123,0,0,0,79], weight 8, critical 100, requirements [STR,DEX,INT,FAI,ARC] [20,15,0,20,0], +0 scaling letters ["D","E","-","D","-"]. Source: https://eldenring.wiki.gg/wiki/Greatsword_of_Damnation
- **Black Steel Greatshield** — attack [physical,magic,fire,lightning,holy] [119,0,0,0,0], weight 18, critical 100, requirements [STR,DEX,INT,FAI,ARC] [35,0,0,0,0], +0 scaling letters ["D","-","-","-","-"]. Source: https://eldenring.wiki.gg/wiki/Black_Steel_Greatshield
- **Carian Sorcery Sword** — attack [physical,magic,fire,lightning,holy] [69,69,0,0,0], weight 2.5, critical 110, requirements [STR,DEX,INT,FAI,ARC] [10,19,16,0,0], +0 scaling letters ["E","D","D","-","-"]. Source: https://eldenring.wiki.gg/wiki/Carian_Sorcery_Sword
- **Ansbach's Longbow** — attack [physical,magic,fire,lightning,holy] [74,0,0,0,0], weight 4.5, critical 100, requirements [STR,DEX,INT,FAI,ARC] [9,43,0,0,0], +0 scaling letters ["E","D","-","-","-"]. Source: https://eldenring.wiki.gg/wiki/Ansbach%27s_Longbow

Important source corrections: Ansbach's Longbow originally had requirements 10 STR / 18 DEX in the secondary roster but the per-weapon source reports **9 STR / 43 DEX** (8 STR when two-handed). Only this specifically documented Bow is opted into the two-hand Strength condition; no generic bow AR or scaling assumptions are introduced. Black Steel Greatshield weighs **18** per its documented 1.17 change. Carian Sorcery Sword critical is **110**. Ancient Meteoric Ore Greatsword's source +3 upgrade table has a likely inconsistent magic value; its level-by-level table was deliberately NOT imported.

Euporia alone receives a source-published +0–+10 somber **BASE** attack progression (physical 84→205, holy 100→245), not scaling or verified final AR.
