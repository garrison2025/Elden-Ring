# Tarnished.dev public v1.17 — existing community weight conflict audit (2026-11-01)

## Direct primary-site evidence and independent double-read result

- Scope: **32 previously community-weighted, never competitor-observed records**, comprising **20 source-sensitive or source-conflicted** entries and **12 other weapon-category controls**. The comparator is the real, publicly rendered **Tarnished.dev v1.17** Build Planner; no third-party wiki values or game client were used to claim numerical acceptance.
- [First direct two-run attempt](https://github.com/garrison2025/Elden-Ring/actions/runs/41260269883): 29 exact matches, 3 initially NOT_OBSERVED. The 3 involved a sorcery staff (no standard numeric Total AR), Carian Sorcery Sword (same issue), and an unactivated torch. That initial observation was **not** silently promoted.
- [Second full two-run Chrome verification, with stricter numerical Sorcery activation](https://github.com/garrison2025/Elden-Ring/actions/runs/41260697800): `total=32`, `weightObserved=31`, `sameAsLocal=30`, `differentFromLocal=1`, `notObserved=1`, `sourceMissingObserved=0`. Both passes retained verified v1.17 marker, exact item name, real Standard/None affinity and activation (numeric Total AR or numeric Sorcery for the two verified caster weapons), correct five stats, +0 upgrades, buffs off and unchanged capacity 48.2. Empty build 0.0 and known Longsword RH and LH both 3.5 passed in both rounds.
- **Actual mismatch #2 among direct comparator weight observations:** `Staff of the Great Beyond` has **Tarnished.dev v1.17 weight 2.5**, original community catalog weight **2.0**, delta local minus competitor **-0.5**. The caster page displays `Sorcery : 150`, not normal numeric `Total AR`. This is why requiring a truly selected item *and* a numeric Sorcery value matters; the number is not inferred from AR.
- **Non-observed entry:** `Beast-repellent Torch` does not activate in the competitor's inspected Build UI; its zero load is invalid evidence. The original local weight 2.5 is retained, but no competitor weight is approved for this entry.

## Complete item-by-item direct comparison

| Item | Existing community weight | Tarnished.dev v1.17 direct weight | Delta (local - comparator) | Evidence |
|---|---:|---:|---:|---|
| Barbed Staff-Spear | 7.5 | 7.5 | 0 | WEIGHT_MATCH |
| Claws of Night | 3 | 3 | 0 | WEIGHT_MATCH |
| Falx | 4 | 4 | 0 | WEIGHT_MATCH |
| Golden Order Flail | 5 | 5 | 0 | WEIGHT_MATCH |
| Golem Fist | 6 | 6 | 0 | WEIGHT_MATCH |
| Greatsword of Radahn (Lord) | 19 | 19 | 0 | WEIGHT_MATCH |
| Hefty Scimitar | 9.5 | 9.5 | 0 | WEIGHT_MATCH |
| Idus Sword | 7 | 7 | 0 | WEIGHT_MATCH |
| Leontiel's Greatsword | 9.5 | 9.5 | 0 | WEIGHT_MATCH |
| Madding Hand | 1 | 1 | 0 | WEIGHT_MATCH |
| Main-gauche | 2 | 2 | 0 | WEIGHT_MATCH |
| Messmer Soldier's Spear | 8.5 | 8.5 | 0 | WEIGHT_MATCH |
| Queelign's Greatsword | 7.5 | 7.5 | 0 | WEIGHT_MATCH |
| Reed Great Katana | 10 | 10 | 0 | WEIGHT_MATCH |
| Reverse-Bladed Sword | 3 | 3 | 0 | WEIGHT_MATCH |
| Silver Grooved Shield | 3 | 3 | 0 | WEIGHT_MATCH |
| Smithscript Axe | 5 | 5 | 0 | WEIGHT_MATCH |
| Smithscript Dagger | 1.5 | 1.5 | 0 | WEIGHT_MATCH |
| Staff of the Great Beyond | 2 | 2.5 | -0.5 | WEIGHT_MISMATCH |
| Swift Spear | 3 | 3 | 0 | WEIGHT_MATCH |
| Ancient Meteoric Ore Greatsword | 22 | 22 | 0 | WEIGHT_MATCH |
| Anvil Hammer | 22 | 22 | 0 | WEIGHT_MATCH |
| Black Bow | 4 | 4 | 0 | WEIGHT_MATCH |
| Blasphemous Blade | 13.5 | 13.5 | 0 | WEIGHT_MATCH |
| Bloodhound's Fang | 11.5 | 11.5 | 0 | WEIGHT_MATCH |
| Broadsword | 4 | 4 | 0 | WEIGHT_MATCH |
| Carian Thrusting Shield | 10.5 | 10.5 | 0 | WEIGHT_MATCH |
| Caestus | 1.5 | 1.5 | 0 | WEIGHT_MATCH |
| Arbalest | 6 | 6 | 0 | WEIGHT_MATCH |
| Beast-repellent Torch | 2.5 | NOT_OBSERVED | — | NOT_OBSERVED |
| Banished Knight's Halberd | 8 | 8 | 0 | WEIGHT_MATCH |
| Carian Sorcery Sword | 2.5 | 2.5 | 0 | WEIGHT_MATCH |

## Fix to the actual site, with provenance preserved

- Promoted **only 31 input-verified, twice-repeated numeric competitor observations** (30 exact matches plus the Staff weight discrepancy) into `public/src/tarnished-v117-public-weights.mjs` with the precise evidence run number **41260697800**. No bulk guessing, no third-party data copy, no unreliably selected Torch.
- The existing Build Planner, weapon-reference and Weapon Database share `getTarnishedV117DirectWeight`; for `Staff of the Great Beyond` they now use and label public v1.17 **2.5** in weight calculations and display, unless the user deliberately overrides it. The original `public/data/community-weapon-catalog.json` still retains the original weight **2.0** and flags; it is not silently overwritten. This is a competitor-v1.17-specific correction, *not* proof of game client 1.17.3 values.
- Regression tests verify 107 distinct primary-site direct item-weight observations, the single-source discrepancy, non-approved torch and the Build manual weight override, without claiming base attack or spell-effect correctness.

## Precise scope and remaining gaps

Previously direct-weight-verified: **76** (72 formerly missing community weight values, three community matches, one real community mismatch, Stone-Sheathed Sword 3.5 vs v1.17 5.0). This round adds **31**, making **107/487 distinct catalogue names with direct competitor-v1.17 weight observations**, including two actual historical-community numeric mismatches. **380 of the 487 names still lack an independent v1.17 weight observation** (including the unobserved torch). The original 72 `weight=null` rows stay intentionally unchanged in the canonical provenance file, even though all 72 have their own observed comparator-layer weight.

The separate AR parity record remains **86 same-input AR cases over 48 distinct weapon names**. A verified item weight does not prove that weapon's +0 five-channel attack tuple, minimum STR/DEX/INT/FAI/ARC requirements, scaling, spell effects, or in-game patch parity. Armor, active Build effects, enemy Damage and Spell modules remain incomplete against the Tarnished.dev public v1.17 comparator. SEO/noindex and third-party redistribution rights are separate release gates.
