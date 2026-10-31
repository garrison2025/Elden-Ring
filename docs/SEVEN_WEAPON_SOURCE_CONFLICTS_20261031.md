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

## New: guided local seven-case collection on the accuracy page

To collect the *missing* evidence without editing JSON manually, open
`/validation-status/#conflict-capture`. This is an **in-page research
workflow**, not another indexable SEO tool.

1. Choose the flagged weapon. Madding Hand (FAI 13 vs 20) appears first
   because it affects whether characters satisfy wield requirements.
   The form shows five distinct candidate values from each published
   source for comparison, but **never prefills observed game values**.
2. Launch an actual Elden Ring game session, type the App and Regulation
   versions visible in the game title screen, choose platform and date.
   Select one local PNG/JPEG/WebP screenshot of the title/version screen.
   The same title-screen file may be reused for other seven cases from
   that session.
3. View the exact selected weapon at **+0/default-uninfused**. Enter all
   five displayed weapon-details base-attack components (PHY/MAG/FIRE/
   LGT/HOLY), or all five exact attribute requirements for Madding Hand.
   A blank field does not mean zero. The **character status AR** is not
   the same thing as the weapon’s individual +0 base attack.
4. Select the original local screenshot of this exact weapon-details
   panel and tick all three manual attestations. Click **Record
   unreviewed observation**. The page checks image format/signature,
   limits each file to 12 MB, computes SHA-256 locally with Web Crypto
   and classifies the transcribed numbers as *matches community*,
   *matches pinned v1.17*, *matches neither* or
   *not compared because title-screen version differs*.
5. Repeat for any available weapons. Click **Download checklist /
   observation JSON** to export all seven entries, with player-entered
   drafts for captured ones and `PENDING_REAL_GAME_EVIDENCE` for
   uncaptured ones. Keep the original screenshot files privately;
   nothing is uploaded, and actual screenshot bytes are not in the
   JSON. The page does not autosave; do not refresh before downloading.
6. Have a **separate independent reviewer** inspect both original
   screenshots, correct App/Regulation version, exact weapon/affinity/
   reinforcement and the claimed values. A hash match only proves file
   identity if the original image is reselected and compared—**not**
   that the image is genuine. The JSON always remains
   `reviewStatus: UNREVIEWED`, `gameClientVerified: false`,
   `publicationApproved: false`, and
   `independentlyReviewedScreenshotCount: 0`. No auto-approval exists.

**Collection vs. validation:** even seven filled records, all matching one
source, are seven **unreviewed player transcriptions**, not seven accepted
game goldens. Do not change the source data/flags or open SEO indexing from
this local client-side export.

This flow reuses the existing screenshot SHA-256 signature validation and
adds no paid APIs, external analytics, browser storage, uploaded image
content, account, or new data-redistribution license.
