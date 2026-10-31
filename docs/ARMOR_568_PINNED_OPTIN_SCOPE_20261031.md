# Pinned opt-in community armor reference: data-scoped progress toward v1.17 Build Calculator

2026-10-31. **This is NOT full Tarnished.dev v1.17 feature or current-patch data parity.**

## What is connected
- User clicks *Load pinned community armor names & weights* in the Build Planner equipment section. Browser requests:
  `https://raw.githubusercontent.com/deliton/eldenring-api/3d9cefcfcda7066796b9553825449039c2073926/api/public/data/armors.json`
- 568 public source records. Source categories: **167 Helm / 203 Chest Armor / 94 Gauntlet(s) / 104 Leg Armor**.
- The browser STRICTLY parses 568 safe records, only permits name/ID/category/weight, and ignores **all descriptions, images, lore and other game material**. No upstream JavaScript is executed; no files stored or transferred to Build Lab servers. This is a user-initiated public-source read.
- Each armor slot gets a category-scoped name dropdown/autocomplete. An exact, unique name match can fill its public **source-reported weight** (no default guess). Source weight provenance is stored in the local serialized equipment state.
- A saved loadout with community armor provenance will NOT silently show an exact equipped weight when the public pinned source has **not been reloaded** or a mismatched/changed source value is supplied; it treats the armor weight as unknown. User-entered values are preserved separately and explicitly labelled.
- Does NOT supply current patch v1.17/1.17.3 certification, complete DLC or Tarnished Pack armor, passive effects, negation arithmetic, precise per-armor poise/regulation parameters, spell or enemy damage formulas.

## Copyright/data rights boundary
The external source repository's software/open source declarations do not automatically license game-derived descriptions/images/serialized parameters. This project does **not** bundle the armor JSON, copy any narrative descriptions/images, or claim legal approval of bulk redistribution. Users choose to retrieve an identified snapshot directly on demand. Any later bundling/indexing must be separately reviewed for rights, source currency and factual reliability.

## Acceptance
- Local deterministic strict parser (568; duplicate names/IDs, malformed types, invalid categories and weights rejected), user-choice fetch arguments and no source media fields exported.
- Source-backed weight requires an exact source match; a forged value in a shared JSON must NOT pass as pinned-source evidence.
- Real Chrome opt-in check uses the public pinned 568 JSON, selects **Black Knife Armor** with its community-reported weight **9.2**, and verifies that changing its name erases the automatically filled weight; no automatic external request on opening the page.
- No paid service, no new production indexing routes and no unverified game client claim.

Master acceptance tracker: https://github.com/garrison2025/Elden-Ring/issues/86 .
