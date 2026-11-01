# Tarnished.dev-only final residual comparison — fixed scope (2026-11-01)

**Only reference:** actual interactive https://www.tarnished.dev/ as observed in **two independent Chromium browser profiles**, with its visibly displayed **v1.17** marker. Do not substitute a cached search crawl, original game client, another wiki, a community API, or any other source for a numeric PASS. Non-numeric rights/SEO work is separate and is **not an added numerical comparison requirement**.

This report answers "is the corresponding local tool numerically the same as the actual reference site?" and separates **already passed samples**, **actually mismatched**, **not implemented as an equivalent calculator**, and **not observable in the reference UI**. The checking itself has a finite end; a recorded NO-MATCH or UNSUPPORTED must not be relabelled "done and passed".

## One frozen final accounting table

| Actual public-site module | Previously checked and retained | This round's new direct observations | Final numeric comparison decision |
| --- | --- | --- | --- |
| Weapon AR | 116 exact examples plus 348 historical +0 site reads (one Icerind float boundary corrected for exact input); existing normal source math unaffected | Actual **Build Planner** Uchigatana Standard +25 Wretch STR/DEX **15/20=376, 20/20=388, 15/25=392**, each independently read twice; our independent local v1.17 AR model equals **all three** | **MATCH for these inputs only**, not proof of arbitrary affinities/upgrade/stat combinations |
| Build Planner | Original **10/10** classes with 8 attributes/level; **360** unbuffed HP/FP/Stamina/equip-load numeric reads; individual selected talismans and narrow exact combinations | The three new full Build weapon AR profiles above, cross-checked against Damage page's different answers | **MATCH for covered isolated facts**; arbitrary equipped armor/talisman/rune/Physick buffs, final resistance/defense and stacked AR **NOT IMPLEMENTED as general same-input parity** |
| Armor Optimizer | 549 original armor Weight+Poise pairs twice read, 2 extra DLC pieces; 515 complete individual 12-field stat-stable armor rows. Poise-only Wretch Normal roll optimum **70** local and site | No new untested single-item data substituted. Existing site first-ranked set still differs from the local rank order | **Poise value MATCH; full best-four-item set, ordered top-5 and weighted 13-stat semantics NOT MATCH/CERTIFIED** |
| Damage Calculator | Real v1.17 same-input Uchigatana +25 STR15 DEX20 shows AR376, DPS single464, paired547. Only AR independently calculated | Three site **Damage page** actual +25 rows, twice each: STR/DEX 15/20 **AR376, DPS464/547**, 20/20 **AR392, DPS489/577**, 15/25 **AR388, DPS483/570** | **Important: public-site INTERNAL AR DISAGREEMENT** on the latter two between reference Build and Damage pages; local engine agrees with **reference Build** on all three. Enemy/NG/moveset damage and DPS remain not same-input implemented |
| Spell Calculator | Real v1.17 Wretch INT25, Astrologer's Staff + Glintstone Pebble result magic242/FP7 | Three exact selected reference observations, twice each: **INT25=242, INT30=267, INT40=315**, FP7, one bullet | **REAL REFERENCE NUMBERS OBSERVED, but NO LOCAL SPELL SCALING CALCULATOR or same-input numerical reproduction**; impossible to mark MATCH from a source table alone |
| Talisman selector and combinations | 14 individual talismans, 8 distinct wearable combinations, and 8 newly measured selector behaviors | Prior PR #155/#156 two-browser provenance/equipment legality frozen | **MATCH at explicitly observed exact Wretch input/selection orders**; arbitrary talisman effects not certified |

### Key finding — a discrepancy inside Tarnished.dev itself

For **the same** Wretch, Uchigatana, Standard, smithing +25, unbuffed, one-handed controls:

| Strength / Dexterity | Actual Tarnished.dev Build Planner AR | Actual Tarnished.dev Damage Calculator AR | Independently calculated local AR |
| --- | ---: | ---: | ---: |
| 15 / 20 | **376** | **376** | **376** |
| 20 / 20 | **388** | **392** | **388** |
| 15 / 25 | **392** | **388** | **392** |

These are observations of the **same website's two live calculators**, not disagreement with any outside benchmark. Both site pages were independently read twice in separate Chrome processes, with exact live weapon, affinity, upgrade, five stats and active switches checked. Preserve and report this external inconsistency. Do **not** change the correct, observed Build-matching production AR algorithm to force both incompatible reference answers at once. In the Damage page, timing-derived DPS readings (shown above) cannot be established by our independent engine from an AR alone.

### Fixed meaning of statuses

- **MATCH** — same effective inputs and the reference's displayed numeric outputs independently reproduced by our model at the recorded examples.
- **REFERENCE_CROSS_PAGE_MISMATCH** — two public Tarnished.dev calculators disagree with each other under identical controls; our engine is compared to each separately, and neither site's answer is made up.
- **NOT_IMPLEMENTED** — local calculator does not possess an equivalent input schema/model; merely copying the reference output is **not** a matching calculation.
- **UNOBSERVABLE** — reference site does not render the requested value, e.g., 27/487 low-requirement weapon `Req:` widgets and 19 historical armor aliases/invalid records.

**No open-ended numerical verification requirements** are introduced: neither official-game-client 1.17.3 certification nor other sources' parity nor exhaustive millions of combinations. The unimplemented Damage, Spell and weighted Armor semantics are **development gaps, not new comparison tasks**.

### Immutable evidence

- [Current same-input cross-page browser run](https://github.com/garrison2025/Elden-Ring/actions/runs/41296445733) — both independent Build reads and three Damage+Spell site profiles in separate Chrome processes; individual JSON jobs.
- [Prior successful two-pass all-six reference reading](https://github.com/garrison2025/Elden-Ring/actions/runs/41296105831).
- `scripts/tarnished-v117-residual-3x2-observed-goldens.json` — 3 Damage and 3 Spell exact reference rows, plus 3 same-input Build AR values. Source data only; no invented local spell/DPS engine.
- `scripts/verify-tarnished-residual-three-uchigatana-ar.mjs` — independently computes all three Build page AR values from the supported pinned v1.17 parameter source.
- `scripts/check-tarnished-residual-damage-spell-v117.mjs` — compares distinct fresh Chrome passes for six scenes and performs explicit cross-page AR discrepancy checks.
- Earlier closed reports: `docs/TARNISHED_V117_FINAL_SCOPE_ACCEPTANCE_20261101.md`, `docs/TARNISHED_V117_REMAINING_ONLY_FINAL_AUDIT_20261101.md`, `docs/TALISMAN_VARIANT_FAMILY_AND_LIVE_SELECTION_AUDIT_20261101.md`.

**Final integrity rule:** a successful CI run confirms code/tests and captured source rows; it **does not** certify all five full calculators. As of this report, full-site feature parity is NOT 100%; only the explicitly listed cases and fields have passed.
