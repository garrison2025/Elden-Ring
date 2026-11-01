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

## Unresolved external output after 150 seconds — run 41278766344

A verified trusted Chrome mouse click was received by Tarnished.dev's actual 'Calculate Best Armor' control (browser captured `trusted: true`, button label). The 12 non-Poise multipliers were set to 0, Poise multiplier 1, default 13 minima and maxima otherwise unchanged. After **25 six-second observations (150 seconds)**, the site produced **no visible armor result**; button was enabled and the current equipment weight remained 0. Therefore the reference numerical result is **UNOBSERVED**, not 0, not 68, not a mismatch. Artifact: https://github.com/garrison2025/Elden-Ring/actions/runs/41278766344/artifacts/13072302887

A final short default-configuration probe is deliberately separate because zero multipliers may be rejected by Tarnished.dev. Its outputs, if any, cannot be compared to the local Poise-only optimizer without matching scoring semantics.

## Correction and actual outputs — the results table must be explicitly opened

**Critical correction to earlier timing reports:** Tarnished.dev successfully computed in the browser, but results did not appear in `document.body.innerText` because the independent **Show Table** control must be clicked. The previous 150-second wait is not evidence of a computation hang.

### Reference default 13-metric objective (13 multipliers all 1)

[Actual browser artifact, run 41279168815](https://github.com/garrison2025/Elden-Ring/actions/runs/41279168815/artifacts/13072566647) showed:

| Rank | Head | Chest | Arms | Legs | Poise | Weight |
|---|---|---|---|---|---:|---:|
| 1 | Greathood | Tree Sentinel Armor | Ronin's Gauntlets | Ronin's Greaves | 59 | 32.8 |
| 2 | Silver Tear Mask | Gaius's Armor | Ronin's Gauntlets | Ronin's Greaves | 59 | 33.5 |
| 3 | Envoy Crown | Radahn's Lion Armor | Traveling Maiden Gloves | Radahn's Greaves | 60 | 33.7 |

This is a **multi-metric** objective, so it is NOT directly comparable to our Poise-only optimizer.

### Actual same-role Poise-only objective

[Actual browser artifact, run 41279389097](https://github.com/garrison2025/Elden-Ring/actions/runs/41279389097/artifacts/13072651799) was produced with genuine Chrome keyboard input (not merely DOM value mutation). All twelve non-Poise multiplier inputs showed 0, had HTML minimum 0 and `checkValidity() === true`; Poise multiplier remained 1. Wretch eight attributes 10, no equipped weapons / armor / runes / Physick, Normal roll cap 33.72 (max equip 48.176), thirteen minima default 0, original maxima untouched.

| Rank | Head | Chest | Arms | Legs | Poise | Weight |
|---|---|---|---|---|---:|---:|
| 1 | Circlet of Light | Tree Sentinel Armor | Preceptor's Gloves | Tree Sentinel Greaves | **70** | **33.7** |
| 2 | Circlet of Light | Tree Sentinel Armor | Gravebird Bracelets | Tree Sentinel Greaves | 70 | 33.3 |
| 3 | Circlet of Light | Tree Sentinel Armor | Vulgar Militia Gauntlets | Tree Sentinel Greaves | 70 | 33.7 |
| 6 | Circlet of Light | Tree Sentinel Armor | Godskin Noble Bracelets | Tree Sentinel Greaves | 70 | 33.3 |

Our live public site was separately observed to achieve **68 Poise / 33.200 weight** using the Poise-only objective and 549 site-verified armor candidates. This is a **2-Poise observed cross-site output gap** under matching character/weight/roll/primary objective conditions, but the candidate sets are **NOT equal**. No claim of an optimizer-algorithm defect is justified by this test.

### Verified missing coverage in pinned data, not a guessed formula failure

Direct inspection of the **exact pinned community source revision** `deliton/eldenring-api@3d9cefcfcda7066796b9553825449039c2073926`, 568 armor records, found:
- `Circlet of Light`: **0 source records**.
- `Gravebird Bracelets`: **0 source records**.
- `Ansbach's Manchettes`: **0 source records**.
- `Tree Sentinel Armor`, `Tree Sentinel Greaves`, `Preceptor's Gloves` each have source entries (whose old unverified raw Poise fields must NOT overwrite the previously accepted site-direct corrected fields).
Consequently the reference's 70-Poise set cannot be formed from our 568-item pinned source even if the search engine is perfect.

### Attempted equivalent source-eligibility subset (DLC excluded)

[Run 41279569113](https://github.com/garrison2025/Elden-Ring/actions/runs/41279569113) and [run 41279662148](https://github.com/garrison2025/Elden-Ring/actions/runs/41279662148) attempted to activate `exclude-dlc-armor` in PrimeReact. The hidden input was **not checked** after actual pointer and fallback DOM click. Test failed closed instead of silently claiming DLC was excluded. **No same-candidate-pool algorithm parity established**.

### Consequences / next work strictly limited to remaining gaps

1. **P0 armor roster coverage:** find independently usable current-version source/permission for DLC items, verify exact slot/weight/Poise values and version; do not fabricate `Circlet of Light` or copy all of Tarnished.dev's tables. Retest only the newly missing candidates.
2. **P0 optimizer semantics:** once candidate eligibility is matched, compare Poise-only rank/value/tie rules and separately weighted 13-metric min/max/score rules; do not compare the default 13-metric rank to Poise-only output.
3. **P1 Damage Calculator:** the live reference contains an enemy selector, NG, eight moveset selectors, PvP and effect controls; our manual AR/MV/defense model cannot produce the same scenario until verified values and attack stages exist.
4. **P1 Spell Calculator / passive effects:** no validated spell/catalyst damage multipliers, talisman/Physick stacking or licensing baseline yet; not numerically comparable to reference.
5. Do NOT rerun or relabel the previously accepted 549 armor field reads, 514 × 12 other fields, weapon AR cases, old Build-level observations or Icerind boundary fix.

**This audit's verified deliverable:** live numerical evidence + concrete source-coverage blocker; **NOT** complete full-site functional parity. Browser workflow success means the evidence capture succeeded, not the calculators matched.
