# Ten exact spell fields: current Regulation 1.17.3 public reference vs pinned legacy source (2026-11-01)

A manual sample of 10 precisely matching public source spell rows at [Almanauts current Regulation 1.17.3, build 25827938](https://almanauts.com/eldenring/spells/) was compared with the pinned deliton community JSON spell source. The current reference site returned HTTP 410 to automated GitHub Actions; its full 214-row HTML cannot be reliably retrieved by CI, so this audit **does not claim a 214-row automated cross-source scrape** or infer missing game values. Only 10 independently researched, explicitly dated public observations are pinned.

| Spell | Current public FP | Legacy FP | Result |
|---|---:|---:|---|
| Glintstone Pebble | 7 | 7 | match |
| Carian Slicer | 4 | 4 | match |
| Comet Azur | 40 | 40 | match |
| Black Flame | **18** | **15** | **outdated legacy** |
| Bloodflame Blade | 20 | 20 | match |
| Rock Sling | 18 | 18 | match |
| Catch Flame | 10 | missing by exact name | older roster incomplete |
| Heal | 32 | 32 | match |
| Terra Magica | 20 | 20 as *Terra Magicus* | renamed alias; do not silently rely on name equality |
| Ranni's Dark Moon | **57** | **62** | **outdated legacy** |

**Reconciliation:** 7 numerical comparisons agree (including the explicitly researched Terra Magicus → Terra Magica rename); 2 different FP costs; 1 absent by exact name; 0 additional slot or requirement differences among these cases.

Independent corroborations:
- [Black Flame — Eldenpedia](https://eldenring.wiki.gg/wiki/Black_Flame) reports FP 18 and a historical 15 → 18 undocumented earlier change.
- [Ranni's Dark Moon — Eldenpedia](https://eldenring.wiki.gg/wiki/Ranni%27s_Dark_Moon) reports FP 57, changed from 62 in patch 1.07.
- [Terra Magica — Eldenpedia](https://eldenring.wiki.gg/wiki/Terra_Magica) explicitly says the release name *Terra Magicus* was later renamed.
- [Almanauts spell table](https://almanauts.com/eldenring/spells/) is labelled Regulation 1.17.3, build 25827938 and lists FP, slots and requirements under that scope.

The reproducible original-source comparator is `scripts/audit-current-1173-spell-fp-ten.mjs` and its GitHub workflow: it independently reads only the pinned legacy public GitHub JSON and compares the 10 current published readings without rewriting either data source, downloading/copying the full competitor table, bypassing HTTP 410 or representing these observations as original game screenshots.

**Decision:** old community 169-spell source **cannot** be used to populate current-release FP costs without a fresh per-field current-version audit. All 169 source spell rows and 87 talisman effect descriptions remain source-only research. The 2026 current-source spell listing reports 214 entries, but that number alone cannot be interpreted as 214 independently implemented, licensed, correctly named spells. A full current-game or source-licensed spell/catalyst/buff/damage model is still blocked.
