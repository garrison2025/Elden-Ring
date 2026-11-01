# Four-module implementation and actual Tarnished.dev v1.17 numerical boundaries — 2026-11-01

**Target:** https://www.tarnished.dev/ real public UI, independently observed in two fresh Chromium processes. This change does not introduce any alternative numerical standard or new paid runtime service.

## Implemented user-facing improvements in this pull request

| Previously missing area | Real implementation | Evidence and exact acceptance | Remaining parity limitation |
|---|---|---|---|
| Armor Optimizer: real-world top-rank vs local top-ranked gear | Reference comparison visible for a *confirmed exact same-input Wretch10* 48.176 maximum, 0 reserved weight, Normal roll, Poise objective, zero extra constraints. The previously observed rank-one armor set can be loaded into all four exact locked armor slots with one explicit click. Changing controls invalidates any previous comparator outcome. | Real Tarnished Poise 70; site rank1 Circlet of Light / Tree Sentinel Armor / Preceptor's Gloves / Tree Sentinel Greaves, 33.7 weight. Local Poise 70 tested. Browser smoke validates observed four-piece set is renderable and score =70. | **NOT** full ranked top-5 equivalence or all 13 weighted scoring semantics. Preset produces a locked comparison, not equivalence of independent algorithms. |
| Damage Calculator: no actual visible source-v1.17 DPS cases | Added separate empirical **source-only** panel with 3 real +25 Uchigatana Standard profiles, shows source AR and DPS while keeping the manual user-supplied enemy/moveset model separate. | Public source 15/20: AR376, DPS464/547; 20/20: AR388, DPS483/570; 15/25: AR392, DPS489/577; two browser reads per row. Independent local v1.17 AR math matches 3/3; browser smoke switches actual rows. | Local independent DPS/enemy/NG/PvP/moveset engine remains **NOT IMPLEMENTED**; a source read is not a generic calculation. |
| Spell Calculator: no standalone site | New **noindex** spell-reference page for *exactly 3* double-read Glintstone Pebble + Astrologer's Staff Wretch INT 25/30/40 context. Unsupported integers, catalysts/spells/defenses **fail closed**, no interpolation. CSS clears/hides previous results (including `display:grid` case). | Source INT25:242, INT30:267, INT40:315 magic, FP7, 1 bullet. Chrome exercises 25→30→31 and verifies 31 displays NO stale damage. | **NOT** a standalone staff/seal scaling formula or general spell/catalyst engine. This is explicitly a reference lookup, not a newly verified calculation. |
| Build Planner: verified combos hidden behind manual name entry | Five selectable **twice-observed exact** 2–3 talisman Wretch10 presets. One click intentionally clears prior weapon/armor/spell/rune/Physick gear, sets 10 in eight stats, selects Wretch, and applies exact observed equip-load maximum (displayed 1-decimal precision disclosed). Existing exact full reference combo panel shows numerical HP, FP, stamina, discovery, negations and resistances. | Real Radagon + Marika Soreseal Wretch10: `-32.25%` negation and max load `56.1`, independently observed twice; real Chromium smoke confirms the applied UI preset, both fields and origin/attributes. | Other combinations and higher levels cannot be inferred from the selected-item arithmetic. General stacking/buff/conditional effects remain unsupported. |

## Fixed observed usability errors

1. Site result section for unsupported spell input cannot keep displaying stale evidence; it is *actually hidden*, its numbers cleared.
2. Applying a measured Build combo uses the measured *buffed* equip-load maximum, not naked Wretch's 48.176. Because the source displays only a decimal, this remains a rounded input.
3. Changing armor optimizer constraints or the exact-Wretch confirmation clears the previous comparator claim. No old-context PASS persists through an invalid input or failed re-run.

## Numerical acceptance and release scope

- `MATCH` only where a local **independent** algorithm produces the same output under identical effective inputs; 3 new AR profiles pass. Previous weight/class/armor subset goldens remain valid within their scope.
- `OBSERVED_REFERENCE_ONLY` for DPS, Spell, armor rank snapshots. Source observations are real, but copying them into a UI is not a calculated general formula.
- `NOT_IMPLEMENTED` for unrestricted 13-attribute armor rank/ties, enemy/moveset DPS/PvP/NG+ pipeline, all-spell catalysts/coefficients, and arbitrary Build active/conditional effects. No claim of full site parity.
- `UNOBSERVABLE` for 27 direct `Req:` widgets hidden by source and 19 historical source armor records without selectable unique identities.

New public resource `/spell-calculator/` remains `noindex,follow`, and its limitations are written visibly on the page. No unsourced game assets or bundled proprietary data were introduced. Existing approved SEO route allowlist is unchanged.

## Regression evidence

- Pure Node `tests/four-module-v117-scoped-reference.test.mjs`: 3 Damage + 3 Spell source rows against committed twice-real-browser goldens; rejection of unverified inputs/context; exact Poise comparison contexts; noindex gate.
- `scripts/smoke-browser.mjs`: actual Chromium verifies source DPS switch, unsupported spell row visually hidden, loaded 5-combo Build real observed -32.25% and 56.1 max, real loaded-source Armor rank-one lock, 70-Poise comparator, stale comparator invalidation, plus prior desktop/mobile regression.
- Independent browser goldens: https://github.com/garrison2025/Elden-Ring/actions/runs/41297001066 .
- Historical direct armor result: `docs/TARNISHED_REMAINING_LIVE_COMPARE_20261101.md`.

**Decision:** This is meaningful implemented coverage of four remaining modules, but it is **not** honest to describe the four full algorithms as finished. Their explicit missing computational inputs remain as above; merely adding more browser golden observations will not close those gaps.
