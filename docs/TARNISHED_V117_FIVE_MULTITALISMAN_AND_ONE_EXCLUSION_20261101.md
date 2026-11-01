# Actual v1.17 multi-talisman Build scenes — two independent browser reads (2026-11-01)

**Source:** [real public Chrome workflow 41291997231](https://github.com/garrison2025/Elden-Ring/actions/runs/41291997231). Site: Tarnished.dev public v1.17 (NOT a Regulation 1.17.3 game-client capture). Test conditions: Wretch, all eight raw base attributes 10; exactly the selected talismans in the stated order; no armor/weapons/other talismans, Great Rune, Physick or spells. Real PrimeReact option selection, final visible selected talisman chips and final computed inputs and outputs independently observed twice. All underlying exact fields and two evidence job IDs per row are pinned in `public/src/v117-talisman-combos-direct.mjs`.

## Five actual simultaneously equipped reference results

| Selected combination, left to right | Final eight character stats | Worn weight | Max load | HP | FP | Stamina | Discovery | Physical negation |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Starscourge Heirloom + Prosthesis-Wearer Heirloom + Stargazer Heirloom | 10/10/10/15/15/15/10/10 | 2.2 | 48.2 | 414 | 78 | 96 | 110 | 0% |
| Radagon's Soreseal + Erdtree's Favor +2 | 15/10/15/15/15/10/10/10 | 2.3 | 60.6 | 542 | 78 | 115 | 110 | -15% |
| Radagon's Soreseal + Marika's Soreseal | 15/15/15/15/15/15/15/15 | 1.6 | 56.1 | 522 | 95 | 105 | 115 | **-32.25%** |
| Great-Jar's Arsenal + Erdtree's Favor +2 | 10/10/10/10/10/10/10/10 | 3.0 | 61.9 | 430 | 78 | 105 | 110 | 0% |
| Silver Scarab + Marika's Scarseal | 10/13/10/10/10/13/13/13 | 2.0 | 48.2 | 414 | 88 | 96 | **188** | -10% |

All eight negation channels, four resistances and relevant physical/magic defenses are in the pinned evidence module. For both Soreseals the eight displayed negation values were -32.25%, NOT the additive -30%; this is a measured site result, not permission to apply this formula to all buffs or game versions.

## One empirically excluded pair — critical limitation

Selecting **Radagon's Scarseal**, then clicking **Radagon's Soreseal** did NOT leave both equipped. The real visible final selection contained **only Radagon's Scarseal**, weight 0.8, final VIG/END/STR/DEX 13 and -10% negation. Both separate Chrome runs reproduced the same result. Clicking a second option is NOT proof that it remains equipped. The local Build UI now explicitly withholds an exact equipment weight for the requested two-item combination rather than falsely summing 0.8 + 0.8 into an asserted valid 1.6 load.

The reverse click order, the corresponding Marika seal pair, other classes, weapon/armor effects, extra talismans and altered base stats were **not independently observed**. No such unobserved combination receives an exact site-proven score, effect stack, HP, stamina, max equip load or negation from these five goldens.

## What is actually implemented and tested

- Same-input Wretch10 matched in the exact observed talisman selection order: display real final eight stats, HP/FP/stamina/discovery, load, eight damage negations, 4 resistances and defense readouts.
- Outside precisely matching inputs, the combination reference table returns an explicit not-certified state. Existing isolated-item arithmetic previews retain their separate warning and cannot overwrite direct mixed results.
- The refused Radagon pair returns a restriction finding, not a fictitious +8 stacked stat bonus. `evaluateBuildLoadout` refuses exact total and roll tier for that pair.
- Targeted unit tests compare every pinned combination, the -32.25% all-channel figure, the 60.6/542/115 mixed case, source job uniqueness, disallowed combinations and context gates; Chromium smoke verifies 3 representative real page interactions.
- Remaining full-site blockers: all DLC armor metric inventory, competitor's unpublished 13-metric optimizer score/order, arbitrary talisman/Physick/rune stacks, full enemy defense/NG/moveset and spell/catalyst damage coefficients. These tests are not 100% parity of those areas.
