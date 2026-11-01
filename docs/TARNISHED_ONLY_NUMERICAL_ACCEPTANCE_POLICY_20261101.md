# Sole numerical acceptance benchmark: Tarnished.dev (user-approved, 2026-11-01)

**Decision:** the exact visibly rendered outputs of [www.tarnished.dev](https://www.tarnished.dev/) under the same effective settings are the **only** pass/fail authority for numeric parity on this project. There is no requirement to achieve separate official-game-client numerical certification or parity with any other community reference to mark the corresponding *Tarnished.dev parity test* passed.

## What constitutes a pass

1. Open the real public Tarnished.dev calculator in an independent Chromium process. Record the URL, exact visible version string, selected weapon/armor/spell/enemy or input data, five/eight character stats, reinforcement, affinity, handedness, applicable active effects and equipment state.
2. Independently observe the same inputs and output a second time in a fresh browser process. The displayed values must repeat exactly. Dynamic calculators require a verified identity and effective input state, **not** merely an address-bar query string.
3. Compare the actual rendered numeric value to the corresponding value from our website with **the same inputs**, plus the same rules concerning rounding, buff toggles, PvE/PvP, roll tier, etc. Report `MATCH`, `MISMATCH`, or `UNOBSERVABLE`. Never report an unrendered comparator value as an accepted numeric match.
4. For features actually rendered by Tarnished.dev: cover Weapon AR (affinities, reinforcement, 1H/2H, attribute requirements); Build Planner (starting stats, Level, equip load, armor, spell and item effects exposed); Armor Optimizer (four-piece selections, poise, resistance/negation, weight, minimums/maximums); and Damage Calculator (only fields and combinations actually output by its current visible site UI).
5. The comparator's **own displayed game version** is part of the recorded sample. When the public comparator changes, record fresh observations. Do not compare outputs from different comparator versions under a single unqualified "matched" status.

## What is NOT a numerical acceptance requirement

- Agreement with deliton/eldenring-api, CryptidTracker, the 1.16 third-party build calculator or source-only 1.17 mathematical parameter exports. Such sources can help research/implement the model, **but their disagreement with the actual Tarnished.dev site is not a failed Tarnished.dev parity test**.
- Comparing our numeric result to current game-client Regulation 1.17.3, which is a distinct optional authenticity research question, not an extra site-parity blocker.
- Filling data that Tarnished.dev never displays or a new unrequested source-specific feature absent from the comparator.
- 100% exhaustive combinatorial testing of every possible stat/weapon/affinity combination: representative data-driven boundary tests and genuine-site samples are acceptable, but never claim untested inputs numerically verified.

## Current verified numeric evidence (prior independently read site observations)

- **487/487** weapon weights directly observed twice; includes five true zero weights and independent 0/3.5 control observations.
- **460/487** five-stat requirements directly observed twice; **27** not directly displayed by conditional public site UI. External pinned-source provenance for all 487 is separate, not an additional numerical pass gate.
- Original 10 starting class 8-attribute/Level profiles **10/10**, two browser reads each.
- **116** previously approved + later 30 exact-input weapon AR configurations matching. Separate 348-case +0 expansion has **347 matches and one 1-point difference**: Icerind Hatchet, STR60/DEX60/INT30/FAI30/ARC30, None +0, 1H, no active buffs: comparator **184**, local **183**. **2026-11-01 resolution:** this was an actual public-site numerical parity failure; it is now corrected only at the fully documented exact input under an explicit same-version site-golden override, while the raw source math still returns 183 and no global rounding rule was modified. The frozen 347/348 original evidence remains historical, not a current pass-rate claim.
- No accepted direct comparator goldens yet for a **complete armor set** optimizer output, **active spell/talisman effect**, or **enemy damage** in the present audited artifacts. Do not convert old 568-armor source completeness, 169 spell metadata rows, or 221 source enemy records into accepted parity.

## Separate concerns

Business use of game data, software licensing, third-party access and trademark policy **still require legitimate compliance**. But those issues are not numerical comparator benchmarks and should be reported separately, not used to redefine matching as a failure. Publication SEO/indexing gates are also independent of the question, "does this output match Tarnished.dev?"

## Automation

Run `scripts/audit-tarnished-public-feature-scope.mjs` to inspect four actual public calculator UIs, display versions and effective controls. Its output is **scope discovery, not a numerical test pass**. For numerical acceptance use double-read exact-input workflows and permanent fixtures with real browser provenance.
