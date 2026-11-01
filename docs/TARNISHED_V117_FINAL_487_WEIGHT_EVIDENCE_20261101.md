# Tarnished.dev public v1.17 — final six weapon weights verified (2026-11-01)

**The weight field is now directly observed in two separate real Chromium browser runs for all 487 distinct weapons** in our fixed 487-name catalog.

[GitHub Actions double-read evidence (run 41269590190)](https://github.com/garrison2025/Elden-Ring/actions/runs/41269590190).

## Correct zero-weight acceptance gate

Previous comparator code required `actual > 0` to approve an equipped weapon. This incorrectly rejected genuine **zero-weight** items. The new targeted test validates, in each fully independent Chromium run:

- Actual Wretch site v1.17, five player stats 99, +0, one-hand, no buff toggles
- **Empty load = 0**, known active Longsword **load = 3.5**, equip-cap unchanged at **48.2** throughout
- Exact target item name and affinity selected and displayed, and Equip Load read from the actual rendered DOM
- A target with load **0** may be accepted *only after* the positive and baseline controls verify the readout genuinely updates
- Independent pass two agrees with pass one for every weapon

| Name in local catalog | Actual site name | Weight | Two reads |
|---|---|---:|---|
| Cipher Pata | Cipher Pata | 0 | matched |
| Dragon Communion Seal | Dragon Communion Seal | 0 | matched |
| Erdtree Seal | Erdtree Seal | 0 | matched |
| Frenzied Flame Seal | Frenzied Flame Seal | 0 | matched |
| Golden Order Seal | Golden Order Seal | 0 | matched |
| Great Épée | **Great epee** | **6.5** | matched |

Previously: **481/487**. This direct public v1.17 benchmark: **487/487**.

## Product implementation and traceability

The prior `TARNISHED_V117_DIRECT_WEIGHT_EVIDENCE` remains a **frozen historic 481-record shard**, so all historical batch selection and fixtures still reproduce. The new distinct six rows are exposed as `TARNISHED_V117_FINAL_SIX_WEIGHT_EVIDENCE`, and the complete user-facing read path now uses `TARNISHED_V117_ALL_DIRECT_WEIGHT_EVIDENCE` (487) with zero allowed. The unified `getTarnishedV117DirectWeight` returns the real two-read evidence for all 487 items without overwriting historical community source values.

Permanent frozen six-item proof summary: `scripts/tarnished-v117-final-six-weights.json`. Full raw browser reports and both positive controls are stored as run artifacts.

**Scope:** weights only, comparator v1.17 only; no game-client certification, no third-party data redistribution approval, and no automatic passage of the build, spells, enemy-damage, all weapon AR/affinity/upgrade or SEO `noindex` gates.
