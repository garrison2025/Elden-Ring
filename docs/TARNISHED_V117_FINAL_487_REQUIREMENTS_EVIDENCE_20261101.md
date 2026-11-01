# 487 weapon minimum requirements — final two-tier evidence audit (2026-11-01)

## Scope and verified outcomes

Version-scoped audit against **Tarnished.dev public Build Planner reporting Elden Ring v1.17** and a separately pinned v1.17 community/game-parameter snapshot. This is an historical version comparison, **not current 2026-11 gameplay certification** and **not a license for copying game-derived data**.

[GitHub Actions: 487-entry source audit and direct Great epee recheck](https://github.com/garrison2025/Elden-Ring/actions/runs/41269449298). All jobs passed.

| Evidence tier | Items | Meaning |
|---|---:|---|
| **PUBLIC_SITE_TWICE + PINNED_VERSION_MATCH** | **460** | Exact weapon, affinity, actual stats, +0 and public v1.17 Req independently displayed twice; independently sourced v1.17 requirement tuple identical |
| **PINNED_VERSION_ONLY — not directly displayed** | **27** | Independent pinned v1.17 source contains a complete unambiguous tuple, but no accepted double-read public Req widget |
| No pinned numerical source | **0** | Every catalog name mapped to a unique, complete source row |
| Confirmed site-vs-pinned numeric disagreement | **0** across 460 | Does not imply 487/487 direct public site parity |

Sources and version tracking: snapshot pinned to commit `3539d87e446f3b9d5b94157f8a2023e28ffea7d2` in the ThomasJClark Elden Ring weapon calculator project, consumed only on explicit user action. It is **not** copied into the production site. The fixed version was used for the math comparison only.

The 27 non-direct records are individually preserved in `scripts/tarnished-v117-final-req-provenance-487-summary.json`. The complete 487-row source-vs-site evidence matrix was stored in the GitHub Actions artifact `v117-final-all-487-req-provenance`.

## Why 27 are source-only

**25** items have a historical candidate requirement no greater than any original starting class's relevant minimum; because Tarnished.dev hides `Req:` when requirements are met, lowering to another valid original class cannot trigger the warning. These items are not considered separately verified by the UI.

**Serpent-Hunter** has a directly verified active item and AR output at two stat presets, but the site does not render `Req:` for its 0/0/0/0/0 pinned requirement tuple. This is source-only, not zero inferred from an absent label.

**Frenzied Flame Seal** is the one **unresolved source conflict**: old bundled community values `0/0/0/10/10` differ from pinned v1.17 source `0/0/0/0/0`. A real Astrologer class-change attempt failed to render an acceptable Req field, so the fixed-source version's zero tuple must be presented strictly as `PINNED_VERSION_ONLY`, **not** a confirmed game-client or independent UI verification. Do not silently overwrite original community data.

## Independent fields are not certified by this table

- Weight evidence is a different per-weapon audit. The older weight audit had 481/487 directly observed; a separate six-name follow-up tests zero-weight items and Great epee with empty and Longsword positive controls.
- AR: a separate eight-input Icerind Hatchet precision audit showed 7/8 matches, with a one-point integer boundary difference at STR/DEX 60/60 (source-local float `183.99999999999997` vs displayed 184). It is preserved as a discrepancy, not hidden by a global epsilon.
- Other AR affinities, upgrade variants, armor, actual enemy damage, spells, status buildup, version 1.17.2/1.17.3 gameplay, third-party re-use rights and page-quality/SEO indexing must pass their own acceptance checks.
- Keep the research warning and `noindex` in place until a separate production-quality decision. Never present `487/487` source coverage as `487/487` direct webpage observations.

**Engineering result:** the requirement *source mapping audit* is closed with full transparency at 487/487, the *direct displayed-Req comparison* is 460/487 and UI-bounded at 27 not directly observed. No numbers were synthesized to force 100% direct coverage.
