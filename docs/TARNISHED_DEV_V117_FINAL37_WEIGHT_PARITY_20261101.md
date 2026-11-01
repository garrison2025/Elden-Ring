# Tarnished.dev v1.17 — Final 37 missing weapon weight comparison (2026-11-01)

## Reference standard, method and independently repeated evidence

The comparator is the **actual public UI of Tarnished.dev v1.17** — not a third-party wiki, a GitHub Regulation parameter snapshot, or the game client. Each of these 37 previously NULL canonical weight records is individually selected into one weapon slot. The program directly reads the rendered `Equip Load` input, subtracts the empty build baseline, checks the site version, selected exact weapon name and active affinity, five character stats, upgrade +0, no Great Rune/Physick, no two-handed modifier, and non-zero active equipment. Somber/special items are confirmed with the actual `None` rather than assuming Standard when the UI doesn't activate; the Gravel Stone Seal catalyst has explicitly labelled activation if its attack field is not relevant.

For every candidate, Chromium independently visited the public site **twice**; both observations were identical. The empty build was 0 / 48.2 and known Longsword RH1 and LH1 controls were 3.5 / 48.2 in both runs. Mismatched, missing or unactivated observations remain `NOT_OBSERVED` by design and are never promoted.

**Actual primary-site run:** https://github.com/garrison2025/Elden-Ring/actions/runs/41259504988

Verified first + second run summary: `total=37`, `weightObserved=37`, `sourceMissingObserved=37`, `notObserved=0`, `verifiedBaseline=true`, `knownLongswordBothHands=true`. All 37 individual rows have `inputsConfirmed=true`, original local `weight=null`, and `COMPETITOR_WEIGHT_OBSERVED`. The comparator never emits invented numbers.

## Each new directly observed item weight

| Weapon (public v1.17 exact name) | Original local canonical weight | Tarnished.dev v1.17 observed weight | Comparison |
|---|---:|---:|---|
| Ant's Skull Plate | NULL | **12.5** | Verified twice |
| Coil Shield | NULL | **1.5** | Verified twice |
| Crucible Hornshield | NULL | **11.5** | Verified twice |
| Dragonclaw Shield | NULL | **13.5** | Verified twice |
| Erdtree Greatshield | NULL | **11.5** | Verified twice |
| Golden Beast Crest Shield | NULL | **10.5** | Verified twice |
| Gravel Stone Seal | NULL | **1.5** | Verified twice |
| Icon Shield | NULL | **9.0** | Verified twice |
| Inseparable Sword | NULL | **10.0** | Verified twice |
| Jellyfish Shield | NULL | **8.0** | Verified twice |
| Large Leather Shield | NULL | **3.0** | Verified twice |
| Lordsworn's Shield | NULL | **9.0** | Verified twice |
| Man-Serpent's Shield | NULL | **2.0** | Verified twice |
| Manor Towershield | NULL | **15.5** | Verified twice |
| Marred Leather Shield | NULL | **3.0** | Verified twice |
| Marred Wooden Shield | NULL | **4.0** | Verified twice |
| One-Eyed Shield | NULL | **20.5** | Verified twice |
| Perfumer's Shield | NULL | **1.5** | Verified twice |
| Pillory Shield | NULL | **3.5** | Verified twice |
| Red Crest Heater Shield | NULL | **3.5** | Verified twice |
| Red Thorn Roundshield | NULL | **1.5** | Verified twice |
| Redmane Greatshield | NULL | **14.0** | Verified twice |
| Rickety Shield | NULL | **1.0** | Verified twice |
| Rift Shield | NULL | **2.0** | Verified twice |
| Riveted Wooden Shield | NULL | **2.0** | Verified twice |
| Round Shield | NULL | **4.0** | Verified twice |
| Scorpion Kite Shield | NULL | **4.5** | Verified twice |
| Scripture Wooden Shield | NULL | **1.5** | Verified twice |
| Shield of the Guilty | NULL | **2.0** | Verified twice |
| Silver Mirrorshield | NULL | **3.5** | Verified twice |
| Smoldering Shield | NULL | **3.0** | Verified twice |
| Spiked Palisade Shield | NULL | **9.5** | Verified twice |
| Spiralhorn Shield | NULL | **2.0** | Verified twice |
| Sun Realm Shield | NULL | **3.5** | Verified twice |
| Twinbird Kite Shield | NULL | **4.5** | Verified twice |
| Visage Shield | NULL | **24.0** | Verified twice |
| Wooden Greatshield | NULL | **8.0** | Verified twice |

## Real code and test effects

- The separate, evidence-backed `public/src/tarnished-v117-public-weights.mjs` contains exactly **76 observed weapon weight facts**: previous 9, second batch 30, final batch 37. Its individual source rows retain their first successful two-round comparison run ID. The original canonical community `weight=null` facts and their missing attack/weight flags are **not** silently altered.
- The existing source-aware `getTarnishedV117DirectWeight` automatically feeds Build Planner, Build weapon item reference and Weapon Database UI. Previously uncalculable empty-catalog equipment now contributes independently observed v1.17 weight; users' explicit manual overrides still take precedence.
- The 72 canonical missing weight entries are now **72/72 covered by actual comparator UI observations in a separate version-labelled data overlay**. This does **not** mean the community catalog's 72 missing +0 attack component tuples, minimum requirements or patch certification have been restored. Source provenance remains unchanged.
- New tests verify that Inseparable Sword 10.0 + Jellyfish Shield 8.0 = **18.0 equip load** and that Gravel Stone Seal weight 1.5 doesn't invent attack data.

## Strict scope limitation

AR parity is independently **86 same-input cases across 48 distinct weapon names**, not all 487 weapon/affinity/stat permutations. The separate weight overlay now contains **76** direct item observations (72 previously missing, 3 community matches, 1 previously confirmed community mismatch: Stone-Sheathed Sword original 3.5 vs public v1.17 5.0). This weight completeness applies only to the **72 source-missing entries**, not the rest of the entire 487-weapon corpus; additional other weapon weights can still be inaccurate and are **NOT_OBSERVED** until independently checked.

Individual physical/magic/fire/lightning/holy base attack, minimum attributes and status for the 72 originally partial rows remain unknown in canonical, and competitor individual field-level numerical values weren't directly observed by this method. Armor, Build active effects, Damage enemy/NG+/moveset, Spell scaling/buff numerical parity are separate unfinished modules. SEO/noindex and data redistribution rights have separate release gates; game-client 1.17.3 certification is **not** required for the comparator-only v1.17 reference standard.
