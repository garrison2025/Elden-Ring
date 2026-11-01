# 2026-11-01 remaining-only live derived-stat audit

Scope: new proof for **unverified Build Stats output**, and capture of existing live Damage and Spell inputs. NO rerun of prior 487 weapon weights, 549+1 armor Weight/Poise, 514×12 armor derived stats, 116 AR scenarios, class/level or Icerind.

A real GitHub Actions Chromium session runs `scripts/probe-tarnished-remaining-derived-v117.mjs`. It records the displayed v1.17 version, unbuffed Wretch all stats 10 with no equipment, and then genuine keyboard edits VIG40 / MND30 / END25 / ARC40. It records *all* rendered input values, including any readonly HP/FP/Stamina/Poise/Equip Load/Defense/Negation/Resistance/Discovery fields, without inferring formulas. Damage/Spell pages are inspected for gaps only: no pretend numeric parity until a real common enemy/moveset or spell/catalyst profile is possible.

The first CI run is a discovery step; no numerical claims are authorized until output fields can be identified and assertions narrowed. Evidence remains in Actions artifact rather than copied site production files.
