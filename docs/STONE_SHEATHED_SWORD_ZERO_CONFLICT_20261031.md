# Stone-Sheathed Sword: source-reported +0 completed, two unresolved contradictions

Date: **2026-10-31**. Scope: community-source facts, **not** independently authenticated App 1.17.2 / Regulation 1.17.3 game-client evidence.

## Evidence adjudication

The former 415/416 catalog omitted all Stone-Sheathed Sword +0 values because wiki.gg's top-line **physical 119** conflicted with its **explicit +0 reinforcement row physical 89**. This was the correct conservative precaution, but additional evidence allows an honest **candidate 89** to be recorded and surfaced without pretending the conflict no longer exists.

| Source | Clearly stated field | Reported PHY | Weight | Context |
| --- | --- | ---: | ---: | --- |
| [Eldenpedia weapon page](https://eldenring.wiki.gg/wiki/Stone-Sheathed_Sword) | Somber **+0** upgrade row | **89** | 3.5 (headline) | Same page headline instead shows PHY **119** |
| [神ゲー攻略 / Kamigame (Japanese)](https://kamigame.jp/eldenring/page/324734066194679699.html) | `初期値` — initial attack | **89** | **5.0** | Clearly distinguishes +0 **89** and +10 **218** |
| [AtlasForge armament table](https://atlasforge.gg/elden-ring/database/weapons) | Base physical column | **89** | **5.0** | Identifies Stone-Sheathed Sword; not independently patch-version-certified |
| [Eldenpedia headline](https://eldenring.wiki.gg/wiki/Stone-Sheathed_Sword) | General Stats physical | **119** | **3.5** | Competes with that page's own explicit +0 row |
| [ESO-UI weapon page](https://wiki.eso-ui.com/index.php/Elden_Ring%3AStone-Sheathed_Sword) | Top-line attack | **119** | **5.0** | Not explicitly labelled +0 and conflicts with explicit initial-value evidence |

### What the actual code now stores

- `Stone-Sheathed Sword` remains **one of the same 416 real named records**.
- Its source-attributed candidate unupgraded `attack` is **[89, 0, 0, 0, 0]**, critical **100**, and starting scale letters **C / D / – / – / –**. The quoted physical source is **+0**, *not* max-upgrade 218 or character Attack Rating.
- The former weight **3.5** remains in the original attributed source record, but competing **5.0** reports are also attached. **Neither** is adopted for complete player equipped-load calculations.
- Both **attack 89 versus 119** and **weight 3.5 versus 5.0** are separately recorded with their exact cited values and URLs. The game client and lineage have **not** been independently verified.
- The two new flags `stone-sheathed-attack-source-conflict` and `stone-sheathed-weight-source-conflict` feed **fail-closed arithmetic**. `reportedBaseDamageParts` can display **89 as DISPUTED**, but `baseDamageParts` returns null; damage-type filter, trusted base damage sorting and upgrade math cannot silently turn 89 into certified AR. Disputed weight cannot enter exact player load totals, rolling tiers, weight sorting or max-weight filters.
- Data-quality reporting explicitly separates **416/416 published reference fields** from **409/416 source attack arrays without flagged attack disagreements**. Neither number certifies current client accuracy.
- Original **seven** pinned-v1.17 / community discrepancies remain seven, not eight; this is an additional *different-type* source discrepancy. Ritual Thrusting Shield's second separately tracked source discrepancy remains.
- **Zero** original current-game-client AR screenshots have been independently reviewed; research `noindex` remains the default.

## Why not just pick 89 or 119 as the definitive truth?

There are stronger **explicit +0 labels** for 89 than for 119, so **89 is the better unupgraded source candidate**. But multiple public sites may share upstream data, and a table copied from an older patch cannot prove precise 1.17.3 parity. Neither the prior six shared-vector checks nor the present source corroboration substitutes for a genuine individually versioned and inspected original game weapon-menu reading.

The actual definitive next proof should include title-screen App/Regulation details, the Stone-Sheathed Sword at default/neutral +0, a clear five-field equipment details screen, and a separate reviewer. The screenshot must not be replaced by SHA alone or automatically promoted from an unreviewed local report.

## Scope and privacy

No licensed screenshots, copyrighted images, game regulation binaries, paid API, authentication or server storage have been added. Regression tests refuse substituted attack/crit/scaling, fake game certification, removed dispute flags or doctored source citations. New data are reference-only until evidence earns a scoped upgrade.
