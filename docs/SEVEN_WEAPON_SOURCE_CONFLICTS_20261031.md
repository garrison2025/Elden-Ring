# Seven unresolved DLC source disagreements — 2026-10-31

**Status:** source-vs-source review completed; **zero** independent App 1.17.2 /
Regulation 1.17.3 game-client screenshot observations accepted. The seven
disagreements are deliberately **not** "resolved" or overwritten.

## Evidence classes

- **Community (+0):** the existing bundled 408-entry community weapon reference;
  the original wiki.gg individual/category page URL is included for each case.
  Web pages may represent older versions; no common patch version is asserted.
- **Pinned source (+0):** `ThomasJClark/elden-ring-weapon-calculator` public
  v1.17 regulation snapshot, commit
  `3539d87e446f3b9d5b94157f8a2023e28ffea7d2`. Correctly calculate
  `rawAttack × reinforceType[level0].attack` for each damage component.
  Comparing raw values alone makes false discrepancies; see the existing
  `docs/DLC_V117_CROSS_SOURCE_REVIEW_20261030.md`.
- **Publisher notes:** official App 1.17.2 / Regulation 1.17.3 release notes
  at https://en.bandainamcoent.eu/elden-ring/news/elden-ring-patch-notes-version-1172 .
  These establish title-screen version and patch context, **not** individual
  +0 weapon stats or exact requirements for these seven entries.
- **Current independent game client:** **not collected / not reviewed**. An
  external website, another wiki, mathematical parity or screenshot filename
  does not establish an independently confirmed game value.

All machine-readable cases, exact source citations and manual observation
requirements are in `public/data/weapon-conflict-evidence.json`.

## Cross-source readings (not current-patch game facts)

Damage order: **Physical / Magic / Fire / Lightning / Holy**.
Requirements order: **STR / DEX / INT / FAI / ARC**.

| Item | Bundled community +0 | Pinned v1.17 source +0 | Disagreement |
| --- | --- | --- | --- |
| Fire Knight's Shortsword | 75 / 0 / 32 / 0 / 0 | 75 / 0 / 22 / 0 / 0 | Fire 32 vs 22 |
| Greatsword of Radahn (Light) | 129 / 83 / 0 / 0 / 0 | 127 / 82 / 0 / 0 / 0 | Physical and Magic |
| Greatsword of Radahn (Lord) | 129 / 83 / 0 / 0 / 0 | 127 / 82 / 0 / 0 / 0 | Physical and Magic |
| Madding Hand **requirements** | 8 / 8 / 13 / 13 / 0 | 8 / 8 / 13 / 20 / 0 | Faith 13 vs 20 |
| Queelign's Greatsword | 117 / 0 / 35 / 0 / 0 | 122 / 0 / 36 / 0 / 0 | Physical and Fire |
| Smithscript Axe | 133 / 0 / 0 / 0 / 0 | 131 / 0 / 0 / 0 / 0 | Physical 133 vs 131 |
| Smithscript Dagger | 67 / 0 / 0 / 0 / 0 | 62 / 0 / 0 / 0 / 0 | Physical 67 vs 62 |

**Public corroboration is split, not conclusive.** For example Eldenpedia's
Madding Hand entry gives FAI 13, whereas the Fandom weapon page, another
published wiki and the pinned 1.17 snapshot report 20; those sources are not
independently verified for Regulation 1.17.3. Eldenpedia's Axes table lists
Smithscript Axe 133, while an independent tool and an additional weapon
database report 131. This is stronger evidence that sources disagree, not
permission to auto-choose either value.

## Manual game-client check: specific reproducible steps

1. Launch Elden Ring **App 1.17.2 / Regulation 1.17.3**, record platform and
   actual title-screen version in a screenshot; retain local original bytes.
2. Equip the *exact* named weapon, use its **default/uninfused +0 state**,
   and capture the weapon-specific **equipment details**. For the six attack
   cases record the five individually displayed *base attack* components.
   Do not substitute the character's status-screen **total AR**.
3. For Madding Hand record its five unmodified requirement values. Effective
   two-hand STR requirements and player stat allocation are not the reference.
4. Save each original screenshot locally with date, platform, app/regulation,
   exact item name, reinforcement level, affinity and optionally SHA-256.
   The existing browser-local `/weapon-data-workbench/` supports unreviewed
   observation drafts and screenshot fingerprints; it cannot authenticate
   screenshots and must not turn these into verified facts automatically.
5. A separate reviewer checks image content, game version, weapon identity,
   conditions, data-origin/license scope, and arithmetic against source
   versions. Only then consider editing the weapon number and clearing its
   conflict flag. Any change must also update the corresponding ledger
   evidence, review history and regression fixtures in one reviewed PR.

**Do not upload, bundle or redistribute game-owned source params or player
screenshots without a separate rights review.** There is no new paid API,
backend, game automation or externally fetched runtime dependency.

## Automated controls

- `scripts/weapon-conflict-dossier.mjs` checks all seven IDs, their exact
  community data, pinned readings, conflict flags, URL hygiene and explicit
  unverified status; fails on missing/new flags or silent source changes.
- `scripts/build.mjs` renders `/validation-status/#conflict-dossier`
  from the ledger and existing source JSON. `scripts/verify-deployment-artifact.mjs`
  ensures the built HTML contains the validated comparison and that no
  screenshot or game-client certification is falsely asserted.
- `tests/weapon-conflict-dossier.test.mjs` covers cases and tampering, and
  `scripts/smoke-browser.mjs` checks rendered rows and disclaimers in real
  Chrome on both desktop and mobile scenarios.
- Indexing stays **off** until the separate release gate explicitly passes.

This is a reproducible source-disagreement audit, **not** an AR or gameplay
accuracy certification.
