# One-click v1.17 Weapon AR Calculator — delivery and verification (2026-10-31)

## What was built

- Public route: `/weapon-ar-calculator/`, with a focused weapon-search, exact source-defined affinity selector, reinforcement level, five stats (STR/DEX/INT/FAI/ARC), one/two-hand switching, nominal total Attack Rating, element breakdown, missing requirements, warnings, and shareable URL.
- Mobile-first tailored CSS: `public/assets/weapon-ar-calculator.css`, using existing Build Lab visual language. Reduced-motion support, semantically labelled controls, accessible live results and states.
- One explicit user click downloads pinned external public community v1.17 parameters directly into the browser via `downloadV117Source` and `inspectV117Json`, verifying expected 3,296 unique weapon/affinity records. No remote JavaScript execution, backend or ongoing paid services; no automatic download on page open.
- The existing versioned local calculation Worker, converter and AR model remain the *only* math engine. No duplicate AR math or guessed affinity options. Somber upgrades limited to source-defined +0..+10, normal upgrades to +0..+25.
- Local JSON import and visibly fictional demo are fallback options, not conflated with real game data. Data remains in browser memory, not localStorage, IndexedDB, or our server.
- Catalog's AR link carries weapon, five stats and optional upgrade into the simplified tool; advanced workbench remains available. Homepage and responsive navigation expose the new page.

## Evidence

- Prior independent external source parity: 15/15 exact v1.17 Tarnished.dev browser comparisons, six weapon families; see `docs/TARNISHED_DEV_15_CASE_PARITY_20261031.md`.
- New **real browser source-download** end-to-end run: https://github.com/garrison2025/Elden-Ring/actions/runs/41181779181.
- User-clicked public 1.17 source, confirmed Uchigatana 40 STR / 40 DEX (10 INT/FAI/ARC): Standard +0 1H 172, 2H 180, Standard +25 491, Keen +25 488. Each is computed by the deployed page rather than a stand-alone test-only implementation.
- Switched to Blasphemous Blade and verified upgrade option list is exactly 0 through 10, with no fabricated +25.
- Tested 375px mobile width; Chrome worker demo independently matches fictional 1H 136 and 2H 152 without initiating a network fetch.
- Static site verification and standard browser smoke remain independent required CI checks.

## Correctness and SEO boundaries

- These are community-published v1.17 **nominal AR estimates**. The 15 benchmark cases certify their specific same-input comparisons only; they do not certify all affinities, weapon mechanics, buffs, statuses, PvE/PvP damage, or App 1.17.2 / Regulation 1.17.3 actual game-client parity.
- Public game-derived data licensing remains a distinct release requirement; the pin is externally downloaded only by the user and no game-owned parameter file is bundled or copied to GitHub/Cloudflare.
- The new public tool is intentionally **noindex** in HTML, release build policy and Cloudflare `_headers` until source-rights, quality, and search-release gates are explicitly approved.

## How to use

1. Open `/weapon-ar-calculator/`.
2. Click **Load public v1.17 data** (one-time per page session). No game installation needed.
3. Search or pick a weapon, select the variant's affinity, upgrade and combat attributes. The result is recomputed in the browser.
4. Toggle Two-handed to see grip changes. Use Copy build link to share configuration (not the game data; recipient must click Load separately).
