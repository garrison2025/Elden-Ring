# SEO first-wave production release — 31 October 2026

## Decision and deployment boundary
The owner approved starting indexing of independently reproducible, no-paid-API calculators. This is a narrowly scoped **production release**, not approval to index every page or to certify Elden Ring game-client accuracy.

- Canonical production origin: `https://elden-ring-5i9.pages.dev`.
- Auto-release **only** when Cloudflare's injected `CF_PAGES=1` and `CF_PAGES_BRANCH=main` are both present. This works with existing `npm run build` configuration, without dashboard secrets, paid APIs or additional services.
- Local builds, CI, pull requests and Cloudflare preview branches remain global `noindex`; no preview sitemap is generated.
- The reviewed allowlist lives in `scripts/build.mjs`. The explicit `SITE_URL` + `RELEASE_INDEX_APPROVED=1` test fixture can exercise the **same four-route** allowlist only; it is not a blanket release.

## Exactly four initially indexable routes
| Route | Rationale | Evidence / published boundaries |
|---|---|---|
| `/` | Original navigation to first-party browser calculators; not a mass-generated weapon landing page | Public calculator overview; weapon-reference uncertainties disclosed; no borrowed images |
| `/level-rune-calculator/` | Self-contained formula: per-level costs, total runes, budget and farm-run arithmetic | Local `core.mjs` tests compare multiple community reference costs and cumulative totals; [Almanauts rune formula](https://almanauts.com/eldenring/rune-calculator/) |
| `/equip-load-calculator/` | First-party light/medium/heavy/overloaded thresholds from **user-entered** in-game total weight and max load | 30% / 70% / 100% boundaries, no automatic invented weights; [Bandai Namco gameplay explanation](https://www.bandainamcoent.com/news/elden-ring-introduction-part-2-advanced-stats) |
| `/class-optimizer/` | Deterministic 12-origin minimum-level points calculation with optional two newly released classes | [Official v1.17/Tarnished Pack announcement](https://www.bandainamcoent.com/news/elden-ring-patch-notes-version-1-17) confirms new origins; [Eldenpedia origins](https://eldenring.wiki.gg/wiki/Origins) independently publishes the same starting stat vectors; no gameplay certification implied |

## Hard exclusions
All other pages, **including `/build-planner/`**, `/about/`, `/privacy/`, `/updates/`, the weapon catalog, AR workbench/calculator, armor optimizer and validation pages, remain `noindex` until individually reviewed and added by a subsequent tested PR. Versioned Tarnished.dev v1.17 same-input AR parity (15/15) supports reference-labelled tool usefulness, **not** wholesale data rights or current Regulation 1.17.3 certification.

## Output and verification
- Exactly four `index,follow` meta tags and canonical URLs at the production origin.
- `robots.txt` allows crawler access so they can read noindex, and points to a sitemap containing **only** the four approved URLs.
- Every other public HTML route has a `noindex` meta tag and an explicit Cloudflare `X-Robots-Tag: noindex` route header (no global noindex header on the approved live build).
- `deployment-info.json` records `indexedRoutes`, `releaseMode`, revision and research status; it is a built artifact record, not a Google indexing guarantee.
- CI tests exercise production/preview/research/explicit fixture modes and fail if an unapproved route is in the sitemap, has a canonical, or lacks HTTP noindex defense.

## Limitations / real follow-up
- A successful build **allows** indexing; it cannot guarantee Googlebot discovery or inclusion. Check the live `/sitemap.xml`, canonical/meta/header responses and submit the sitemap via Google Search Console after deploy.
- Do not treat `https://<hash>.elden-ring-5i9.pages.dev` deployment previews as canonical.
- If a custom domain is added, update the canonical production origin in a reviewed PR and test redirects before enabling the new hostname.
- Third-party game-specific reference parameters and media are not automatically licensed merely because another site displays them; review those routes separately.
