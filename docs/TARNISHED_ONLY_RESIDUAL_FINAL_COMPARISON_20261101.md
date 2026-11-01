# Tarnished.dev v1.17 only — finite remaining comparison audit (2026-11-01)

Numerical benchmark: **actual publicly rendered Tarnished.dev v1.17** with identical effective inputs; two independent fresh Chromium sessions per new scene. Do NOT substitute other websites, game-client Regulation versions, offline assumptions, or frozen reference values for a local algorithm.

## Real result from this round

The reference's Damage and Build pages **AGREE** when the actual scenario identity, not the unordered GitHub Actions job ID, is used. One initial manual job-ID association was incorrect and was immediately corrected after a formal same-input cross-page comparison. This is a bookkeeping correction, **NOT** an identified problem in Tarnished.dev.

All three profiles: Wretch, other original attributes 10, unbuffed, **Uchigatana, Standard, smithing +25, one-handed**. Each corresponding Build and Damage page separately read twice in Chromium. Independent local v1.17 AR engine recalculated three samples.

| STR / DEX | Tarnished.dev Build AR | Tarnished.dev Damage AR | Local independently calculated AR | Reference Damage DPS single / paired | Verdict |
| --- | ---: | ---: | ---: | --- | --- |
| 15 / 20 | **376** | **376** | **376** | 464 / 547 | **AR MATCH** |
| 20 / 20 | **388** | **388** | **388** | 483 / 570 | **AR MATCH** |
| 15 / 25 | **392** | **392** | **392** | 489 / 577 | **AR MATCH** |

The **DPS figures are source observations only**. Our local manual Damage model does **not** implement the reference weapon move timing, enemy lookup, NG+, and exact DPS pipeline; no numerical DPS MATCH is asserted.

Public Spell Calculator: Wretch INT25/30/40, other base attributes 10, **Astrologer's Staff + Glintstone Pebble**, default site reinforcement and zero-defense/zero-negation target:

| INT | Actual Tarnished.dev Magic damage | FP | Bullets | Local parity |
| --- | ---: | ---: | ---: | --- |
| 25 | **242** | 7 | 1 | **NOT IMPLEMENTED** |
| 30 | **267** | 7 | 1 | **NOT IMPLEMENTED** |
| 40 | **315** | 7 | 1 | **NOT IMPLEMENTED** |

These six source scenes were **twice-observed**, with Wretch stats, exact selection labels, actual controls, version and raw result fields recorded. A real source output is **not** a local spell formula.

### Definitive accounting of corresponding modules

| Module | Accepted comparator observations already closed | Remaining numerical-equivalence status |
| --- | --- | --- |
| Weapon AR | 487/487 weights; 460/487 directly displayed requirements (27 unobservable), broad independent AR cases and one exact Icerind rounding correction; above 3/3 new +25 AR | **MATCH for observed configs**; arbitrary untested upgrades, affinities and effects cannot be called directly matched |
| Starting classes / Build | 10/10 original classes and Level with 8 attributes, 360 unbuffed HP/FP/Stamina/load values, 14 isolated talismans and a small exact Wretch set of combinations | **MATCH for tested individual contexts**; complete buffs/Physick/Great Rune/equipment effects and arbitrary class+gear downstream defense calculations remain **NOT IMPLEMENTED as general same-input model** |
| Armor Optimizer | 549 original armor Weight+Poise double reads; 2 independently observed DLC armor; 515 full 12-metric stat-stable pieces; Wretch Normal roll **70 Poise** maximum local and site | **70 objective MATCH**. Four-piece rank/ordered ties and all 13 weighted constraints **NOT IDENTICAL / NOT CERTIFIED**; full DLC candidate pool is not complete |
| Damage Calculator | Three new actual reference rows; independent local weapon AR **3/3 MATCH** | **DPS, selected enemy/NG/moveset/PvP/poise hit damage NOT IMPLEMENTED as a same-input comparator algorithm** |
| Spell Calculator | Three exact selected staff+spell source rows all double-read; magic 242/267/315 | **No local spell/catalyst damage engine**; 0/3 reproduced numerically, status NOT IMPLEMENTED |
| Talisman equipment selection | 14 isolated double reads, 8 distinct wearable combinations and 8 selector behavior scenes double read | **MATCH only for recorded Wretch 10/10 input/order**; unrestricted cross-item effect stacks not certified |

### Allowed end states, no expanding acceptance requirements

- **MATCH**: source effective inputs and real output independently repeated; local independent numeric calculation equals it for exactly the supported use case.
- **MISMATCH**: source shows a value and local engine produces a different one for same effective inputs; do not call such case passed.
- **NOT IMPLEMENTED**: the corresponding locally calculated feature does not exist, e.g. full spell scaling or actual enemy/moveset DPS. Reading more source values alone does not fix implementation.
- **UNOBSERVABLE**: public site does not render a unique target numeric field (27 hidden low-Req labels, 19 old duplicate/missing armor items). This is not a numeric error.

**Remaining tool implementation is NOT completed by this audit.** Passing CI or browser observation is not a claim that all of Tarnished.dev has been reproduced. No requirement for another game client's validation, another reference site, or millions of exhaustive combinations has been introduced.

## Evidence and verification

- [Real independent reference browser run with Build and Damage + Spell lanes](https://github.com/garrison2025/Elden-Ring/actions/runs/41296627816).
- `scripts/tarnished-v117-residual-3x2-observed-goldens.json`: strict actual profile-to-output mapping.
- `scripts/verify-tarnished-residual-three-uchigatana-ar.mjs`: independent local +25 AR calculation over a pinned v1.17 numerical parameter reference.
- `scripts/check-tarnished-residual-damage-spell-v117.mjs`: two-pass raw actual comparator observation and formal cross-page agreement audit.
- Earlier established scope and unsupported fields: `docs/TARNISHED_V117_FINAL_SCOPE_ACCEPTANCE_20261101.md`, `docs/TARNISHED_V117_REMAINING_ONLY_FINAL_AUDIT_20261101.md`.

**Verified status:** This is a complete, bounded accounting of residual comparisons and known implementation gaps. It does not mislabel missing Damage/Spell/weighted Armor computation as a successful same-input parity.
