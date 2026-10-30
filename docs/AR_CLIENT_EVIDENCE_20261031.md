# 2026-10-31 AR research continuation — coverage and independent game-client evidence

This branch **does not claim current-version game AR certification**.

## Implemented

1. The weapon catalog now refreshes its AR handoff link when changing a community-published upgrade value. The link uses the currently displayed +level and the five editable combat attributes.
2. The local workbench reports selected source rows' known model-scope limitations (paired moveset, ranged ammunition/motion, spell-tool scaling, status buildup, 11-step somber skill damage). These are warnings about missing gameplay simulation, not blanket assertions that the parameter-derived nominal AR is wrong.
3. A real-game **manual equipment-menu observation draft** can be recorded directly after calculating nominal AR: explicit App/Regulation versions, platform, date, exact affinity name, reinforcement, grip, five player stats, observed integer menu AR, local evidence filename/reference and candidate calculated AR. The JSON contains the numeric difference, plus `reviewStatus: UNREVIEWED`, `gameClientVerified: false`, `publicationApproved: false`. An exact match never changes those fields.
4. The export is browser-local; no screenshot/image, game data or personal build is uploaded. Fictional demo calculations are forbidden as game observations. Players must keep screenshots and submit observations for **separate** independent review before any verified claim.
5. New synthetic matrix tests exercise all thirteen source-affinity rows and somber/paired/status/spell/ranged warnings. The source-derived arithmetic CI has also expanded from 4 to 12 cases per actual imported variant: +0, intermediate, maximum, 1H/2H, each attack attribute extreme and all-99. This yields 39,552 shared-source mathematical comparisons across 3,296 imported v1.17 rows, with zero differences after explicitly matching the source's floating-point evaluation order. **Neither test is independent current-game validation.**
6. Research builds default to site-wide `noindex` even if `SITE_URL` is configured. `robots.txt` must allow reading `noindex`. The sitemap is withheld. The explicit `RELEASE_INDEX_APPROVED=1` switch is for a future **separately approved** release, not something to set during research.

The extended matrix first exposed eight integer-floor discrepancies (four rows at 99 FAI and four at all-99 two-handed) due to IEEE-754 calculation order. The imported-profile engine now evaluates modern compact-source scaling in the same operand order as its independent raw-source arithmetic checker; all expanded comparisons pass. This is a correction to mathematical consistency, **not** evidence that the game uses this same floating-point order at its display boundary. Those boundary states still require game-menu screenshots.

## 2026-10-31 continuation: full affinity matrix

The local AR workbench now has **Compare every affinity of this weapon family**, a manual
action that compares every *exact source-defined* variant of the currently selected
weapon family under the same five attributes, enhancement level and grip. It uses
the existing local Worker and imported JSON and sends nothing to a server.

- Displays the source-name row, nominal AR and the five separately floored
  physical/magic/fire/lightning/holy components.
- Displays missing weapon attribute requirements and scope warnings per row,
  including paired weapon movesets, ranged ammunition, spell tools, status
  buildup and somber weapon skills where source metadata indicates them.
- An absent reinforcement step (e.g. a somber +10 entry compared at +25) is
  **unavailable, not zero**: no interpolation or guessed weapon value is used.
- Malformed source rows are labeled `source-conversion-blocked`, not
  silently omitted. Rows remain in original source affinity order, **not
  sorted as an actual-damage ranking**.
- Changing weapon, attributes, reinforcement, source file or comparison grip
  invalidates old matrix results. Late Worker replies cannot publish results
  for a previous input revision.
- Synthetic tests cover all thirteen fabricated affinities, source +0/+25
  and mixed +10/+25 upgrade paths and missing weapon requirements. They
  are **not** independent game-client goldens.

**Verification unchanged:** zero current App 1.17.2 / Regulation 1.17.3
game-client screenshot goldens have been independently reviewed. All
outputs remain research-only; site-wide `noindex` remains enabled.
Numerical nominal AR does not include movesets, enemy defenses,
status buildup, ammunition or weapon skills.

## 2026-10-31 continuation: reinforcement paths and observation draft recheck

Two more research functions are implemented in the local browser Worker and source
calculator:

1. **Full upgrade progression** for one exact selected source entry: calculate
   nominal equipment AR at **every explicitly available** +level for one-hand
   and two-hand grip, plus five separately floored elemental components.
   Standard 26-step and special 11-step source tables are never conflated.
   Missing reinforcement rows are shown as unavailable rather than invented.
   The source-table length identifies the *supplied table length only*; it does
   **not** certify somber classification, hidden scaling, weapon skill damage,
   equipment buffs, statuses or game version parity.
2. **Recheck an unreviewed game-menu observation JSON**: select a locally
   exported draft and recompute its exact weapon/affinity, stats, enhancement
   level and grip from the **currently loaded parameter source**. Detect
   mismatched source version, candidate formula drift and inconsistent saved
   derived fields, with an explicit comparison against the originally
   transcribed game-menu AR. Only one small local JSON file is read;
   nothing is uploaded. Fictional demo mode cannot run the rechecker.
   This process cannot independently inspect the screenshot or establish
   that the claimed App/Regulation versions match the actual installed game;
   all results remain `UNREVIEWED` and `gameClientVerified:false`.

Synthetic regression tests exercise +0–+10, +0–+25, intentionally absent
reinforcement rows, paired weapons without a fictional two-hand bonus,
split physical/magic AR, and tampered/contradictory JSON drafts.
These scenarios **are not** new actual client goldens.

**Publication gates remain unchanged:** research-only `noindex`, no bundled
third-party weapon data, unresolved redistribution rights, and **zero**
independently reviewed 1.17.2/1.17.3 game-client AR screenshot goldens.

## 2026-10-31 continuation: combat attribute investment sensitivity

The research workbench can now compare **+1, +5, and +10** to each of the
five player combat attributes (STR / DEX / INT / FAI / ARC). For each probe,
all *other* attributes, the exact source weapon/affinity, reinforcement
level and selected grip remain constant. The app exposes:

- Baseline nominal AR, final nominal AR and **gain per actually invested**
  stat point. A current stat of 97 queried with +5 invests only **2** points;
  stat 99 is explicitly unavailable rather than counted as a zero-gain
  available investment.
- Five independently floored damage-component changes and unmet or newly
  satisfied weapon attribute requirements. 1H/2H STR effects and paired
  grip restrictions follow the same imported-source calculation engine.
- A Worker-only, manually triggered sensitivity table; previous rows are
  cleared on changes to weapon, attribute values, upgrade, source dataset
  or comparison grip to avoid stale result confusion.

The implementation does **not** rank global build quality or optimize
a complete character: it makes only one-variable local probes, assumes
added points are possible within 1–99, and cannot infer player rune
level or skill/status/ammunition/target-defense effects. In particular,
nominal split AR changes are not a prediction of real enemy damage.

Synthetic tests cover exact equality with direct profile calculation,
all 15 per-attribute probes, 99 caps and partial investments, requirement
threshold crossings, split physical/magic results and paired weapons.
**Zero new independent game-client screenshots were reviewed.**

## 2026-10-31 continuation: in-game screenshot test plan and batch arithmetic recheck

The local `/weapon-data-workbench/` now has a **manual game-client
AR test planner** for one exact source-defined weapon/affinity.

1. The player explicitly loads the pinned v1.17 research snapshot or their
   own permission-reviewed JSON, selects the exact weapon, and enters five
   combat attributes. No source is downloaded merely by opening the page.
2. Click **Generate manual test cases**. The Worker generates at most 24
   deduplicated condition vectors: low/middle/high *actually supplied*
   reinforcement levels, 1H and 2H grip, raw stat requirement boundaries,
   standard-grip effective two-hand STR thresholds, and attribute-99
   boundary probes. Paired or forced-grip profiles do **not** get a
   fictional ordinary-two-hand STR breakpoint.
3. Each condition displays the exact five stats, +level, grip and
   **parameter-derived candidate AR**, with its current research source
   version and any recognized excluded-mechanic flags. The empty actual
   AR and screenshot-reference fields are intentionally never populated
   with generated values. Players must use the **real equipment menu**
   for each test condition and save genuine screenshots separately.
4. Fill any subset of actual integer game-menu AR values and local screenshot
   filenames. Reuse the App version, Regulation version, platform and
   observation date from the adjacent evidence form. Click
   **Export completed observations** to download a local JSON batch of
   `UNREVIEWED` drafts, or **Download checklist JSON** to keep the test
   cases without claiming observations.
5. The offline **Recheck a saved game-menu observation** panel accepts
   either a single previous JSON draft or the new batch format and
   recomputes each draft against the currently imported source. It reports
   arithmetic drift, version mismatch, malformed/misrepresented drafts
   and numerical discrepancy from the manually reported game value.
   Any rejected batch row is explicitly reported rather than discarded.

This workflow does not inspect screenshots, access game processes,
authenticate sources, assign independent reviewers, or grant data rights.
Even a batch of all numerical matches remains
`reviewStatus: UNREVIEWED`, `gameClientVerified: false` and
`publicationApproved: false` with **0 independently reviewed screenshots**.
The pinned v1.17 candidate source must not be represented as proven
Regulation 1.17.3 client data. The per-case records contain separately
typed game App and Regulation versions, not inferred ones. The fictional
demo can show a plan, but cannot export real-game observation batches.

All handling is local to the browser. No screenshots are uploaded,
no game-owned asset pack or dataset is bundled, and no API/backend is
introduced. This is **data collection and arithmetic reproducibility
tooling**, not special-weapon skill-damage or status-effect modeling.
The site stays research-only `noindex`.

## 2026-10-31 continuation: screenshot SHA-256 file-identity chain

Manual game-menu AR batch entries now support an **optional LOCAL screenshot**
input alongside the player-transcribed AR and filename. Only screenshots
with PNG/JPEG/WebP signatures and matching extensions/MIME types are accepted
(up to 12 MB each). When the player clicks **Export completed observations**,
the browser computes SHA-256 using Web Crypto and adds a small metadata object
(filename, media type, byte length, SHA-256, `screenshotReviewed:false`,
`gameClientVerified:false`) to each selected record. The screenshot itself
is **not** embedded in JSON, uploaded, committed or cached by this workflow.
The original photo should be saved separately by the tester.

When a batch containing fingerprints is imported into the existing local
arithmetic recheck tool, the app offers **Compare screenshot SHA-256 locally**:
select a case and the corresponding original file. It recomputes that image's
fingerprint and reports a **bytes-match** or **bytes-mismatch**. Hash validation
also rejects malformed fingerprint fields in batch arithmetic recheck; older
UNREVIEWED JSON records with only a filename remain compatible.

**Important interpretation:** SHA-256 matching proves that the selected file
has the same byte digest/size/type as the previously fingerprinted file.
It cannot establish that the file contains a genuine Elden Ring UI,
correct character stats, the current App/Regulation version, an untampered
screenshot, independently confirmed client goldens or lawful redistribution.
The browser does not itself examine screenshot pixels or authenticate a
player's claims. All outputs remain `UNREVIEWED`, `gameClientVerified:false`,
and `screenshotReviewed:false`. There are still **zero** separately
inspected, accepted real-client screenshot goldens.

This flow uses no additional npm dependency, server, paid API or storage.
The site-wide `noindex` research gate is unchanged.

## Outstanding release blockers

- No independently inspected, current-version game-menu screenshot samples are claimed here.
- The original independently cited 14 regulation-derived comparisons, 3 historical player reports and cross-source parity checks remain separate evidence classes and cannot certify Regulation 1.17.3 game-client fidelity.
- Real weapon-skill, motion-value, spell catalyst, ammunition, status and target-defense effects remain out of scope. The nominal AR tool is **not** a real-damage calculator.
- Data license/redistribution review, conflicting DLC rows and full per-affinity current-version goldens remain open.
- The site must remain research-only `noindex` until data, formula, UI, game screenshots and rights have each been independently reviewed.

## Recording a valid future candidate

On `/weapon-data-workbench/`: opt in to loading the pinned v1.17 parameter source or use permission-reviewed local JSON; select an exact weapon/affinity, level and five stats; calculate one-hand/two-hand nominal AR. Then inspect the **same conditions** in a real game build, enter App and Regulation values visible in the game, screenshot filename and observed equipment-menu integer AR, and click **Export unreviewed observation JSON**. A future reviewer must separately inspect the screenshot, confirm the version/state/conditions, assign a code commit and data revision, and re-run the comparison. Do not count unreviewed exports as verified goldens.
