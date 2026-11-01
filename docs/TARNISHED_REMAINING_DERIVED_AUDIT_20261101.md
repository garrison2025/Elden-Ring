# 2026-11-01 remaining-only live derived-stat audit

Scope: new proof for **unverified Build Stats output**, and capture of existing live Damage and Spell inputs. NO rerun of prior 487 weapon weights, 549+1 armor Weight/Poise, 514×12 armor derived stats, 116 AR scenarios, class/level or Icerind.

A real GitHub Actions Chromium session runs `scripts/probe-tarnished-remaining-derived-v117.mjs`. It records the displayed v1.17 version, unbuffed Wretch all stats 10 with no equipment, and then genuine keyboard edits VIG40 / MND30 / END25 / ARC40. It records *all* rendered input values, including any readonly HP/FP/Stamina/Poise/Equip Load/Defense/Negation/Resistance/Discovery fields, without inferring formulas. Damage/Spell pages are inspected for gaps only: no pretend numeric parity until a real common enemy/moveset or spell/catalyst profile is possible.

The first CI run is a discovery step; no numerical claims are authorized until output fields can be identified and assertions narrowed. Evidence remains in Actions artifact rather than copied site production files.

## Direct live numerical results: [GitHub Actions 41281523364](https://github.com/garrison2025/Elden-Ring/actions/runs/41281523364)

Browser captured Wretch 10s no items. VIG40 -> HP **1450**, FP78, Stamina96, max Equip Load48.2, Discovery110. VIG40+MND30 -> HP1450, FP**173**. Plus END25 -> Stamina**121**, Equip Load**72.0**. Plus ARC40 -> Discovery**140**. All displayed in Tarnished.dev v1.17 UI with genuine keyboard edits. In these four experiments, every unarmored damage-negation readout remained 0.000%, and defense and resistances changed with level and attribute allocation. Source code before this task did not calculate HP/FP/Stamina derived curves; do not claim our Build Planner matches without a tested implementation.

The following new sweep captures every point VIG/MND/END 10..99 in a no-gear Wretch scenario by genuine keyboard events, separately retaining HP, FP, Stamina and Max Equip Load as arrays. Do not infer or claim 1..9 or buffed values from that sweep.

## Full 10–99 direct site measurements — [CI 41281685407](https://github.com/garrison2025/Elden-Ring/actions/runs/41281685407)

A single real Chromium session used keyboard input and real `HP`, `FP`, `Stamina`, and `Equip Load` output fields for **90 separate VIG values**, **90 MND values**, **90 END values** (twice the output readings), **360 total numeric cells**. The readouts are stored as unmodified per-point arrays in `public/src/v117-base-vitals-direct.mjs`, with no interpolation or extrapolation. Key confirmations: HP (VIG10/25/40/50/60/99) = 414/800/1450/1704/1900/2100; FP (MND10/25/40/50/60/99) = 78/147/235/300/350/450; Stamina (END10/25/40/50/60/99) = 96/121/142/155/158/170; displayed Equip Load = 48.2/72/90.9/105.2/120/160.

**UI change**: Build Planner now displays these independently browser-observed **base** values. The weight is display-rounded and is NEVER used as a replacement for exact equipment-load thresholds. Input attributes <10 are shown as unverified; combined/all-class effects remain unverified. No enemy defense, buffs, talismans, runes or gear bonus computed here.

## Wider confirmed Build Stats golden output (unbuffed Wretch only)

The exact reference UI also reported the following (no weapon/armor/talisman/Physick/Great Rune). These are **NEW reference goldens**, NOT implemented as general character defense or resistance models.

| Input profile | Physical Defense | Magic Defense | Fire Defense | Lightning Defense | Holy Defense | Immunity | Robustness | Focus | Vitality | Discovery |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Wretch VIG40 | 87 | 103 | 123 | 83 | 103 | 126 | 96 | 96 | 106 | 110 |
| Wretch VIG40 MND30 | 95 | 111 | 131 | 91 | 111 | 130 | 100 | 100 | 110 | 110 |
| Wretch VIG40 MND30 END25 | 101 | 117 | 137 | 97 | 117 | 134 | 104 | 104 | 114 | 110 |
| Wretch VIG40 MND30 END25 ARC40 | 124 | 141 | 161 | 121 | 173 | 160 | 130 | 130 | 160 | 140 |

All five main damage-negation readouts remained 0.000 with no equipped armor/effects; the separate "physical defense" integers are **not** damage-negation percentages. Source: [real browser run 41281523364](https://github.com/garrison2025/Elden-Ring/actions/runs/41281523364); the exact 4 scenarios are pinned in `scripts/tarnished-v117-derived-four-observed.json` to permit future comparison without revisiting the site.

### Still NOT verified or modeled as cross-site numeric parity
- Character-derived **physical/elemental defense and four resistances across arbitrary levels and classes** (only the four documented Wretch points above are measured).
- Equipment/talisman/Physick/Great Rune/active spell stacking and +attribute effects beyond known Circlet-of-Light direct fields.
- Damage Calculator enemy presets, NG scaling, attack movesets, status/poise damage, PvP, hit rounding; no common numeric output schema with our manual user-entered AR model.
- Spell Calculator real spell damage, staff/seal scaling and passive modifiers; both sites' features remain incomparable without same-input source/provenance.
- Armor optimizer joint 13-metric weighted objective and full DLC roster remain incomplete; separate Poise=70 is already verified and frozen.

Successful browser CI alone means the *evidence capture* succeeded; it does NOT certify absent algorithms. No older item audits were repeated in this task.
