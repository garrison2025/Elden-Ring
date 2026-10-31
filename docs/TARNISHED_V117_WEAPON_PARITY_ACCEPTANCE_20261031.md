# Tarnished.dev v1.17 → Elden Ring Build Lab: final-gap audit and acceptance contract

> **2026-10-31 最新用户验收口径（优先于本文旧版硬门槛）：** 只需与 Tarnished.dev **v1.17 公共界面**进行同条件功能、数据及数值对比，满足覆盖矩阵并通过自动回归即可结束该模块验收；**不需要游戏实机、菜单截图或 Regulation 1.17.3 的独立 game-client golden**。此前出现的“实机验证为必需项”现为非阻塞、非目标。第三方素材/参数使用权与 SEO 发布审批是单独管理事项，不影响 v1.17 功能数值对标的 PASS 判定。详见 [正式基准](./TARNISHED_V117_COMPARATOR_ONLY_ACCEPTANCE_20261031.md)。


**Audit date:** 2026-10-31. **Scope:** the weapon database plus weapon AR comparison, **not** a claim to reproduce all of Tarnished.dev or the V2 entire combat simulator. Original PRD: `Elden_Ring_Tools_完整建站方案_V2_强化版_20261030.md`, sections 4.1, 4.2, 4.8, 5 and 6. Public comparison: [Tarnished.dev](https://www.tarnished.dev/) and [Weapon AR Calculator](https://www.tarnished.dev/weapon-calculator), currently labelled **v1.17**. Version scope matters: Tarnished.dev v1.17 observations do **not** verify App 1.17.2 / Regulation 1.17.3 gameplay.

## Root cause of the delay

Previous PRs added small, individually useful features without enforcing an agreed acceptance matrix or declaring an end to this product slice. The sole current acceptance goal is **Tarnished.dev v1.17 reference parity** across observed features/data. Current-Regulation-1.17.3 client certification is not a project acceptance goal. Historical text below may still describe the former gate. A local search/filter UI or a few matched examples does not complete either one. From this audit onward, count only acceptance evidence—not number of commits or additional UI controls.

## Numbers derived from main source, not manual progress estimates

`npm run audit:weapon-parity` reads the same checked-in `public/data/community-weapon-catalog.json` as the site and `public/src/tarnished-reference-benchmark.mjs` independently observed public UI samples.

| Measure | At baseline | Definition |
|---|---:|---|
| Catalog weapon/shield IDs | 487 | 377 base / 102 Shadow of the Erdtree / 8 Tarnished Pack |
| Primary +0 attack present | 415 | Source array exists; not proof of accuracy |
| Primary requirements present | 487 | Source array exists; may include disputed fields |
| Primary weight present | 415 | Source numeric value; not equipment load |
| All three primary fields, **no flagged source conflict** | 406 | **Not** current-patch game certified |
| 72 recovered source-only candidates with attack/weight missing in primary catalog | 72 | Cited review previews exist separately; cannot quietly promote |
| Entries with flagged source attack/requirements/weight disagreements | 9 | Fail-closed for affected calculations |
| Embedded precise AR parameter profiles inside primary catalog | 0 | User can separately opt-in to a pinned external v1.17 regulation source |
| Independently repeated same-input Tarnished.dev UI comparison cases | 15 | Passed only for those exact weapon/affinity/upgrade/stats/grip cases; **not** 15 current-patch game goldens |

## Source-level feature comparison

| External v1.17 function observed | Local evidence | Verdict | Concrete exit condition |
|---|---|---|---|
| Search weapons, types | `weapon-database` / `searchCatalog`; 487 names and category filters | Built within supported local subset | Browser verify query, class, DLC gates, direct links, unknown fields |
| Filter low requirements, one-/two-handed | `weaponRequirementComparison`, missing-points rank and live stat refresh | Built for supported community fields | Confirm disputed and unsupported grips never produce a positive verdict |
| Affinity selection and weapon upgrade | Separate `weapon-ar-calculator` with user-initiated v1.17 input source; catalog only has limited +0/rounded upgrade references | **Partial, split UI** | Document exact supported affinity/upgrade matrix, fail closed on unavailable source variants |
| Weapon global AR comparison/ranking table | Local reference comparison of at most **3** source weapon facts, **not** multiweapon AR | **Missing** | Same STR/DEX/INT/FAI/ARC and 1H/2H; per-weapon legal affinities; compare one or more upgrades and rank **calculated AR**, with CSV export and source/version badge; Chrome evidence |
| Distinguish somber from smithing | Source calculator supports corresponding upgrade constraints; catalog cannot infer every reinforcement track | **Partial** | Source-supported +0/+10 and +0/+25 with exact legal constraints; no guessed type |
| Filter weapon affinities on a whole results table | Single-weapon affinity input exists | **Missing** | Filter valid affinity subsets, show eligible weapons and AR sort, avoid treating `None` as `Standard` |
| Show items, regular vs somber, low req | Search/category, DLC, weight, damage, wield and source-quality filters exist | **Partial** | Explicit supported inventory/class/reinforcement filters or clearly declare unsupported |
| Export AR comparison CSV | Source weapon reference links and copy functions exist; no equivalent AR ranking CSV | **Missing** | User-initiated export from actually displayed AR ranking with provenance/column units |
| Character stats, starting class, two-handed | Build Planner/class optimizer/local calculators, AR handoff | **Implemented as separate workflows** | Browser handoff exact five stats; no stale result after edits |
| Integrated armor, talismans, spells, active effects | Manual gear/armor tools but no complete game-verified integration | **Not part of this narrow release** | Own separately versioned, licence-reviewed workstream, not a blocker for an explicitly limited *weapon reference* release |
| Tarnished.dev v1.17 numeric AR examples | `tarnished-reference-benchmark.mjs`; 15 repeated exact-input UI observations | **15 observed** | Minimum **50 distinct source-observed cases** spanning regular/somber, +0/mid/max, elemental/affinities, base/DLC, 1H/2H, requirement-met/not-met; no silently dropped mismatches |
| Current Regulation 1.17.3 game-client AR | Not independently certified | **Out of scope; NOT a parity blocker** | No real-game validation needed; do not market v1.17 reference values as official current patch |
| Third-party parameter/weapon-data redistribution rights | Catalog attributes upstream and explicitly warns MIT software licence does not convey all game-data rights | **Not approved** | Review each dataset's permission/rights basis; keep loading voluntary if redistribution right unknown |

### Why “15/15 matched” is not “all done”

The existing repeated observations are **15** *specific* cases, not a representative census of all 487 weapon IDs, all somber paths or the latest official regulation. Unit tests mapping all 13 affinity names to a URL are **not observations** of 13 independent external numerical matches. User-entered comparison values are **not authenticated golden samples**. If original sources conflict, display both readings and mark blocked—not choose Tarnished.dev's number by default.

## Frozen tasks in completion order

1. **P0 Data:** classify all 72 primary missing-attack/weight candidates into *supported source-reported preview / conflict / inaccessible-or-rights-blocked*, with per-row source rights and provenance. Preserve original unknowns until approved for use; do not auto-publish.
2. **P0 AR ranking:** implement actual multi-weapon AR comparison and sorting over **only** source-parameter-supported legal weapon/affinity/upgrade combinations. Show numeric component breakdown, missing requirements, current Build handoff, unknown/unsupported states. Do **not** replace AR with sum of +0 base damage.
3. **P0 external numeric acceptance:** >=50 *distinct* observed exact-input v1.17 reference cases covering regular and somber reinforcement, base/DLC, elemental affinity, 1H/2H, edge stats; store controls, source observation, build SHA, expected and actual per-component/total, differences and screenshot/evidence reference when permissible. Fix mismatches, don't cherry-pick.
4. **P0 rights and version decision:** separately sign off data redistribution rights; if current patch is unverified, **ship only v1.17 reference-labelled capability**, with strict noindex on research pages until actual page-quality gate.
5. **P1 UX/SEO:** real 375px desktop/browser smoke, keyboard focus, table export, accurate metadata, human-authored content; review canonical/index per route, not all at once.
6. **Out of scope for this weapon milestone:** enemy Damage Calculator, full buff/talisman/spell stack (these remain under the full five-module issue). **Patch 1.17.3 gameplay certification is no longer a required milestone or blocker.**

**Updated Definition of Done:** v1.17 source-observed functional/numeric coverage and source-data reconciliation gates complete **with evidence**, unsupported variants fail closed, browser interaction and regression CI green; *then* the narrow reference milestone may be marked delivered. Rights/publication approval is separate. No game-client evidence required. A public feature being available or having 100 passing unit tests does not by itself meet this criterion. Current verdict: **NOT READY FOR FULL PARITY**.

## How to check progress without asking “继续” indefinitely

Run `npm run audit:weapon-parity`. Its output is a **blocker report, not certification**; `NOT_READY` exits successfully so existing Cloudflare deployments keep working. Numerical counts update from source JSON and the checked-in benchmark suite, while source rights/publication remain tracked separately; current-game validation is not a gate, and the global AR ranking was implemented in PR #84/#85. Don't mark those gates green based on a changed string or an external site's release announcement.
