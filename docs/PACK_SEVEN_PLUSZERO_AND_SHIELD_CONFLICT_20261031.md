# Tarnished Pack +0 and conflicting-shield/source audit — 2026-10-31

**Status: source-attributed, NOT independently game-verified.** The catalog has **416 total named rows**, including **8 Tarnished Pack / Tarnished Edition armaments**.

## Four additional sourced +0 rows

The `wiki.gg` armament-class comparison tables explicitly list +0 (base, unupgraded) attack components, critical and starting letter grades. These are **published community rows**, not game-client screenshots. They are not AR or maximally upgraded attack.

| Weapon | +0 PHY | +0 HOLY | Critical | STR/DEX/INT/FAI/ARC base scaling | Linked table |
|---|---:|---:|---:|---|---|
| Reverse-Bladed Sword | 115 | 0 | 100 | D / D / – / – / – | https://eldenring.wiki.gg/wiki/Backhand_Blades |
| Hefty Scimitar | 135 | 0 | 100 | D / D / – / – / – | https://eldenring.wiki.gg/wiki/Curved_Greatswords |
| Leontiel's Greatsword | 130 | 0 | 100 | E / C / – / – / – | https://eldenring.wiki.gg/wiki/Greatswords |
| Golden Order Flail | 75 | 92 | 100 | E / E / – / C / – | https://eldenring.wiki.gg/wiki/Flails |

Previous individually sourced +0 rows were **Idus Sword 124 physical**, **Reed Great Katana 158 physical**, and **Silver Grooved Shield 61 physical**; they remain unchanged. This yields **7 of 8 Tarnished Pack +0 community source references**, with **Ritual Thrusting Shield +0 still UNKNOWN**. For all seven, the exact citation, raw five-component +0 attack vector, critical and scaling grade are pinned in the source validator; source URLs do not certify Regulation 1.17.3 parity or full character AR.

## Ritual Thrusting Shield: source values materially disagree

- The Regulation 1.17.3-labelled [Almanauts armament database](https://almanauts.com/eldenring/weapons/) (build **25827938**) reports **weight 10; required STR 13, DEX 12**. These values remain in the catalog as attributed source readings.
- [ESO-UI weapon page](https://wiki.eso-ui.com/index.php/Elden_Ring%3ARitual_Thrusting_Shield) reports **weight 9; STR 13, DEX 12**, and an unupgraded physical figure **135**.
- [Allthings.how guide](https://allthings.how/elden-ring-tarnished-edition-ritual-thrusting-shield-location-guide/) reports **weight 10; STR 15, DEX 12**, also claiming physical **135**.

Although two latter sources agree on a purported +0 physical attack of 135, their weight/requirement data differ, and neither is a personally examined current-game equipment screenshot. We **do not import** the physical 135 yet. Most importantly, **weight and STR requirements are marked source-disputed and cannot produce** a trusted complete equipped-load/roll tier or definitive can-wield verdict. This is **one new Tarnished Pack secondary source dispute**, tracked **separately from the original seven** v1.17 community-vs-pinned DLC disputes. It is not silent source selection or a claim about the precise truth of either reference.

## Fire Knight's Shortsword: inconsistency inside wiki.gg itself

One of the six original disputed +0 attack cases has an even stronger reason not to auto-correct:

1. [Fire Knight's Shortsword wiki.gg Stats](https://eldenring.wiki.gg/wiki/Fire_Knight%27s_Shortsword): **PHY 75 / FIRE 32**.
2. The **same page's Standard +0 upgrade table**: **PHY 72 / FIRE 22**.
3. The pinned public Regulation 1.17 parameter report: **PHY 75 / FIRE 22**.

These are three distinct published vectors, despite two originating on the same page. It would be incorrect to *splice* Physical 75 from the headline section and Fire 22 from the upgrade table to invent a supposedly verified vector. The exact inconsistency is preserved in `public/data/weapon-conflict-evidence.json`, checked by `scripts/weapon-conflict-dossier.mjs`, and visible in the build-generated accuracy dossier. The original **7** historical source conflicts and **0** independently inspected game-client screenshot goldens remain unchanged.

## Release and correctness conditions

- The 7 Pack +0 community rows do not supply reinforcement, infusion, numeric scaling or precise AR; values displayed as +0 source facts only.
- The eighth Pack record has requirements/weight as disputed readings for source transparency but **cannot** enter requirements or full equipped-load calculations.
- Test suite checks class-row +0 exact numbers, safe missing-value handling, tampering, false screenshot approval, source disagreements and blocked calculations.
- Global research `noindex` remains; no paid API, database, user login, image rehosting or extracted game regulation assets are added.
- The remaining six original DLC attack conflicts still require independent, comparable +0 data for the actual current Regulation and a correctly identified game build.
