# AR source-completeness safety gates — 2026-10-31

## Scope: reject corrupt/incomplete local compact parameter input

The weapon-data workbench accepts **locally imported, non-certified source JSON**. Exact numeric AR is calculated as research output only; this document does not certify any game client or patch. Our rule is that **source absence must not silently become a fabricated zero** when the source record itself is missing.

### Two corrected import boundaries

| Source condition | Previous behavior | Required behavior now |
|---|---|---|
| Entire `weapon.requirements` property missing/null | `requirements ?? {}` assigned five synthetic zeros and could calculate AR | **Reject** selected weapon/affinity conversion; no nominal AR or upgrade curve |
| Present *sparse* `requirements` object | Missing individual stat keys treated as zero | **Retain**, as explicit compact data may omit zero requirements |
| Numeric, positive `AttackElementCorrect` attribute override but `attributeScaling` for that attribute missing/zero | Converter emitted an enabled override with base scaling 0; AR arithmetic then treated its contribution as 0 | **Reject** input instead of silently producing a nominal AR |
| Numeric positive override with positive base scaling | Source scaling and override are both defined | **Calculate** under existing research formula, preserving floating-point order |
| Boolean enabled correction with zero base scaling | Explicit source correction is enabled, without a numeric override | Existing behavior unchanged; additional independent review required before game certification |

The independent raw-parameter parity probe already rejected a positive numeric override when its underlying base scaling was zero. The importer now fails the same case instead of disagreeing silently with the raw probe.

### CI regression

New `tests/ar-import-provenance-gates.test.mjs` uses **only fictional** synthetic weapons to check source rejection and unaffected math. Existing unit tests and desktop/mobile smoke should remain passing.

### Unchanged hard limits

- **408** community weapon records retained.
- **7** community-versus-source conflicts remain unresolved, with no forced adjudication.
- **0 approved game-client AR screenshot goldens**. No in-game AR certification.
- No extracted regulation tables, protected screenshots, or game artwork are committed to the repository.
- No paid API, backend, database or automatic external download is introduced.
- The workbench, validation plan and AR calculators remain **research-only/noindex**.

## Next verification that cannot be replaced by code

Issue #47 tracks actual in-game evidence. For an AR case, separately record the original menu reading, weapon/affinity/upgrade, complete five relevant stats, grip mode, App/Regulation version, local capture fingerprint and a second independent reviewer. A source-vs-source parity match is not a screenshot-based game-client golden. Do **not** promote a numeric match or local fingerprint to game certification.
