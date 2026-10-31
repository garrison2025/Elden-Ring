# Build Lab — unofficial Elden Ring calculators

A free, static, privacy-conscious calculator website. No API keys, backend, payments or database.

**Cloudflare preview deployed:** https://elden-ring-5i9.pages.dev/. Eight standalone calculators/planners are implemented, with some research-stage pages deliberately noindexed. Public indexing is not yet enabled.

**Not production-validated:** Real Weapon AR (research profiles only), real opponent damage, actual in-game armor optimization, spell scaling and full equipment simulation. The AR test fixture is explicitly fictional and the page is `noindex`.

## Run locally

Requires Node.js 20 or later. There are **no npm dependencies**.

```bash
npm test
npm run build
python3 -m http.server 8080 -d dist
```

Visit `http://localhost:8080` and try every calculator. Viewing the HTML directly via `file://` may work, but serving with a local HTTP server is recommended for ES module imports.

## Cloudflare Pages (free tier)

- Connect this repository through Cloudflare Pages.
- Framework preset: **None**.
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js 20+.
- Research builds remain site-wide `noindex` even if `SITE_URL` is configured. Robots allow crawlers to read the `noindex` directive; sitemap is withheld. Never set `RELEASE_INDEX_APPROVED=1` without independently approved release gates.
- Before public launch, set `SITE_URL=https://your-real-https-domain.example` in Cloudflare's build environment and rebuild. Use the final canonical origin, without a trailing slash. This emits canonical URLs, a sitemap and public robots directives. Verify the deployed output and GSC before announcing it.

**Do not use the example domain as your SITE_URL.** The repo does not choose or register a domain. Cloudflare Pages is connected to `main` and is serving the preview at `https://elden-ring-5i9.pages.dev/`. Do not change indexing until production release checks pass.

## Accuracy and game-data rules

- The calculator relies on a small documented set of baseline stats and numerical formulas with tests.
- No official images, game assets, game binaries or copyrighted icon packs are bundled.
- The two extra-content classes are optional; only select one if your edition includes it.
- No real weapon dataset has been licensed/validated. Do not remove the research warning or `noindex` until game-client golden-vector validation is complete.
- Official game patches require data review, not necessarily a code change; see `docs/RELEASE_GATE.md`.
- Inputs are processed in the browser. No analytics or advertising scripts are integrated.

## Keywords / content architecture

The product specification and keyword study are in `docs/BUILD_SPEC_V2.md` and `docs/keyword-research.xlsx`. These are research inputs, **not permission to publish a page per keyword**. Multiple calculator routes are implemented; several are `noindex` previews. Additional indexed routes require accurate capabilities, validated unique search intent, and production QA.

## Tests

`npm test` runs the core, class, rune, load and synthetic AR engine tests. These tests do **not** prove parity with current in-game AR or opponent damage. Run browser smoke checks and current data validations before production indexing.

This is an unofficial fan project unaffiliated with FromSoftware or Bandai Namco Entertainment.

## Latest usability work (2026-10-30)

The Build Planner can send its eight stats to the Class Optimizer and its level plan to the Rune Calculator. Rune farming yield is an optional, user-supplied estimate, not a measured farm rate. Equip Load now gives action-oriented reduction thresholds. Invalid inputs clear stale displayed results. See `docs/ITERATION_20261030.md`.


## Respec planning and private local storage (2026-10-30)

- `/respec-planner/` compares a character's current and proposed eight stats under the same starting class and level budget. A respec is valid only when the total points are allocated exactly. It does not simulate gear, unlock conditions, or consumables.
- The respec page is `noindex` pending separate search-intent verification; it is accessible through the homepage and Build Planner.
- In Build Planner, saving is **opt-in**: Save locally, Load saved, and Delete saved work using this browser's `localStorage`. Shared URLs contain only origin and eight stat values, not identity information.


## Weapon AR evidence comparator (2026-10-30)

Research-only \`/weapon-ar-validation/\`: locally import candidate weapon parameters and independent AR observations, compare totals and per-element values, then export CSV or JSON regression reports. 3 bundled reference observations are synthetic and deliberately fictional. All user-entered observations remain \`UNREVIEWED\` until real game screenshots, data rights, game version and gold tests have been checked. This is an accuracy-tooling milestone, **not** publication of a real Weapon AR calculator.


### Automated AR comparison gate

Run \`npm run verify:ar\` for the **fictional** fixture regression used by GitHub CI. To compare candidate parameters with separately recorded observations offline:

\`\`\`bash
node scripts/verify-ar.mjs --profile ./candidate.json --observations ./observations.json --out ./ar-report.json
\`\`\`

The command exits nonzero when any recorded total or element differs, when data is incomplete, or when versions conflict. An exit code of zero means **only** that supplied numbers matched; it never proves in-game accuracy, data reuse rights, or a supported regulation. Never publish manually transcribed data without independent review.


## Manual Weapon Requirements Calculator

\`/weapon-requirements/\` provides an independent, browser-only attribute threshold checker using **player-entered** weapon requirements. For ordinary two-handed wielding, effective STR is floor(1.5 × STR); DEX, INT, FAI and ARC are unchanged. It offers a special/paired grip option to disable the bonus, exact deficit breakdown and sharable numerical links. Build Planner can pre-fill current stats via URL. Example 16 STR / 24 STR is grounded in the publisher's Advanced Stats guide, but the tool does not bundle or assert a weapon database, AR values, equipment effects or damage formulas.

The page initially remains \`noindex\` until the live interaction and individual keyword intent are verified, independently of incomplete Weapon AR research.


## Custom Armor Optimizer — manual-entry preview

\`/armor-optimizer/\` is a genuinely functional, research-stage **manual-data** optimizer.
Users enter up to twelve candidates per armor slot using CSV columns
\`slot,name,weight,score,poise\`, choose maximum equipment load, reserved non-armor
weight, load tier, minimum poise and an optional per-poise score preference.
The engine exhaustively compares up to 13⁴ = 28,561 combinations (including
empty slots) and returns five top combinations.

**Critical distinction:** The user-entered \`score\` is a subjective additive
comparison metric; it does **not** reproduce Elden Ring's damage-negation
formula. The bundled starter pieces and values are fictional. The tool does
not provide real armor item data, weapon data, or legal permission to
redistribute game content. No user data is uploaded or persisted, except a
CSV the user explicitly downloads. Winning equipped weight can be opened in
the existing Equip Load Calculator. The route stays \`noindex\` until
quality review and real non-brand keyword/SERP validation.


## Smithing Stone Calculator (2026-10-30)

\`/weapon-upgrade-calculator/\` calculates required and missing materials for **regular +0–25** and **somber +0–10** weapon reinforcement. The rules are documented in [Eldenpedia Smithing Stones](https://eldenring.wiki.gg/wiki/Smithing_Stones), [Somber Smithing Stones](https://eldenring.wiki.gg/wiki/Somber_Smithing_Stone) and the Gamer Guides reinforcement table. Regular stones [1]–[8] use a 2/4/6 schedule per grade (96 total from +0 to +24); +25 uses an Ancient Dragon Smithing Stone. Somber grades [1]–[9] each use one stone; +10 uses a Somber Ancient Dragon Smithing Stone. The site computes interval totals, subtracts user-entered owned inventory, details each step and exports a CSV missing-materials checklist.

The calculator is **not an attack rating tool** and does not estimate weapon-specific rune costs, stone locations or weapon eligibility. Inputs remain in-browser only. This route stays \`noindex\` pending live functional QA, precise search-intent validation and any upcoming official patch check; site-wide research `noindex` protection stays active.


## Versioned AR parameter import — local developer workflow

The repository now includes \`scripts/import-regulation.mjs\`, a conservative
converter from an independently obtained compact regulation **JSON** file to
our research AR profile schema. It can list available exact item/affinity names
and export one candidate profile at a time, including original-file SHA-256,
source notes and a manually declared regulation version. The workflow is
**local only**, with \`local-ar-data/\` excluded by \`.gitignore\`.

\`\`\`bash
node scripts/import-regulation.mjs --help
\`\`\`

Conversion runs no JavaScript from third-party data, downloads no game files,
does not import commercial rights, and produces **UNVERIFIED** profiles.
The converter's tests use entirely invented parameters. See
\`docs/AR_VALIDATION.md\` before using actual data or publishing AR results.


## Local Weapon Data Workbench (research only)

Route: \`/weapon-data-workbench/\`, explicitly \`noindex,nofollow\`. This is a
browser-based partner to the existing versioned regulation importer. Users
select their **own** compact-format JSON file (max 16 MB), provide version and
source/rights context, search weapon/affinity names, and compare preliminary
one-hand and two-hand AR at only the reinforcement levels actually supplied.
It runs in a dedicated Web Worker to keep UI responsive. The data is never
uploaded, automatically fetched, stored in browser storage, or bundled.
The page includes neither a public game-derived database nor a certification
claim. Regression tests use independently authored invented weapon entries.


### AR workbench synthetic demo

The local workbench includes a one-click **fictional demo** with four invented
weapons. This is UI and formula regression test data, NOT Elden Ring item data,
and remains strictly `noindex`. It permits testing the whole workflow without
uploading or redistributing any real-game dataset.


## Eight-tool discovery and shared navigation

The homepage now has eight equal-weight tool cards rather than four plus
repetitive feature banners. The static build calls `scripts/navigation.mjs`
to place four additional tool links into desktop and mobile headers on every
indexable and research HTML page. No client-side navigation runtime, API,
server or new npm dependency is introduced. All links remain static HTML.


### Compare two weapon profiles (research only)

The local data workbench now allows choosing weapon A and B from the same
imported compact JSON (or fictional demo), selecting reinforcement separately,
and comparing one-handed or two-handed nominal AR using the same character
attributes. Breakdown shows damage elements separately. A larger nominal
AR does NOT imply greater enemy damage, particularly with split damage.
Both profile versions must match, missing upgrade data is refused and UI
request revisions prevent stale async comparisons overriding newer changes.
All numbers remain **UNVERIFIED**, and the workbench is noindex.


### AR source-policy audit

Latest AR engine research records explicit policies for per-damage-type
requirement penalties versus the legacy per-stat formulation, and shows both
rounding conventions for mixed elemental AR. Compact imports select the
damage-type-60 / sum-of-floored-components convention, while the old manual
fixture retains its existing behavior. Nothing is labelled game-certified;
see \`docs/AR_VALIDATION.md\` for the source disagreement and golden tests.


## Whole-weapon-dataset conversion audit (local, 2026-10-30)

Before evaluating an independently obtained JSON dataset for AR research, run:

\`\`\`bash
node scripts/audit-regulation.mjs \
  --input local-ar-data/regulation.json \
  --version "1.17" \
  --source "local source, acquisition date, and rights status" \
  --out local-ar-data/audit-report.json
\`\`\`

This verifies **every record** independently instead of assuming that one
working weapon proves the entire dataset is convertible. The aggregate report
counts invalid data, duplicates, missing correction graphs, missing upgrade
tables, grip categories, reinforcement length and unsupported status/spell
mechanics. It includes source SHA-256 and anonymous failing row indices;
it excludes weapon names and parameter values. An invalid row gives a nonzero
CLI exit code. To avoid O(N²) rescanning of names, each entry is converted in
a one-record view of the source tables. No download, upload, or new dependency.

**Crucial: a 100% conversion score does NOT mean publishable.** Data rights,
official version compatibility, independently reviewed in-game samples and
unsupported spell/status mechanics remain outstanding. This is a structural
triage utility only, not a license grant, gameplay certification, or SEO launch.


### One-click workbench dataset audit

The local Weapon Data Workbench now exposes **Audit entire dataset** after
loading your JSON file or the fictional demo. An isolated Worker scans every
entry, displays conversion coverage, duplicate/missing-table blockers, and
allows downloading an anonymous, aggregated JSON report. No game-derived
names or source parameter values are included in the export; no uploaded
data or ongoing API costs. The report is never a real-world game validation,
license grant or publication approval.


The web-based audit now displays both structural and scope-review counts, including separate incomplete upgrade, spell-tool and status-effect warnings. It receives anonymous processed/total progress from the in-memory worker. The exported report omits raw provenance notes and remains unverified, with publishable always false.


## Real community weapon reference: 307 named weapons

\`/weapon-database/\` now serves a **bundled, version-unverified source snapshot**
of 307 actual named weapons from deliton/eldenring-api's MIT-declared API
project, SHA \`1d2626ceda5eb8c08997e345e303344a64edc106\`. We import only
factual names, category, weight, required attributes, basic scaling *letters*
and reported +0 base attack/critical values. We do NOT bundle API item
descriptions, screenshots, images, lore, skills, locations or extracted game
regulation files. Source: https://github.com/deliton/eldenring-api .
MIT project license: https://github.com/deliton/eldenring-api/blob/main/api/LICENSE .
Code rights do not establish rights over independent game material.

Three obvious source anomalies were manually corrected with independent
references: Royal Greatsword physical 112 and critical 100
(https://eldenring.wiki.gg/wiki/Royal_Greatsword), Serpentbone Blade
physical 120 and critical 100 (https://eldenring.wiki.gg/wiki/Serpentbone_Blade),
and Star Fist critical 100 (Push Square weapon guide).
Other suspicious records and name collisions remain flagged. This
data **does not claim game version 1.17.3**, completeness (e.g. recent DLC),
or full gameplay parity. **Base (+0) weapon values are NOT character AR**:
true AR requires regulation-strength coefficients, reinforcement and
affinity rules, and game-client verification. The new page remains
\`noindex\` for now; do not index its stats until current-patch validation.
The browse page is pure static JSON + JS; no paid APIs and no third-party
requests are required at runtime.


Data provenance, source MIT license and targeted corrections: docs/COMMUNITY_WEAPON_DATA.md and docs/UPSTREAM_API_MIT_LICENSE.txt.


The Character Build Planner now links directly to the real community Weapon Database with the player's five weapon-related stats carried through. Clicking a specific weapon there passes its reported requirements and character stats to the independent Requirements Calculator.

## Find wieldable real weapons

The community weapon database now combines five-attribute requirements, weapon category, physical/elemental base type and weight filters. The conservative two-hand model excludes ranged, casting, fist and claw categories from the ordinary bonus, while warning that other special grips can still differ. This is an equipment **requirements** filter, not real AR or enemy DPS; numbers remain source- and version-unverified. No runtime paid APIs.


### Sourced Shadow of the Erdtree requirements-only expansion

The static Weapon Database includes 364 named entries: 307 legacy community rows plus 57 DLC name/class/requirement references. Unknown DLC base damage, weight, critical and scaling are NULL, not guessed. A coverage filter selects base, DLC or all data. Source and numeric limitations: docs/COMMUNITY_WEAPON_DATA.md. This is not a complete DLC catalog and does not certify game version 1.17.3 AR.

## Manual game-menu AR test checklist (research-only, 2026-10-31)

In `/weapon-data-workbench/`, **Generate manual test cases** creates
up to 24 condition-specific test vectors for one exact imported weapon:
source-supplied reinforcement levels, one/two-hand grip, attribute
requirements and high-stat edges. You may enter genuine in-game
equipment-menu AR values and separately saved screenshot filenames,
then export an **UNREVIEWED** JSON batch. The existing local recheck
also supports these batches. It detects arithmetic drift but cannot
authenticate the screenshot, game version or game-data rights.

The optional pinned source is **v1.17 research data**, not independently
validated App 1.17.2 / Regulation 1.17.3 game-client AR.
No special weapon skills, spell catalysts, ammo, statuses or target
damage are inferred. Nothing is uploaded or bundled, and the site-wide
research `noindex` gate remains enabled. See
`docs/AR_CLIENT_EVIDENCE_20261031.md`.


### Optional screenshot file fingerprint (2026-10-31)

In the manual game-menu AR test grid, optionally select the original PNG/JPEG/WebP
file (up to 12 MB) for a recorded case. The browser computes its SHA-256 locally
and embeds **only** filename, image format, byte count and hash in the exported
UNREVIEWED observation batch. It never uploads or embeds the screenshot.
On batch reimport, choose a recorded case and the original screenshot to check
whether file bytes match the stored hash. Older filename-only batches remain
supported. A matching file hash is **not** independent screenshot authenticity
or in-game AR validation. See `docs/AR_CLIENT_EVIDENCE_20261031.md`.

## Weapon database: closest-to-wield shortlist and deep links (2026-10-31)

At `/weapon-database/`, the 408 existing community weapon/shield references
can now be ranked by **fewest additional player attribute points for
one-handed wielding**, using the five combat stats entered on the page.
Each weapon card lists the currently missing STR/DEX/INT/FAI/ARC amounts.
Weapon details show separate one- and two-handed requirement gaps and label
the standard `floor(1.5 × STR)` assumption when applicable. Rows lacking
source-reported requirements are **unknown**, not free-to-equip; they sort
after entries with known requirements.

The **Copy this weapon + stat link** control shares an exact weapon ID and
five numerical character attributes without accounts, cookies or server
storage. Opening such a link locates and displays that specific weapon,
including a direct path to the separate local AR research workbench.
**Clear all filters** returns to the complete list. These links do not
contain or certify player AR or true combat damage.

These are **community-reported requirement facts** with documented source
disagreements, not App 1.17.2 / Regulation 1.17.3 independently checked
in-game outcomes. Special grips remain research assumptions and the
entire site retains research-only `noindex`. This adds no new redistributed
game-derived data, paid API or backend service.

## Weapon database → Smithing Stone planner handoff (2026-10-31)

From a selected weapon entry in `/weapon-database/`, the new
**Plan Smithing Stones for this weapon** link opens the existing
`/weapon-upgrade-calculator/` with the exact existing community
weapon ID and display name. The materials calculator shows this identity
and a direct return link to the same database entry, **without**
inventing a player's current reinforcement level.

Of the **408 existing catalog records**, only **six** have explicit
community-published `upgradeReference.path: "somber"` tables.
For these six, the link suggests the Somber (+10) calculator track
with a prominent instruction to confirm the real smithing-menu track.
The remaining **402 records** do not receive a guessed track; the
player must select Regular (+25) or Somber (+10) themselves. The
catalog's published +level is a *reference base-attack row*, not the
level of a player's own weapon, so neither current nor target upgrade
levels are transferred.

All quantities are calculated with the existing local material rules;
optional owned-stone input remains private and no new API, backend,
asset files or live-game claims are introduced. Such community track
hints are not independent current-Regulation validation. Research
`noindex` remains enabled.

## Multi-weapon Smithing Stone basket (2026-10-31)

The existing `/weapon-upgrade-calculator/` now includes an **optional
multi-weapon checklist** in addition to its unchanged single-weapon planner.
Players can add the selected single-weapon settings (including a weapon
name arrived from `/weapon-database/`), create other manually named rows,
remove rows and combine up to **8** separate weapons. A second copy of the
same weapon may be entered intentionally. Each row requires a manually
chosen Regular or Somber track and the player's actual current and target
upgrade level.

The basket aggregates exact regular +0…+25 and Somber +0…+10 material
schedules using the existing validated calculator. It combines the
**required quantities by stone type first**, then subtracts the basket's
one shared inventory **exactly once**; the single-weapon inventory is
independent and cannot accidentally subtract shared stock twice. All 19
regular/Somber stone types are accepted in the shared inventory, and a
combined CSV exports named plans and a total material/shortage checklist.
Inputs are temporary browser state; no upload, account, persistence,
API key or external dependency.

The catalog's 6 explicit Somber references offer only an unverified
track suggestion, not actual game-client proof. The remaining catalog
entries have no sourced track and must be confirmed by the player. No
published reference reinforcement level is silently used as the player's
current level. Material math is **not** weapon AR, rune costs, game-client
parity or special weapon-effect calculation. Research `noindex` remains.

## Build Planner → multi-weapon Smithing Stone shortlist (2026-10-31)

The existing `/build-planner/` optional weapon selector now includes a separate
**Smithing shortlist**. Add up to **eight distinct** references, remove them,
or clear the list; disabling Shadow of the Erdtree references discards DLC
shortlist items, including when restoring a saved Build with DLC disabled.
The shortlist is deliberately **session-only**: it is separate from the
single-weapon selection and is NOT stored in the existing saved Build or
the shared Build attributes link.

**Plan stones for selected weapons** opens
`/weapon-upgrade-calculator/?weapons=<bounded ids>`. Only the existing
catalog IDs are carried in the query; no user-provided item name, AR,
unconfirmed upgrade track, current level, target level, account data or
full character stats are transferred. The material planner fetches and
validates its own bundled community catalog, re-resolves **all identities**
and rejects unknown, malformed, duplicate, >8 or oversized handoffs.
It does not trust external URL names or item upgrade classifications.

Imported rows intentionally have **no default track, current level or
target level**. The player must select Regular (+25) or Somber (+10)
and enter the real +levels for each weapon before the existing
multi-weapon aggregation produces results. Six explicitly
community-sourced Somber reinforcement-table weapons display a
clearly labeled **non-certified** hint, but that track is never
auto-confirmed. All other tracks remain unknown until selected.
The combined inventory is subtracted once from aggregated needs;
no new API, backend or browser persistence is used. This is not
verified player inventory, game-client current-version data, AR,
weapon-specific rune costs or actual combat damage. Research
`noindex` remains unchanged.
