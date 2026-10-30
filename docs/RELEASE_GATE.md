# Release gate — 2026-10-30

## Production-safe now (subject to live browser QA)

- Base class stats and level allocation: 8 attributes; 10 base origins and two optional extra-content origins.
- Level/rune cost formula and boundary checks.
- Equip-load ratio tiers from current in-game weight and max load input.
- Starting-class minimum level optimizer.

## NOT production-safe

- Weapon AR sample: tests use **synthetic fictional data**. Not representative of game weapon AR.
- No independently validated, licensed/versioned inventory and reinforcement datasets.
- Real PvE / PvP damage, enemy armor, spell scaling, buff order, motion values, status effects and DLC combat modifiers.
- Full item-based Build Planner and Armor Optimizer.

## Before changing noindex on a new real-data calculator

1. Record data source, reuse rights, version, scrape/extract provenance and date.
2. Establish independent in-game gold vectors (one-handed/two-handed, affinity, upgrades, stats, attribute shortfall, DLC and boundary cases).
3. Include deterministic automated tests and visual/manual reference results.
4. Demonstrate user-task completion on mobile and desktop.
5. Verify SEO raw HTML, canonical, sitemap, redirects, no broken paths, source method and privacy text.
6. Record test date and check regressions after official patch notes. Never label synthetic test fixtures as real weapon data.

Current state: core and synthetic math-unit tests are runnable; no in-game weapon AR certification, no domain, no live deployment, no AdSense integration.

## Evidence from the 2026-10-30 implementation pass

- Node.js automated tests: 18 formula/research tests passed on the initial implementation.
- Browser-based inline integration smoke checks: 4 calculators, viewport 390px and 1440px; build edits and invalid entries, optional-class filter, rune cap at 713, equip load at 29.9% and 70% all passed; no page JS errors or horizontal overflow.
- Static source audit: nine page routes and local assets resolved; seven eligible URLs generated with `SITE_URL`, while two research/verification routes remain noindex.
- CI: GitHub Actions build/check on repository main reported success.
- Browser smoke used DOM-injected static source because direct navigation to local HTTP/file URLs was blocked by the browser sandbox; real Cloudflare-hosted page-endpoint testing is still required.
- No signed-off test against real Elden Ring weapon damage values or game client has occurred.
