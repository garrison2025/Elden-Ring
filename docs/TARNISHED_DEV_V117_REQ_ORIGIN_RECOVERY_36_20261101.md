# Tarnished.dev public v1.17 — original-class switching unlocks hidden Req (2026-11-01)

## Strict live comparison

Real [six-shard two-pass public Chromium results](https://github.com/garrison2025/Elden-Ring/actions/runs/41267709648) recover **35/36** previously unobserved minimum-requirement tuples. All 35 direct five-number `Req:` values exactly match the active pinned v1.17 comparator source, and both independent page reads match one another.

This is a different control condition from the original Wretch-at-10 reading. The browser *clicked the actual visible PrimeReact Starting Class dropdown* and selected a genuine original character class with a base stat lower than at least one candidate required stat. Each accepted record verifies the resulting class label, its five actual numeric inputs, version, selected weapon, affinity, +0, one-hand and inactive Rune/Physick. Merely editing a hidden `<select>` or input's DOM value does not count: an earlier pilot proved such changes did not update the site's calculation state.

- Pilot: [actual Astrologer-origin Club Req 10/0/0/0/0, twice](https://github.com/garrison2025/Elden-Ring/actions/runs/41267459898)
- Production research audit: [36 cases, 6 parallel double-read browser shards](https://github.com/garrison2025/Elden-Ring/actions/runs/41267709648)
- Original captured site values: `scripts/tarnished-v117-direct-req-origin-recovery-36.json`

| Batch | New double-observed Req | Cumulative direct Req | Not directly observed |
|---|---:|---:|---:|
| Original 487-name audit | 357 | 357/487 | 130 |
| Prior AR-reference rescue (#111) | +20 | 377/487 | 110 |
| Previously high-but-inactive retry (#112) | +46 | 423/487 | 64 |
| Valid lower-origin retry (this batch) | **+35** | **458/487 = 94.0%** | **29** |

The 35 confirmed cases comprise 22 Wretch-hidden records and 13 previously not observed low-Req cases. The six exact-shard compare logs show zero mismatches against pinned source, zero source-conversion blocks, and no reported historical-community disagreements for these cases.

## One lower-origin candidate remains NOT_OBSERVED

**Frenzied Flame Seal**: neither origin-switched browser pass rendered an acceptable direct Req. Original historical community requirement `0/0/0/10/10` is *not* proof of site output; the pinned v1.17 effective source was reported as `0/0/0/0/0` for this item. Keep the conflict and direct-certification uncertainty visible; do not fill or falsely approve.

## Remaining 29 direct Req limitations

- **25** entries have a historical candidate required stat no greater than the minimum corresponding base stat across any of the original classes, so this 'lower starting class to trigger Req' technique cannot expose their requirements.
- **1** Frenzied Flame Seal still has no direct repeated Req despite switching class, with historical vs pinned-source disagreement as described.
- **3** items still fail exact active public weapon selection/readout attempts: **Great Épée**, **Serpent-hunter**, **Steel-wire Torch**.
- These unresolved values may still be available in another independent, publicly visible detail view; that has **not** been demonstrated here. The 29 are `NOT_OBSERVED`, not wrong, not zero and not gameplay-certified.

## Separate acceptance gates are unchanged

487-item weapon families are a source roster, but 458 direct requirement tests are not full weapon data certification. Weapon weight still has 6 direct gaps; +0 total AR contains the acknowledged one-ULP Icerind Hatchet site 184 vs local 183 mismatch; multi-weapon affinity and reinforcement grid, five-component base damage, armor effects, damage calculations, spell and data-license review remain independent. Keep site-wide research `noindex` until the relevant production and SEO gates are individually met. No paid API or user data upload is required.
