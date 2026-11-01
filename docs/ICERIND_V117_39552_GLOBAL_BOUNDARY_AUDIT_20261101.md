# Icerind Hatchet — global rounding-correction candidate REJECTED (2026-11-01)

This is a **read-only** numeric audit, not a new gameplay-certified AR algorithm.

## Inputs and actual checks

[GitHub Actions full 39,552-case audit](https://github.com/garrison2025/Elden-Ring/actions/runs/41270394395) used all 3,296 variants of the pinned v1.17 public community regulation source, 12 distinct levels/attribute/grip scenarios per variant, the existing independent raw-source formula, and the local converted-profile formula.

| Test | Result |
|---|---:|
| Pinned-v1.17 source variants | 3,296 |
| Independent exact-source math cases | 39,552 |
| Existing local-vs-independent-source mismatches | **0** |
| Local raw-sum totals just below an integer (within 2 ulps) | **26** |
| Hypothetical near-integer ceil changes local AR | 26 |
| Hypothetical ceil disagrees with independent source math | **26** |

The Icerind Hatchet STR60/DEX60/INT30/FAI30/ARC30 +0, 1H case still produces raw physical `183.99999999999997`, local floor **183**, independently implemented raw source floor **183**, and the separately twice-observed Tarnished.dev public v1.17 UI **184**. The other seven independently observed Icerind site inputs matched the unchanged local engine.

## Engineering decision

Reject a global epsilon/next-representable-number/near-integer ceiling adjustment. It would reconcile this one external-site display case but diverge from independent raw source arithmetic in **26 of 39,552** model cases. The earlier global one-ULP test separately produced six regressions under a different narrower threshold; both risk measurements support the same *do not silently adjust globally* decision.

This evidence does not identify why Tarnished.dev renders 184 (operation-order, floating precision, or an independent presentation-rounding choice remain possible). Without a defensible version-wide semantics rule validated against new independent site goldens, keep the discrepancy openly listed.

No change to `public/src/weapon-ar.mjs`, versioned source, user input handling, `noindex`, or any 487-field weights/requirements certification.
