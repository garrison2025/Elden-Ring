# Current 1.17.3 cross-source numeric acceptance — 2026-10-31

## Scope and authority

The official [October 20, 2026 patch notes](https://en.bandainamcoent.eu/elden-ring/news/elden-ring-patch-notes-version-1172) name **App 1.17.2 / Regulation 1.17.3**. The independent [Almanauts weapon list](https://almanauts.com/eldenring/weapons/) explicitly labels its numeric table **build 25827938 / regulation 1.17.3** and defines the listed attack rating as fully upgraded with weapon's minimum required attributes. The automated comparator uses a baseline of **10** for attributes without requirements or requirements below 10; this is a stated modeling convention, not a claim of a full observed character sheet. This is **regulation-data-derived secondary evidence**, not original game equipment menu screenshots.

The site's pinned Tom Clark source remains **v1.17**, not 1.17.3. Almanauts independently reports [no tracked stat-table number changes from 1.17.1 to 1.17.3](https://almanauts.com/eldenring/patches/1-17-3/). This helps compatibility but does **not** establish that all relevant Regulation 1.17 and 1.17.3 tables are identical, nor the right to redistribute extracted game data.

## Fourteen fixed independent reference totals

Conditions: maximum reinforcement (+25 standard, +10 somber), one-handed unless weapon usage forces two-handed, weapon requirements and a baseline 10 for other attributes. All published numbers below are taken from the independent 1.17.3 reference table.

| Weapon / neutral affinity | External 1.17.3 AR | Requirement |
| --- | ---: | --- |
| Royal Greatsword | 788 | STR 26, DEX 18, INT 22 |
| Rellana's Twin Blades | 700 | STR 13, DEX 16, INT 16, FAI 16 |
| Blasphemous Blade | 652 | STR 22, DEX 15, FAI 21 |
| Sword of Night and Flame | 615 | STR 12, DEX 12, INT 24, FAI 24 |
| Treespear | 611 | STR 15, DEX 22, FAI 18 |
| Dragon Greatclaw | 650 | STR 30, DEX 14 |
| Carian Knight's Sword | 503 | STR 10, DEX 10, INT 18 |
| Ancient Meteoric Ore Greatsword | 717 | STR 35, DEX 10, ARC 19 |
| Fire Knight's Greatsword | 584 | STR 22, DEX 18, FAI 12 |
| Great Club | 715 | STR 35 |
| Longsword | 308 | STR 10, DEX 10 |
| Cinquedea | 277 | STR 10, DEX 10 |
| Rabbath's Cannon | 756 | STR 28, DEX 16 |
| Jar Cannon | 672 | STR 34, DEX 12 |

`public/src/current-reference-ar.mjs` stores the 14 named published reference facts. `npm run audit:real-v117` independently downloads the pinned public 1.17 JSON on the CI runner, calculates these totals using our existing converter and writes only aggregate counts and failing IDs to `.audit/v117-vs-current-1173.json`. New disagreement causes CI failure; original reference numbers are not automatically revised.

## Source-methodology discrepancy — deliberately excluded from the pass count

The current-patch reference site shows **Reduvia 265 AR** in a table labeled "minimum requirements", while the explicit weapon requirements are **5 STR / 13 DEX / 13 ARC**. Under the pinned v1.17 regulation source:
- At **5 STR**, 13 DEX, 13 ARC, +10, AR is **262**.
- At **10 STR**, 13 DEX, 13 ARC, +10, AR is **265**.

Therefore the reported 265 appears to use a baseline of 10 even for a stated lower requirement, which is not a true minimum-requirement check for this weapon. Reduvia has been **replaced with Cinquedea (STR 10 / DEX 10, AR 277)** in the hard-gated 14-vector suite. Reduvia is a known reference-methodology caveat, not an implicit game-accuracy pass. Neither website is allowed to silently change the facts.

## Release status

- Historical Reddit player numerical checks: 3 matches (no current-game screenshot).
- 2026 cross-site patch-referenced parameter checks: 14 matches (not current-game screenshot).
- Same-source calculation tests: 3,296 variants × 4 scenarios = 13,184 cases.
- Independently reviewed current-game screenshot observations: **zero**.
- Outstanding DLC disputes: 6 +0 attack discrepancies and 1 requirement discrepancy, flagged for review.

Do not claim general 1.17.3 parity, current-game certification, or model coverage of status, spells, skill damage, buffs or real enemy damage. Research pages remain noindexed.
