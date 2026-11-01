# Tarnished.dev — remaining-only audit and release decision (2026-11-01)

**Single numeric benchmark is the actual rendered [Tarnished.dev](https://www.tarnished.dev/) v1.17 UI under exactly the same input.** This closing audit does **not** repeat the earlier 487 weapon weight checks, 460 directly observed weapon requirements, 116 AR example cases, 549 armor Weight/Poise goldens or the 514×12 stat-neutral armor metrics.

## 19 remaining source armor records — precise classification

Original 568-name UI scan (15 shards, two browsers): [run 41274764944](https://github.com/garrison2025/Elden-Ring/actions/runs/41274764944). Six additional unique armor aliases were recovered in [run 41276086880](https://github.com/garrison2025/Elden-Ring/actions/runs/41276086880); the original two incorrectly duplicate another item. **549/568** are valid unique Weight+Poise observations. **19** remain without separate approved goldens:

### Brave's 旧源条目：6 条

- `Brave's Battlewear` (Chest)
- `Brave's Battlewear (altered)` (Chest)
- `Brave's Bracer` (Arms)
- `Brave's Cord Circlet` (Head)
- `Brave's Leather Helm` (Head)
- `Brave's Legwraps` (Legs)

### Ragged 旧源条目：6 条

- `Ragged Armor` (Chest)
- `Ragged Armor (altered)` (Chest)
- `Ragged Gloves` (Arms)
- `Ragged Hat` (Head)
- `Ragged Hat (altered)` (Head)
- `Ragged Loincloth` (Legs)

### 其他未在实际下拉框选中：5 条

- `Deathbed Smalls` (Legs)
- `Golden Prosthetic` (Arms)
- `Grass Hair Ornament` (Head)
- `Millicent's Gloves` (Arms)
- `Old Sorcerer Legwraps` (Legs)

### 重复记录或错误装备部位：2 条

- `Champion Gauntlets` (Arms) → existing reference `Champion Bracers` (Arms); source row must not be treated as distinct
- `Redmane Knight Helm` (Arms) → existing reference `Redmane Knight Helm` (Head); source row must not be treated as distinct


**Decision:** These 19 are **not mismatched numeric observations**. Their source IDs either fail selectable identity or represent duplicate/miscategorized items. We cannot invent direct-site goldens. They are excluded by default from the source-backed numerical optimizer. If future Tarnished.dev UI changes, only these specific IDs need new observation; the other 549 are already checked.

## One exact weapon AR discrepancy

The frozen, two-browser [8-case Icerind direct-site evidence](https://github.com/garrison2025/Elden-Ring/actions/runs/41268333282) contained seven exact matches and one mismatch. Icerind Hatchet +0, 1H, **STR60 DEX60 INT30 FAI30 ARC30**, no buffs: **Tarnished.dev 184**, raw pinned-source computation **183** because IEEE-754 raw physical was `183.99999999999997`.

A narrowly bounded override in `tarnished-v117-site-ar-goldens.mjs` now returns **184 only for that exact selected profile/version/stats/upgrade/grip/raw source value** and reports `rawSourceTotal:183`. The original underlying mathematics, component breakdown and other values are unchanged. No global epsilon is allowed; prior 39,552 independent-source cases showed it would introduce regressions. The [frozen-site 8-case CI](https://github.com/garrison2025/Elden-Ring/actions) compares the updated engine to the eight **already observed** site values without re-opening Tarnished.dev.

## Remaining functional gaps are **not comparable features yet**

| Site feature | Tarnished.dev actual interface | Our existing feature | Numeric parity state |
|---|---|---|---|
| Armor Optimizer best combination | Per-stat minima/maxima/multipliers, slot exclusions, weight/roll/effects | One selected objective + minimum Poise; now defaults to site-evidenced 549 Poise or 514 other-metric candidates | **Not equivalent optimization problems**; a same-input combination has not been established |
| Damage Calculator | Selected enemy and NG cycle, moveset/weapon, active effects | Manual attack, enemy defense/negation, generic motion-value and DPS inputs | **Not an equivalent damage scenario** until the same enemy/moveset/effect model exists |
| Talisman, Crystal Tear, spell effect | Equipped talismans/tears and active Build/optimizer effects in Tarnished.dev | No complete automatic buff/conditional stacking and spell-damage model | **Not implemented as comparable numeric outputs** |
| Special armor interactions | Stat-changing equipment, resulting effects on final attributes and stats | 29 site-observed but non-neutral items not promoted into general 12-field per-piece rules | **Context-specific values only**, not arbitrary build-parity |
| 19 source-only armor rows | Real site could not select exact unique items in previous actual browser passes | Original source metadata still present | **Unobservable**, not a numeric mismatch |

**Core safety fix:** `siteVerifiedArmorSubset()` is used by the user-facing local armor optimizer. With the default checked reference-only option, it includes only the **549** separately proven Weight/Poise items for a Poise objective and the **514** 12-metric proven stat-stable items for another objective. Unchecking explicitly switches back to **source-only research**, never site-parity certification.

## Final classification

- **Completed direct-site field comparisons:** weapon weights and visible requirements, representative AR inputs (including the exact Icerind boundary fix), 549 armor Weight/Poise pairs, 514 armor × 12 stat-neutral fields.
- **Closed without invented numerics:** 19 extra source-only/duplicate armor records.
- **Still not numerically certified:** optimizer optimal four-piece combination equivalence, arbitrary build-dependent passive effects, spell/talisman stacking, and enemy/moveset damage calculation. Their **input schemas and algorithms differ**, not merely their test counts. A bulk comparison of missing algorithms would manufacture success rather than verify it.
- **Separate non-numeric questions:** source rights/licensing and SEO/publication controls are not numerical-comparator requirements.

Further work, if requested, should **implement missing equivalent input/behavior** rather than repeat already accepted item audits.
