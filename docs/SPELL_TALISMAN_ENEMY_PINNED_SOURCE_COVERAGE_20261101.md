# Spell, talisman and enemy source triage (2026-11-01)

Actual pinned community raw-source inventory checked in [GitHub Actions 41271971311](https://github.com/garrison2025/Elden-Ring/actions/runs/41271971311). Exact revision: deliton/eldenring-api `3d9cefcfcda7066796b9553825449039c2073926`, the same source lineage used by the optional armor optimizer. No raw JSON, item art, description, game-client files or third-party tables are imported into this repository.

| Resource | Unique IDs / records | Numeric fields directly provided | Critical data not provided |
|---|---:|---|---|
| Sorceries | 71/71 | FP cost 71, slots 71, requirements arrays 71 | **0 structured numeric spell scaling, damage multipliers or status buildup; no separate damage-type field** |
| Incantations | 98/98 | FP cost 98, slots 98, requirements arrays 96 | **0 structured numeric spell scaling, damage multipliers or status buildup; two missing requirement arrays** |
| Talismans | 87/87 | Textual effect description 87 | **0 structured numeric effect multipliers, 0 stacking-rule fields** |
| Bosses | 106/106 | Health Points reported as **text** on 105 rows, not reliably numeric | **0 structured enemy defense/negation fields; duplicate display names 2** |
| Creatures | 115/115 | Name/description/location and drops where published | **0 numeric defense, 0 numeric HP; duplicate display names 3** |

**Interpretation:** We located **169 spell records, 87 talisman records and 221 boss/creature records** as *pinned community metadata*, not as current Regulation 1.17.3 spell-damage, PvE damage or passive-effects goldens. Source rosters are not necessarily exhaustive for all DLC/Tarnished Pack additions, and public JSON access is NOT permission to redistribute game-derived text, images or data.

This audit explicitly blocks four invalid substitutions:
1. Spell FP cost or attribute requirements **cannot** substitute for sorcery/incantation scaling or damage motion value.
2. A textual talisman `effect` **cannot** establish numeric percentage, stack order or activation conditions.
3. Boss string `healthPoints` **cannot** substitute for a structured set of physical/elemental defense and negation.
4. A game-data source revision pinned by Git SHA **does not** prove the game regulation version or client capture.

The source-integrity result is permanently available in `scripts/pinned-spell-talisman-enemy-source-summary.json` and the five raw fetch metadata in the associated Actions logs. Non-verified fields remain `UNKNOWN` and no new site indexing or real combat damage claim is permitted.

To finish real spell/damage accuracy, a versioned, legal, independently checkable source for actual spell ratios / catalyst upgrade scaling / talisman modifiers / enemy per-type defense and effective attack stages is still required, followed by exact-input external or original-client checks. The current source cannot supply those fields.
