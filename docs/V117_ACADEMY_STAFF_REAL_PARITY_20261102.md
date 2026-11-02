# Second spell catalyst: Academy Glintstone Staff — actual numerical parity, 2026-11-02

## Direct evidence, not re-auditing earlier spell samples

One selected *new* staff, **Academy Glintstone Staff +25**, paired with **Glintstone Pebble**, has been tested with Wretch original stats 10 except INT 40/50/60/80, no effects, default zero enemy defense and negation, Tarnished.dev public v1.17 reference UI. Two **independent** Chromium jobs read each actual reference value; separate local code used pinned publicly available catalyst/upgrade/curve tables and a documented spell coefficient, without taking the real site's output as the algorithm result.

| INT | Site actual Magic | Independent model Magic | Delta |
|---:|---:|---:|---:|
|40|319|319|0|
|50|368|368|0|
|60|416|416|0|
|80|472|472|0|

**4/4 exact numerical matches in that finite input domain.** Evidence workflow: https://github.com/garrison2025/Elden-Ring/actions/runs/41367503995 ; machine-readable frozen checks: `scripts/tarnished-v117-academy-staff-goldens.json`. The browser and independent comparison artifact are available from this run.

## Product changes and limits

Reference lookups now allow choosing between the original 18 verified Astrologer's Staff cases and these 4 Academy Glintstone Staff cases; the independent calculator labels these 4 cases as numerical site-matches. Unobserved inputs are never looked up or presented as verified. The existing 18 cases are preserved unchanged, and baseline 487 weapon/568 armor data are not touched.

**Not a completed all-spell or all-catalyst certification**: nonzero enemy defenses, other sorceries/seals, further upgrades, weapon passive spell boosts, arbitrary equipment effects, PvP, and real 1.17.3 game-client hits still lack matching inputs/sufficient evidence. Neither the entire Damage Calculator nor Armor Optimizer nor Build Planner is marked complete.
