# Remaining Damage and Spell same-input validation — actual public table audit (2026-11-01)

The website reference is Tarnished.dev public **v1.17**, not an authoritative 1.17.3 game-client capture. This read-only test directly opens `/damage-calculator` and `/spell-calculator`, captures the real input/search controls and clicks **Show Table** with a real Chromium pointer if available, recording DOM rows and visible outputs. It does **not** revisit past AR, armor, Build level or rune goldens. No invented weapon/moveset/spell candidate is supplied.

The verified prior underlying source scan (`docs/SPELL_TALISMAN_ENEMY_PINNED_SOURCE_COVERAGE_20261101.md`) established: 169 spell records have FP/requirements but zero structured spell damage multipliers, 87 talismans have no structured numeric effect multipliers, and 221 boss/creature records have no structured enemy defense values. Hence a no-weapon or no-spell table, even if visible, **cannot** demonstrate a same-input numeric damage or spell parity.

This workflow is the final explicit gate: only a result with exact weapon/affinity/upgrade, enemy/NG/move and effects (or spell/catalyst+stats) plus actual numeric output could justify a parity assertion. Until then, Damage/Spell remain manual/reference estimates, not site-matched. Do not try to fill the missing multipliers from textual descriptions.
