# Tarnished.dev public v1.17 — five-module complete-parity audit

> **2026-10-31 最新用户验收口径（优先于本文旧版硬门槛）：** 只需与 Tarnished.dev **v1.17 公共界面**进行同条件功能、数据及数值对比，满足覆盖矩阵并通过自动回归即可结束该模块验收；**不需要游戏实机、菜单截图或 Regulation 1.17.3 的独立 game-client golden**。此前出现的“实机验证为必需项”现为非阻塞、非目标。第三方素材/参数使用权与 SEO 发布审批是单独管理事项，不影响 v1.17 功能数值对标的 PASS 判定。详见 [正式基准](./TARNISHED_V117_COMPARATOR_ONLY_ACCEPTANCE_20261031.md)。

Date: 2026-10-31. Scope: independent, rights-conscious **functional and numerical parity**, NOT visual cloning, not reuse of their source code or game assets.

## Evidence boundaries
- The public Tarnished.dev homepage labels **Elden Ring v1.17** and advertises Weapon AR, Armor Optimizer, Build Calculator, Damage Calculator (experimental), and Spell Calculator (experimental). Its 2026-10-23 update documents armor-exclusion refinements. Sources: https://www.tarnished.dev/ ; /weapon-calculator ; /armor-optimizer ; /build-planner ; /damage-calculator ; /spell-calculator .
- Public indexed pages may be older than the homepage; avoid using a stale page cache as proof of live same-input numeric output.
- Our code is independent. The external `ThomasJClark` 3,296-variant v1.17 compact parameter snapshot is downloaded **only after the visitor clicks**; it is not bundled into this repository. Third-party code licence is not automatically permission for copied game-derived data/artwork.
- This audit is **not a release certificate**. 15 exact independently observed numerical AR cases do not prove all variants or current Regulation 1.17.3 behavior.

| Tarnished.dev module / capability | Current Build Lab status on branch after this change | Full-parity blocker |
|---|---|---|
| Weapon AR: same STR/DEX/INT/FAI/ARC, grip, legal source affinity and enhancement | **Working reference calculator**, same pure `calculateAr` engine and v1.17 opt-in source | Scale of independently observed numeric evidence still 15, not 50 diverse cases |
| Weapon AR: all candidate variants and actual numeric ordering | **Opt-in whole-loaded-source ranking**, replacing previous 240-only subset; source variants processed in Worker, sorted globally, 100 rows at a time, all supported ranked rows in CSV | 3,296 variants do not equal a current-patch certified inventory; invalid variants counted as unsupported |
| Weapon AR: weapon types, full filter state, supported damage/status items, selected build active effects | Affinity and Regular/Somber/requirements filters available, limited weapon query and direct Build handoff | No certified status, build-effect, weapon-class or item parameters integrated |
| Build Calculator: class, eight attributes, levels, runes, sharing, A/B | **Working original first-party** class/rune/Build tools with source caveats | Full gear, spell, talisman, rune, physick and passive-effects system **missing** |
| Build Calculator: complete derived HP/FP/stamina/defense/resistance/negation | Fragmented or missing; equip-load is user supplied | Needs versioned curves, full equipment and effects evidence |
| Armor Optimizer: true armor roster, defense, resistances, poise, locked pieces and exclusions | Exact solver with CSV/manual research inputs; exclusions tested | Bundled **real versioned full armor dataset is missing**; no certified effect passives |
| Damage Calculator: enemy defenses/negations/NG+, motion values, buffs, PvP, poise and DPS | Weapon AR is NOT enemy damage; no equivalent verified damage calculator page | Requires licensed/verified enemy+move data, published model and substantial golden suite |
| Spell Calculator: staff/seal scaling, offensive/support spells, skill buffs | No equivalent complete verified spell calculator | Requires licensed source corpus, catalysts, formulas, effect stacking and golden suite |
| Current game App 1.17.2 / Regulation 1.17.3 equivalence | Explicitly NOT claimed | **Out of scope; no game-client or in-game verification required for v1.17 comparator parity** |
| SEO release | Only previously approved **five routes** indexable on Cloudflare main | AR/armor/database experimental pages remain `noindex`; separate accuracy+rights+content release decision required |

## Definition of full completion
All five calculators must have a functional browser workflow, independently licensed or user-authorized real data with scope/version provenance, validation for each claimed calculation domain, cross-tool state sharing, desktop/mobile and keyboard acceptance tests, source exclusions rather than guessed values, and no subscription or paid runtime API. **Do not close the full-parity issue until all conditions pass**. A source dataset containing 3,296 weapon-affinity variants cannot by itself complete armor, spell, character effect or enemy damage coverage.

## This PR delivers precisely
- Whole-loaded-source source-variant nominal AR ranking on explicit opt in (not just alphabetically first 240), with optional regular/somber and meeting-requirements filters.
- Full-result CSV; 100-row paginated UI and exact count transparency.
- Deterministic synthetic >240 source test and real 3,296-variant browser regression (conditional on the already user-initiated public-source CI workflow).
- No copyrighted assets or unauthenticated new numeric observations. No extra paid service and no change to SEO allowlist.

**Remaining P0:** independently observed 50-case reference matrix; 72 research-only weapon records and 9 disputed sources; source rights review; true full armor, character effects, damage, and spell datasets/engines. Master tracker: https://github.com/garrison2025/Elden-Ring/issues/83 .
