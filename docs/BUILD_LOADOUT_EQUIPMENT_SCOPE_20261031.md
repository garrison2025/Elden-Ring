# Build Planner equipment/active-item state: source-safe milestone — 2026-10-31

## Why this exists
Tarnished.dev's public v1.17 Build Calculator includes six weapon hand slots, head/chest/arms/legs, talismans, spells, Physick and Great Runes, with derived load and AR. Build Lab previously had class/runes/weapon requirement checks, a separate six-weapon Equip Load tool and a standalone v1.17 reference AR calculator, but no *single character Build* holding all the equipment and active item selections. This patch provides that structure **without inventing their numerical buff formulas or redistributing third-party datasets**.

## Delivered
- In **/build-planner/**, opt into a source-catalog-backed equipment planner. Six exact local weapon selections with source names (from the bundled 487-entry, source-attributed reference), manual per-weapon weight overrides, four named armor slots each with user-supplied weight, four talisman name slots, ten spell name slots, two Physick tear name slots and one named Great Rune.
- Existing independent content gates: SOTE selection allowed only when enabled, Tarnished Pack selection allowed only when enabled. The two extra content switches are **not interchangeable**.
- Exact equipped weight subtotal, if and **only if** all occupied slots have numerical source-reported non-disputed or explicitly user-entered weights. Source UNKNOWN or disputed weights fail closed, display the specific named blocked slots and suppress roll tiers until resolved. Roll thresholds are from the same core function as Equip Load, and actual user-entered max weight is mandatory for a tier.
- Local JSON export/import, deliberate user-controlled browser local save/restore, version-1 link encoding; old Build stats links remain valid. Share URLs carry current origin + eight attributes + optional extra content flags + bounded equipment object. URLs can be exposed to the hosting operator when opened; do not imply private URLs cannot leave the browser.
- Per-equipped-weapon handoff to the existing opt-in v1.17 reference AR calculator with the current five combat attributes. Source version/certification limitations remain at the destination.

## Not delivered; MUST NOT claim functional/data parity for Build Calculator
- Primary real **armor** catalog, talisman/Physick/Great Rune effect registry, full spell list/requirements and casting-tool scaling (currently the user manually enters names).
- Actual HP/FP/Stamina/Negation/Defense/Poise/Discovery derived-curve verification with in-game evidence and effect stacking/exclusivity model.
- In-slot affinity/upgrade, spell damage, passive buffs, full negative-effect handling, enemy-specific damage or latest Regulation 1.17.3 game-client certification.
- A title's presence in the user-supplied notes is not verified to be a real equipped item, and name-only selections never alter computed stats or enemy damage.
- Source corpus version remains unverified; the 487-entry local data is **not** a complete authoritative 1.17.3 game dataset.

## Test and release gates
- Unit checks against real bundled catalog: 6/4/4/10/2/1 shape, known Uchigatana weight, source-only Albinauric Shield unknown, Stone-Sheathed Sword disputed weight, manual override, no DLC/PACK mix, malformed/invalid source IDs, JSON roundtrip.
- Chrome smoke: enable real local source, choose known source weapon, block unknown second source weapon weight, enter explicit user override, recalc + share-safe result, explicit local save and restore.
- No new paid API/server; Build Planner remains within the existing **five** approved production SEO routes, **not** a blanket unblock for experimental armor/damage/spell pages.
- This is an **implemented bounded Build equipment state**, not completion of master full-feature/data parity issue [#86](https://github.com/garrison2025/Elden-Ring/issues/86). The five-module audit remains the release boundary.
