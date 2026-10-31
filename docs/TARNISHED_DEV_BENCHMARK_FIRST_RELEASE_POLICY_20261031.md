# Benchmark-first release policy — Tarnished.dev v1.17 (2026-10-31)

## User decision
The user is **not** expected to install Elden Ring or furnish any game screenshots merely so we can build and ship a useful Elden Ring calculator. **Do not block reference-labelled tools on original-game screenshot QA.**

## Primary functional and numerical benchmark
- Primary functionality/UX reference: https://www.tarnished.dev/
- Public weapon AR calculator: https://www.tarnished.dev/weapon-calculator
- Site publicly labels its available data Elden Ring v1.17, with a reported update 2026-08-28. Keep source-date and feature version alongside each comparison.
- Compare exact same input controls: weapon name + version, stats (STR/DEX/INT/FAI/ARC), upgrade level, affinity, one/two-handed, with buffs and PvP/PvE separately. Record accessible source result and our own calculated output, plus rounding/assumptions.
- Never infer that an unperformed benchmark passed. The normal weapon database's 72 newly corroborated source-only rows are +0 published candidates, not proof of AR parity.

## Evidence levels
1. **Public source referenced**: game data comes from attributed third-party sources, not yet benchmarked.
2. **v1.17 reference benchmark PASS**: separately implemented model matches Tarnished.dev for documented representative same-input calculations. Label only this source version; log inputs, outputs, timestamp, rounding and discrepancies.
3. **Current game verified**: independently reviewed App/Regulation game-client screenshots. Optional higher standard and NOT required to publish properly labelled v1.17 reference estimates.

Data discrepancies can block a specific field; they must not block all other useful tools. The public reference is a benchmark, not automatically official truth. Do not copy website proprietary code, imagery, or full database.

## Current repository implementation
- /weapon-database/: 487 named weapons/shields, 72 +0 source-only previews, original-source citations, unresolved values still separated from precise calculations.
- /weapon-data-workbench/: free pinned public v1.17 regulation JSON downloaded only when user opts in, local independent conversion, no account, paid API or persistent backend.
- /validation-status/: clearly separates benchmarkable reference estimates from real-client certification.
- /game-evidence-queue/: optional exceptional-conflict review, no mandatory screenshot workflow.

**Next release gate**: Produce reproducible Tarnished.dev same-input AR benchmark cases before marking output benchmark-passed. Current v1.17.3 client certification is not claimed. A policy change alone is not evidence of mathematical agreement.
