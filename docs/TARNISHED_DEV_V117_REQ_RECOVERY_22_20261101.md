# Tarnished.dev v1.17 Req — focused follow-up audit of 22 AR-observed gaps (2026-11-01)

## Actual browser evidence, not a hypothetical completion

- [Double-read CI evidence: run 41266643033](https://github.com/garrison2025/Elden-Ring/actions/runs/41266643033)
- Two separate Chromium reads per weapon across two parallel 11-name shards
- Exact site version **v1.17**, selected public weapon/affinity, actual Wretch 10/10/10/10/10, +0, one-handed and all buffs disabled were checked
- Actual five-number `Req:` text was independently captured, checked for repeat agreement, and compared separately against the pinned v1.17 calculation source
- **Shard 0: 11 observed / 11 matched**, **Shard 1: 9 observed / 9 matched**, 0 site-to-pinned numeric discrepancies
- Reproducible compact direct observations: `scripts/tarnished-v117-direct-req-recovery-22.json` (scripts-only; no site bundling)

| Field | Old report (#109) | Increment | Total directly observed |
|---|---:|---:|---:|
| Weapon requirements with two exact public-site reads | 357 | **+20** | **377/487** |
| Unobserved or hidden Req | 130 | −20 | **110/487** |
| Verified direct Req mismatches vs pinned v1.17 source | 0 | 0 | **0 in 377 confirmed rows** |

This **does not** mean all 487 items' requirements were individually website-observed. The rest have pinned-version source values but remain site-uncertified for this field. Never change an unobserved value to `0` or mark it VERIFIED.

## All 20 newly observed direct public Req (STR/DEX/INT/FAI/ARC)

| Local catalog name | Actual public UI selected name | Req |
|---|---|---|
| Axe Of Godfrey | Axe of Godfrey | 42/14/0/0/0 |
| Axe Of Godrick | Axe of Godrick | 34/22/0/0/0 |
| Beast-repellent Torch | Beast-Repellent Torch | 12/8/0/0/0 |
| Blade Of Calling | Blade of Calling | 6/13/0/15/0 |
| Bolt Of Gransax | Bolt of Gransax | 20/40/0/0/0 |
| Celebrant's Rib-rake | Celebrant's Rib-Rake | 8/14/0/0/0 |
| Crepus's Black-key Crossbow | Crepus's Black-Key Crossbow | 14/16/0/0/0 |
| Cross-naginata | Cross-Naginata | 16/20/0/0/0 |
| Giant-crusher | Giant-Crusher | 60/0/0/0/0 |
| Hand Of Malenia | Hand of Malenia | 16/48/0/0/0 |
| Miséricorde | Misericorde | 7/12/0/0/0 |
| Regalia Of Eochaid | Regalia of Eochaid | **12/18/0/0/15** |
| Rivers Of Blood | Rivers of Blood | 12/18/0/0/20 |
| Scepter Of The All-knowing | Scepter of the All-Knowing | 12/18/21/0/0 |
| Serpent-god's Curved Sword | Serpent-God's Curved Sword | 13/9/0/0/0 |
| Staff Of The Avatar | Staff of the Avatar | **34/8/0/24/0** |
| Sword Of Milos | Sword of Milos | 15/19/0/0/0 |
| Sword Of Night And Flame | Sword of Night and Flame | **12/12/24/24/0** |
| Varré's Bouquet | Varre's Bouquet | 8/16/0/0/24 |
| Wing Of Astel | Wing of Astel | 7/17/20/0/0 |

The three emphasized records differ from old, **unmodified historical community catalog** values, while the separate *active pinned v1.17 comparator layer already has the public matching values*. These are not new production discrepancies.

## Two cases still unobserved despite known earlier AR

- **Serpent-hunter**: weapon selection remained `Select equipped weapon...` in both low-stat observations. Historical AR success at different inputs does not certify its five Req fields.
- **Steel-wire Torch**: same invalid/inactive selection at these inputs. Keep `NOT_OBSERVED`; do not borrow old community value as if directly displayed.

## Follow-up boundary

1. The remaining **110** need separate classification: original `REQ_NOT_EXPOSED_AT_WRETCH10` records, plus names that did not activate in the first pass. A direct value is only approved when site displays it twice with validated controls.
2. Using a valid lower-attribute starting class may reveal some otherwise hidden low Req values, but it must first be proven via actual site selection/DOM state. Values below every permissible class minimum may stay invisible.
3. One +0 AR discrepancy (Icerind Hatchet) is separate and unchanged. So are 6 unobserved weights, damage/spells/armor parity, licensing and production SEO/noindex gates.
