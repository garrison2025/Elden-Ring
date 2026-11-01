# Six real Tarnished.dev v1.17 armor aliases recovered, two duplicated legacy items classified

Actual browser evidence: [two independent Chromium processes](https://github.com/garrison2025/Elden-Ring/actions/runs/41276086880). Ten previously unverified source names were tried against the real public Build Calculator v1.17 via visible equipped-item dropdowns, at baseline Wretch 10/10/10/10/10 and no buffs.

| Result | Count | Meaning |
|---|---:|---|
| Exact-site selected twice and same Weight/Poise shown | **8** | Actual public site values, not another community source |
| Of those, six source IDs correspond to **distinct additional site items** | **6** | May be added to site's direct weight/Poise overlay |
| Other two already existed under **different, already verified source IDs** | **2** | Must NOT create a duplicate Tarnished.dev item |
| Still absent from actual public site dropdown | **2** | Not observed; no fallback numeric acceptance |

## Six verified unique recoveries

| Old local source name | Actual Tarnished.dev name | Weight | Poise |
|---|---|---:|---:|
| Godksin Noble Robe | Godskin Noble Robe | 6.3 | 12 |
| Nox Monk Bracelets | Nox Bracelets | 2.6 | 3 |
| Blackflame Monk Greave | Blackflame Monk Greaves | 7.3 | 14 |
| Nox Monk Greaves | Nox Greaves | 5.1 | 10 |
| Imp Head (wolf) | Imp Head (Wolf) | 8.1 | 10 |
| Hierodas Glintstone Crown | Hierodas Glintstone Crown | 3.0 | 4 |

Both helmet entries legitimately **change maximum equip capacity from 48.2 to 51.4**. The earlier strict unchanged-capacity requirement was inappropriate for these special armor items. We directly accepted their separately displayed Weight and Poise values, but **did not** infer their extra armor negations/resistances from the stat-modified Wretch output.

Two old source records must not be treated as new distinct equipment: `Champion Gauntlets` is an alias for the already verified `Champion Bracers` (2.1 Weight / 3 Poise), while a second miscategorized `Redmane Knight Helm` row appears under **Gauntlets**, even though the real site has the same helmet already recorded in **Head** (5.1 Weight / 8 Poise). They stay excluded from the verified overlay to prevent duplicated site identities. `Millicent's Gloves` and `Golden Prosthetic` were not selectable in either direct browser pass.

## New coverage and exact status

- Previous 568-candidate batch: **543** distinct site-aligned equipment Weight/Poise pairs.
- New **6 distinct** exact item aliases: **549 / 568** source IDs directly matched Tarnished.dev for Weight/Poise.
- **19 / 568** source IDs still do not have approved unique direct-site Weight/Poise goldens (including two identified duplicate/miscategorized source records).
- The separate 12-metric audit still supplies **6,168** safe baseline-derived negation/resistance fields on **514** stat-neutral armor pieces. These six newly recovered items do not receive invented 12-metric corrections.
- Combined bounded UI numeric evidence: **549 × 2 + 514 × 12 = 7,266 fields**.

`scripts/tarnished-v117-armor-alias-recovery-10-summary.json` preserves all outcomes with job and site IDs; `public/src/tarnished-v117-armor-recovered.mjs` contains ONLY the six unique direct goldens. No other source is used as numerical acceptance.
