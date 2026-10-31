# Tarnished.dev v1.17 — 15/15 independently calculated AR matches (2026-10-31)

## Verification result

**15 of 15 exact same-input, same-output integer AR matches, difference 0 across all cases** between our independent v1.17 AR engine and the live rendered public Tarnished.dev build planner.

- Browser source first input-verified: https://github.com/garrison2025/Elden-Ring/actions/runs/41180592038
- Separately repeated real Chromium browser run: https://github.com/garrison2025/Elden-Ring/actions/runs/41180757356
- Independent pinned public v1.17-source numeric computation: https://github.com/garrison2025/Elden-Ring/actions/runs/41180757347
- All 15 browser cases had page version v1.17, correct weapon/affinity/upgrade/STR/DEX/INT/FAI/ARC/grip controls, zero activated Great Rune and Physick.
- Separately, 3296 source weapon variants were converted and 39,552 **internal pinned-source mathematical** cases passed, with zero mismatches. The 39,552 checks are **NOT** competitor-site comparisons.
- No actual game client was used. This is representative v1.17 reference benchmark parity, not a current Regulation 1.17.3 client accuracy certification or complete coverage of all available affinities.

## Complete 15-case matrix

INT and ARC = 10 in every case. FAI = 10 unless explicitly listed. Scadutree level 0; no activated buffs. Every displayed AR was captured from the real site's rendered UI and then independently computed with the fixed public v1.17 source.

| Weapon | Affinity + upgrade | STR | DEX | FAI | Grip | Tarnished.dev AR | Our AR | Delta |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Uchigatana | Standard +0 | 40 | 40 | 10 | 1H | 172 | 172 | 0 |
| Uchigatana | Standard +0 | 12 | 15 | 10 | 1H | 133 | 133 | 0 |
| Uchigatana | Standard +25 | 40 | 40 | 10 | 1H | 491 | 491 | 0 |
| Uchigatana | Keen +25 | 40 | 40 | 10 | 1H | 488 | 488 | 0 |
| Uchigatana | Standard +0 | 40 | 40 | 10 | 2H | 180 | 180 | 0 |
| Longsword | Standard +0 | 10 | 10 | 10 | 1H | 120 | 120 | 0 |
| Longsword | Standard +25 | 40 | 40 | 10 | 1H | 452 | 452 | 0 |
| Longsword | Heavy +25 | 60 | 20 | 10 | 1H | 495 | 495 | 0 |
| Greatsword | Standard +0 | 31 | 12 | 10 | 1H | 211 | 211 | 0 |
| Greatsword | Heavy +25 | 60 | 12 | 10 | 1H | 745 | 745 | 0 |
| Greatsword | Heavy +25 | 60 | 12 | 10 | 2H | 839 | 839 | 0 |
| Claymore | Quality +12 | 30 | 30 | 10 | 1H | 337 | 337 | 0 |
| Dismounter | Keen +25 | 19 | 72 | 10 | 1H | 666 | 666 | 0 |
| Fire Knight's Greatsword (DLC) | Standard +0 | 30 | 25 | 20 | 1H | 235 | 235 | 0 |
| Fire Knight's Greatsword (DLC) | Standard +25 | 30 | 25 | 20 | 1H | 632 | 632 | 0 |

## Test scope and release interpretation

Coverage includes six weapon families, four affinities (Standard, Keen, Heavy, Quality), three reinforcement stages (+0/+12/+25), single/two-handed grips, distinct stat allocations and Shadow of the Erdtree DLC weapons.

Passed: the pinned v1.17 **reference calculation engine** for this representative 15-case suite; no need to install the game, use paid APIs or copy competitor code.

Not established: all weapon/affinity combinations, somber +10, status buildup, ash damage, enemy post-defense damage, PvP, spell catalyst correction or original 1.17.3 game-client certification.

Implementation: public/src/tarnished-reference-benchmark.mjs; scripts/audit-v117-pinned.mjs; scripts/probe-tarnished-ui.mjs; .github/workflows/tarnished-public-benchmark.yml. The private external website's code, images, and proprietary full data were not downloaded into our repo.

End-user evidence: /validation-status/. Local, optionally retrieved reference calculation: /weapon-data-workbench/.
