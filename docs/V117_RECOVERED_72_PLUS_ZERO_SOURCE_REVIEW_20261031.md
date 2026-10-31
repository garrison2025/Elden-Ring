# The 72 newly recovered armaments: source-only +0 field completion (2026-10-31)

## Source-reference work completed, distinct from current-game certification

The prior catalog has 72 recovered Regulation 1.17 default-affinity names and five numeric attribute requirements but **null weight, attack, critical and scaling**. This project now adds \`public/data/v117-recovered-72-reference.json\` with an individually attributed **+0 base attack, weight, critical and initial scaling candidate for all 72**.

- 69 shields: wiki.gg Small Shields (17), Medium Shields (27), Greatshields (25) per-class comparison-table rows.
- 3 other armaments: Bandit's Curved Sword, Inseparable Sword, Gravel Stone Seal individual wiki pages.
- Known-but-blank wiki scaling cells are retained as \`?\`, not invented \`-\` or letter grades.
- Every row links its exact published source page and carries \`gameClientVerified: false\`, \`reviewStatus: UNREVIEWED\`.
- The original safe canonical catalog fields remain **null** for these 72, pending a separately reviewed source-data publication decision and original-game certification. The candidate values can be researched on \`/weapon-source-review/\` without affecting equip load, AR, or damage calculations.

### Meaning of sources and reference versions

\`tarnished.dev\` explicitly says it updated to patch 1.17 in August 2026. Its public weapon AR calculator is useful for **external cross-checks** but does not produce an independently inspected original game-client screenshot or an automatically reusable per-item +0 dataset from its public textual page. Do not claim this ledger was extracted from tarnished.dev: the **numeric source is individually linked wiki.gg**, with two conflict cross-checks.

A separate \`tarnished.app\` (different host) Buckler page gives +0 Physical **68**, while the wiki.gg Small Shields table states **60**. The ledger records both and marks **SOURCE_CONFLICT**. This is not current-game certified.

The wiki.gg Greatshields class table lists **Visage Shield requirement STR 24**, while the pinned Regulation 1.17 source and a 1.17.3-labelled Almanauts secondary table give **STR 44**. The ledger retains pinned STR 44 in the original catalog and flags the contradiction. That wiki source also lists weight 24; don't confuse requirement STR 24 with weight 24.

Many Greatshield weights differ from old patches. The wiki.gg Greatshields page now lists post-1.17 weights (e.g., Ant's Skull Plate 12.5, Briar Greatshield 8.5, Erdtree Greatshield 11.5, Icon Shield 9, Spiked Palisade Shield 9.5). These are published *secondary source readings*, not independently verified 1.17.3 game-menu results.

### Independent game QA still required

Only original current App 1.17.2 / Regulation 1.17.3 game screenshots, weapon identity, +0/default affinity, specific equipment-menu values and independent human review can permit a field to become \`IN_GAME_VERIFIED\`. **Zero** images have been accepted. A publicly published +0 row is **not** player AR, scaling parameters, max upgrade stats, affinity-specific values or damage against a boss.

Existing seven historical source disputes, the Stone-Sheathed Sword attack/weight disagreement, and the Ritual Thrusting Shield weight/requirements disagreement are still open. The new Buckler and Visage divergences add separate source evidence flags; none is automatically corrected.

## Regression and release gates

\`tests/recovered-weapon-reference.test.mjs\` checks complete roster identity, version-provenance gates, null canonical fields, total coverage, and both explicit source conflicts. The new \`/weapon-source-review/\` is explicitly noindexed and its public preview never writes back to gameplay calculators. No paid API, images, scraped prose or game binaries were committed.

Sources:
- https://www.tarnished.dev/
- https://www.tarnished.dev/weapon-calculator
- https://eldenring.wiki.gg/wiki/Small_Shields
- https://eldenring.wiki.gg/wiki/Medium_Shields
- https://eldenring.wiki.gg/wiki/Greatshields
- https://eldenring.wiki.gg/wiki/Bandit%27s_Curved_Sword
- https://eldenring.wiki.gg/wiki/Inseparable_Sword
- https://eldenring.wiki.gg/wiki/Gravel_Stone_Seal
- https://tarnished.app/weapons/buckler
- https://almanauts.com/eldenring/weapons/
