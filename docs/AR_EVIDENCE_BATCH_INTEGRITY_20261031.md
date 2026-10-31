# Offline AR observation batch integrity — 2026-10-31

## Why this hardening is necessary

A locally typed AR number, a self-described App/Regulation version, and a SHA-256 file fingerprint are **not** evidence that a value has been inspected in a genuine current-game client. The existing tools already label all exports `UNREVIEWED`, `gameClientVerified:false` and `publicationApproved:false`. This patch tightens **consistency inside the still-unreviewed package**, without pretending to replace human visual verification.

## Enforcement matrix

| Gate | New behavior | Why |
|---|---|---|
| Test-plan origin | Export requires `sourceProvenanceStatus:'manual-unverified'`, `synthetic:false`, an explicit source version and supported levels | A plan's label alone cannot be used to bypass research provenance |
| Individual planned test | Requires matching weapon name, `UNREVIEWED`/false flags, null observation/evidence placeholders, and a source-present upgrade step | Prevents mixing rewritten or unsupported plan rows into a batch |
| Evidence references | Case-insensitively unique across submitted scenarios | One screenshot reference should not be counted as separate observations |
| Screenshot SHA-256 | One hash for at most one case per batch, even when filenames differ | Prevents the *same bytes* being counted twice under different screenshot filenames |
| Standalone draft recheck | Validates any attached fingerprint's strict metadata and filename against the observation | Single-case recheck previously skipped checks performed for batch recheck |
| Batch summary | `plannedCases`, `numericalMatches`, `fingerprintedCases`, weapon and source labels must agree with submitted records | A forged summary should not be accepted as an accurate tally |
| Batch row provenance | Every case name and parameter source version must equal its batch identity | Mixed-weapon/version evidence is not silently conflated |
| Damaged individual batch entry | Returns `recheck-rejected` with a reason while retaining independent valid rows | One bad row does not silently disappear or certify unaffected cases |

These constraints apply to **export and offline recheck** of locally prepared JSON. They do not authenticate screenshot contents or infer whether two screenshots depict the same game state. A hash proves only identical file bytes when a local original is provided; a hash **string in a JSON file can be fabricated**.

## What remains unchanged

- **408** community weapon rows; **7** unresolved v1.17 source conflicts.
- **0 independently approved game-client AR screenshot goldens**.
- All candidate values remain `UNREVIEWED`; even perfect numeric agreement is not certification.
- No pictures, game param bundles, new paid services, servers, or persistent file storage added.
- Source code tests use deliberately fictional weapon inputs and fabricated *metadata*, not real-game observations.
- Research-only/noindex treatment remains in force.

## Actual game-client verification

Follow [Issue #47](https://github.com/garrison2025/Elden-Ring/issues/47) and `docs/AR_VALIDATION.md`. A genuine review needs original locally retained screenshots, readable exact weapon, affinity/upgrade, complete five combat stats, grip, App version and Regulation version, a separately reviewed in-game AR number, and source licensing and release review. More test code cannot substitute for those artifacts.

## Regression

`tests/ar-evidence-batch-integrity.test.mjs` exercises duplicate references, repeated screenshot hashes, forged summary counters, mixed source/weapon cases, tampered single-case fingerprints and intact synthetic arithmetic. Run `npm run check` and the desktop/mobile Chrome browser smoke workflow.
