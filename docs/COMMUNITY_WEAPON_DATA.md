# Community weapon database: provenance and limitations

307 real named Elden Ring weapons with community-reported numerical +0 facts.
Game regulation version of the source snapshot is NOT established; it is NOT a current-patch certified AR database.

Upstream repository: https://github.com/deliton/eldenring-api
Source: https://github.com/deliton/eldenring-api/blob/main/api/public/data/weapons.json
Source commit: 1d2626ceda5eb8c08997e345e303344a64edc106
Upstream API software license: MIT (api/LICENSE).
We copy only factual weapon names, type, unupgraded physical/elemental attack numbers, critical, requirements, scaling letter and weight.
No images, item descriptions, lore, code, icons, extracted regulation parameters or user-uploaded game files.
MIT software licensing does not establish a license over the game's intellectual property or commercial reuse rights for game assets.

Three independently cross-checked factual corrections:
- Royal Greatsword physical 112, magic 134 and critical 100: https://eldenring.wiki.gg/wiki/Royal_Greatsword
- Serpentbone Blade physical 120, critical 100: https://eldenring.wiki.gg/wiki/Serpentbone_Blade
- Star Fist critical 100: https://www.pushsquare.com/guides/elden-ring-all-weapons-list-and-weapon-locations

The source has two distinct Erdtree Seal rows with the same name, both flagged. Spiked Spear and Vulgar Militia Shotel include suspicious critical values, so no silent corrections were invented.
Records without warning flags are NOT independently verified. Some DLC weapons and balance changes are absent.
Base weapon attack is not player AR. Letter-grade scaling is insufficient for true AR math.
Research route remains noindex until independent current-patch validation and data-rights review.

Twelve source weapons have unknown '?' scaling grades. They remain '?' (not guessed) and are flagged in the UI; this is not a current-patch-verified scaling database.


## Shadow of the Erdtree partial factual additions (2026-10-30)

Added 57 named DLC armaments with categories and five minimum attributes, from https://consolepulse.com/multiplatform/elden-ring/guides/elden-ring-dlc-weapon-shield-locations . This is a PARTIAL selection, not a complete DLC list. All new DLC rows retain null weight, attack, critical and base scaling; their source supplies scaling for a different upgrade level and thus is not a valid +0 replacement. All new rows carry a source link and a prominent warning. They are searchable by name/category/requirements, while damage-type and weight filtering properly EXCLUDES unknown data. Totals: 307 base community numeric entries + 57 DLC requirements-only entries = 364. Never infer current-patch AR from any of them. All preview routes remain noindex.
