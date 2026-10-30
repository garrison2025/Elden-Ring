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

A report with zero mismatches verifies **arithmetic parity between implementations using the SAME source**, not independent game correctness. Do not claim this proves current Regulation 1.17.3 values, patches, infusion parameter fidelity, status buildup, sorcery/incantation scaling, hidden effects, real enemy damage, legal redistribution of third-party/game-derived data, or in-game parity. All calculation results remain noindex/research-only until matched against independent game-menu observations.

## Evidence status

Before this change, the pinned source was examined and shown to contain 3296 unique variant entries with no missing references to base correction, reinforcement or scaling-graph tables. That checks only the presence of dependencies, not numerical parity. A mismatched Madding Hand faith requirement exists between community 1.17 sources. The new audit is necessary but insufficient before any product release.

Site UI: `/weapon-data-workbench/` → **Load public v1.17 dataset** → **Audit AR math for all weapon variants**; or load a local compact JSON first. Tests include deliberately invented standalone weapons (standard, paired, bow, split magic, numeric correction overrides), failure paths, mismatch gates, anonymous reporting and noindex invariants.
