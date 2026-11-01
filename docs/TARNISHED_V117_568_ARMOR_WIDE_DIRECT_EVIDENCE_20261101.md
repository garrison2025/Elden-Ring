# Live Tarnished.dev armor weight / Poise verification — batch of all 568 existing source records

**Acceptance benchmark:** only the **real displayed numbers** from [Tarnished.dev v1.17 Build Calculator](https://www.tarnished.dev/build-planner). This is not a requirement to agree with other community datasets.

[Original successful 15-shard, two independent Chromium passes](https://github.com/garrison2025/Elden-Ring/actions/runs/41274764944)

| Item | Count |
|---|---:|
| Existing catalog candidates checked | **568** |
| Actually selected in the reference site and read identically in two independent browser profiles | **543** |
| Not safely observable or not selectable with exact name | **25** |
| Existing local weight already equals real site | 520 |
| Existing local weight differs from real site | **23** |
| Existing local Poise already equals real site | 12 |
| Existing local Poise differs from real site | **531** |
| Total direct site-verified corrected numeric fields in overlay | **1,086 (543 × 2)** |

The older four independently sampled All-Knowing pieces are included and confirmed exactly in the much broader second campaign.

## Real browser controls and acceptance

15 category-aligned shards: Head 4, Chest 5, Arms 3, Legs 3. Each shard reads the same selected armor in two fresh Chromium profiles. Every sample is a **single armor item with all three other armor slots empty**, base Wretch 10 STR / 10 DEX / 10 INT / 10 FAI / 10 ARC, +0 reinforcement, Great Rune and Physick disabled. The baseline is 0 item load, 0 Poise and equip capacity 48.2. The real selected label must match the candidate and the site must show `Elden Ring Version: v1.17`.

A numerical value is accepted only when all effective control checks pass and the exact selected item's **weight and Poise both agree between the two independent browser reads**. Non-observed fields remain explicitly unverified. The frozen result including **all 568 attempted candidate IDs** is `scripts/tarnished-v117-armor-568-site-observations.json`. The client-side, bounded **543-only** source overlay is `public/src/tarnished-v117-armor-wide.mjs`, validated with regression tests.

## Website data correction

`loadPinnedArmorSource()` still fetches its existing pinned roster only when the user opts in. It overlays **only two public-reference-proven fields** on 543 exact matched source IDs: equipment Weight, equipment Poise (and `metrics.poise`). All other 12 sourced armor metrics, special effects, and entries not confirmed by the real comparator remain unchanged and are **not** declared site-verified.

This corrects **23 wrong weights** and **531 wrong Poise values** compared with Tarnished.dev in the currently selectable source subset. It also retains an exact fallback for the four earlier per-item goldens in local synthetic tests, and fails closed on duplicate or mismatched source IDs, names and slots.

## 25 remaining and next gates

Of the 25 unverified source names, most did not exist under the exact display name in the public Tarnished.dev selector (including cut/unreleased equipment and legacy naming variants); two were selected but a strict unchanged-capacity or other baseline condition did not pass. They remain **unobserved**, not matched or automatically corrected.

This audit **does not** verify defense negation, immunity, focus, vitality, full armor-combination optimization or active equipment effects. To complete those, run new exact-input public UI comparisons; do not relabel metadata completeness as numeric parity.

**This full external-site audit is manual-only for future runs**, to avoid making hundreds of redundant requests to Tarnished.dev every time a documentation/test commit changes.
