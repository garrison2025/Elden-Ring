# v1.17 source-scoped multiweapon AR ranking — evidence and limits

The Weapon AR Calculator now includes an opt-in **same-build source-variant ranking** under the existing calculator at `/weapon-ar-calculator/`. It runs entirely in the existing browser Worker, **not** on Cloudflare servers or a paid API. The public source is the pinned third-party **v1.17** snapshot requested directly by the user; the user can instead load their own local JSON. The fictional QA demo is unmistakably labelled invented data.

## User workflow
1. Open the Weapon AR Calculator. **Explicitly** click “Load public v1.17 data” (not loaded on page visit) or choose local file / fictional demonstration.
2. Set STR, DEX, INT, FAI, ARC, and one-hand/two-hand mode in the existing calculator.
3. Use “Compare multiple weapon Attack Ratings”: enter a search term of 2–100 characters, optionally filter exact source affinity ID (all / None / Standard / 12 source affinities), and choose **two independent values** for Regular +0..25 and Somber +0..10.
4. Click “Rank matching weapon AR”. The Worker converts exact source variants with the existing `describeLocalWeapon` / `calculateAr` engine and sorts **numeric nominal total AR descending**. The table includes source weapon, affinity, reinforcement path, numeric physical/magic/fire/lightning/holy components, unmet attribute requirements, and missing mechanics warnings.
5. Choose “Export displayed AR ranking CSV”; generated in browser with source/version provenance and spreadsheet-formula injection protection. No network write. Editing stats, grip, query or upgrades invalidates both results and export.

## Honest, bounded limitations
- **240 exact variants maximum per query**: broader requests return a diagnostic asking the user to refine the name/affinity. Never call the first 240 alphabetical results a global top-AR ranking.
- Exclude with count and source error reason every candidate that cannot be converted or whose requested Regular/Somber +level is absent. **Never interpolate.** The first 12 excluded examples are displayed; the rest are still counted.
- The display includes source-defined variants and supports a multi-family substring search; it is **not** yet a single-click exhaustive ranking over all 3,296 variants at once.
- Unsupported weapon mechanics (paired grip, ammunition, status buildup, skills, buffs, spell tools, enemy defenses and actual DPS) remain **outside** nominal AR. Weapons below the requirements can show a penalized nominal AR, **labelled NOT MET**, never presented as wieldable.
- Source snapshots, names, calculated AR and CSV remain local to the user session; third-party material is not bundled. This is **community v1.17 reference only**, NOT independent Regulation 1.17.3 current-game validation, and nominal AR is not enemy damage.
- The existing 15/15 Tarnished.dev external same-input numeric evidence applies **only** to those specific exact cases. Running a much larger local ranking does **not** magically increase the number of independently observed reference samples.
- Weapon database and AR research pages remain **noindex** pending a separate content/rights assessment. This PR must not modify the five production-approved SEO URLs.

## Test acceptance
- Deterministic invented data: multi-family descending totals match the **same** existing single-weapon AR engine; 1H/2H differences, mixed damage components, unmet requirements and source-affinity legal variants.
- Strict Somber +0/+10 versus Regular +0/+25, no implicit path conversion; unprovided upgrades excluded with count.
- Oversized query failure is visible; malformed stats, affinity IDs, levels reject; CSV output tracks displayed rank and prefixes potentially executable spreadsheet names.
- Chrome at mobile width: no horizontal page overflow (table scrolls inside its container), user opt-in source load, fictional ranking, invalidation and re-run.
- Real pinned v1.17 Chrome: source-loaded Uchigatana +0 Standard AR 172; in-query Standard +25 AR 491; Blasphemous Blade source Somber +10 path while Regular +25 remains separate.

## Project milestone status
This closes **implementation of the bounded multiweapon AR ranking slice** of [Issue #83](https://github.com/garrison2025/Elden-Ring/issues/83). It does **not** close the master issue: 72 data gaps, 9 conflicts, source usage/rights decision, and the remaining 35 independent numerical benchmark cases still need resolution. The `audit:weapon-parity` gate remains NOT_READY until broader milestone evidence is accepted.
