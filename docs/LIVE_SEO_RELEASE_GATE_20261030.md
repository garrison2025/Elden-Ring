# Live Cloudflare Pages indexing check — 2026-10-30

Production/preview endpoint checked: https://elden-ring-5i9.pages.dev/ .

## Actual public responses observed

| URL | Observed result | SEO consequence |
| --- | --- | --- |
| `/robots.txt` | `User-agent: *` followed by `Disallow: /` | Crawlers are disallowed from site-wide crawling |
| `/` | HTML robots `noindex,follow` | Home is excluded from normal index consideration |
| `/build-planner/` | HTML robots `noindex,follow` | Build Planner excluded from index consideration |
| `/sitemap.xml` | 404 | No published XML sitemap |
| `/src/build-weapon-reference.mjs` | Responds with source implementing `inspectBuildWeapon` | Latest linked-weapon module deployed |
| `/build-planner/` text | Mentions extra origins, optional weapon reference, precise AR limitation | New HTML deploy confirmed |

These were read-only HTTP/extracted-page checks. They are **not** desktop/mobile interactive E2E tests or evidence of live Googlebot actions.

## Why

The current `scripts/build.mjs` requires an explicitly configured `SITE_URL` HTTPS origin. When absent:

- The build inserts `noindex,follow` on ordinary pages.
- `robots.txt` is written with `Disallow: /`.
- `sitemap.xml` is not generated.

The observed response is *consistent with* this preview build path. The Cloudflare Pages project build environment itself was **not** inspected, so missing `SITE_URL` remains a strong inference rather than verified setting.

A new console warning now calls out this nonindexable preview explicitly; it does not unilaterally open indexing.

## Controlled path to indexable production

1. Choose and confirm a stable production origin (prefer a controlled canonical custom domain when registered). Do not automatically switch canonical from preview to a guessed domain.
2. Independently validate every proposed indexable tool against the V2 page/accuracy and license gates; baseline community weapon facts, 0 independent AR golden samples, and synthetic previews do **not** pass the exact-AR gate.
3. Confirm which routes should remain `noindex` (weapon reference catalog, unsupported damage/AR research, incomplete tools) and which are demonstrably eligible. Update build route policy accordingly before enabling production indexing.
4. Configure `SITE_URL=https://your-confirmed-origin` for the **production build only** in Cloudflare Pages, then redeploy.
5. Independently confirm deployed `robots.txt`, generated `sitemap.xml`, HTML canonical, `meta robots` on each route, 404 handling, and actual GSC URL Inspection status before requesting indexing.
6. Keep development/preview deployments blocked from indexing; do not publish draft AR or unsupported calculation tools as finished SEO landers.

## Audit scope

No advertising income or keyword rankings were inferred. This document makes **no** claim that the site is now indexable. The existing nonindexable deployment is intentional safety until the quality and accuracy release requirements can be met.
