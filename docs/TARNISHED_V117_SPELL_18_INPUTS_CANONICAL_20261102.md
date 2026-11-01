# Tarnished.dev v1.17 — consolidated 18-input Spell Calculator acceptance (2026-11-02)

**Only numerical reference:** actual https://www.tarnished.dev/spell-calculator interactive result table, shown as Elden Ring Version: v1.17, independently captured twice for each input. This reconciles earlier **9-input** and **17-input** browser studies without discarding the extra INT20 sample from the already merged PR #161.

Tested: Wretch original stats 10 except INT, **Astrologer's Staff +25**, **Glintstone Pebble**, target site default zero defense/negation, no active effects; spell FP7, single bullet. Reference runs [17-point](https://github.com/garrison2025/Elden-Ring/actions/runs/41362826940), [four additional inputs with independent overlap](https://github.com/garrison2025/Elden-Ring/actions/runs/41362855674).

| INT | Actual Tarnished.dev | Independent local unadjusted formula | Difference (local minus site) | Result |
|---:|---:|---:|---:|---|
|20|219|219|0|Match|
|25|242|243|+1|One-point gap; existing output is site-calibrated only|
|30|267|267|0|Match|
|35|290|291|+1|One-point gap|
|40|315|315|0|Match|
|45|338|338|0|Match|
|50|363|362|−1|One-point gap|
|55|386|386|0|Match|
|60|410|410|0|Match|
|65|424|424|0|Match|
|70|438|438|0|Match|
|75|451|451|0|Match|
|80|465|465|0|Match|
|85|475|475|0|Match|
|90|484|484|0|Match|
|95|494|494|0|Match|
|98|499|500|+1|One-point gap|
|99|502|502|0|Match|

**Independent formula equality: 14 of 18 (77.78%). Four exact-input 1-point disagreements: INT 25, 35, 50 and 98.** They are not a uniform rounding shift, so no globally invented +1 or -1 is permitted. Existing INT25 exact-site adjustment remains explicitly marked as a calibration, NOT an independent model proof. The reference-only UI now offers exactly **18** directly observed INT results and refuses unobserved ones.

The nine-point study supplied INT20 (actual 219, independent 219); the seventeen-point study overlaps on **three** independently tested INT values 35, 45 and 55. Its 17 other points agree with previously recorded base inputs where covered. No contradictions were found in this observed overlap. The preservation of these separate studies is material to traceability: never infer the sandbox content or result values without the cited direct Chrome run artifacts.

Reproducible source files: `scripts/tarnished-v117-spell-18-consensus-goldens.json`, `scripts/tarnished-v117-spell-17-double-observed-goldens.json`, `scripts/tarnished-v117-four-new-spell-curve-goldens.json`, `tests/v117-spell-18-consensus-real-site.test.mjs`, `scripts/compare-tarnished-v117-spell-curve-17.mjs`. New code preserves independently computed catalyst math separately from real site data.

**Still not finished:** universal spell/catalyst/enemy modifier formulas, exact Tarnished.dev Armor Optimizer ranked/tied 13-metric results, real-site enemy/weapon moveset DPS, arbitrary Build equipment effect stacks. The prior PR #159 local algorithms continue to run, but this acceptance scope does **not** certify complete functional parity. Do not repeat previous green checks as proof of these unimplemented behaviors.

This project has **no paid external API, backend or on-site data fetch until explicit user opt-in** for public v1.17 parameters.
