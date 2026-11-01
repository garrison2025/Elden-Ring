# Eight Wretch single-axis defense and resistance curves (real-site v1.17)

Actual Browser Matrix: 8 independent GitHub Actions Chrome sessions, each 90 real keyboard edits for one axis 10..99. Wretch eight baseline stats 10; all equipment empty; rune/Physick toggles off, Poise 0, current equipment weight 0. For every level, the script checks the 8 final attribute values exactly match the corresponding one-axis vector. This is a new check, **not** a repeat of previously verified HP/FP/Stamina/Equip Load curves.

The only certified output cells are the five displayed defenses (Physical, Magic, Fire, Lightning, Holy), four resistances (Immunity, Robustness, Focus, Vitality), and Discovery. The script saves each raw numeric vector and fails if a single output is unavailable, malformed, or character effects contaminated.

**IMPORTANT**: an actual unbuffed Wretch axis response is not an arbitrary mixed-build formula, and it cannot justify summing per-axis outputs. Combined builds and equipment effects require separate same-input verification. We will build the display around exact observed profiles and fail closed for unsupported combinations.
