# Tarnished.dev public v1.17 — 47 high-requirement gaps follow-up (2026-11-01)

## Actual repeated public-browser comparison

[GitHub Actions 6-shard evidence, two separate Chromium reads for each](https://github.com/garrison2025/Elden-Ring/actions/runs/41266993579).

This batch **does not** rerun the entire 487-name catalog. It selects 47 previously NOT_OBSERVED weapons which had no prior directly read AR evidence and have a historical community requirement exceeding the valid Wretch 10-point baseline on at least one STR/DEX/INT/FAI/ARC field.

| Shard | Selected | Site Req repeated twice | Equal to pinned v1.17 | Still missing |
|---|---:|---:|---:|---:|
| 0 | 7 | 6 | 6 | 1 |
| 1 | 8 | 8 | 8 | 0 |
| 2 | 8 | 8 | 8 | 0 |
| 3 | 8 | 8 | 8 | 0 |
| 4 | 8 | 8 | 8 | 0 |
| 5 | 8 | 8 | 8 | 0 |
| **Total** | **47** | **46** | **46** | **1** |

Public-site inputs checked in both passes: v1.17, exact active weapon name and Standard/None affinity, actual Wretch five stats 10 each, +0, one-hand and no active Rune/Physick. Values originate in **rendered `Req:` five-tuples**, not a wiki or inferred AR. The numerical reconciliation produced **zero disagreements with pinned-v1.17 effective values** and **zero differences from original community requirements among these 46**.

## Updated direct Req field coverage

- Original #109: **357/487**, 130 remaining not directly observed
- #111: **+20**, reaching 377/487
- This #112: **+46**, reaching **423/487 (86.9%)**
- Still not directly observed: **64/487**. Do not call them individually validated even if the pinned source supplies parameters.

All new 47 outcome records (including the missing one) are independently traceable in `scripts/tarnished-v117-direct-req-high-gap-recovery-47.json`. The 357 and 20 previous direct observations remain unchanged.

### Still missing among this batch

**Great Épée** was never an exact, active selected item with visible `Req:` under the attempted public URL spellings/affinities and Wretch stats in both runs. Keep `NOT_OBSERVED`; its old and pinned requirements are not proof of a public UI read.

## Subsequent work (not a claim of completion)

- Of 64 remaining, at least 27 have already been explicitly recorded as `REQ_NOT_EXPOSED_AT_WRETCH10`. Based on existing original-class initial attributes, around 23 may reveal `Req:` when a valid lower-stat origin is actually selected. That is a *test hypothesis*, not verified site output.
- Other low-stat selection failures and prior AR-observed `Serpent-hunter` / `Steel-wire Torch` still require direct public UI evidence or a clear `NOT_OBSERVED` status.
- AR total precision discrepancy (Icerind Hatchet 183 local vs 184 direct site), 6 unobserved item weights, component base attacks, actual enemy damage, and armor/spell/build effects remain separate; no production `noindex` or licensing gate changes are authorized by this Req comparison.
