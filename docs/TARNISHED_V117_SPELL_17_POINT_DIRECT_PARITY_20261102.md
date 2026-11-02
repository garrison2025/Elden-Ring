# Tarnished.dev v1.17 Spell Calculator: 17-point actual same-input numerical acceptance (2026-11-02)

> **Historical audit as of the original fractional-scaling formula.** This document's 13/17 and four one-point gaps preserve the original evidence only; they are **not** the current calculator state. The unified site-accurate rule `Math.round(Math.trunc(sorceryScaling) * spellCoefficient * defenseMultiplier)` fixes all four input discrepancies without per-INT patches. See [TARNISHED_V117_SPELL_ONE_POINT_UNIFIED_ROUNDING_FIX_20261102.md](TARNISHED_V117_SPELL_ONE_POINT_UNIFIED_ROUNDING_FIX_20261102.md) for current math and 18/18 source inputs.

Only comparator: **https://www.tarnished.dev/spell-calculator** actual rendered interactive output (v1.17). No additional sites or game-client certification are required to mark a same-input result. This is **not** a claim of general spell or full website parity.

## Real measured conditions

Wretch original stats all 10 except INT; real selected Astrologer's Staff, Glintstone Pebble, smithing +25 / somber +10, no additional active effects, site’s default zero-defense/zero-negation target. Fresh independently started Chrome sessions, **two independently read numerical outputs at every one of 17 INT settings**: [GitHub Actions run 41362826940](https://github.com/garrison2025/Elden-Ring/actions/runs/41362826940), artifacts and logs. Exact recorded fields: selection tokens, effective stats, version, FP=7, one projectile, visible Magic damage. False/missing rows cause audit failure.

| INT | Actual Tarnished.dev | Independent local source-math (without case-specific correction) | Delta (local − site) | Conclusion |
|---:|---:|---:|---:|---|
|25|242|243|+1|**Unresolved source-math gap**; old exact-site correction is explicitly tagged as calibrated|
|30|267|267|0|Match|
|35|290|291|+1|**Unresolved source-math gap**|
|40|315|315|0|Match|
|45|338|338|0|Match|
|50|363|362|-1|**Unresolved source-math gap**|
|55|386|386|0|Match|
|60|410|410|0|Match|
|65|424|424|0|Match|
|70|438|438|0|Match|
|75|451|451|0|Match|
|80|465|465|0|Match|
|85|475|475|0|Match|
|90|484|484|0|Match|
|95|494|494|0|Match|
|98|499|500|+1|**Unresolved source-math gap**|
|99|502|502|0|Match|

**Actual independent uncalibrated formula parity: 13/17 = 76.5%.** Four real one-point disagreements: INT25, 35, 50, 98. The signs are not uniform (+1,+1,-1,+1), so applying a global extra rounding/floor/ceil step is not justified. Do not hardcode four corrections into the *general* calculator. INT25's existing exact scenario site correction remains transparent and explicitly separate from the independent equation. All other reference-only outputs are now available in the exact-input lookup without extrapolation. Unmeasured INT remains "NOT OBSERVED" in the reference panel.

## Release scope and remaining deficits

- This PR improves the **Spell Calculator's observable source coverage and regression depth**, not arbitrary catalysts/spells/targets.
- Real source-level formula for a single Glintstone Pebble + staff combination remains separate from the 17 source observations and flags mismatches honestly.
- The four-module work from merged PR #159 remains deployed: exact local top-five Poise optimization, user-input frame damage sequences, source-derived Glintstone Pebble model, limited talisman-effect composition. **Full Tarnished.dev parity is still NOT established** for all four.
- Our site must not assert completed DPS, complete armor optimizer tie ranking, all 13 metric scoring, generic spell scaling or arbitrary equipment effect stacks.

## Evidence files

- `scripts/tarnished-v117-spell-17-double-observed-goldens.json` — fixed 17 real-site readings and local formula status.
- `scripts/probe-tarnished-v117-spell-curve-17.mjs` — two real Chrome sessions with 17 current INT inputs each.
- `scripts/compare-tarnished-v117-spell-curve-17.mjs` — independently reproduces the model for all 17 direct site observations.
- `tests/v117-spell-17-two-browser-parity.test.mjs` — fail-closed source/provenance/regression checks.

**Next actual programming requirement to reach formula equality:** resolve its INT-dependent game calculation/rounding stages for all 17 with one independently specified formula, *then* validate out-of-sample INT configurations and multiple catalysts. Arbitrary per-INT lookup values count as source observations only, not algorithm completion.
