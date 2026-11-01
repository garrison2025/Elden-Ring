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
- Public Tarnished.dev v1.17 numeric parity tests now cover 481/487 directly observed weapon weights, 377/487 directly observed five-stat requirements (all 377 agree with our pinned v1.17 source; 110 remain not directly observed), 86 previously approved AR input cases, and 347/348 additional direct +0 AR comparisons (Icerind Hatchet remains 1 AR different). These are **version-scoped competitor comparisons, not current-game-client proof**. Game installation is not required for this public-site benchmark, but third-party data reuse rights, feature-specific completeness and indexing quality gates remain separate. Do not remove the research warning or site-wide `noindex` prematurely.
- Official game patches require data review, not necessarily a code change; see `docs/RELEASE_GATE.md`.
- Inputs are processed in the browser. No analytics or advertising scripts are integrated.

## Keywords / content architecture

The product specification and keyword study are in `docs/BUILD_SPEC_V2.md` and `docs/keyword-research.xlsx`. These are research inputs, **not permission to publish a page per keyword**. Multiple calculator routes are implemented; several are `noindex` previews. Additional indexed routes require accurate capabilities, validated unique search intent, and production QA.

## Tests

`npm test` runs the core, class, rune, load and synthetic AR engine tests. These tests do **not** prove parity with current in-game AR or opponent damage. Run browser smoke checks and current data validations before production indexing.

This is an unofficial fan project unaffiliated with FromSoftware or Bandai Namco Entertainment.

## Direct numeric comparator progress (2026-11-01)

The current real-site observation reports: [86 historical AR cases](docs/TARNISHED_DEV_86_CASE_PARITY_20261101.md), [348 new +0 AR cases with one unresolved numerical discrepancy](docs/TARNISHED_DEV_V117_EXPANDED_348_AR_20261101.md), [481 observed individual weapon weights](docs/TARNISHED_DEV_V117_ALIAS36_PARITY_20261101.md), and [357 initial + 20 newly recovered = 377 directly read minimum weapon requirements](docs/TARNISHED_DEV_V117_REQ_RECOVERY_22_20261101.md). The website's validation-status page distinguishes public comparator-only data from original community source fields. Armor/Build-effects/Damage/Spell accuracy and weapon component damage still require separate site observations. No game client is needed for the user's chosen public-v1.17 website comparator acceptance.

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

## Live Cloudflare Pages deployment parity checks (2026-10-31)

A read-only live check of `https://elden-ring-5i9.pages.dev/` found
an outdated homepage teaser claiming **364** weapons and **57** DLC
requirements-only records, although the repository's source JSON contains
**408** weapon/shield references, including **102** Shadow of the Erdtree
records and **101** sourced +0 base-attack rows. The Build Planner and
Smithing Stone pages were reachable, and their HTML included the new
multi-weapon shortlist and shared-inventory sections. Reading static
markup is **not** proof of successful browser click/CSV interaction.

To prevent recurrent stale homepage copy, `npm run build` regenerates
the marked home weapon-coverage paragraph **from
`public/data/community-weapon-catalog.json`** and refuses mismatched
catalog metadata. Do not hand-maintain counts in unrelated HTML.

The same static build creates `dist/deployment-info.json`, which records
UTC build time, catalog coverage, index-mode and the deployed source
commit SHA when **`CF_PAGES_COMMIT_SHA`** (Cloudflare Pages default)
or `GITHUB_SHA` (GitHub Actions) is available. When neither is
provided, the revision is `null` rather than an invented hash.
This JSON contains no user information, API keys or secrets.

After deployment, compare:
- `https://elden-ring-5i9.pages.dev/deployment-info.json` →
  `revision`, `revisionSource`, and `catalog`.
- `https://github.com/garrison2025/Elden-Ring/commits/main` →
  current main commit.
- Live `/`, `/build-planner/` and
  `/weapon-upgrade-calculator/` → correct source counts, presence
  of controls and continued research `noindex`.

A revision mismatch establishes that the served deployment is not the
current repository commit, **not** that the calculation model is wrong.
A match still does not substitute for browser E2E tests or real game
client AR screenshots. The `npm run check` CI task now also runs
`npm run verify:deployment` on the actual generated `dist/` files,
failing for missing weapon-coverage parity, shortlist/basket markup,
commit provenance or research SEO gating. This uses no paid APIs or
services.

## Opt-in local save/restore for multi-weapon Smithing plans (2026-10-31)

The multi-weapon planner at `/weapon-upgrade-calculator/` supports explicit
**Save checklist on this device**, **Restore saved checklist** and **Delete
saved checklist** actions. Nothing is autosaved, and opening the page does not
auto-restore. A versioned `buildlab:smithing-basket:v1` localStorage record
contains up to eight manual weapon labels, confirmed Regular/Somber smithing
tracks, player-entered current/target levels, and the shared owned-material
quantities. It excludes source weapon tables, game data, user IDs and AR.

Restoring revalidates the entire saved record with the existing canonical
multi-weapon planner, rejecting unsupported version, missing/invalid level,
unknown inventory material, corrupt JSON and more than eight weapons. Valid
rows are constructed before replacing the on-screen list; an invalid record
does not overwrite the current UI. Clear basket keeps a previous saved copy;
Delete saved checklist removes only the stored record, not the current rows.
Storage may not work in private/incognito sessions and all storage exceptions
are surfaced as feedback, not silently ignored.

The Build Planner's ID-only import remains a separate manual workflow:
links alone cannot set tracks/levels or overwrite an already edited basket.
No backend, paid API, new redistribution, or persistent cookies were added.
Research noindex and current patch-validation limitations remain.

## Free real-browser acceptance suite (2026-10-31)

`.github/workflows/browser-smoke.yml` runs Chromium/Google Chrome already
preinstalled on GitHub's Ubuntu runner (no Playwright package downloads,
paid browser service, backend API, or extra production dependencies). It
builds the actual static `dist/` candidate and executes
`node scripts/smoke-browser.mjs` over a localhost server with native Node
WebSocket + Chrome DevTools Protocol. The script performs a **real DOM/browser
journey**: select Uchigatana + Greatsword in Build Planner, import their
catalog IDs into Smithing Planner, confirm track and current/target +levels
remain blank until player input, calculate +0→+3 / +0→+6 = 36 stones,
enter 5 shared stones and confirm 31 still missing, save and reload without
automatic restore, restore only after explicit click, delete the stored
snapshot without clearing the active rows, and check 375px viewport overflow.
Any incorrect browser DOM result or uncaught JavaScript exception fails CI.

This test runs against the built *deployment artifact* served from localhost.
It is not itself proof that Cloudflare production has deployed a given SHA;
use public `/deployment-info.json` for actual production revision parity.
For extra privacy, the browser uses an isolated temporary profile and
removes it when finished. Static unit/integrity and real-browser workflows
run independently on pushes and pull requests.

## Compare two character Builds in-place (2026-10-31)

The existing `/build-planner/` now supports a **temporary pinned Build A**
compared live against the editable **Build B**. Pin the currently valid
class, eight attributes, content permissions and optional source weapon;
then change B's class, stats or selected weapon. The page displays a stable
side-by-side table of the eight attribute differences, resulting level,
allocated points above each origin, and upgrade rune budget calculated
**independently from each Build's own starting class**. It also displays
the selected source weapon's one-handed requirement state and individual
weight, when present and covered by the bundled weapon reference catalog.
No weapon AR, enemy damage, total equipment weight or respec cost is
inferred from these comparisons.

The baseline is **memory-only** for the open tab; it is neither included
in the existing Build share URL nor written into the Build/Smithing
localStorage records. It is only replaced by **Pin current Build as A**
or removed by **Clear comparison**. Invalid current stats do not reset the
pinned baseline; the comparison temporarily hides with an explanatory
error until the inputs are valid again. Content access flags are stored
separately for A and B so Tarnished Pack origins and Shadow of the Erdtree
weapon references cannot be silently substituted. All text is displayed
using safe DOM text nodes, with a mobile-scrollable table.

Regression coverage includes pure A/B math, cross-origin rune-budget
semantics, weapon source identity, both distinct DLC gates, invalid/legacy
state rejection and real Chrome browser interaction in the existing
`browser-smoke.yml` workflow (pin A → change VIG → check +1 level →
switch starting class → check 375px viewport). This is a player-facing
research function on the existing Build Planner, not a thin duplicate page.

## Share and restore two Build comparisons (2026-10-31)

The on-page Build Planner A/B comparison now offers **Copy link to both
Builds** separately from the legacy one-Build **Copy build URL** action.
The dual-build URL carries the eight character stats and independent
starting class, DLC/origin permissions and optional catalog weapon ID
for each of A and B. B retains the existing ordinary Build Planner
query convention; the pinned baseline A is a bounded versioned
`compare=v1...` token. Neither game files, player identities,
inventory, upgrade levels, source weapon names nor asserted attack
ratings are transmitted. The share field is selectable manually if
clipboard permission is unavailable.

Receiving a link validates both character states, content permission
switches, size/format and optional weapon identity against the **current
bundled community catalog** before pinning A or restoring B. Invalid
comparisons fail visibly without pretending they are valid. Unknown
or DLC-inaccessible weapons are not silently substituted. A/B URLs do
not create persistent localStorage records, and ordinary single-Build
URLs continue to work without an automatically pinned comparison.
Sharing is optional and only happens when the player clicks the new
button.

`tests/build-compare-share.test.mjs` checks round trips, hostile/old/
duplicate fields, source weapon resolution and DLC permissions. The
GitHub Chrome browser smoke now checks two distinct selected weapons,
live attribute changes, URL creation, navigation to a fresh page,
reconstruction of A and B with the expected +1 VIG delta, and
backward compatibility for old one-Build URLs. Source facts are still
community references: no independent current-patch game-client
verification or AR guarantee is implied. Research `noindex` stays.

## Per-weapon wieldability for Build Planner shortlist (2026-10-31)

The existing `/build-planner/` **Smithing shortlist** is also a live
**weapon requirement planning** panel. Up to eight source-linked weapon
candidates are each evaluated against the same character's selected
class and all eight attributes. For each candidate the planner shows
source-reported one-hand and ordinary two-hand minimums/shortfalls in
STR, DEX, INT, FAI and ARC, and its *individual* weight if sourced.
Unreported data remains UNKNOWN. The check does not mean these weapons
are equipped simultaneously, so weights are **never added together** as
a pretend total equip load.

Two optional controls can **apply the minimal known stat increases**
to make the character meet all candidates' one-hand requirements, or
each eligible candidate's standard two-hand requirements. The planner
takes the componentwise maximum of individual requirements, **not their
sum**, and never decreases current stat values. It computes the added
character levels and incremental rune upgrade costs from the existing
canonical Build and rune formulas. Two-handing has the usual 1.5× STR
assumption **only for supported source weapon categories**; paired
weapons, staffs, seals and special grips get no invented discount.
Each button only changes the current on-screen Build when explicitly
clicked, leaving any pinned Build A comparison intact.

An absent requirements table, disputed v1.17 source requirement flag,
missing/DLC-inaccessible weapon, or invalid Build stat prevents automatic
allocation. Partial source results and reasons remain visible, but the
app does not invent AR, full equipment load, actual combat damage,
item acquisition or respec costs. The original shortlist → Smithing
Stone workflow, A/B share links, browser-local storage and research
`noindex` stay intact. The computation is source-backed community
research, not independent current-patch game-client validation.

Test coverage includes 1H/2H individual minimums, the componentwise
stat target and incremental rune costs, exceptions to two-hand STR,
unknown/disputed requirements, SOTE gating and malformed Build fields.
The existing zero-paid-dependency Chrome workflow also clicks the
One-Hand and Two-Hand allocation buttons, verifies STR 31 / level 28
versus STR 21 / level 18 for the Samurai + Uchigatana/Greatsword case,
and checks the shortlist table at a 375px mobile viewport.

## Explicit equipment loadout builder (2026-10-31)

The **existing** `/equip-load-calculator/` now has a new, separate
**Build your actual equipment loadout** workbench. Select 0–6 actual
weapon slots (RH1–RH3, LH1–LH3) using the validated local community
weapon catalog. Only **selected, equipped** weapon weights are summed.
If a selected community weapon has an unknown/unverified weight,
the subtotal excludes it and **the final roll tier is blocked**;
unknown is never treated as zero. Identical weapons can appear in more
than one equipped slot (e.g., owned duplicates).

Armor (head, chest, arms, legs) and four talisman slots require the
player to mark **Empty** (no item) or **Equipped** and supply a weight
from their actual game status. An equipped item with blank weight is
unknown, NOT zero; explicit weight `0` is allowed. The user also
enters the actual *maximum equip load* from the status screen (never
estimated from END or unverified talisman effects). The UI shows a
**known subtotal** while editing and final equipped total/roll tier
**only after** all selected weights are known, a maximum is entered,
and the user explicitly checks that the entire actual set of
equipment has been included. Changing any item or maximum clears
that confirmation. The existing `loadTier()` enforces the exact
30%/70%/100% threshold equality behavior. No combat damage, poise,
AR, inventory ownership, rune cost, upload, auto-saved private gear or
equipment bonus computation is implied.

The Build Planner's existing multi-weapon shortlist can open this
workbench via a **candidate-only URL**, carrying up to 8 validated
weapon catalog IDs in `?candidates=`. These IDs are offered first
in the weapon pickers but **none are automatically equipped**.
The Smithing Stone candidate import, single Build links, A/B shared
Builds and local saved stone basket remain separate and unchanged.
This is a meaningful enhancement of an existing tool, not a duplicate
SEO landing page.

`tests/equipment-loadout.test.mjs` verifies 6+8 explicit slots,
exact source-weapon and manual-weight math, threshold equalities,
unknown/blank/invalid input gating, and hostile/duplicate candidate
links. The free Chrome browser smoke navigates Build Planner → Equip
Load, verifies no automatic equipping, adds two weapons and two
manual items, checks unknown talisman prevention, confirmation
reset, final total and percentage, clear action and 375px phone
viewport. Release artifact audit requires the new page and scripts
to ship and remain in research `noindex` mode. No paid APIs,
backend, new dependencies or invented armor/talisman catalog.

## Optional equipment save / actual equipped A-B comparison (2026-10-31)

The **existing** `/equip-load-calculator/` now supports **Save current
equipment**, **Restore saved equipment**, **Delete saved equipment** and
a separate **Pin current loadout as A / Use saved equipment as A** comparison
flow. B is always the current explicitly chosen 6 weapon slots, four
manual armor slots and four manual talisman slots. The comparison shows
all 14 actual equipped slots, any changed slot contents, each plan's
known subtotal, maximum load, missing weights and (only for separately
confirmed complete plans) both roll tiers and percentage points.

The single opt-in localStorage record (`buildlab:equipment-plan:v1`)
contains source weapon IDs, equipped/empty selections, player-entered
armor/talisman weights and the player-entered maximum. It is bounded
and schema-versioned, and **never stores valid confirmation**. Restore
first validates the entire record against the current local community
catalog before changing the editor. Any stale weapon IDs, invalid
numerics, oversized/corrupt JSON, or unsupported version fail
without replacing the current edit. Restore is manual, not automatic,
and always demands the player reconfirm the actual equipped gear.
Deleting the stored copy does not erase the screen or pinned A.

The two-Build comparison does **not** confuse the eight-weapon Smithing
shortlist with the six actual equipped weapon slots. It only sums
explicitly selected equipment. Unknown item weights never become zero,
and an exact weight difference is withheld if either selected loadout
has an unknown weight; an exact roll-tier comparison is withheld unless
both A and B are confirmed and complete. Community weapon weights are
still not independently verified for the actual game client patch;
armor and talisman names, bonuses, poise and equipment ownership are
not invented. No paid API, account, backend, cookies, persistence beyond
explicit local saves, new tool landing page or SEO gate relaxation.

`tests/equipment-save-compare.test.mjs` covers exact changes, copied
pinned state, unconfirmed restored records, malicious/stale saves and
unknown-weight gates. The free Chrome smoke now actually clicks
save → fresh page → explicit restore → verify no old confirmation →
pin A from saved plan → change two equipped slots → verify diff and
375px overflow → delete stored copy without clearing the comparison.
The deployment artifact audit checks that the controls and module
are included in Cloudflare's built output.

## Source-derived, fail-closed weapon evidence dashboard (2026-10-31)

`/validation-status/` now contains an audit dashboard generated at build
time from the exact `public/data/community-weapon-catalog.json` included
in the deployment artifact. A public `/catalog-evidence.json` captures
the same evidence in a machine-readable, schema-versioned summary.
`scripts/catalog-evidence.mjs` validates original catalog schema and
metadata, then computes live counts (base/DLC records; known weapon
requirement, weight and +0 fields; published base-attack upgrade tables;
absence of full AR parameter profiles), plus an ID-specific list of
unresolved community source attack/requirement conflicts. The conflict
list links to the existing weapon database for inspection.

**This is a source consistency audit, not a gameplay certification.**
Even where all records have community weapon weights or requirements,
source accuracy and patch compatibility are not independently proven.
Conflicts are NOT resolved by replacing them with game-derived guesses.
The public page explicitly differentiates derived calculations,
community reference coverage, uncertain source values and unavailable
precise AR. The in-browser equipment planner is correctly identified as
available for manually confirmed loadouts; it is not described as a
published/verified full armor/talisman item database.

The build script replaces one explicit catalog-audit row and section
in the validation source HTML, and emits evidence JSON from exactly
the same local catalog as the homepage. `npm run check` now fails the
deployment artifact audit if either dashboard or JSON differs from the
bundled weapon file, if historical `364/57` claims return, or if the
research-mode noindex is missing. Pure tests additionally check
HTML escaping, error paths and automatic response to changed source
flags. The free real-Chrome smoke visits the rendered
`/validation-status/` page and compares its counts and conflict rows
against `/catalog-evidence.json`. This workflow adds no runtime API,
paid service, database, or external monitoring.

**Release blocker remains**: provenance and current-game client goldens
must still be validated independently before enabling indexing or
marketing a precise Attack Rating / damage calculator. Resolving a
source disagreement requires archived original evidence and independently
reproducible observations; merely removing a flag is not validation.

## Source-conflicted weapon values fail closed in player tools (2026-10-31)

The seven documented v1.17 **source disagreements are more than a badge
in the accuracy dashboard**: their uncertainty now reaches every
downstream player decision that consumes the disputed fields.

- **Madding Hand:** The community list reports FAI **13**, but the
  independent pinned v1.17 parameter reference reports FAI **20**.
  `weaponRequirementComparison()`, Build Planner's one-/two-hand
  checks, Build A/B, shortlist minimum-stat planning and weapon
  comparison cannot claim requirements met/not met or a precise point
  deficit for this disputed weapon. The source-only value can still be
  read in Weapon Database, clearly labelled **DISPUTED community
  reading**, with its provenance and link to the accuracy dossier.
  "Wieldable" filters omit disputed-requirement rows rather than count
  them as satisfied. Numeric requirement links cannot silently shed
  their dispute flags.
- **Six disputed +0 attack references:** The Weapon Database visibly
  labels the community reading as **DISPUTED**, and comparison tables
  carry a dedicated source-conflict row and mark all attack components
  as community readings. Build inspection does not present a disputed
  value as accepted base attack; damage-type searches omit
  dispute-flagged values and the numerical base-attack ranking puts
  such sources after known uncontested ones. None of this confers
  valid Attack Rating or current-game accuracy.
- **Unflagged source references:** Existing five-component community
  numbers, individual weapon weight, class character stats and
  explicit equipment load remain unchanged. A disputed attack flag
  does not imply a disputed weight; a disputed requirements flag does
  not prevent a user from examining its community source reading.

Automated coverage tests actual flagged catalog entries and negative
control weapons with no flags, including the Build → comparison →
shortlist and Weapon Database pathways. The free Chrome smoke visits
Madding Hand and Smithscript Axe directly, verifies disputed labels
and disabled requirements handoff, and tests the mobile Build preview.
**No source flags were cleared or patched**: all seven cases still need
independent App/Regulation game-client evidence. Research `noindex`
remains enabled.
