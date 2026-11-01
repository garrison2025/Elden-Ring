# Tarnished.dev remaining numerical parity — narrow live browser audit (2026-11-01)

This is NOT a repeat of prior 568-item armor field verification, earlier 15 AR goldens, build level, or the Icerind Hatchet correction.

Read-only Chromium collects current public controls and captures a genuine Calculate click on Tarnished.dev's armor optimizer. Also reads public controls of both armor optimizers and both damage calculators. It does not claim same-input numeric parity unless the observed input state, calculations and exact output values match and are captured. Missing/unreadable results remain UNVERIFIED.

The first pass is deliberately a UI discovery run, not a verification success. Further target checks must explicitly fix exact stats, equipped items, roll limit, 13 metric minima/maxima/multipliers and source version before comparison. Do not normalize differing algorithm semantics silently.

Scripts: `scripts/probe-tarnished-remaining-live-ui.mjs`; workflow `.github/workflows/tarnished-remaining-live-ui.yml`. Evidence is uploaded as an artifact and intentionally not added as copied third-party data to site production.

## Actual browser findings — test run 41278618195
- Public Tarnished.dev v1.17: unbuffed Wretch 10/10/10/10/10/10/10/10, equipment weight 0, max equip load 48.176, Normal rolls (remaining 33.72). Inputs: 13 minimums=0, 13 default maxima finite, 13 multipliers default 1; 12 multipliers changed to 0 for Poise-only attempt. A trusted browser mouse event reached 'Calculate Best Armor', but no numeric result was visible after 15s. Therefore reference optimization remains **NOT OBSERVED**.
- Local production /armor-optimizer/: explicitly loaded 568 community items; site-verified Poise subset 549; same Wretch equip-load cap supplied manually as 48.176, reserved 0, Normal tier, Poise-only optimization, min Poise 0; Worker returned Poise 68 at weight 33.200. Four items: Head Omensmirk Mask (3.0/6); Chest Tree Sentinel Armor (18.9/39); Arms Godskin Noble Bracelets (1.7/3); Legs Crucible Greaves (9.6/20). This is an observed **local-only optimum**, NOT a verified cross-site match.
- Important eligibility mismatch remains: local 'site verified' excludes 19 unverified source candidates; public Tarnished.dev may use different eligibility and stacking rules. Never falsely report numerical equivalence.
- The next browser run isolates only unresolved Tarnished Armor Optimize response, waits up to 150s without rerunning previously accepted site source audits or re-testing local result.
