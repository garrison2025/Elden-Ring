# SEO wave 2: Build Planner — 2026-10-31

## Scope
Wave 1 enabled four reviewed original calculator pages (PR #79). Wave 2 adds **one more indexable route**:

- `/build-planner/` (title: *Elden Ring Build Planner & Stats Calculator*), bringing the production sitemap to **five routes total**.

No other route's indexing status changes. The weapon catalog, weapon AR calculator/workbench, armor optimizer, respec and weapon upgrade research tools stay `noindex`. No source-code snippets or third-party web content are copied for SEO.

## Why this page is eligible
- The core class minimums, eight-stat allocation, level math, rune budget, class comparisons, local save and A/B comparison are executed in first-party browser code and exercised in deterministic tests and Chrome smoke checks.
- The page has an authored five-step workflow explaining origin allocation, attribute budget, sourced weapon constraints, loadout distinction, and sharing/private storage rather than empty or auto-generated SEO copy.
- The optional, user-selected weapon panel is **explicitly source-labelled**, with missing/disputed requirements and weights fail-closed; it never claims to compute current-patch weapon AR or live damage.
- For reference AR, an explicit user action opens the separate `noindex` calculator using exactly the selected reference weapon name and the current Build's STR/DEX/INT/FAI/ARC. It never invents affinity, reinforcement, current-patch accuracy, or source version, and that destination still requires user-initiated data loading.
- Tarnished.dev publicly offers a build-calculator workflow on v1.17. It is a **functional reference**, not a license, copy source, or independent in-game certification.

## Gates
1. Cloudflare production main only: `CF_PAGES=1`, `CF_PAGES_BRANCH=main`. No additional paid services or manual admin settings.
2. The existing five-route allowlist emits a sitemap and canonical URLs with the exact origin `https://elden-ring-5i9.pages.dev`.
3. All other routes continue to receive `noindex` meta and Cloudflare `X-Robots-Tag`; previews remain globally `noindex` even when a stale approval flag is present.
4. Unit tests exercise exact five-stat link construction, URL parsing, input rejection, source-conflict caveats; real browser smoke checks selected weapon, stat changes and invalid-state hiding.
5. Real-world publication requires the main-branch GitHub Actions results and Cloudflare Pages deploy to succeed. Eligibility for indexing does **not** guarantee Google will index the URL.

## Further review needed before AR/database indexing
- Source-specific rights for redistributed game-derived parameter data, text and item data are not established by copying another site's output.
- 15 documented same-input Tarnished.dev v1.17 AR matches cover only those cases. Missing variants and disputed numerical fields cannot be silently filled from a competitor or represented as current Regulation 1.17.3 client certification.
- A future weapons/database release should have independently authored per-weapon utility and reliable source evidence, with canonical/sitemap scope reviewed separately.
