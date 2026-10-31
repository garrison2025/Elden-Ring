# 72 recovered armaments — second-source +0 comparison (2026-10-31)

## Completed (public-source audit, not original game)

- Live research review: \`/weapon-source-review/\`. Cloudflare Pages URL \`https://elden-ring-5i9.pages.dev/weapon-source-review/\` returned a successful public page in independent recheck.
- **72/72** original Eldenpedia wiki +0 source rows and **72/72** independent Tarnished.app per-weapon published pages read and compared separately (Tarnished.app is not Tarnished.dev).
- All 72 now have candidate +0 attack/weight/critical and a secondary full list of explicitly *reported* scaling grades.
- **126 unknown source-table scaling cells** remain after using Tarnished.app's explicit Strength E reading to replace Perfumer's Shield STR \`?\` in the separate research ledger. Absence of another scaling row in a published table is NOT conclusive proof of \`-\`.
- **0 independently reviewed screenshots, 0 game-certified weapons, 0 precise current-patch AR weapons**. All 72 entries in the canonical calculator catalog still have null attack, critical, scaling and weight, preserving the safety gate.

## Newly detected source conflicts (8 weapon groups)

| Item | Field | Wiki +0 source | Tarnished.app published Base | Status |
|---|---|---|---|---|
| Buckler | Physical | 60 | 68 | CONFLICT |
| Buckler | Dexterity scaling | - | D | CONFLICT |
| Carian Knight's Shield | Magic attack | 63 | 40 | CONFLICT |
| Dragonclaw Shield | Lightning attack | 76 | 0 (not present in reported Attack) | CONFLICT; do not equate omission with proof |
| Fingerprint Stone Shield | Physical | 158 | 139 | CONFLICT |
| Golden Greatshield | Physical | 100 | 113 | CONFLICT |
| Erdtree Greatshield | Strength scaling | C | D | CONFLICT |
| Inseparable Sword | Faith scaling | C | D | CONFLICT |
| Visage Shield | Strength requirement | 24 (wiki category + individual page) | 44 (pinned v1.17 / other secondary sources) | CONFLICT; original pinned requirement remains |

**8 unique disputed weapon groups**, involving **5 attack vectors, 3 scaling fields and 1 requirements field**. No version-specific current-game decision has been made. Reference data is separate from calculation-safe data.

The two source systems may differ in rounding. Tarnished.app sometimes displays fractional base values (e.g. 136.8 vs Eldenpedia 136), so a strict integer equality test would create spurious conflicts. The public-source comparison uses a tolerance of 1.01 **only to classify likely meaningful mismatches**; it is not an official arithmetic accuracy standard.

## Additional evidence clarification

- The initial source fetch for **Gravel Stone Seal** shows a named weapon wiki infobox with +0 values, not a readable individual upgrade-table row. Its provenance is now explicitly \`wiki-individual-weapon-infobox-plus-zero\`. A named ESO-UI page independently reports physical 25, weight 1.5, critical 100, STR E and FAI C. Not game verified.
- The **Perfumer's Shield** wiki category row does not explicitly publish initial STR scaling. A named Tarnished.app page shows STR E. The source ledger records STR E with that exact per-field URL, while all current-game certification flags remain false.
- The live website at \`https://www.tarnished.dev/\` says it updated to 1.17. It is a feature/patch-version research reference only; **this audit's 72 individual secondary source pages belong to Tarnished.app**. Do not conflate the two hosts.

## Remaining actual-game QA

Target title screen **App Ver. 1.17.2 / Regulation Ver. 1.17.3** according to official Bandai Namco October 20, 2026 patch notes. For the 8 newly flagged groups plus the existing seven DLC disputes, Stone-Sheathed Sword (attack/weight), and Ritual Thrusting Shield (weight/requirements), collect original game screenshots of the exact +0/default item-detail menu and title/version screen. An independent reviewer must compare the screenshots and classify every field. A hash of an image or the published site's "Base" column cannot certify the game client. Current verified count remains ZERO.

## Source references

- https://en.bandainamcoent.eu/elden-ring/news/elden-ring-patch-notes-version-1172
- https://www.tarnished.dev/
- https://tarnished.app/weapons/buckler
- https://tarnished.app/weapons/carian-knight-s-shield
- https://tarnished.app/weapons/dragonclaw-shield
- https://tarnished.app/weapons/fingerprint-stone-shield
- https://tarnished.app/weapons/golden-greatshield
- https://tarnished.app/weapons/erdtree-greatshield
- https://tarnished.app/weapons/inseparable-sword
- https://eldenring.wiki.gg/wiki/Small_Shields
- https://eldenring.wiki.gg/wiki/Medium_Shields
- https://eldenring.wiki.gg/wiki/Greatshields
- https://wiki.eso-ui.com/index.php/Elden_Ring%3AGravel_Stone_Seal
