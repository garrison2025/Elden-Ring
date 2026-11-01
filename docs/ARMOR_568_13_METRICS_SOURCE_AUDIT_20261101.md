# 568 armor records × 13 numeric metrics — pinned-source integrity audit (2026-11-01)

> **2026-11-01 later amendment:** The first frozen snapshot below reports 7,325/7,384, with 59 unknown cells. PR #128 fixed a verified signed-defense parsing bug: 41 negative negations are valid, giving **7,366/7,384 source-readable cells, 18 malformed/unknown**. This original baseline is preserved for reproduction. The remaining 18 were individually compared to a separate public armor source, **but are not auto-filled**; see [18-field secondary audit](ARMOR_18_CORRUPTED_FIELDS_SECONDARY_REFERENCES_20261101.md).

[GitHub Actions full pinned-source audit](https://github.com/garrison2025/Elden-Ring/actions/runs/41271717697) fetched **exactly the pinned upstream deliton/eldenring-api JSON revision**, verified each ID and category, and inspected thirteen selected source-reported numeric armor metrics without distributing third-party item descriptions/art or copying the source table.

| Provenance / field | Result |
|---|---:|
| Unique community armor records | **568 / 568** |
| Head / Chest / Arms / Legs | 167 / 203 / 94 / 104 |
| Source-reported weight | **568 / 568** |
| Source-reported Poise | **565 / 568** |
| Number of per-piece metrics | 13 |
| Total cells | **7,384** |
| Valid source numeric values | **7,325** |
| Missing/ambiguous source numeric values | **59** |
| Invalid or out-of-range source cells accepted as numeric | **0** |
| Duplicate display names in same slot | **1** (remain ambiguous; no fabricated disambiguation) |
| Independent real-game original-client evidence | **0** |
| Independent Tarnished.dev per-piece armor measurements | **0** |
| Commercial game-data redistributability approval | **Not established** |

Metric-specific remaining unknown cells:

| Source-reported field | Known / 568 | Missing |
|---|---:|---:|
| Poise | 565 | 3 |
| Immunity | 568 | 0 |
| Robustness | 568 | 0 |
| Focus | 568 | 0 |
| Vitality | 565 | 3 |
| Physical negation | 562 | 6 |
| Strike negation | 556 | 12 |
| Slash negation | 563 | 5 |
| Pierce negation | 563 | 5 |
| Magic negation | 562 | 6 |
| Fire negation | 559 | 9 |
| Lightning negation | 563 | 5 |
| Holy negation | 563 | 5 |

Report stored as `scripts/armor-568-thirteen-metric-integrity-summary.json` with exact pinned commit metadata. The site already excludes unknown fields from per-metric optimization instead of silently setting them to zero.

**Evidence tier: SOURCE DATA FIELD INTEGRITY ONLY.** Neither the 568 names nor 7,325 reported numeric values have been independently checked against a current Regulation 1.17.3 game client, an external armor website under identical conditions or legal redistribution permission. Derived armor optimization results remain community-source mathematical models, not real-game certified values.

The critical next data tasks are verifying disputed/missing 59 source cells from an independent published source where available, and obtaining actual current-game menu evidence for material high-traffic armor sets; missing values cannot simply be guessed.
