# Additional talisman tier and mutually exclusive family audit (2026-11-01)

## Why this change
The existing 2026-11-01 compatibility gate protected only repeated *identical* items, the Radagon seals and the Marika seals. It did not guard against equipping **two upgraded variants of the same talisman family**. In such a case a local calculation could show a total equip weight and roll tier even though the selected pair cannot be worn in the game. The purpose here is **equipment legality**, not to extrapolate numerical effects or assert new site goldens.

## Secondary-source documented restrictions added
All restrictions are exact **display-name allowlists**. Unrecognized names or merely similar prefixes do not get a fabricated restriction:

| Family | Recognized names | Source quality |
| --- | --- | --- |
| Erdtree's Favor | base, +1, +2 | [wiki.gg Erdtree's Favor +2](https://eldenring.wiki.gg/wiki/Erdtree%27s_Favor_%2B2) |
| Arsenal | Arsenal Charm, Arsenal Charm +1, Great-Jar's Arsenal | [wiki.gg Equip Load](https://eldenring.wiki.gg/wiki/Equip_Load) |
| Crimson Amber Medallion | base, +1, +2, +3 | [wiki.gg Crimson Amber +3](https://eldenring.wiki.gg/wiki/Crimson_Amber_Medallion_%2B3) |
| Cerulean Amber Medallion | base, +1, +2, +3 | [Fandom talisman variant rules](https://eldenring.fandom.com/wiki/Talismans) |
| Viridian Amber Medallion | base, +1, +2, +3 | same talisman variant rules |
| Dragoncrest physical-defense | Shield base/+1/+2 and Greatshield | [Independent variant family overview](https://wiki.eso-ui.com/index.php/Category:Elden_Ring_-_Talismans) |
| Alexander shards | Warrior Jar Shard and Shard of Alexander | same family overview |
| Crimson Seed | base and +1 | Fandom talisman variant rules |
| Cerulean Seed | base and +1 | Fandom talisman variant rules |

The Radagon and Marika seal restrictions remain as before; the known overlapping same-name restriction remains. This registry **does not claim exhaustive coverage of every talisman family** or verify the latest game client.

On conflict, the Build Planner reports `UNWEARABLE`, withholds `exactTotal` and roll `tier`, and identifies the restriction as `independent-documentation-only`. No stack formula or effect multiplier is inferred. Valid cross-family pairings (including two distinct types of Amber Medallions) are not blocked.

## Independent two-pass actual public-site control experiment
`scripts/probe-tarnished-talisman-tier-conflicts-v117.mjs` is run in two **separate fresh Chromium profiles** for each of eight ordered selection scenes:
1. Radagon Soreseal → Scarseal (reverse of previously observed order)
2. Marika Scarseal → Soreseal
3. Marika Soreseal → Scarseal
4. Radagon Scarseal → same Radagon Scarseal (duplicate click)
5. Starscourge Heirloom → same Starscourge Heirloom (duplicate click)
6. Crimson Amber Medallion → +1
7. Arsenal Charm → +1
8. Erdtree's Favor → +2

Each read uses the **public Tarnished.dev v1.17** Wretch all-10 naked Build profile with no rune/physick, and captures actual selected tokens and numeric fields after clicking each real selector option. Outcomes are *discovered*, not guessed: both-selected, first-only, none-selected, or a flagged unexpected outcome. Two identical captures are required by a separate comparison job. The actual JSON artifacts are retained for 30 days and the full observed selection table is posted on the pull request. A selector that allows a pair **does not override documented game-client equipability**, and a selector that refuses a pair does **not** certify any combined numeric effect.

No additional browser run is asserted by this planning note; see the actual pull request's Actions results/comments for live acceptance.

## Remaining independent validation boundaries
- **Damage**: Actual public-site Uchigatana/Standard/+25 Wretch sample has AR 376 and displayed DPS 464/547, but our DPS timing/moveset data are not proven same-input. Do not claim general damage or DPS parity.
- **Spell**: One Glintstone Pebble/Astrologer's Staff actual public-site sample displayed magic 242 and FP 7; the site engine's complete catalyst scaling/multiplier inputs have not been independently reproduced. Do not claim general offensive spell parity.
- **Armor**: 568 source items cover a much wider catalog, but 18 numeric cells remain malformed/unknown (after 41 signed-negation entries were correctly accepted), and a pinned community source is not equivalent to source-site same-input numerical validation of every optimizer result.
- **Current version**: Tarnished.dev declares public version v1.17. Do not conflate with any 1.17.3 game-client evidence.

Related previous audits: `docs/TARNISHED_DAMAGE_SPELL_LIVE_TABLE_AUDIT_20261101.md`, `docs/ARMOR_568_13_METRICS_SOURCE_AUDIT_20261101.md`, `docs/TALISMAN_LOADOUT_COMPATIBILITY_GATE_20261101.md`.

## Verification gate
Run `npm run check`, the desktop/mobile browser smoke workflow, and the dedicated fresh-site workflow. Merge only if required checks are green; if the live experiment cannot confirm both passes, retain explicit secondary-source evidence and disclose that the new browser acceptance failed.
