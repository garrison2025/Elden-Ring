# Tarnished.dev v1.17 same-input external benchmark: 15 approved + 35 NEW candidate probes

**Date:** 2026-10-31. **Policy:** [Comparator-only acceptance](./TARNISHED_V117_COMPARATOR_ONLY_ACCEPTANCE_20261031.md). No real-game / Regulation 1.17.3 evidence is required. No actual game client is used.

## Two evidence populations — never conflate

| Population | Count | Status |
|---|---:|---|
| Previous publicly re-observed, mathematically matching exact-input samples | **15** | Existing approved Tarnished.dev v1.17 comparison evidence |
| Additional source-specific URL/input combinations | **35** | **CANDIDATES ONLY** until publicly observed **twice** with the correct controls and independently reproduced numeric results |
| Total input cases in the new Chrome probe | **50** | **NOT 50 matched/accepted cases yet** |

The original 15 AR cases remain in `public/src/tarnished-reference-benchmark.mjs`. The 35 supplementary inputs are defined in `scripts/tarnished-v117-extra-candidates.mjs`. Expected AR values are **not invented**, copied from other weapon calculators or extrapolated from the upstream regulation file.

## New coverage branches
- Regular +0 / +12 / +15 / +20 / +25 using Standard, Heavy, Keen, Quality, Fire, Flame Art, Lightning, Sacred, Magic, Cold, Poison, Blood and Occult where selected source variants are legally recognized.
- Main-game and Shadow of the Erdtree names: Longsword, Uchigatana, Claymore, Greatsword, Dismounter, Milady, Fire Knight's Greatsword.
- Unique/Somber examples include Moonveil, Blasphemous Blade, Dark Moon Greatsword, Bloodhound's Fang and Rivers of Blood at **+0 / +5 / +10**. Exact legal source support is checked; a missing variant cannot be counted as success.
- At least one two-handed case to test the source's STR/grip branch.

## Evidence protocol
1. A Github Actions Chrome browser visits Tarnished.dev's **public v1.17 Build Calculator** for each explicit candidate. It verifies: version v1.17, chosen weapon, affinity, all five combat stats, reinforcement series, grip, inactive Great Rune and Physick. A website failure or rejected controls is a **NOT VERIFIED** outcome, not a numerical match.
2. Capture the actual displayed `Total AR`, source page/controls and read-only observations into the short-lived private GitHub Action artifact `.audit/tarnished-chrome-ui.json`.
3. Fetch the pinned public source dataset **in the CI runner, without bundling it into the website**, calculate nominal AR using our independently authored engine and output exact integer differences to `.audit/tarnished-chrome-comparison.json`. Numeric mismatches are published as blockers. A calculation matching a site output in **one** run is labelled `matched-unpromoted`.
4. Independently repeat the live website probe. Only the two matching, input-verified observations and independent AR output may be considered for **manual promotion** into the approved benchmark file; review source behavior at cases that differ from our model before deciding whether the input mapping or algorithm is wrong.
5. The static `audit:weapon-parity` count must stay at **15** until actual promotion. Tests enforce that the new candidate module does not automatically inflate accepted samples.

## Independent gate distinctions
- This effort does **not** require in-game verification, game screenshots, patch 1.17.3 goldens or a subscription.
- Third-party data redistributing rights and SEO release approval are handled in separate workflows and are not numerical parity blockers.
- Passing weapon AR cases does not complete the unrelated Tarnished.dev Build, Armor, Damage or Spell feature matrices. Master [#86](https://github.com/garrison2025/Elden-Ring/issues/86) remains open.
