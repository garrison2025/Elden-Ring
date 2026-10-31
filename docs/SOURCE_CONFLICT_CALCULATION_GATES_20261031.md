# Calculation-entry source reliability gates — 2026-10-31

## Scope and unchanged audit baseline

- 408 bundled **community reference records**, NOT 408 game-verified records.
- Seven unresolved cross-source discrepancies: **six +0 attack rows**, plus **Madding Hand Faith requirement 13 versus 20**.
- Accepted independent App 1.17.2 / Regulation 1.17.3 game-client screenshot goldens: **0**.
- This change does not choose between sources, edit any reported source number, alter seven-case evidence, or authorize indexing.
- See `docs/SEVEN_WEAPON_SOURCE_CONFLICTS_20261031.md` and the machine-readable `public/data/weapon-conflict-evidence.json`.

## Never merge attribution and calculation

| Entry point | Source disagreement | Contract | Current audited cases |
| --- | --- | --- | --- |
| Community +0 base attack | `v117-community-attack-conflict` | `reportedBaseDamageParts()` returns labelled, attributed source readings for display. `baseDamageParts()` returns **null**, not attack numbers, for missing or disputed attack. | Six source attack conflicts + Stone-Sheathed Sword missing attack |
| Published +0..+10 base progression | If its underlying +0 attack becomes disputed | `publishedUpgradeParts()` returns **null** for a dispute, even if the reference has all eleven rows. Do not interpolate or use an older progression to override a new dispute. | Six published upgrade reference rows remain source-only; no new conflict asserted for them |
| Requirement comparison | `v117-community-requirement-conflict` | Wieldability, minimum shortfall, URL numeric requirement handoff remain unavailable. Attributed community requirement numbers may still appear with **DISPUTED** labels. | Madding Hand |
| Equipped weight and load tier | Future `v117-community-weight-conflict` (currently **zero** such flagged rows) | Weight is **null** in Build inspection, excluded from equipment totals; complete load, percentage, roll tier and A/B deltas require non-disputed known weights. A user checkbox cannot override unresolved source disagreement. | Preventive regression gate; does **not** invent an eighth dispute |
| Weapon catalogue weight filter/sort | Future disputed weight | Disputed values are excluded from max-weight filters and sorted as unknown, not ranked by a false number. Compare table marks the community figure **DISPUTED**. | Preventive regression gate |
| Level/rune, class origin and manual equipment-input calculations | No newly established source dispute in this patch | Keep prior source/assumption warnings. Local arithmetic tests are not equivalent to independent game-client validation. | No new game-client goldens |

`null` means **unavailable for authoritative numerical use**. A UI may display a disputed community reading only when it is explicitly labelled and attributed to its source; it must not then feed that reading back into an eligibility verdict, rank, load total, or AR prediction.

## Independent game-client verification: still required

1. Record the title screen showing exact **App** and **Regulation** versions (reference target: 1.17.2 and 1.17.3), platform, and capture date; retain the original image locally.
2. For six attack conflicts, display the exact named weapon at **+0/default infusion** and transcribe the weapon-details **five base attack categories**, not status-screen AR. For Madding Hand, capture all five unmodified requirements.
3. Use `/validation-status/#conflict-capture` to save an **UNREVIEWED** seven-case local JSON draft and local screenshot fingerprints. The workflow does not upload original screenshots and cannot authenticate images.
4. Recheck original file SHA-256 in `/validation-status/#conflict-evidence-recheck`. Matching bytes alone do not verify image content.
5. A separate reviewer examines originals, weapon identity, enhancement/infusion state, capture version, original numeric fields, source rights and the exact code/data revision. An approved sample must have a reviewer record and reproducible result; never auto-promote an imported draft.
6. Only a subsequent reviewed change may modify a specific source flag and its numeric record, update the evidence ledger, and add a game-client golden fixture. A matching community wiki or regulation-derived third-party site is **not** an accepted game-client screenshot.
7. Keep research pages `noindex`, do not advertise exact player AR or damage, and do not label a source audit as gameplay validation while evidence is pending.

## Regression / deployment checks

`tests/source-conflict-boundaries.test.mjs` checks the current six source-attack conflicts, attributed-display versus numeric-gate isolation, hypothetical conflicts in already-published upgrade rows, and simulated future weight disputes traversing Build, equipment total, A/B comparison and catalogue. Synthetic flags used by tests are **not** committed to the actual 408-record JSON. Existing dossier checks still require exactly seven current conflicts and zero independent in-game approvals.

This is an accuracy **fail-closed code change**, not an external game data acquisition, an additional confirmed sample, or a rights/licensing determination.
