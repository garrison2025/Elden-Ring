# Tarnished.dev v1.17 — Icerind Hatchet floating-point boundary diagnosis (2026-11-01)

Eight exact-input +0 one-handed Icerind Hatchet `None` configurations were read directly from real public rendered Build Planner pages in **two separate headless Chromium runs**. All selected names, five attribute controls, +0 smith/somber, version v1.17 and inactive Rune/Physick were validated.

- [Direct site evidence, repeated browser reads and pinned source math comparison](https://github.com/garrison2025/Elden-Ring/actions/runs/41268333282)
- Permanent summary of observed public totals and local raw physical floats: `scripts/tarnished-v117-icerind-eight-case-comparison.json`.

| STR | DEX | INT/FAI/ARC | Site total AR | Unmodified local AR | Delta local−site |
|---:|---:|---|---:|---:|---:|
| 60 | 60 | 30/30/30 | **184** | **183** | **−1** |
| 60 | 59 | 30/30/30 | 183 | 183 | 0 |
| 59 | 60 | 30/30/30 | 183 | 183 | 0 |
| 20 | 20 | 10/10/10 | 140 | 140 | 0 |
| 30 | 30 | 10/10/10 | 153 | 153 | 0 |
| 40 | 40 | 10/10/10 | 165 | 165 | 0 |
| 99 | 99 | 99/99/99 | 202 | 202 | 0 |
| 12 | 16 | 10/10/10 | 133 | 133 | 0 |

**7/8 matched; 1/8 mismatch**, repeated twice. The mismatch's calculated raw physical amount was `183.99999999999997`, one floating-point representational step below the integer 184, so `Math.floor` yielded 183. The two neighboring settings (59/60 and 60/59) both matched exactly, while max stats and moderate cases matched.

## Engineering boundary

The evidence is consistent with a floating-point boundary/operation-order difference. It is **not** enough to prove the exact rounding algorithm used by Tarnished.dev or the game. A previous whole-engine one-ULP workaround was correctly reverted after creating six regressions in 39,552 source-math comparisons. Do **not** reintroduce a global epsilon or hardcode an entire weapon's AR based on one point. The accepted result remains the original 347/348 expanded cases, with one known exception. The 8-case grid provides **new tested inputs** but does not replace the prior 348-case fixture.

This PR updates diagnostic evidence only: it does not change `public/src/weapon-ar.mjs`, input profiles, third-party data rights or `noindex`.
