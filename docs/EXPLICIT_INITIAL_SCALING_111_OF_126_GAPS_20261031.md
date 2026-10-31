# Explicit +0 Standard grading source audit — 2026-10-31

## Result

**29/33** of the source-only weapons with originally blank scaling columns have a readable, individually named **Standard (unupgraded +0)** table on Fextralife. We extracted only their exact STR / DEX / INT / FAI / ARC grade columns, and checked that the cited same-row physical +0 attack agrees with the existing Eldenpedia original physical source.

- 72 recovered weapon IDs and original calculation-safe catalog rows remain unchanged.
- Original Eldenpedia empty scaling cells remain literally \`?\` (126) in \`reference.scalingAtPlusZero\`. The original published data has NOT been silently overwritten.
- Explicit separately attributed Fextralife Standard +0 rows now supply **111** previously unreported grade cells, mostly explicit \`-\` values (i.e. **not** inferred from an empty table).
- The remaining **15 unresolved cells** are grouped across four named shields: Marred Leather Shield (4), Marred Wooden Shield (4), Shield of the Guilty (4), and Spiralhorn Shield (3). The four available Fextralife pages DO NOT provide readable Standard +0 rows, so a Std+25 affinity-specific or missing page is NOT substituted for +0.
- The number of fully covered source-only rows for initial grades is 72 - 4 = **68**, counting a separately attributed Fextralife grade as published evidence, not game-client review.
- The existing eight conflicting weapon groups and nine field disagreements remain open. The 111 grade receipts do not certify any of them.

## Reproducible source discipline

For each of 29 entries, \`explicitInitialScalingSource\` in \`public/data/v117-recovered-72-reference.json\` records:
- A named \`https://eldenring.wiki.fextralife.com/<weapon title>\` link
- Exact \`Standard\` row, default affinity and reinforcement 0 (not +25, Heavy, Keen, or other alternate affinity)
- All five explicitly printed scaling symbols and original-unknown grade count
- Same-row physical +0 attack crosscheck against the original Eldenpedia reference
- \`gameClientVerified:false\`, \`publicationApproved:false\`, \`independentlyReviewedScreenshot:false\`, and unversioned-source warning.

This is **source-text auditing**, not confirmation of App Ver. 1.17.2 / Regulation Ver. 1.17.3 actual equipment menus.

## User-facing effect

Main \`/weapon-database/\` source-only preview presents **A = original Eldenpedia, B = named Tarnished.app, C = explicit Fextralife Standard +0** rather than changing A's \`?\` or pretending C is a verified client.
The \`/weapon-source-review/\` research table also prints explicit published Standard +0 grades with the exact source URL.

No exposed research field is transferred to precise AR, upgrade formula, equip load, weight sorting, or a published real-game badge. No new runtime API, server, asset scraping, paid service or periodic crawler is required.
