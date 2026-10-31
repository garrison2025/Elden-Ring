# Pinned Regulation 1.17 reverse roster — completed gap reconciliation

Reviewed: 2026-10-31. Scope: **names, default-affinity class and attribute requirements only**, not original 1.17.3 client screenshots or 1.17.3 feature parity.

## Actual result

- Prior database: **416 rows, 415 distinct names** due to a byte-identical duplicate Erdtree Seal (same community base numbers).
- Pinned public 1.17 regulation snapshot: **488 unique named source families**, one of which is a special non-equippable **Unarmed** state; **487 source-name families representing equippable items**.
- Missing from original database: **73 distinct source families = 72 wearable items + Unarmed**. Actual missing wearable breakdown: **17 Small Shields, 27 Medium Shields, 25 Greatshields, 1 Sacred Seal, 1 Curved Sword, 1 Greatsword**.
- Source-state reconciliation: added **72** new searchable records with exact neutral/default-affinity five-attribute requirements; excluded Unarmed; retired a redundant second Erdtree Seal ID and retained it as a link alias. **487 unique entries** now cover **487/487 wearable named families found in the pinned source**, and **0 genuine source-only names remain**. This is NOT a warranty that pinned source represents every 2026 patch or DLC/edition.
- For the new 72: weight, +0 base attacks, critical damage and letter scaling **UNKNOWN**; they cannot enter damage-based or weight-based filtering and cannot create final AR or roll-tier figures. No fake zeroes.

## 72 newly recovered rows (exact source spelling and requirements)

Requirements are **STR / DEX / INT / FAI / ARC**; missing source keys mean zero minimum for that attribute. The linked source is a pinned 1.17 public game-derived parameter dataset, not a user-observed current game-client screenshot.

### Small Shield (17)

| Name | Required STR / DEX / INT / FAI / ARC | Source record ID |
|---|---|---|
| Blue-White Wooden Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-010` |
| Buckler | 8 / 13 / 0 / 0 / 0 | `v117-roster-013` |
| Coil Shield | 10 / 10 / 0 / 0 / 0 | `v117-roster-016` |
| Gilded Iron Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-029` |
| Ice Crest Shield | 9 / 0 / 0 / 0 / 0 | `v117-roster-038` |
| Iron Roundshield | 8 / 0 / 0 / 0 / 0 | `v117-roster-043` |
| Man-Serpent's Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-048` |
| Perfumer's Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-053` |
| Pillory Shield | 10 / 0 / 0 / 0 / 0 | `v117-roster-054` |
| Red Thorn Roundshield | 8 / 0 / 0 / 0 / 0 | `v117-roster-056` |
| Rickety Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-058` |
| Rift Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-059` |
| Riveted Wooden Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-060` |
| Scripture Wooden Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-063` |
| Shield of the Guilty | 8 / 0 / 0 / 0 / 0 | `v117-roster-064` |
| Smoldering Shield | 10 / 9 / 0 / 12 / 0 | `v117-roster-066` |
| Spiralhorn Shield | 8 / 10 / 0 / 0 / 0 | `v117-roster-068` |

### Medium Shield (27)

| Name | Required STR / DEX / INT / FAI / ARC | Source record ID |
|---|---|---|
| Albinauric Shield | 11 / 0 / 0 / 0 / 0 | `v117-roster-001` |
| Banished Knight's Shield | 14 / 0 / 0 / 0 / 0 | `v117-roster-004` |
| Beast Crest Heater Shield | 10 / 0 / 0 / 0 / 0 | `v117-roster-005` |
| Beastman's Jar-Shield | 10 / 0 / 0 / 0 / 0 | `v117-roster-006` |
| Black Leather Shield | 10 / 0 / 0 / 0 / 0 | `v117-roster-007` |
| Blue Crest Heater Shield | 10 / 0 / 0 / 0 / 0 | `v117-roster-008` |
| Blue-Gold Kite Shield | 12 / 0 / 0 / 0 / 0 | `v117-roster-009` |
| Brass Shield | 16 / 0 / 0 / 0 / 0 | `v117-roster-011` |
| Candletree Wooden Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-014` |
| Carian Knight's Shield | 10 / 10 / 15 / 0 / 0 | `v117-roster-015` |
| Eclipse Crest Heater Shield | 10 / 0 / 0 / 0 / 0 | `v117-roster-024` |
| Flame Crest Wooden Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-027` |
| Great Turtle Shell | 14 / 0 / 0 / 0 / 0 | `v117-roster-033` |
| Hawk Crest Wooden Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-035` |
| Heater Shield | 10 / 0 / 0 / 0 / 0 | `v117-roster-036` |
| Horse Crest Wooden Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-037` |
| Inverted Hawk Heater Shield | 10 / 0 / 0 / 0 / 0 | `v117-roster-041` |
| Kite Shield | 12 / 0 / 0 / 0 / 0 | `v117-roster-045` |
| Large Leather Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-046` |
| Marred Leather Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-050` |
| Marred Wooden Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-051` |
| Red Crest Heater Shield | 10 / 0 / 0 / 0 / 0 | `v117-roster-055` |
| Round Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-061` |
| Scorpion Kite Shield | 12 / 0 / 0 / 0 / 0 | `v117-roster-062` |
| Silver Mirrorshield | 12 / 10 / 10 / 0 / 0 | `v117-roster-065` |
| Sun Realm Shield | 8 / 0 / 0 / 0 / 0 | `v117-roster-069` |
| Twinbird Kite Shield | 12 / 0 / 0 / 0 / 0 | `v117-roster-070` |

### Greatshield (25)

| Name | Required STR / DEX / INT / FAI / ARC | Source record ID |
|---|---|---|
| Ant's Skull Plate | 28 / 0 / 0 / 0 / 0 | `v117-roster-002` |
| Briar Greatshield | 21 / 0 / 0 / 0 / 0 | `v117-roster-012` |
| Crossed-Tree Towershield | 30 / 0 / 0 / 0 / 0 | `v117-roster-017` |
| Crucible Hornshield | 26 / 0 / 0 / 0 / 0 | `v117-roster-018` |
| Cuckoo Greatshield | 32 / 0 / 0 / 0 / 0 | `v117-roster-019` |
| Distinguished Greatshield | 32 / 0 / 0 / 0 / 0 | `v117-roster-020` |
| Dragon Towershield | 30 / 0 / 0 / 0 / 0 | `v117-roster-021` |
| Dragonclaw Shield | 28 / 12 / 0 / 0 / 0 | `v117-roster-022` |
| Eclipse Crest Greatshield | 32 / 0 / 0 / 0 / 0 | `v117-roster-023` |
| Erdtree Greatshield | 30 / 0 / 0 / 12 / 0 | `v117-roster-025` |
| Fingerprint Stone Shield | 48 / 0 / 0 / 0 / 0 | `v117-roster-026` |
| Gilded Greatshield | 36 / 0 / 0 / 0 / 0 | `v117-roster-028` |
| Golden Beast Crest Shield | 24 / 0 / 0 / 0 / 0 | `v117-roster-030` |
| Golden Greatshield | 34 / 0 / 0 / 0 / 0 | `v117-roster-031` |
| Haligtree Crest Greatshield | 36 / 0 / 0 / 0 / 0 | `v117-roster-034` |
| Icon Shield | 22 / 0 / 0 / 0 / 0 | `v117-roster-039` |
| Inverted Hawk Towershield | 30 / 0 / 0 / 0 / 0 | `v117-roster-042` |
| Jellyfish Shield | 20 / 14 / 0 / 0 / 0 | `v117-roster-044` |
| Lordsworn's Shield | 16 / 0 / 0 / 0 / 0 | `v117-roster-047` |
| Manor Towershield | 30 / 0 / 0 / 0 / 0 | `v117-roster-049` |
| One-Eyed Shield | 36 / 0 / 0 / 0 / 0 | `v117-roster-052` |
| Redmane Greatshield | 30 / 0 / 0 / 0 / 0 | `v117-roster-057` |
| Spiked Palisade Shield | 20 / 0 / 0 / 0 / 0 | `v117-roster-067` |
| Visage Shield | 44 / 0 / 0 / 0 / 0 | `v117-roster-071` |
| Wooden Greatshield | 14 / 0 / 0 / 0 / 0 | `v117-roster-072` |

### Sacred Seal (1)

| Name | Required STR / DEX / INT / FAI / ARC | Source record ID |
|---|---|---|
| Gravel Stone Seal | 4 / 0 / 0 / 18 / 0 | `v117-roster-032` |

### Curved Sword (1)

| Name | Required STR / DEX / INT / FAI / ARC | Source record ID |
|---|---|---|
| Bandit's Curved Sword | 11 / 13 / 0 / 0 / 0 | `v117-roster-003` |

### Greatsword (1)

| Name | Required STR / DEX / INT / FAI / ARC | Source record ID |
|---|---|---|
| Inseparable Sword | 18 / 18 / 0 / 20 / 0 | `v117-roster-040` |

## Published numeric discrepancy decisions (best current reference versus game certification)

| Scope | Adopted best **reference** reading | In-game verification | Safety boundary |
|---|---|---|
| Fire Knight's Shortsword +0 | Physical 75 / Fire 22 (pinned 1.17 and third public Base; wiki headline conflicts) | No | Original conflicting community value stays archived, trusted AR gated |
| Greatsword of Radahn (Light) +0 | Physical 127 / Magic 82 (pinned and third Base) | No | Trusted precise AR gated |
| Greatsword of Radahn (Lord) +0 | Physical 127 / Magic 82 (pinned and third Base) | No | Trusted precise AR gated |
| Queelign's Greatsword +0 | Physical 122 / Fire 36 (pinned and third Base) | No | Trusted precise AR gated |
| Smithscript Axe +0 | Physical 131 (pinned and third Base) | No | Trusted precise AR gated |
| Smithscript Dagger +0 | Physical 62 (pinned and third Base) | No | Trusted precise AR gated |
| Madding Hand minimum FAI | 20 (pinned 1.17 and version-labelled 1.17.3 secondary; historical community FAI 13 preserved) | No | Wieldability for disputed row gated |
| Stone-Sheathed Sword | +0 physical 89 appears in explicit +0/initial rows; weight 3.5 versus 5 still unresolved | No | Trusted damage and equipped-load gated |
| Ritual Thrusting Shield | +0 physical 135 community-supported; Reg. 1.17.3-labelled STR 13 and weight 10 compete with STR 15 and weight 9 elsewhere | No | Wieldability/load gated |

**Do not misstate these 9 source-dispute groups as 9 verified values.** Exactly the prior seven historical source-v1.17 disagreements plus two additional source-disputed equipment groups are still open to original-game verification. This decision table provides best public references immediately without changing the independent game-client QA flag.

## Provenance and limitations

- Pinned full source (not bundled into the website): https://github.com/ThomasJClark/elden-ring-weapon-calculator/blob/3539d87e446f3b9d5b94157f8a2023e28ffea7d2/public/regulation-vanilla-v1.17.js
- The regulator source snapshot is 1.17, not an original verified current 1.17.3 game dump. The 8 Tarnished Pack names are included in the current 487-source-matched catalog, but patch/edition roster certification requires an independent current reference.
- The original imported catalog had a duplicated **Erdtree Seal** entry with same name, category, weight, attack, critical, scaling and requirements. The retired record ID `17f698bacafl0i1phz3om56qt5bqof` maps to the surviving `17f69746125l0i1phti5gxbjc1nfhx` in `meta.legacyWeaponIdAliases` so old catalog links can resolve.
- A two-way CI audit now fails on missing source name, modified raw 1.17 requirement, duplicate catalog name, or non-Unarmed remaining unmatched source family. The only intentional non-equipment exception is exact source state **Unarmed** (`weaponType 35`).
- No proprietary game binaries, graphics or full extracted regulation data have been committed; only the 72 missing equip names/types and minimum attribute facts.
