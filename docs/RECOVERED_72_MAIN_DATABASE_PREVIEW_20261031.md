# Recovered 72 source-only +0 values integrated in the main weapon database

## Practical UX change

The normal \`/weapon-database/\` page now **shows** 72 previously separate source candidates directly next to each selected weapon, with original Eldenpedia and Tarnished.app field values, optional named third source, precise unknown-value notation, and explicit unresolved conflicts.

- **487 canonical weapon identities** remain unchanged; **72** base-game source-only rows remain \`requirements-only\` with null \`attack\`, \`weight\`, \`critical\`, \`scaling\`.
- For those 72 identities, on selection the main browser loads the **separate 72-row provenance ledger**, validates every record against the canonical 487-row catalog, and displays source-only +0 attack, weight, critical, STR/DEX/INT/FAI/ARC scaling, and discrepancies.
- **126** scaling cells have no explicit original wiki.gg letter, and no explicit secondary Tarnished.app scaling row. These are shown as \`NOT REPORTED\`, **not as \`-\`** (which would claim proven absence of scaling).
- Dragonclaw Shield's missing secondary Lightning attack line is shown as \`NOT REPORTED\`, **not \`0\`**.
- 8 weapon groups / 9 field disagreements are labelled \`SOURCE CONFLICT\`; all third-source links are accessible and **none** grants client verification.
- Rendering uses \`textContent\`, DOM-created anchor elements, strictly same-origin JSON, with no API or image assets. Failure of secondary source load degrades to a review link rather than breaking the main weapon list.

## Critical guardrail

Preview-only +0 published facts are **not** used to compute actual AR, smithing upgrades, filtered damage/weight search, carry load or weapon comparisons. Those pathways continue reading the unchanged canonical catalog and will show unknown or blocked outcomes. Real current patch requires a genuine App 1.17.2 / Regulation 1.17.3 screenshot and independent review.

## QA

The new pure \`buildRecoveredWeaponPreview\` model and tests assert 72/72 identity alignment, no mutation, 126 unknown cell preservation, exact original +0 versus alternative source conflicts, no forged zero for absent lines, and non-approval status.
