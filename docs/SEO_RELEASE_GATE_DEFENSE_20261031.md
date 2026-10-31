# SEO release gates: research routes are withheld at every output layer

Date: 2026-10-31. This is an **indexing-safety fix**, not approval to publicly index the unfinished site or certify Elden Ring weapon data.

## Two distinct modes

| Build mode | Conditions | HTML | Cloudflare Pages response headers | Sitemap |
|---|---|---|---|---|
| Default research preview | `RELEASE_INDEX_APPROVED` unset/not `1`, or missing HTTPS `SITE_URL` | Every page gets one build-generated `noindex` | Generated `_headers`: `/* X-Robots-Tag: noindex` | Not generated |
| Explicit site-wide SEO release | `RELEASE_INDEX_APPROVED=1` **and** valid `SITE_URL` | Seven approved public/editorial routes have one `index,follow` tag and a self canonical; nine withheld pages remain `noindex` | Explicit `X-Robots-Tag: noindex` for every withheld route | Only seven public/editorial routes, never research |

**Do not enable `RELEASE_INDEX_APPROVED` until independent publishing review.** This switch is an operator decision, not proof of game-data rights or accuracy. The build does not infer review completion from passing tests.

## Protected research and limited-data routes

These **nine** routes stay withheld even after a global indexing release:

- `/weapon-ar-lab/` (fictional AR research)
- `/weapon-ar-validation/` (unreviewed observation comparator)
- `/weapon-data-workbench/` (local 1.17 compact parameter research)
- `/weapon-database/` (408 community entries; 7 unresolved source conflicts)
- `/validation-status/` (development validation record)
- `/respec-planner/`
- `/weapon-requirements/`
- `/armor-optimizer/`
- `/weapon-upgrade-calculator/`

The four strict research/validation pages use `noindex,nofollow`; other withheld pages use `noindex,follow`. All nine receive Cloudflare's `X-Robots-Tag: noindex` when global indexing is enabled.

The build **removes stale or duplicate source robots and canonical tags within HTML HEAD**, then emits exactly one set of appropriate tags. A source editor deleting a `noindex` meta cannot override this route list. Previously, `weapon-ar-lab` was not present in the build's withheld list; this fix prevents it from entering an approved Sitemap.

## CI verification and limitations

- `tests/seo-release-gate-end-to-end.test.mjs` builds both modes in isolated temporary directories.
- The test deliberately **deletes all nine source-page robots tags**, then proves that output still contains the correct noindex, Cloudflare headers, and sitemap exclusions.
- The deployment-artifact verifier checks built HTML and Cloudflare headers, not just handwritten HTML text.
- Cloudflare Pages automatically loads a static `dist/_headers` file and applies the matching route rules. A GitHub green check is **not** a guarantee of Google indexing status, which requires live URL inspection after a deployment.
- `robots.txt` allows crawlers to access noindexed HTML, so they can read its robots tags; the default mode omits Sitemap.
- Do not confuse an `index,follow` declaration with a search engine commitment to index any URL.

## Accuracy stays separate from SEO

- **408** community-reported weapon records remain unchanged.
- **7** source disputes remain unresolved.
- **0** independently approved current-game AR screenshot goldens.
- Existing research noindex and data-licensing gates remain; no commercial data-rights claim or AR certification is established.
- No new service, paid API, or external asset is introduced.

A later page-by-page release of withheld tools would require a deliberate code change to the protected list, data verification, editorial review and tests; a generic environment flag must not grant it accidentally.
