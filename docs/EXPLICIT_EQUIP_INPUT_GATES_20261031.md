# Equip load: explicit input and slot-state trust gates (2026-10-31)

## Problem and resolution

A missing JavaScript field is not proof the player has **zero** equipment weight, and an omitted equipment slot is not proof it is **Empty**. Before this patch, the public, standalone load calculator prefilled 43.2 / 75.0 and displayed a result without any player action. The core `loadTier` function also converted `''` and `null` to 0 via `Number()`. The equipped-gear planner treated missing object properties as empty slots, although the UI itself passed all fourteen fields.

This is a **data-integrity and presentation** fix, not a claim of new game validation.

| Boundary | Accepted | Rejected / unavailable |
|---|---|---|
| Simple load weight | Explicit finite decimal, including 0 | Missing, empty, whitespace, null, bool, object, scientific/hex string |
| Maximum load | Explicit finite positive decimal | Missing, empty, 0, malformed |
| Six equipped weapon slots | Exact ID of a catalog weapon or explicit empty string | Missing property, null, absent catalog ID |
| Eight manual armor/talisman slots | Explicit `{mode:'empty'}` or `{mode:'equipped',weight:...}` | Missing property, null, invalid mode |
| Equipped manual weight | Actual number entered by player, including explicit 0 | Empty weight blocks complete total / roll tier |
| Source-disputed or absent weapon weight | May show a labelled source subtotal | No complete equipped total, exact delta, or roll tier |
| First page load | All input fields initially blank, neutral request to enter game values | No prefilled pseudo-player tier |
| Valid URL handoff | Decimal fields from a bounded, explicitly supplied query | No arbitrary automatic default |

**Validation:** `tests/equip-input-provenance.test.mjs` covers omission/null across all 14 slots, explicit zero versus UNKNOWN, zero/30/70/100 threshold behavior, community counts, and static page/client boundaries. Existing tests also cover source-weight disputes, saved snapshots and A/B comparisons. GitHub CI must pass `npm run check` and desktop/mobile browser smoke.

## Provenance is unchanged

- Community weapon rows: **408**.
- Recorded unresolved source disagreements: **7**, not silently adjudicated.
- Independently reviewed current-game capture goldens: **0**.
- The weight totals rely on user-confirmed slots and community-reference weapon weights; they are not game-client goldens.
- No licensed artwork, copyrighted screenshots, paid services, cloud storage, or game parameter exports added.
- See `docs/SOURCE_CONFLICT_CALCULATION_GATES_20261031.md` and issue #47 for the separate real-game evidence backlog.

## Next independent verification

Obtain original in-game equipment/status captures with title App / Regulation version, loadout, and maximum load visible where possible; independently review the exact 30%, 70%, and 100% threshold cases and compare displayed load tier to this implementation. This document records **no** such approved captures.
