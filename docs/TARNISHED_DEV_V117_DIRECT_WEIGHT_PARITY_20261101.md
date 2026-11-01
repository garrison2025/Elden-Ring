# Tarnished.dev v1.17 — direct single-item weapon weight audit (2026-11-01)

## Standard and evidence boundary

Acceptance benchmark: **Tarnished.dev public v1.17**, not wiki and not an independent game client. Item weight is observed **independently from total AR**, by reading the rendered Build Planner **Equip Load** field with a single equipped armament and no other items. Each inference requires two Chrome page observations, exact selected weapon, correct Standard/None affinity, valid total AR shown, stats (STR60/DEX60/INT30/FAI30/ARC30), smith=0/somber=0, no Great Rune/Physick, no two-handing, and constant capacity 48.2.

- [Browser DOM discovery / first exploratory observation](https://github.com/garrison2025/Elden-Ring/actions/runs/41256750144): demonstrates `document.getElementById('Equip Load').value` and that it is absent from `document.body.innerText` because it is an input value; baseline 0.0; Longsword RH1/LH1 both 3.5.
- [Two independently repeated complete reads, input validation, source-to-local comparison](https://github.com/garrison2025/Elden-Ring/actions/runs/41257042883): `verifiedBaseline=true`, `knownLongswordBothHands=true`; **9/9** directly observed single-item weights; **5** originally missing from the canonical community catalog; **3** exact local community weight matches; **1** real competitor weight disagreement.
- Source: `scripts/probe-tarnished-item-fields.mjs` and `scripts/compare-tarnished-item-weights.mjs`. The former records bounded UI source state; the latter refuses to infer a weight if weapon selection, affinity, AR or control data is not verified, and is tested against an invalid/zero-weight case.

## Concrete data-to-data comparison

| Weapon | Tarnished.dev rendered single-item weight | Original local community weight | Status |
|---|---:|---:|---|
| Albinauric Shield | **4.5** | NULL | Direct competitor weight recovered |
| Brass Shield | **7.0** | NULL | Direct competitor weight recovered |
| Fingerprint Stone Shield | **29.0** | NULL | Direct competitor weight recovered |
| Golden Greatshield | **17.0** | NULL | Direct competitor weight recovered |
| Great Turtle Shell | **5.5** | NULL | Direct competitor weight recovered |
| **Stone-Sheathed Sword** | **5.0** | **3.5** | **Real comparator mismatch: local -1.5** |
| Fire Knight's Shortsword | 2.0 | 2.0 | Match |
| Greatsword of Radahn (Light) | 19.0 | 19.0 | Match |
| Ritual Thrusting Shield | 10.0 | 10.0 | Match |

The first exploratory probe produced **0 load** for Stone-Sheathed Sword and Radahn (Light) because those unique weapons were incorrectly given Standard affinity; those reads were **invalid**. The second, strict probe explicitly selects **None** affinity and confirms live numeric AR and Build controls before accepting the item weight. This is why a mere item name in a dropdown, or Equip Load zero, must never be promoted.

## Concrete website fix (and why canonical is preserved)

A small, explicit `public/src/tarnished-v117-public-weights.mjs` stores only these nine individually observed numeric facts and their comparator version/evidence, **not any third-party source code**. `evaluateBuildLoadout` applies an exact-name v1.17 competitor weight when the user has not supplied a manual override; these values are labelled `tarnished-dev-v1.17-direct-ui`. In particular, the formerly unknown five shield entries now contribute their real observed weights; Stone-Sheathed Sword contributes **5.0** instead of being blocked or using disputed 3.5. Manual entered overrides still have highest precedence.

`inspectBuildWeapon` and the weapon database detail explicitly display the versioned comparator weight. The original community `Stone-Sheathed Sword.weight=3.5` and source-conflict flag remain unchanged, with its 5.0 comparator observation displayed **separately**. Original five `weight=null` and `attack=null` remain in canonical 487-record provenance file; source-only flags and the historic 72 missing records are not falsely marked fully resolved. This prevents silent rewriting of community-origin evidence while fixing user-facing **v1.17 comparator** numbers.

## Still NOT verified

- The competitor Build UI does **not** directly expose raw +0 Physical/Magic/Fire/Lightning/Holy base attack components or individual minimum STR/DEX/INT/FAI/ARC requirements in the same publicly inspected view. Those fields remain NOT_OBSERVED rather than passing on independent ThomasJClark or wiki figures.
- Only **9 individual weight observations** in this milestone; this is not the full 487 catalog. AR parity remains **86** distinct same-input cases across **48** distinct weapon names; AR match does not prove a weight.
- Armor, active Build effects, enemy Damage and Spell parity remain open; rights and SEO/noindex status remain separate. The newer 1.17.3 game client is not a mandatory acceptance source under the user’s v1.17 website comparator-only rule.
