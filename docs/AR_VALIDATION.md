# Weapon AR research engine — validation and data admission gate

**Status: research-only.** Source code computes on synthetic or manually supplied parameters. It does **not** ship a licensed/verified Elden Ring weapon dataset, real enemy-defense calculations or in-game AR comparisons. Do not publish this page as a real game weapon calculator.

## Implemented contract

- Five damage types are independently calculated: physical, magic, fire, lightning, holy.
- Each damage type uses explicit base damage and per-upgrade damage multiplier, per-stat scaling and reinforcement scaling, correction-curve value, and attack-element-specific correction/ratio/override.
- Stat requirement failure applies a negative correction. Two-handing affects the effective Strength input, but not the character's saved Strength attribute or level.
- Scaling is clamped against the lowest individual negative factor when multiple requirements are unsatisfied.
- Raw damage components are summed before final flooring (individual displayed components may not sum to the displayed total).
- Missing reinforcement rows or correction-curve entries are a hard error, **not** estimated or interpolated.
- Custom profiles are read locally from JSON; no uploads, tracking, paid API or database.

## Data schema v1

JSON root object:

```text
schemaVersion: 1
label: string, <= 120 characters
provenance: {status: 'synthetic-test' | 'manual-unverified', note: nonempty string}
requirements: {str, dex, int, fai, arc}  // integers 0..99
affinities: {
  'CUSTOM AFFINITY': {
    baseDamage: {physical, magic, fire, lightning, holy},  // numbers, zero allowed
    baseScaling: {str, dex, int, fai, arc},
    correctionCurves: {physical: [151 numbers], magic: ..., ...}, // one 0..150 vector per nonzero damage element
    elementScaling: {
       physical: {str:{enabled:true,impactRatio:1,overrideScaling:null}, dex:{enabled:false},...},
       magic: {...}, ...
    },  // one object for every stat for every nonzero damage type
    upgrades:[{
       level: 0,
       damageMultipliers:{physical:1,...}, // every nonzero damage type
       scalingMultipliers:{str:1,dex:1,int:1,fai:1,arc:1}
    }]
  }
}
```

The package includes `data/ar-synthetic-fixture.mjs` with deliberately fictional values. **These numbers cannot be used as an in-game damage guide.**

## Why the game version is not declared supported

Source references explain the general algorithm; neither reference proves that the fixture matches Regulation 1.17.3:

1. [ERDB: Calculating Attack Power](https://github.com/EldenRingDatabase/erdb/wiki/Calculating-Attack-Power-in-Elden-Ring) — reference math, notes older article structure may be outdated.
2. [ERDB: attack_power.py](https://github.com/EldenRingDatabase/erdb/blob/master/src/erdb/utils/attack_power.py) — reference per-element scaling, requirements, capping and flooring logic. We independently implemented the behavior; did not copy script source or game assets.
3. [Bandai Namco 1.17.2 notes (2026-10-20)](https://en.bandainamcoent.eu/elden-ring/news/elden-ring-patch-notes-version-1172) — patch/version checkpoint.

`EldenRingDatabase/erdb` publishes MIT-licensed code; **that is not proof of unrestricted commercial rights to datasets extracted from the game**. No full extracted param tables are redistributed here. Small manually researched numeric observations may also require permission/provenance review for commercial launch. Generic facts, formula descriptions, and original code should be kept separate from protected artwork, audio, names/branding claims and bulk game assets.

## Production data gate (still blocked)

1. Establish lawful source/rights for data: weapon+affinity+upgrade rows, requirements, base damage, scaling, `CalcCorrectGraph`, `AttackElementCorrectParam`, `ReinforceParamWeapon` (or independently documented equivalents), and all DLC changes.
2. Freeze a **specific** app and regulation version and provide provenance per source artifact.
3. Golden regression cases from **real game client** across: standard/somber upgrades, physical/split elements, all scaling stats, min-requirement penalties, 1H/2H, at least one DLC weapon, affinities, max upgrade. Each case includes screenshot/recorded in-game AR and input state.
4. Show tests' pass/fail matrix; fix all known material discrepancies and document unsupported mechanics.
5. Only then ship `/weapon-ar-calculator/` publicly with unique SEO content and accurate claims. Leave this research-only URL `noindex,nofollow`.
6. Review current official patches and repeat affected golden tests after changes. Do not automatically update unreviewed data.

## QA status 2026-10-30

- Numerical fixtures: synthetic only; 10 weapon research tests passed.
- Existing character/rune/load: 8 older tests passed.
- Game-client golden AR cases: **0** (required before publication).
- Real weapon data included: **none**.
- Source asset licence/data distribution gate: **open**, not certified.
- Real game version supported by AR output: **none**, irrespective of the site-wide game reference marker.


## Offline evidence comparator — added 2026-10-30

Research-only route: \`/weapon-ar-validation/\` (\`noindex,nofollow\`). The route accepts candidate parameter JSON using the existing schema and a separate v1 observation file. No game files, image uploads, credentials, or external APIs are sent to a server. It compares total AR and optional individual damage components across strength/dexterity/intelligence/faith/arcane, grip, affinity and reinforcement. JSON/CSV audit output can be saved locally.

Observation schema: \`{schemaVersion:1,profileLabel:string,gameVersion:string,cases:[{id,affinity,upgrade,twoHanded,stats:{str,dex,int,fai,arc},observedTotal,observedElements?,evidence:{kind:'synthetic-test'|'manual-transcription',reference,note?}}]}\`.

**Matching numbers are NOT certification**: all records remain \`UNREVIEWED\`, even with zero error. A real client screenshot, confirmed version, rights provenance, formula edge tests and independent review are still mandatory. A mismatched \`profile.provenance.gameVersion\`, if supplied, blocks calculations. The bundled example is **entirely synthetic**, with no game AR data.

A separate open-source calculator \`nyedr/elden-ring-ar-calculator\` provides an MIT-licensed code reference, but its public bundled regulation file refers to **vanilla 1.14**, and does not establish rights for rebundling game-derived parameters or accuracy against current patch. Do not import that data into the public site as 2026 current numbers.


### CLI and CI regression gate

\`npm run verify:ar\` runs synthetic, deliberately fictional observation cases and is included in \`npm run check\`/GitHub Actions. For candidate data, call \`node scripts/verify-ar.mjs --profile candidate.json --observations observations.json --out report.json\`. A mismatch, missing upgrade, invalid schema, version disagreement, or missing file fails with a nonzero process exit. An exact comparison means **calculation consistency only**, not independently established in-game correctness or permission to distribute underlying game data.


## Local 1.17-compatible compact regulation import (2026-10-30)

Research-only developer workflow added: \`scripts/import-regulation.mjs\` and
\`public/src/regulation-import.mjs\`. Supports the compact JSON structure with
\`weapons\`, \`reinforceTypes\`, \`calcCorrectGraphs\`,
\`attackElementCorrects\` and per-weapon table IDs, as described by
[ThomasJClark/elden-ring-weapon-calculator](https://github.com/ThomasJClark/elden-ring-weapon-calculator).
This is a separately implemented converter; **no external source code, weapon data
or extracted game assets are included**.

The public repository declares MIT licensing for its software, but its README
explicitly states that its regulation data is extracted from game files with
WitchyBND. GitHub software licensing is **not itself** a determination that
redistribution of game-derived parameters is commercially authorized.
No source is assumed verified merely because it is tagged \`v1.17\`.
Almanauts' independent change history reports no tracked param-table changes
in 1.17.1 or 1.17.2/Regulation 1.17.3, but this is not an official game-client
AR validation for every weapon and effect.

Only local \`.json\` input is accepted; external \`.js\` files are never evaluated.
Use an explicitly permission-reviewed JSON representation of the compact
regulation object and run:

\`\`\`bash
node scripts/import-regulation.mjs --input local-ar-data/regulation.json --list
node scripts/import-regulation.mjs \
  --input local-ar-data/regulation.json \
  --weapon "Exact weapon+affinity name" \
  --version "1.17" \
  --source "source URI, rights check and extraction date" \
  --out local-ar-data/candidate.json
node scripts/verify-ar.mjs --profile local-ar-data/candidate.json --observations local-ar-data/observations.json --out local-ar-data/report.json
\`\`\`

One exact weapon/affinity at a time. The output remains \`manual-unverified\`,
with a SHA-256 hash of the local input. It handles stat scaling graphs,
base damage, explicit upgrade multipliers, corrections, and paired-vs-standard
two-handing behavior. Bows/ballistae are tagged \`forced-two-hand\`. Status
buildup, attack motions, buffs, player-vs-enemy final damage and licensed
multi-weapon distribution remain out of scope. An unknown graph, missing
reinforcement multiplier, or ambiguous item name is a hard failure, not an
interpolation. The regression fixtures are entirely fictional.

**Production gate remains blocked** until independently sourced data rights
and actual game-client golden vectors are documented and reviewed.


### CLI integration coverage

Automated regression now actually spawns the local importer, lists names, writes a
SHA-256-traceable candidate profile from independent fictional JSON, and checks
that JavaScript payloads and unknown names fail. All imported values remain
\`manual-unverified\`; there are still **zero** independent current-game weapon
AR golden vectors.


### Live local-file workbench

\`public/weapon-data-workbench/index.html\` uses a module Web Worker to parse
a user-supplied compact regulation JSON (under 16 MB), search exact
weapon/affinity names and compare preliminary 1H/2H values. All operations
remain in memory in the user's browser: **no upload, remote fetch or
persistent database.** Missing graph IDs, missing upgrades, invalid JSON,
duplicate names and invalid attributes cause explicit errors. All output
is research-only; matching imported parameters is not independently checked
in-game and does not grant game-data redistribution rights.


#### Research importer hardening

Imported attack/scaling pair keys are now allowlisted (known attack-power
IDs and STR/DEX/INT/FAI/ARC), and lookup uses own-properties only.
Prototype-like keys and inherited table IDs are not accepted. Worker message
contract tests use synthetic JSON to prove load/search/select/compare/clear
behavior and missing-level rejection; they are not in-game AR tests.
