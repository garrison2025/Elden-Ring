# Build Planner → weapon reference handoff (2026-10-30)

This change adds an **optional** local source-reported weapon reference to the existing eight-attribute Build Planner. The static weapon catalog stays at **409 total named weapon/shield rows, 102 DLC; 21 sourced +0 DLC facts, 52 requirements-only, 29 names-only; 4 source-published somber base attack progressions**.

## Product contract

- Two separate **opt-in switches**: Tarnished Pack permits **Idus Knight and Heavy Knight starting classes**; Shadow of the Erdtree permits its catalog weapon selections. Neither toggle unlocks paid game content. Both are off by default.
- Search up to 35 weapon matches at once; selected weapon remains visible during filtering and is bound by its catalog ID, never title text. The repository has no runtime-paid API.
- For selected weapon display: weapon name and class, known single-weapon weight (or UNKNOWN), one-/two-hand attribute requirement checks (or UNKNOWN), and a prominent AR disclaimer. This must **never** be called total equipped weight, player AR, damage, affinity result or current-regulation verified profile.
- Build → Weapon Database carries origin, eight attributes, selected weapon ID, and separate extra-content switches. Weapon Database → Build Planner carries those validated-shape fields back, preserving context. A DLC weapon-only link with no SOTE flag remains pending until the user explicitly enables SOTE references; it is neither silently enabled nor discarded. Values are validated against the local catalog (not blindly trusted).
- Optional URL state: `origin`, `stats`, `weapon`, `tarnished=1`, `sote=1`. Defaults are base-only. DLC weapon URLs without explicit SOTE choice are rejected, not silently enabled. Shared URLs do not create indexable build variants.
- Local save schema v2: `{version:2,origin,stats,weaponId,ownsTarnishedPack,ownsSote}` under the preexisting key. Base-origin version 1 legacy drafts can be restored without weapon state; legacy extra-origin drafts require explicit user recreation rather than silently enabling content.
- A broken/removed weapon ID does not break the character build, and no replacement weapon is substituted.
- Any failure to fetch/validate the local catalog disables only the optional reference UI, not the core eight-attribute calculator.

## Release gate

The source-reported numbers are not validated for current game regulation, so this is an explicitly labeled *reference preview* within the preexisting planner and not proof of finished AR/Equip Load functionality. Do not claim full inventory load, precise attack rating or equipment simulation. Existing weapon database and AR research noindex gates remain unchanged.

Test plan: exact reference facts, unknown-as-null, entitlement separation, invalid URL IDs, stored draft migration, selected option preservation, cross-tool URLs, and CI build. Real device/E2E and game-version golden sample checks remain separate release blockers.

### Current DLC snapshot (later 2026-10-30)

43 individual per-weapon +0 profiles, 59 attributed requirements+individual-weight profiles, 0 names-only; every DLC record has reported weight and requirements. **Reported single-weapon weight is not game-patch-verified and does not mean total equipped load.** Full AR and infusion remain unavailable.

**Later completion milestone:** 101/102 DLC community +0 attacks sourced (68 individual wiki weapon pages, 33 class comparison rows), 102/102 attributed requirements and weights. Stone-Sheathed Sword intentionally remains unknown. Three '?' grade letters prevent fake precision; precise AR remains 0 game-golden-verified profiles.
