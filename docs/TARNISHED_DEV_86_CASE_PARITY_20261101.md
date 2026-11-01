# Tarnished.dev public v1.17 — high-risk 18-weapon AR discrepancy audit (2026-11-01)

## Primary-site evidence and conclusion

- **18 / 18** exact-input public-site AR observations matched our computed result in **two independent Chromium instances**; every row had valid v1.17 page marker, weapon, affinity, upgrade, STR/DEX/INT/FAI/ARC, grip, no active Rune/Physick.
- Full run [1](https://github.com/garrison2025/Elden-Ring/actions/runs/41256014056) and [2](https://github.com/garrison2025/Elden-Ring/actions/runs/41256043633) each completed successfully, with **0 differences, 0 unverified inputs, 0 differing repeat reads**.
- Prior approved 50 + additional approved 18 + this targeted high-risk 18 = **86 distinct same-input public v1.17 AR samples**, **not 86 different weapon families** and not an item-attribute audit.
- This PR does **not** alter user-facing community database facts, invent absent weight or requirements, or turn unknown fields into green badges.

## Direct comparator AR values

| Weapon | Tarnished.dev browser AR | Local v1.17 math | Delta |
|---|---:|---:|---:|
| Fire Knight's Shortsword | 111 | 111 | 0 |
| Greatsword of Radahn (Light) | 265 | 265 | 0 |
| Greatsword of Radahn (Lord) | 762 | 762 | 0 |
| Madding Hand | 138 | 138 | 0 |
| Queelign's Greatsword | 189 | 189 | 0 |
| Smithscript Axe | 159 | 159 | 0 |
| Smithscript Dagger | 78 | 78 | 0 |
| Stone-Sheathed Sword | 114 | 114 | 0 |
| Barbed Staff-Spear | 211 | 211 | 0 |
| Claws of Night | 168 | 168 | 0 |
| Falx | 138 | 138 | 0 |
| Messmer Soldier's Spear | 169 | 169 | 0 |
| Swift Spear | 132 | 132 | 0 |
| Ritual Thrusting Shield | 165 | 165 | 0 |
| Albinauric Shield | 86 | 86 | 0 |
| Brass Shield | 93 | 93 | 0 |
| Fingerprint Stone Shield | 184 | 184 | 0 |
| Golden Greatshield | 150 | 150 | 0 |

Exact full inputs: `scripts/tarnished-v117-disputed-candidates.mjs`; immutable repeated-reference observations: `public/src/tarnished-v117-approved-disputed.mjs`.

## What remains unproven

The local 487-weapon catalog still contains **72 records with primary base attack and weight missing**, plus **9 explicit source-conflict records**. Source-to-source **41 basic attack** and **25 requirement** differences were observed in another independent publicly pinned data source: these are **not** 41/25 confirmed competitor UI mismatches.

A matching whole-weapon AR number does NOT prove the community +0 physical/elemental base attack tuple, weight, attribute requirement, status buildup, or damage against a target. The observed readout is a composite of source parameters, reinforcement, stats and scaling, so do not overwrite the original canonical fields just because a total matches. To close field conflicts we must separately read those exact individual Tarnished.dev public fields and calculate a direct field-level delta; if the competitor does not publicly expose them, retain NOT_OBSERVED/UNKNOWN.

Remaining entire-site gaps: Armor defense/resistance/passives/Pack filters; Build equipment effects and stacking; Damage enemy/move/NG+/PvP; Spell catalyst/buff/offensive numerical comparisons. Prior parity fixture: [68-case report](./TARNISHED_DEV_68_CASE_PARITY_20261101.md). Scope: [comparator-only v1.17 acceptance](./TARNISHED_V117_COMPARATOR_ONLY_ACCEPTANCE_20261031.md).

Third-party redistribution rights and SEO/noindex approvals are separate decisions. Game-client Regulation 1.17.3 certification is not required.
