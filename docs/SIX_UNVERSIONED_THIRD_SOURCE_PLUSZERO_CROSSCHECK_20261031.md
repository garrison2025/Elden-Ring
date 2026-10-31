# Six disputed +0 weapon readings — third public Base-column reconciliation

Date: **2026-10-31**. Status: **public-source corroborated, NOT game-client verified**.

## Scope

Existing catalog: **416** distinct named armament references, of which **7** have historical pinned Regulation 1.17 versus community source disagreements: **6 +0 attacks** and **1 attribute requirement** (Madding Hand). This audit does **not** increase the weapon count or rewrite original source values.

The six weapons have an additional individually named public page on **tarnished.app**. Each page explicitly has a **Base** attack column that is separate from its **Tier +10/+25** attack. Every Base vector is the same as the existing pinned public Regulation 1.17 source.

### Exact source-by-source numeric comparison (PHY / MAG / FIRE / LGT / HOLY)

| Weapon | Previously attributed community +0 | Pinned public Regulation 1.17 +0 | Third public Base +0 | Third public page |
|---|---|---|---|---|
| Fire Knight's Shortsword | 75 / 0 / 32 / 0 / 0 | 75 / 0 / 22 / 0 / 0 | 75 / 0 / 22 / 0 / 0 | https://tarnished.app/weapons/fire-knight-s-shortsword |
| Greatsword of Radahn (Light) | 129 / 83 / 0 / 0 / 0 | 127 / 82 / 0 / 0 / 0 | 127 / 82 / 0 / 0 / 0 | https://tarnished.app/weapons/greatsword-of-radahn--light- |
| Greatsword of Radahn (Lord) | 129 / 83 / 0 / 0 / 0 | 127 / 82 / 0 / 0 / 0 | 127 / 82 / 0 / 0 / 0 | https://tarnished.app/weapons/greatsword-of-radahn--lord- |
| Queelign's Greatsword | 117 / 0 / 35 / 0 / 0 | 122 / 0 / 36 / 0 / 0 | 122 / 0 / 36 / 0 / 0 | https://tarnished.app/weapons/queelign-s-greatsword |
| Smithscript Axe | 133 / 0 / 0 / 0 / 0 | 131 / 0 / 0 / 0 / 0 | 131 / 0 / 0 / 0 / 0 | https://tarnished.app/weapons/smithscript-axe |
| Smithscript Dagger | 67 / 0 / 0 / 0 / 0 | 62 / 0 / 0 / 0 / 0 | 62 / 0 / 0 / 0 / 0 | https://tarnished.app/weapons/smithscript-dagger |

### What this proves — and does not

- **Proven from public pages:** All six third-party displayed **Base** rows support the existing pinned Regulation 1.17 **unupgraded** values, not the conflicting legacy wiki +0 rows.
- **Not proven:** The third site does not explicitly label each weapon page as App 1.17.2 / Regulation 1.17.3; its data extraction independence from the pinned source has not been demonstrated. Two agreeing websites may share the same underlying data. This is **published-source corroboration, not a pair of independent in-game observations**.
- **Not inferred:** Tier +10/+25, scaling coefficients, infusion, weapon damage against enemies, character Attack Rating (AR), and actual equipped state.
- **Not changed:** The historical six source conflict flags, original wiki values, original pinned values, Fire Knight's Shortsword's separate wiki-internal Standard +0 contradiction, and all zero current game-client accepted screenshots.
- **Separate evidence:** Madding Hand's FAI **20** has a **Regulation 1.17.3-labelled secondary** parameter corroboration, unlike the six third-party Base pages, which are **unversioned**. FAI **13** remains the original conflicting community reading and automatic wield checks remain blocked.

### What the website now does

- Each six weapon records includes `thirdPartyBasePlusZero`: exact source URL and Base numeric vector, an explicit not-declared patch, unproven lineage, and `gameClientVerified:false`.
- Each corresponding row of `public/data/weapon-conflict-evidence.json` contains the same third-party observation; the build refuses discrepancies or forged game-verified claims across both files.
- The weapon detail shows original community +0 readings as **disputed** and displays the pinned-matching third-party candidate **separately with a source link and qualification**; it does not silently replace the original.
- The accuracy dossier shows all seven historical disputes and the six provisional cross-checks. It distinguishes these unversioned checks from the single current-version-labelled Madding Hand secondary-source match.
- `baseDamageParts` and published upgrade calculations remain **null** for source-disputed attack rows. The site still ships research `noindex` with no paid API or extracted game assets.

## Remaining steps to move from provisional evidence to verified gameplay

1. Capture each exact **uninfused/default +0 weapon menu** in the target game with App/Regulation shown on title screen, name and weapon type unambiguous, and platform/date logged.
2. Independently inspect screenshots, ensure source ownership/use rights and cross-check each of five visible attack components. A filename or SHA-256 does **not** validate a screenshot's pixels or authenticity.
3. Only with explicit reviewed evidence can a separate change select a source as **game verified**, update data and remove a relevant conflict flag. Reviewers must also decide whether the wiki-internal Fire Knight contradiction is a table version mismatch.
4. Create separate AR goldens with **character attributes, reinforcement, affinity, grip, game version and screenshot**, rather than mislabelling raw +0 attack rows as finished AR.

All three dimensions remain separate: **historical published-source disagreements = 7; six provisional unversioned base source matches = 6; accepted game-client AR goldens = 0**.
