# 72 recovered armaments: 126 / 126 initial-grade source gaps addressed (2026-10-31)

## Summary

All 72 source-only catalog identities have separate published +0 attack, weight, critical and initial scaling source candidates. **All 126 previously blank individual STR/DEX/INT/FAI/ARC scaling cells now have a separately attributed, explicitly printed unupgraded public-source value**.

**This does not mean 126 game-client readings are verified. Original screenshots independently inspected: ZERO.**

Sources for the **33 previously partially blank weapons**:

| Public source category | Named weapons | Originally unreported explicit source-grade cells |
|---|---:|---:|
| Fextralife weapon-specific \`Standard\` unupgraded rows | 29 | 111 |
| Historical Fandom \`Standard\` unupgraded rows | 3 | 12 |
| PureEldenRing unupgraded \`-\` table | 1 | 3 |
| **Total** | **33** | **126** |

The original \`reference.scalingAtPlusZero\` arrays retain all **126** wiki.gg \`?\` placeholders as historical truth of what that source reported. The new \`explicitInitialScalingSource\` is a separate display-only set of 33 readings (with 5 grades, named page URL, +0/default row, and source-game-version caveat), and the UI shows them as **source C** rather than rewriting the missing original source A.

All 33 third-source rows have current-game-approved flags **false** and share a strict identity/coverage validator; the 487 original catalog identities, null calculation-gated attack/critical/scaling/weight on 72 unverified source-only items, and 8 disputed weapon groups remain unchanged.

## Why some third sources are historical and should not be over-trusted

- Named Fandom pages have individually quoted initial \`Standard\` values. They are historical and do **not** label App 1.17.2 / Regulation 1.17.3.
- **Shield of the Guilty**: historical Fandom page shows required Strength **6** while our pinned v1.17 source and current wiki.gg show **8**. The source's explicit initial grades \`D,-,-,-,-\` are attributed to that historical source, but its Strength 6 value is **never** copied to requirements or used for wieldability.
- **Spiralhorn Shield**: PureEldenRing's named \`Stat Scaling\` unupgraded row explicitly lists \`E,-,-,-,-\`. It is not an authenticated current-game +0 screenshot.
- No row is inferred from an upgraded +25 affinity, a blank class table, or a wiki page without a readable unupgraded initial row.

## Named source URLs for the four previously still-missing source rows

- https://eldenring.fandom.com/wiki/Marred_Leather_Shield
- https://eldenring.fandom.com/wiki/Marred_Wooden_Shield
- https://eldenring.fandom.com/wiki/Shield_of_the_Guilty
- https://www.pureeldenring.com/weapon/spiralhorn-shield

The other 29 individually named pages are linked in the corresponding \`explicitInitialScalingSource.sourceUrl\` fields of \`public/data/v117-recovered-72-reference.json\`.

## QA / game client / publication boundary

- **Public-source reference-grade completeness**: 126/126 original blank fields separately attributed.
- **Current-game App/Regulation original screenshot verification**: 0.
- **Eight weapon groups / nine field conflicts**: still unresolved. Two published sources agreeing is not client evidence. The separate 20-field screenshot collector cannot inspect uploaded images or turn player transcription into certification.
- **Precise AR, reinforcement-level damage, and disputed equipment weight**: not certified. These source-only fields are intentionally not fed into calculators or weight/damage search.
- No paid API, server-side crawler or game assets were introduced.

After merging, the relevant pages are:
- https://elden-ring-5i9.pages.dev/weapon-database/
- https://elden-ring-5i9.pages.dev/weapon-source-review/
- https://elden-ring-5i9.pages.dev/game-evidence-queue/
