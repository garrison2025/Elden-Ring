# Direct Tarnished.dev v1.17 +0 AR: 348 new two-read UI numeric comparisons (2026-11-01)

## User-selected acceptance standard

**Only real Tarnished.dev public v1.17 rendered Build Planner** values count as comparator numeric observations. The 348 new distinct weapon configurations in `scripts/tarnished-v117-weight-probe-ar-observations.json` were extracted retrospectively from **two complete independent Chromium page loads each** in previously successful weight audits; the AR is parsed directly from an actual `Total AR : N` displayed field, NOT calculated from weight. Same exact name, active Standard/None affinity, STR/DEX/INT/FAI/ARC, +0, normal one-hand, no buffs, verified both times.

- [12-shard public-site source observations](https://github.com/garrison2025/Elden-Ring/actions/runs/41261521809)
- [4-shard public-site spelling/activation source observations](https://github.com/garrison2025/Elden-Ring/actions/runs/41262468777)
- [Independent pinned-v1.17 total AR calculator comparison, initial 347/348](https://github.com/garrison2025/Elden-Ring/actions/runs/41263263242)

The full independent computation found **347 numerical total AR matches; 1 actual comparator mismatch, Icerind Hatchet**. The inputs were `STR60/DEX60/INT30/FAI30/ARC30`, `None`, +0, one-handed: **competitor 184 AR vs local 183 AR**. Inspecting actual component math from [follow-up diagnostic run](https://github.com/garrison2025/Elden-Ring/actions/runs/41263328489) established `raw physical = 183.99999999999997`. Ordinary `Math.floor` dropped that one-ULP underflow to 183.

## Correctly bounded response to precision discrepancy

Diagnostic output found `raw physical = 183.99999999999997`; a global one-ULP rounding change would make this displayed AR equal 184. **However, after executing the full pinned mathematical audit (39,552 engine/source comparisons), this generalized change produced six new numerical mismatches. It was REVERTED before merge.** The source-math engine remains unchanged and passes the historic audit.

The CI audit explicitly tracks **347 AR matches, one known, still-unresolved Icerind discrepancy and zero source conversion failures**. Any additional mismatch fails the gate. We do **not** declare 348/348 parity, and do not hide the result or hardcode a weapon-wide AR correction based on a single input.

The historical 86 accepted same-input Tarnished.dev v1.17 AR observations remain separately protected by `scripts/audit-v117-pinned.mjs`; all comparisons are version-scoped. An eventual Icerind fix must match the website at multiple inputs **and** preserve the 39,552 independent source-math checks (or document a versioned alternate rounding rule).

### Precise coverage, not premature site acceptance

- New +0 direct public-site AR cases: **348** separately from the historical 86; combinations may overlap, so don't claim a deduplicated 434 without checking IDs/configurations.
- Actual direct v1.17 weapon weight coverage remains **481/487**, with six unobservable cases.
- This proves *total AR for tested inputs*, **not** five-channel +0 base attack, minimum individual attribute requirements, special passive effects, incantation/sorcery, damage against enemies, armor optimization or entire 487-weapon AR space.
- The separate pinned external source feeds calculations; neither the game client nor game files are needed as benchmark. Third-party distribution rights, release/indexing and Cloudflare deployment remain independent gates.
