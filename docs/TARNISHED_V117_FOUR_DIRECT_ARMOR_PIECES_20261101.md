# Direct Tarnished.dev v1.17 armor weight and Poise — four exact-item UI samples

**Single numeric comparator: [Tarnished.dev public Build Calculator](https://www.tarnished.dev/build-planner)**, observed through a real Chromium process and repeated in a second independent process as the CI acceptance gate. No other database or game patch is used to determine whether these fields match.

The input baseline for every independent item was a Wretch with 10 STR / 10 DEX / 10 INT / 10 FAI / 10 ARC, +0 reinforcement, no Great Rune/Physick or other equipment, **0 baseline item load, 0 Poise**, total capacity **48.2**. Each armor was selected from the real visible PrimeReact option (name identity checked) and read from rendered `#Equip Load` and `#Poise` controls. [Initial real-browser evidence](https://github.com/garrison2025/Elden-Ring/actions/runs/41274222694); [two-pass recheck](https://github.com/garrison2025/Elden-Ring/actions/runs/41274434745).

| Independently selected equipment | Actual Tarnished.dev v1.17 weight | Legacy source weight | Actual Tarnished.dev v1.17 Poise | Legacy source Poise |
|---|---:|---:|---:|---:|
| All-Knowing Helm | **4.6** | 4.6 | **7** | 5 |
| All-Knowing Armor | **10.7** | 10.6 | **22** | 16 |
| All-Knowing Gauntlets | **3.5** | 3.5 | **5** | 4 |
| All-Knowing Greaves | **6.6** | 6.6 | **13** | 10 |

**4/4 source Poise values are wrong for Tarnished.dev v1.17 parity; 1/4 source weights differs.** Source row arithmetic compliance is not a substitute for real public-site numerical results.

## Production fix

- `public/src/tarnished-v117-armor-direct.mjs` includes **only these four exact weight/Poise goldens**, not guessed values for 568 pieces.
- User-initiated `loadPinnedArmorSource()` fetches the original 568-row community corpus, then overlays these four **site directly verified weight/Poise fields** in-memory; no full proprietary dataset is copied to GitHub.
- Existing `inspectArmorSource()` remains the strict unmodified original-source parser. Unverified physical/elemental damage negation, resistances, armor passive effects and other items are **NOT** overwritten and are **NOT** claimed site-verified.
- Each corrected row exposes `siteDirectFields` provenance. The build and armor optimizer UI explain that four items have reference-aligned weight/Poise and all other armor fields are still source-only.
- CI runs **two independent real browser reads**, requires identical user inputs/site version/selected item and exact numeric output, then compares the **actual overlay returned by our user-facing armor loader**. The site is the sole numeric golden.

This is **8 directly observed armor numeric fields across four pieces**, not certification of all 568 armor rows, armor optimization search parity, or spell/buff/damage modules. The only remaining acceptance target for those numbers is Tarnished.dev under precisely matched inputs.
