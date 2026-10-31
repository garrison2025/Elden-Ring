# Tarnished Pack / Tarnished Edition 2026 — actual catalog coverage upgrade

Date: 2026-10-31. **Status: source-backed reference, not independently game-menu verified.**

## Gap that was found

The previous catalog contained 408 named armament references: 306 legacy/base-game community rows and 102 Shadow of the Erdtree weapons/shields. **None** of the eight armaments in the new 2026 Tarnished Pack / Tarnished Edition roster was present.

The publisher's [1.17 patch notes](https://www.bandainamcoent.com/news/elden-ring-patch-notes-version-1-17) confirm newly added weapons and two extra classes. The publisher does **not** list the eight new weapon names or numerical stats there. Independent [GamesRadar](https://www.gamesradar.com/games/action-rpg/elden-ring-new-weapons-armor-tarnished-edition/) identifies seven new weapons; [tarnished.app's weapon tracker](https://tarnished.app/weapons) and other detailed guides additionally identify **Silver Grooved Shield**. These are secondary roster sources, not original data-table or screenshot evidence.

A patch-labelled [Almanauts weapon reference](https://almanauts.com/eldenring/weapons/) identifies game build **25827938**, Regulation **1.17.3**, and reports weight and five-stat requirements for all eight armaments. Its displayed **base attack is at the maximum upgrade**, so those numbers **must not** be inserted into a +0 attack column. The user-facing catalog therefore deliberately leaves **attack, critical and scaling** null, not zero.

## Newly added named armaments and source-reported facts

| Name | Class | STR | DEX | INT | FAI | ARC | Weight |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Reverse-Bladed Sword | Backhand Blade | 9 | 11 | 0 | 0 | 0 | 3 |
| Idus Sword | Light Greatsword | 10 | 15 | 0 | 0 | 0 | 7 |
| Hefty Scimitar | Curved Greatsword | 13 | 11 | 0 | 0 | 0 | 9.5 |
| Reed Great Katana | Great Katana | 11 | 16 | 0 | 0 | 0 | 10 |
| Ritual Thrusting Shield | Thrusting Shield | 13 | 12 | 0 | 0 | 0 | 10 |
| Leontiel's Greatsword | Greatsword | 13 | 26 | 0 | 0 | 0 | 9.5 |
| Golden Order Flail | Flail | 9 | 16 | 0 | 26 | 0 | 5 |
| Silver Grooved Shield | Medium Shield | 9 | 12 | 0 | 0 | 0 | 3 |

A requirement of **0** indicates that the item imposes no requirement for that attribute. It is not the same as an unknown value. All eight requirements vectors and weights are **secondary source claims** and may be revised if real game evidence contradicts them. Owners of the Tarnished Pack / Tarnished Edition can access these items; do not imply they exist in an unmodified base-game installation without the Pack.

## Coverage after this addition

- **416 total** unique named armament records.
- **306** original/legacy community records, unchanged.
- **102** Shadow of the Erdtree references, unchanged; **101** with published +0 base attack arrays.
- **8** Tarnished Pack/Tarnished Edition records: all have attributed requirements and weight, **0** with +0 attack/crit/scaling/precise AR.
- The existing **7** v1.17 community-vs-pinned conflicts remain unresolved and flagged.
- **0** independently inspected current game-client AR or weapon-details golden screenshot records.

These counts are scoped to this curated catalog; **416 is not claimed to be the number of every eligible weapon, shield, ammunition type, duplicate game record, affinity, or multi-variant item in Elden Ring**. Other websites may count different categories; raw site count subtraction is not a completeness audit.

## Implemented quality gates

1. The new source tier requires a real item roster URL, the exact patch-labelled 1.17.3 weight/requirements source, and explicit null unknown damage fields.
2. A separate `Tarnished Pack` catalog filter avoids quietly relabelling new paid-content armaments as part of the legacy base game or Shadow of the Erdtree.
3. Requirements checks and equipped-weight calculations can use the source-reported fields. Unknown +0 base attack never becomes zero, inferred AR, or a damage-filter match.
4. Homepage, catalog search, accuracy-status audit, counts and deployment manifest derive from the same bundle and distinguish 306/102/8.
5. All original v1.17 conflict flags, current-patch AR validation gates, copyrights and `noindex` restrictions remain.

## Remaining concrete work

- Obtain an independently versioned source for **actual +0** attack, critical, scaling, upgrade tracks for the eight new items. Do not silently reverse-engineer +0 from max-upgrade displayed attacks.
- Collect original *real game-client* +0 weapon-details screenshots for the seven already flagged source discrepancies, with an independent reviewer and correct App/Regulation versions.
- Reconcile the rest of the known source families and separate actual weapons/shields from ranged ammunition and parameter-only test rows before claiming full coverage.
- Do not misstate historical same-source formula agreement as current-game AR certification.
