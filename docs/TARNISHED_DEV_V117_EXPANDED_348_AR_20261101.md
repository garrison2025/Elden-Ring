# Direct Tarnished.dev v1.17 +0 AR: 348 new two-read UI numeric comparisons (2026-11-01)

## User-selected acceptance standard

**Only real Tarnished.dev public v1.17 rendered Build Planner** values count as comparator numeric observations. The 348 new distinct weapon configurations in `scripts/tarnished-v117-weight-probe-ar-observations.json` were extracted retrospectively from **two complete independent Chromium page loads each** in previously successful weight audits; the AR is parsed directly from an actual `Total AR : N` displayed field, NOT calculated from weight. Same exact name, active Standard/None affinity, STR/DEX/INT/FAI/ARC, +0, normal one-hand, no buffs, verified both times.

- [12-shard public-site source observations](https://github.com/garrison2025/Elden-Ring/actions/runs/41261521809)
- [4-shard public-site spelling/activation source observations](https://github.com/garrison2025/Elden-Ring/actions/runs/41262468777)
- [Independent pinned-v1.17 total AR calculator comparison, initial 347/348](https://github.com/garrison2025/Elden-Ring/actions/runs/41263263242)

The initial independent computation found **347 numerical total AR matches; 1 actual comparator mismatch, Icerind Hatchet**. The inputs were `STR60/DEX60/INT30/FAI30/ARC30`, `None`, +0, one-handed: **competitor 184 AR vs local 183 AR**. Inspecting actual component math from [follow-up diagnostic run](https://github.com/garrison2025/Elden-Ring/actions/runs/41263328489) established `raw physical = 183.99999999999997`. Ordinary `Math.floor` dropped that one-ULP underflow to 183.

## Implementation correction and independent regression

`public/src/weapon-ar.mjs` uses a carefully bounded *one machine-epsilon relative* integer-boundary guard, not general numerical rounding or an ad hoc per-weapon hardcode. It only corrects results indistinguishable from the exact integer at floating-point machine precision. This resolves the real **183.99999999999997 → 184** numerical comparison without rounding ordinary fractional AR values.

Independent tests then require **348/348 same-input AR matches, zero outstanding numerical differences and zero source-variant conversion blockers**. The workflow also runs `scripts/audit-v117-pinned.mjs` to protect earlier **86 accepted public website v1.17 AR observations over 48 different weapon names**. The archived exact-input comparison is separate from the previous 86, and no unverified data was promoted.

### Precise coverage, not premature site acceptance

- New +0 direct public-site AR cases: **348** separately from the historical 86; combinations may overlap, so don't claim a deduplicated 434 without checking IDs/configurations.
- Actual direct v1.17 weapon weight coverage remains **481/487**, with six unobservable cases.
- This proves *total AR for tested inputs*, **not** five-channel +0 base attack, minimum individual attribute requirements, special passive effects, incantation/sorcery, damage against enemies, armor optimization or entire 487-weapon AR space.
- The separate pinned external source feeds calculations; neither the game client nor game files are needed as benchmark. Third-party distribution rights, release/indexing and Cloudflare deployment remain independent gates.
