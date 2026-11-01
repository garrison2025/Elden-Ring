# Remaining Damage and Spell same-input validation — actual public table audit (2026-11-01)

The website reference is Tarnished.dev public **v1.17**, not an authoritative 1.17.3 game-client capture. This read-only test directly opens `/damage-calculator` and `/spell-calculator`, captures the real input/search controls and clicks **Show Table** with a real Chromium pointer if available, recording DOM rows and visible outputs. It does **not** revisit past AR, armor, Build level or rune goldens. No invented weapon/moveset/spell candidate is supplied.

The verified prior underlying source scan (`docs/SPELL_TALISMAN_ENEMY_PINNED_SOURCE_COVERAGE_20261101.md`) established: 169 spell records have FP/requirements but zero structured spell damage multipliers, 87 talismans have no structured numeric effect multipliers, and 221 boss/creature records have no structured enemy defense values. Hence a no-weapon or no-spell table, even if visible, **cannot** demonstrate a same-input numeric damage or spell parity.

This workflow is the final explicit gate: only a result with exact weapon/affinity/upgrade, enemy/NG/move and effects (or spell/catalyst+stats) plus actual numeric output could justify a parity assertion. Until then, Damage/Spell remain manual/reference estimates, not site-matched. Do not try to fill the missing multipliers from textual descriptions.

## First actual numeric reference rows (2026-11-01)

Two separate real Chromium passes now selected **Uchigatana** on the public Damage calculator, and **Glintstone Pebble + Astrologer's Staff** on the public Spell calculator. After actual PrimeReact multiselect interactions, the rendered reference tables (rather than source estimates) contained:

| Reference feature | Explicit input | Actual public v1.17 output | Comparator state |
|---|---|---|---|
| Damage weapon AR | Wretch; STR15 DEX20, other attributes 10; Uchigatana; Standard; smithing +25 (default), NG+0/Default enemy, no activated effects | Physical AR **376**, total AR **376**, Poise **5** | Can be independently recalculated using the pinned public v1.17 AR engine |
| Damage displayed DPS | Same selected weapon/profile | Single DPS **464**, Paired DPS **547** | **NOT site-parity certified**: the reference's attack speed and moveset/timing derivation were not captured; our manual attacks-per-second is not the same input |
| Spell offensive | Wretch INT25 others 10, **Glintstone Pebble**, **Astrologer's Staff**, default +25 smithing/+10 somber upper controls; site's enemy zero defenses/negations | Magic **242**, bullet amount **1**, FP **7**, INT req **10** | **NOT site-parity certified**: no independent spell/catalyst scaling source in our production engine |

The actual reference's client-side interactive result rows are virtualized and are **not** standard HTML `<table>` elements. Their visible text was read after actual option selection. Raw chronological browser logs and artifacts: [actual sample run](https://github.com/garrison2025/Elden-Ring/actions/runs/41284568837); [earlier independent selection](https://github.com/garrison2025/Elden-Ring/actions/runs/41284358487). The immutable hand-recorded numeric goldens and exact input states are stored in `scripts/tarnished-v117-damage-spell-new-live-goldens.json`.

Important: reference website itself declares both Damage and Spell calculators unfinished/work in progress. A single scenario benchmark and AR agreement are **not** coverage of all enemies, NG cycles, attack movesets, catalysts, spells, buffs, or patch 1.17.3.
