# Tarnished.dev v1.17 — 68/68 real public UI Weapon AR same-input comparisons (2026-11-01)

## Conclusion
- Existing 50 comparator cases remain independent and unchanged: [prior report](./TARNISHED_DEV_50_CASE_PARITY_20261031.md).
- **18 NEW distinct weapons / affinity / upgrade / player stat / grip combinations** independently observed twice with exact UI input checks (original site version **v1.17**) and compared to our own weapon AR calculator using the pinned public v1.17 reference parameters.
- Both browser runs observed **18/18** valid inputs and the **same 18 actual numeric AR values**. Both calculated **18/18 matched**, **0 numeric mismatches, 0 unverified/blocked, 0 difference**.
- Total **68/68 twice-observed same-input combinations**, not 68 unique weapons, not a full 487-weapon field certification, not 3,296 Tarnished.dev observed variants.
- Browser run 1: https://github.com/garrison2025/Elden-Ring/actions/runs/41255162868
- Browser run 2: https://github.com/garrison2025/Elden-Ring/actions/runs/41255239994
- Exact 18 inputs are in `scripts/tarnished-v117-fresh-candidates.mjs`; approved regression fixtures in `public/src/tarnished-v117-approved-fresh.mjs`.

## New 18 direct same-input comparison results

| ID | Tarnished.dev v1.17 rendered AR | Our calculated AR | Delta |
|---|---:|---:|---:|
| fresh-broadsword-standard-p0 | 142 | 142 | 0 |
| fresh-lordsworn-quality-p25 | 517 | 517 | 0 |
| fresh-zweihander-heavy-p25-2h | 735 | 735 | 0 |
| fresh-nagakiba-keen-p25 | 599 | 599 | 0 |
| fresh-godskin-peeler-blood-p25 | 556 | 556 | 0 |
| fresh-antspur-rapier-poison-p25 | 449 | 449 | 0 |
| fresh-scavenger-curved-occult-p25 | 572 | 572 | 0 |
| fresh-guardian-swordspear-keen-p25 | 785 | 785 | 0 |
| fresh-rellanas-twin-blades-s10 | 847 | 847 | 0 |
| fresh-star-fist-heavy-p25-2h | 508 | 508 | 0 |
| fresh-great-stars-cold-p25 | 748 | 748 | 0 |
| fresh-black-knife-s10 | 501 | 501 | 0 |
| fresh-deaths-poker-s10 | 659 | 659 | 0 |
| fresh-claymans-harpoon-magic-p25 | 671 | 671 | 0 |
| fresh-magma-blade-s10 | 629 | 629 | 0 |
| fresh-urumi-keen-p25 | 609 | 609 | 0 |
| fresh-warhawks-talon-lightning-p25 | 568 | 568 | 0 |
| fresh-grafted-blade-greatsword-s10 | 732 | 732 | 0 |

Actual conditions include full STR/DEX/INT/FAI/ARC stats, affinity, legal smithing/somber reinforcement level and one-/two-handed flags; source input validation checks the rendered public site. All buffs from Great Rune/Physick were inactive.

## Evidence protocol and remaining limits
- New cases were **not** approved on first probe. Independently repeated Chrome runs were compared case-by-case, confirming the same externally rendered AR, browser input controls, and independently calculated result.
- This validates these **AR samples only**. It does not independently validate defense, enemy damage, status buildup, item weight, armor, spells, passive effects or any unknown 487 catalog data.
- The original catalog retains 72 missing primary attack/weight fields and 9 source disputes; ThomasJClark source comparisons (41 base-attack and 25 minimum-stat differences) are distinct from Tarnished.dev website observations and must not be called competitor errors.
- Third-party data redistribution rights and separate SEO release decisions do not follow from numeric parity; the current game-client Regulation 1.17.3 is not the requested comparator.
