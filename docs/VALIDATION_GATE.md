# Data/Formula Release Gate | 2026-10-30

## Confirmed
- Official latest patch verified: App 1.17.2 / Regulation 1.17.3, posted 2026-10-20, is bug-fix-only; previous 1.17 added Idus Knight and Heavy Knight and changed gameplay mechanics. Sources: https://en.bandainamcoent.eu/elden-ring/news/elden-ring-patch-notes-version-1172 and https://en.bandainamcoent.eu/elden-ring/news/elden-ring-patch-notes-version-117.
- Bandai Namco advanced stats guide: light below 30%, medium below 70%, heavy below 100%, overloaded 100% and above: https://www.bandainamcoent.com/news/elden-ring-introduction-part-2-advanced-stats.
- Community level cost: floor(((L + 81)^2 * (0.1 + 0.02*max(0,L-11)))+1) from current level L to L+1, 1≤L<713. Checks from https://almanauts.com/eldenring/rune-calculator/ . Test vectors: level 1→2=673, 2→3=689; total from 1→50=262472; 1→100=1997878; 1→125=3984881; 1→150=7112459; 1→200=18253715; 1→713=1692566842.
- Base 10 origins and two new origins cross-checked against https://tarnishedwiki.com/starting-classes/ and https://oggo.gg/guides/elden-ring-starting-classes-explained ; derived invariant sum(stats)=level+79. Not game-client verified.

## Licensing: do NOT bypass
- https://github.com/EldenRingDatabase/erdb  MIT **source code**; machine-extracted game content, images, file contents and commercial republication need separate legal/licence review. Its source last pushed 2024-06-24, so not automatically current for patch 2026.
- https://github.com/DanielKinsner/elden-ring-build-calc  publicly readable but GitHub repo declares **no license**; don't copy its implementation or assets.
- https://github.com/misspia/elden-ring-data  collection of links; **no repo license**. Not a verified dataset or rights clearance.

## Unresolved blockers for full site
1. Choose legitimate, updateable versioned weapons/affinities/reinforcement/armor dataset; establish redistribution policy and provenance. No copyrighted icons/assets without permission.
2. Verify weapon AR against game-screen samples for +0/+25/+10, two-handing, unmet requirements, split damage, affinity and DLC.
3. Damage requires verified damage defense/absorption, motion values, skill-specific rules, enemy data and buffs; no publish until golden results match.
4. Armor optimizer needs verified poise, weights, talisman bonuses and compatibility; performance benchmark on low-end phones.
5. Domain selection, static SEO canonical/sitemap, index gating for only real features, screenshot UI QA, Core Web Vitals and GSC after deployment.

## Gate decision
Base calculation preview: **available for user testing**, NOT production certified. Complete build-site release: **blocked** by game data licence/accuracy tests.
