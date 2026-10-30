# Opt-in v1.17 public regulation-data research integration — 2026-10-30

## What was verified

The source repository is [ThomasJClark/elden-ring-weapon-calculator](https://github.com/ThomasJClark/elden-ring-weapon-calculator). Its authored software has [MIT permission text in COPYING](https://github.com/ThomasJClark/elden-ring-weapon-calculator/blob/3539d87e446f3b9d5b94157f8a2023e28ffea7d2/COPYING), and README states that weapon parameter files were derived from ELDEN RING game Regulation data extracted with WitchyBND. The repository's frontend labels the snapshot **Patch 1.17 (latest)** in `src/app/regulationVersions.tsx`; it is **not explicitly certified as regulation 1.17.3**.

The pinned upstream commit is `3539d87e446f3b9d5b94157f8a2023e28ffea7d2`. Its public UTF-8 snapshot `public/regulation-vanilla-v1.17.js` contains **JSON text** despite the `.js` suffix and approximately **1.1 MB / 3296 distinct weapon+affinity variants**, plus `calcCorrectGraphs`, `attackElementCorrects`, `reinforceTypes`, status parameters, scaling tiers and the weapon list.

The public **software's MIT license is not a separate definitive license grant to redistribute game-extracted data, text, images or other third-party assets**. Therefore this implementation **does not bundle** the 1.1 MB source, does not clone the upstream app/visuals, does not copy the calculation engine, and does not execute `.js` from another origin. Only after a user explicitly clicks **Load public v1.17 dataset**, their browser requests the pinned JSON text via HTTPS, verifies the high-level shape and record count, and transfers it to our existing standalone in-memory worker. The source is not uploaded, saved to localStorage or served by our site. This is an engineering risk-reduction measure, **not an opinion that the user has redistribution rights**.

## How to use

1. Open `/weapon-data-workbench/` (always noindex/nofollow) directly or from a weapon in `/weapon-database/`.
2. Click **Load public v1.17 dataset**. The fetch is browser-initiated, with `credentials:omit`, `cache:no-store`, response-size enforcement at 16 MB, and pinned public Git commit. If a browser/CORS/network failure occurs, fetch the linked upstream JSON and import it locally (renaming the `.js` extension to `.json`); it is parsed as strict JSON, never executed.
3. Search real weapon/affinity names, compare one- and two-hand AR hypotheses, switch available reinforcement levels, compare two weapons, and run full structural audit in the browser worker. All computed values remain **unverified research AR**.
4. Click **Clear from memory** to discard the source; selecting another file or the fictional demo cancels any running upstream request. The site never calls a paid runtime API.
5. **Do not** publish this as accurate AR until actual 1.17 in-game equipment-screen golden vectors match selected normal, split-damage, unique/somber, infusable, paired, ranged and spell-tool cases. Research code explicitly excludes important status buildup/spell scaling coverage and does not calculate damage against an enemy.

## Current evidence discrepancy

The pinned upstream 1.17 parameter object reports `Madding Hand` requiring **20 Faith**, while the project's DLC wiki category reference previously gave **13 Faith**. This real source disagreement must be reconciled with the appropriate game Regulation version and independent player screenshots; neither should silently overwrite the other as an unqualified accurate fact. Keep the separate 409-row community catalog and 3296-row *affinity-inclusive* research dataset semantically distinct.

## Tests and gating

Unit tests exercise pinned URL/commit, strict JSON/no script execution, malicious/repeated records, streaming byte cap, explicit request mode and no credentials; DOM source tests verify user click wiring, noindex, attribution and weapon deep links. Existing worker arithmetic and synthetic fixtures remain intact. Tests do NOT perform a live browser connection, license certification or in-game client validation. The source bridge should never be used as an automated publishing gate.

Public references:
- https://github.com/ThomasJClark/elden-ring-weapon-calculator
- https://github.com/ThomasJClark/elden-ring-weapon-calculator/blob/3539d87e446f3b9d5b94157f8a2023e28ffea7d2/COPYING
- https://github.com/ThomasJClark/elden-ring-weapon-calculator/blob/3539d87e446f3b9d5b94157f8a2023e28ffea7d2/public/regulation-vanilla-v1.17.js
