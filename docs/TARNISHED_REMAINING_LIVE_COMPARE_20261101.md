# Tarnished.dev remaining numerical parity — narrow live browser audit (2026-11-01)

This is NOT a repeat of prior 568-item armor field verification, earlier 15 AR goldens, build level, or the Icerind Hatchet correction.

Read-only Chromium collects current public controls and captures a genuine Calculate click on Tarnished.dev's armor optimizer. Also reads public controls of both armor optimizers and both damage calculators. It does not claim same-input numeric parity unless the observed input state, calculations and exact output values match and are captured. Missing/unreadable results remain UNVERIFIED.

The first pass is deliberately a UI discovery run, not a verification success. Further target checks must explicitly fix exact stats, equipped items, roll limit, 13 metric minima/maxima/multipliers and source version before comparison. Do not normalize differing algorithm semantics silently.

Scripts: `scripts/probe-tarnished-remaining-live-ui.mjs`; workflow `.github/workflows/tarnished-remaining-live-ui.yml`. Evidence is uploaded as an artifact and intentionally not added as copied third-party data to site production.
