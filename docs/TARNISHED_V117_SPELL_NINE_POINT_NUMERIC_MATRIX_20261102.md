# v1.17 Spell rounding analysis: 9 real same-input Tarnished.dev scenes — 2026-11-02

## Exactly one numerical comparator

The only authority for an acceptance value is the **real public [Tarnished.dev Spell Calculator](https://www.tarnished.dev/spell-calculator) v1.17**, independently observed in two Chromium sessions each, with verified effective Wretch INT, other seven attributes 10, Astrologer's Staff, Glintstone Pebble, site standard smithing +25, default 0 target defense/negation and no other equipment effects.

The independent source model reads pinned v1.17 catalyst scaling parameters **only after user action**. It derives:
`source output = floor(152 × [1 + INT scaling factor 0.89 × reinforcement factor 3 × correctionGraph(INT)] × defenseMultiplier(0))`. It does NOT derive these results by copying Tarnished.dev reference rows.

| Wretch INT | Tarnished.dev v1.17 (two actual browser reads) | Unadjusted local formula | Local − site | Exact classification |
| ---: | ---: | ---: | ---: | --- |
| 20 | 219 | 219 | 0 | INDEPENDENT_SOURCE_MATCH |
| 25 | 242 | 243 | +1 | SITE_ONLY_EXACT_CALIBRATION; unadjusted model mismatch |
| 30 | 267 | 267 | 0 | INDEPENDENT_SOURCE_MATCH |
| 35 | 290 | 291 | +1 | **UNRESOLVED_MODEL_MISMATCH** |
| 40 | 315 | 315 | 0 | INDEPENDENT_SOURCE_MATCH |
| 45 | 338 | 338 | 0 | INDEPENDENT_SOURCE_MATCH |
| 50 | 363 | 362 | −1 | **UNRESOLVED_MODEL_MISMATCH** |
| 55 | 386 | 386 | 0 | INDEPENDENT_SOURCE_MATCH |
| 60 | 410 | 410 | 0 | INDEPENDENT_SOURCE_MATCH |

**6/9** values match the source model without any special adjustment. **3/9** do not. Site INT25 is *visibly marked calibrated*, NOT independently matched. No plausible single constant +1/-1 adjustment can fix INT25,35,50 and preserve the other six.

## Browser evidence

- INT25, 30, 40: [two-browser real-site run](https://github.com/garrison2025/Elden-Ring/actions/runs/41297001066)
- INT50, 60: [two-browser run](https://github.com/garrison2025/Elden-Ring/actions/runs/41361280757)
- INT20, 35, 45, 55: [two-browser run](https://github.com/garrison2025/Elden-Ring/actions/runs/41362855674)
- Source evidence is now in `scripts/tarnished-v117-four-new-spell-curve-goldens.json`, `scripts/tarnished-v117-pebble-int-50-60-fresh-browser-goldens.json`, `scripts/tarnished-v117-residual-3x2-observed-goldens.json`.
- Pure reproducibility and source-label tests: `tests/v117-nine-spell-source-observations.test.mjs`. Real-browser fresh independent reader: `scripts/check-v117-four-new-spell-curve.mjs`.

## What this fixes and what it does not

1. Expands strictly measured result lookup from 5 to 9 actual inputs with correct version/control provenance, without guessing values between them.
2. Separates actual site output from pure model calculation; the UI can display mismatches under exactly matching inputs.
3. Adds four cases that span the 18-to-60 INT correction curve (20,35,45,55), identifying a previously unknown **INT35 +1 model discrepancy**.
4. Leaves the INT25 exact-site override visibly limited and INT35/50 mismatches unsolved. This is a real outstanding algorithm problem and **not a claim of complete generic Spell Calculator parity**.

Numerical web-side parity for arbitrary catalysts, status effects, enemies and all spells remains unverified. Existing Armor ranking, enemy/moveset DPS and arbitrary Build stacks are separate unfinished feature areas. Successful CI verifies honest record integrity and browser operation, not 100% site equivalence.
