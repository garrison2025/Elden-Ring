# Version-labelled 1.17.3 cross-check and individually sourced Pack +0 readings — 2026-10-31

## Scope and verdict

This is a **real source-evidence improvement**, but **NOT** a game-client screenshot certification or blanket approval of the published wiki. The catalog remains 416 distinct named armament references.

### Madding Hand: one original source conflict has current-patch secondary corroboration

- Legacy [Eldenpedia (wiki.gg)](https://eldenring.wiki.gg/wiki/Madding_Hand) reports **STR 8 / DEX 8 / INT 13 / FAI 13 / ARC 0**.
- Pinned public Regulation 1.17 parameter snapshot reports **STR 8 / DEX 8 / INT 13 / FAI 20 / ARC 0**.
- A second, patch-labelled Regulation **1.17.3** source, [Almanauts Fist weapons table](https://almanauts.com/eldenring/tiers/weapons-fist/), also reports **8 / 8 / 13 / 20 / 0**, with build **25827938**.
- Almanauts [1.17.2 / regulation 1.17.3 patch diff](https://almanauts.com/eldenring/patches/1-17-3/) reports **no changes in the headline numerical values tracked** from regulation 1.17.1 to 1.17.3. This is a scoped comparison, not proof of every possible parameter.
- **Evidence-based direction:** version-labelled *parameter reports* support **FAI 20** versus unversioned wiki **13**. **Still missing:** independent 1.17.2/1.17.3 in-game equipment-menu screenshot and review.

The catalog intentionally retains the original wiki reading **FAI 13** and the flagged source discrepancy; the additional `currentPatchRequirementCorroboration` attaches the separately supported FAI 20 fact to the same exact Madding Hand ID. Wield calculations remain **unavailable** for this weapon until the disputed field can be published as a clearly versioned, reviewed datum. This avoids silently changing the original community field or implying a game-verified result.

The original discrepancy ledger still contains **7 historical disagreements** (six +0 base attacks, one requirement); this update produces **1 current-patch corroborated source position and six unresolved +0 current-patch source cases**, but **zero** reviewed screenshot goldens. These numbers are not a single synthetic accuracy score.

### Three Tarnished Pack weapons with exact individual community +0 figures

The prior Pack import had all eight names, weight and requirements from [Almanauts 1.17.3-labelled armament list](https://almanauts.com/eldenring/weapons/). That site's primary base-attack column explicitly shows **maximum-reinforcement base attack**, **not +0**. We have now independently checked the individual `wiki.gg` pages for the following three **published unupgraded +0** rows:

| Weapon | +0 PHY/MAG/FIRE/LGT/HOLY | Crit | STR/DEX/INT/FAI/ARC base grades | Community source |
|---|---|---:|---|---|
| Idus Sword | 124 / 0 / 0 / 0 / 0 | 100 | D / D / – / – / – | [Individual weapon](https://eldenring.wiki.gg/wiki/Idus_Sword) |
| Reed Great Katana | 158 / 0 / 0 / 0 / 0 | 100 | D / D / – / – / – | [Individual weapon](https://eldenring.wiki.gg/wiki/Reed_Great_Katana) |
| Silver Grooved Shield | 61 / 0 / 0 / 0 / 0 | 100 | D / – / – / – / – | [Individual shield](https://eldenring.wiki.gg/wiki/Silver_Grooved_Shield) |

These numbers are **wiki-reported +0**, not verified from an independent game-client screenshot at Regulation 1.17.3. Crit 100 is the critical rating, not a buff multiplier in nominal AR. Grades are descriptive letters, not numerical scaling factors. All three entries retain their previously attributed five requirements and weight; exact names/URLs and base figures are pinned by source-specific validation tests. **The other 5 Pack records stay +0 UNKNOWN.**

## Data audit and UI

- Home and catalog data-quality page now derive **8 Pack records: 3 community +0 sourced; 5 requirements/weight only**.
- The catalog displays published +0 and source link for the three, does not fake +0 for the other five.
- The Madding Hand weapon detail and generated conflict dossier now link the current-patch corroboration and explicitly state the two competing values. No source reading auto-verifies a character's wieldability.
- The discrepancy ledger remains fail-closed on missing or falsified evidence, claim of game verification, or altered current-version corroboration.
- The research site remains `noindex`. No paid API, new runtime request, server, game screenshots, extracted regulation bundle or game images were introduced.

## Not resolved

- Six disputed +0 base-attack rows still await comparable **true +0 current-version evidence**; do not confuse other sites' max-upgrade totals with +0.
- Madding Hand source direction strongly favors **20** but its historical disagreement is preserved; an independently inspected original game menu could finish this separately.
- No current-client screenshot golden is accepted (**0**).
- Full in-game weapon/AR certification, source ownership, and redistribution rights remain open.
