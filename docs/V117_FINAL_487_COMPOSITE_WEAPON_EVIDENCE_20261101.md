# Final 487-weapon cross-module v1.17 reference data admission check (2026-11-01)

[Verified GitHub Actions run](https://github.com/garrison2025/Elden-Ring/actions/runs/41270772136) joined **the actual user-facing direct-weight lookup**, independently pinned v1.17 +0 neutral attack/Req overlay and canonical weapon database. This is not merely three previously published headline counts: every canonical record is joined by ID and name; missing, duplicate, wrong-version or mismatched effective fields fail CI.

| Criterion | Actual result |
|---|---:|
| Catalog entries / unique names | **487 / 487** |
| Direct public v1.17 weight records, twice observed | **487 / 487** |
| Of those, legitimate zero-weight items | **5** |
| Independently source-mapped neutral +0 attack vectors | **487 / 487** |
| Independently source-mapped five-stat min requirement tuples | **487 / 487** |
| Five-stat Req also shown twice on the public v1.17 page | **460 / 487** |
| Requirement tuples available only from pinned source | **27 / 487** |
| Missing/ambiguous source mapping, missing weight, duplicate name | **0** |
| Mismatched attack or requirement fields in effective v1.17 comparator | **0** |
| Historical community weight differing from directly observed comparator | **4**, kept separately, not rewritten |

The CI audit is `scripts/audit-v117-composite-487-weapon.mjs`; the workflow writes a privacy-safe **aggregate** `.audit/v117-composite-487-weapon-acceptance.json`, not the raw 3,296-variant source data.

## Exactly what is now complete

The browser-only website's **v1.17 neutral, unupgraded weapon reference catalog** can draw a nonmissing, version-qualified weight, neutral +0 base-attack vector and five-attribute minimum requirement from these **distinct evidence tiers**. The 27 pinned-only requirements remain unobserved in Tarnished.dev's conditional Req display. A historic community value disagreement on Frenzied Flame Seal's FAI/ARC remains visible as a source conflict; its pinned v1.17 neutral requirements are not independently observed.

## What this still does NOT pass

- **AR total at all stat/upgrade/affinity/grip combinations:** 86 previously approved direct cases, 347/348 additional +0 direct comparisons, and independent 39,552-case source arithmetic parity. The Icerind Hatchet site 184 vs local/source 183 case is still a visible comparator discrepancy. A global floating-point fix was rejected after the 26-case independent source mismatch analysis.
- **Current App 1.17.2 / Regulation 1.17.3 game client**: the comparison data here remain historical v1.17.
- **Per-weapon five-component +0 attack vectors:** accepted from a pinned source, **not** independently displayed component-by-component on Tarnished.dev for all 487.
- **External legal/redistribution rights**, enemy damage, spell scaling, full armor equipment/effects, buff/status/PvP behavior, browser UX completeness and production indexing gates: **not approved** by this composite audit.
- The live-site research noindex and opt-in source download safeguards remain unchanged.

**Disposition:** v1.17 neutral weapon reference **data association** is complete, but the complete Elden Ring tool suite is NOT yet production-validated. Different numerical fields must not be assigned the same verification status.
