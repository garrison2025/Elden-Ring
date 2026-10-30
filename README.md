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
- While testing, omit `SITE_URL`; the build adds `noindex` and disallows crawling.
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

The calculator is **not an attack rating tool** and does not estimate weapon-specific rune costs, stone locations or weapon eligibility. Inputs remain in-browser only. This route stays \`noindex\` pending live functional QA, precise search-intent validation and any upcoming official patch check; the site-wide preview crawler block is unchanged.


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
