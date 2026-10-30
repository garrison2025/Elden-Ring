# Independent v1.17 arithmetic parity audit (research only)

This adds an on-demand, **whole-imported-dataset** arithmetic comparison to the browser-only, noindex Weapon Data Workbench. It does not ship game parameter files.

## Two algorithms sharing only parameter data

1. **Raw-source reference** (`public/src/regulation-parity.mjs`): evaluates the compact JSON's original damage/attribute pairs, individual reinforcement factors, attack-element correction, stat curves and grip directly, without building a `weapon-ar.mjs` profile.
2. **Our conversion/engine**: `convertCompactRegulation` → `calculateAr`, with distinct precomputed correction curves, explicit profile parameter validation and damage-component rounding.

For each source variant, four scenarios are exercised:
- Low stats, +0, one-handed;
- High stats, last supplied reinforcement, one-handed;
- High stats, last supplied reinforcement, two-handed;
- Very low stats, +0, two-handed.

The check compares raw physical/magic/fire/lightning/holy component amounts (tolerance 1e-6), floored nominal total and effective STR. The report gives **conversion coverage, cases executed, mismatches, unsupported cases, anonymous source indices**, and optional downloadable aggregated JSON. Source names, original parameter records and golden AR values are *not exported*. Runtime is in a Worker, no paid API. The audit must run only after the user clicks its button; external pinned v1.17 loading remains explicitly opt-in.

## First external historical AR observations — 2026-10-31

Three externally posted, numeric **Heavy Greatsword +25** AR claims from 2024 were checked against the same pinned 1.17 compact source, using our actual `convertCompactRegulation → calculateAr` implementation:

| User-reported setup | Player-reported AR | Public report |
| --- | ---: | --- |
| 54 STR, two-handed | 826 | https://www.reddit.com/r/Eldenring/comments/1ahuhm4/ |
| 66 STR, two-handed | 853 | https://www.reddit.com/r/Eldenring/comments/1ahuhm4/ |
| 91 STR, one-handed | 841 | https://www.reddit.com/r/Eldenring/comments/1dxyvfs/ |

The posts do not fully specify all non-Strength attributes; DEX was conservatively set to 12 (the Heavy Greatsword's requirement), and INT/FAI/ARC to 10. In this affinity those have no attack scaling and no AR effect when requirements are met. They are **not quoted character sheets** and **not screenshot-certified game observations**. The 2024 client version may differ from 1.17. Test results are properly called **historical reported AR parity**. The model, not the posts, determines the exact source-version calculation. The distinct external observations are **not** the same as the 13,184 raw-vs-converted math cases that share one source. This evidence strengthens regression confidence, but **does not** permit current-patch game-certification or public search release.

The CI `npm run audit:real-v117` now checks all three against the pinned 1.17 JSON and emits `.audit/v117-historical-player-reports.json` containing only aggregate counts and sample IDs for failures, never source data or per-weapon calculated AR values. If a future calculation differs it fails rather than silently editing external evidence. Official patch note for 2026-10-20 says **App 1.17.2 / Regulation 1.17.3** (https://en.bandainamcoent.eu/elden-ring/news/elden-ring-patch-notes-version-1172). Community parameter comparison reports no tracked attack-numeric differences between the 1.17.1 and 1.17.3 variants (https://almanauts.com/eldenring/patches/1-17-3/), but it does not certify this project's tool against in-game visual values.

A report with zero mismatches verifies **arithmetic parity between implementations using the SAME source**, not independent game correctness. Do not claim this proves current Regulation 1.17.3 values, patches, infusion parameter fidelity, status buildup, sorcery/incantation scaling, hidden effects, real enemy damage, legal redistribution of third-party/game-derived data, or in-game parity. All calculation results remain noindex/research-only until matched against independent game-menu observations.

## Evidence status

Before this change, the pinned source was examined and shown to contain 3296 unique variant entries with no missing references to base correction, reinforcement or scaling-graph tables. That checks only the presence of dependencies, not numerical parity. A mismatched Madding Hand faith requirement exists between community 1.17 sources. The new audit is necessary but insufficient before any product release.

Site UI: `/weapon-data-workbench/` → **Load public v1.17 dataset** → **Audit AR math for all weapon variants**; or load a local compact JSON first. Tests include deliberately invented standalone weapons (standard, paired, bow, split magic, numeric correction overrides), failure paths, mismatch gates, anonymous reporting and noindex invariants.
