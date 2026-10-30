# 2026-10-31 AR research continuation — coverage and independent game-client evidence

This branch **does not claim current-version game AR certification**.

## Implemented

1. The weapon catalog now refreshes its AR handoff link when changing a community-published upgrade value. The link uses the currently displayed +level and the five editable combat attributes.
2. The local workbench reports selected source rows' known model-scope limitations (paired moveset, ranged ammunition/motion, spell-tool scaling, status buildup, 11-step somber skill damage). These are warnings about missing gameplay simulation, not blanket assertions that the parameter-derived nominal AR is wrong.
3. A real-game **manual equipment-menu observation draft** can be recorded directly after calculating nominal AR: explicit App/Regulation versions, platform, date, exact affinity name, reinforcement, grip, five player stats, observed integer menu AR, local evidence filename/reference and candidate calculated AR. The JSON contains the numeric difference, plus `reviewStatus: UNREVIEWED`, `gameClientVerified: false`, `publicationApproved: false`. An exact match never changes those fields.
4. The export is browser-local; no screenshot/image, game data or personal build is uploaded. Fictional demo calculations are forbidden as game observations. Players must keep screenshots and submit observations for **separate** independent review before any verified claim.
5. New synthetic matrix tests exercise all thirteen source-affinity rows and somber/paired/status/spell/ranged warnings. The source-derived arithmetic CI has also expanded from 4 to 12 cases per actual imported variant: +0, intermediate, maximum, 1H/2H, each attack attribute extreme and all-99. This yields 39,552 shared-source mathematical comparisons across 3,296 imported v1.17 rows, with zero differences after explicitly matching the source's floating-point evaluation order. **Neither test is independent current-game validation.**
6. Research builds default to site-wide `noindex` even if `SITE_URL` is configured. `robots.txt` must allow reading `noindex`. The sitemap is withheld. The explicit `RELEASE_INDEX_APPROVED=1` switch is for a future **separately approved** release, not something to set during research.

The extended matrix first exposed eight integer-floor discrepancies (four rows at 99 FAI and four at all-99 two-handed) due to IEEE-754 calculation order. The imported-profile engine now evaluates modern compact-source scaling in the same operand order as its independent raw-source arithmetic checker; all expanded comparisons pass. This is a correction to mathematical consistency, **not** evidence that the game uses this same floating-point order at its display boundary. Those boundary states still require game-menu screenshots.

## Outstanding release blockers

- No independently inspected, current-version game-menu screenshot samples are claimed here.
- The original independently cited 14 regulation-derived comparisons, 3 historical player reports and cross-source parity checks remain separate evidence classes and cannot certify Regulation 1.17.3 game-client fidelity.
- Real weapon-skill, motion-value, spell catalyst, ammunition, status and target-defense effects remain out of scope. The nominal AR tool is **not** a real-damage calculator.
- Data license/redistribution review, conflicting DLC rows and full per-affinity current-version goldens remain open.
- The site must remain research-only `noindex` until data, formula, UI, game screenshots and rights have each been independently reviewed.

## Recording a valid future candidate

On `/weapon-data-workbench/`: opt in to loading the pinned v1.17 parameter source or use permission-reviewed local JSON; select an exact weapon/affinity, level and five stats; calculate one-hand/two-hand nominal AR. Then inspect the **same conditions** in a real game build, enter App and Regulation values visible in the game, screenshot filename and observed equipment-menu integer AR, and click **Export unreviewed observation JSON**. A future reviewer must separately inspect the screenshot, confirm the version/state/conditions, assign a code commit and data revision, and re-run the comparison. Do not count unreviewed exports as verified goldens.
