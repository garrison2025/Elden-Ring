# Current Regulation 1.17.3 conflict verification path (2026-10-31)

## Why this is a data advance, not a seventh website citation

The previous seven-case audit has six unversioned third-party Base rows that match pinned Regulation **1.17**, plus one **Regulation 1.17.3-labelled** requirement source for Madding Hand. To check whether source versions can explain historical disagreements we inspected actual version-difference coverage:

1. [Almanauts complete regulation patch history](https://almanauts.com/eldenring/patches/) explicitly reports **1.17 → 1.17.1:** all **184 parameter tables hash-identical**.
2. [Almanauts App 1.17.2 / Regulation 1.17.3 diff](https://almanauts.com/eldenring/patches/1-17-3/) reports **1.17.1 → 1.17.3:** **no changes to the headline weapon, requirement, armor or other numbers it tracks**, but **Piquebone Arrow projectile/bullet behavior and Repeating Crossbow animation/event changes do occur**.
3. This is a **patch-lineage corroboration for tracked fields**. Do NOT claim that the entire regulation binary is hash-identical in 1.17.3, or that the tracker proves the exact `+0` five-component figure of each weapon. Upstream site data lineage and coverage should be checked separately.
4. The official patch notes are relevant for version identification and developer intent, but are not a published complete weapons param dump.

This narrows the likelihood of six Base-vector differences being caused by an *intervening documented change to tracked weapon attack stats*. It does **not** replace exact per-weapon readings or original game evidence.

## New functional improvement: user-supplied seven-case source comparator

Open `/validation-status/#reg-seven-audit` in the deployed research site.

- Supply a `*.json` **compact regulation object** already lawfully obtained, with `weapons` and `reinforceTypes`. The existing `/weapon-data-workbench/` page uses the same family of JSON. The form **does not import raw `regulation.bin`, Smithbox CSV or executable JavaScript**.
- Provide the source's App version, Regulation version and honest origin. These fields are **self-declared**; do not type `1.17.3` for an older file to pretend it is newer.
- The browser verifies the file's SHA-256 bytes **only as a fingerprint**, not proof of authenticity. Parsing and the seven-case comparisons run locally in a browser Worker. No source file is sent to a service, committed to GitHub, or stored on a server.
- Only **unique neutral/default affinity** matching named weapon rows are used; ambiguous, absent or incomplete source rows are explicitly surfaced.
- For the **six attack cases**, the code applies the *source file's own +0 reinforcement multiplier* to its raw five damage components; it never confuses max-upgrade attack with +0. For **Madding Hand** it reads the five requirement components. No scaling, character AR, poise, DPS, affinity assumptions or source data are inferred.
- The seven per-weapon rows show **original community**, **pinned 1.17**, **selected local source** and their matches/differences. Users can download a compact `UNREVIEWED` JSON report containing only seven source values and the input file fingerprint — never the full imported regulation data.
- Source-version authenticity, extraction lineage, screenshot pixels, copyright and license status are **not independently verified** by this tool. It **never** changes any weapon fact or removes original review flags.

## What remains to finish the original data question

A genuinely traceable current Regulation **1.17.3** compact parameter export from an authorized source plus an independently reviewed original game-client **+0 details screen** are still needed to mark the seven historical source differences as game verified. The model cannot run the commercial game client or manufacture source screenshots. A local JSON import with a claimed current patch is **not enough by itself**. Exact character AR goldens are separately needed for any real AR release; `0` are approved now.

This keeps the core goals measurable: seven specific local table matches, seven independently reviewed weapon-menu screenshots, and separate AR scenario goldens — instead of simply accumulating other websites repeating the same values.

The research site's `noindex` gate remains unchanged; no paid APIs, server storage, proprietary game assets, login, or copied extracted game tables were introduced.
