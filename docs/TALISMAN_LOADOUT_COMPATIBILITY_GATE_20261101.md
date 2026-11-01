# Talisman equipability gate and source-confidence UI (2026-11-01)

Scope: Build Planner equipment legality only; this PR does **not** expand the directly observed multi-talisman stat/defense model, add synthetic numerical goldens, or claim additional Tarnished.dev browser runs.

## Actual bug on main before this change

The Build Planner previously summed each known individual talisman weight even for a second **identical** talisman or the **Marika Scarseal + Soreseal** incompatible pair. It could return a numerically exact total and roll tier for an unwearable selection. Radagon Scarseal + Soreseal was already blocked, but the UI had no reusable evidence-labelled compatibility model. Unobserved combinations could silently fail to show a clear combined-results warning.

## Narrow rules and provenance

| Input | Equipment legality | Evidence level | Site-numeric parity |
| --- | --- | --- | --- |
| Duplicate same name | blocked | Independent community accounts; no fresh two-browser scenario | NOT TESTED |
| Radagon Scarseal + Soreseal, either order | blocked | The **Scarseal then Soreseal** order directly rejected twice by public Tarnished.dev v1.17; opposite order from independent documentation | Direct only for observed order |
| Marika Scarseal + Soreseal, either order | blocked | Independent documentation only | NOT TESTED |
| Other multi-talisman selections | no conflict in this restricted rule set | No implicit generalized legality or stacking proof | Existing nine recorded exact ordered rows (eight distinct combinations, because one overlaps) remain conditional |

Direct actual public-site evidence: `docs/TARNISHED_V117_FIVE_MULTITALISMAN_AND_ONE_EXCLUSION_20261101.md`, workflow [41291997231](https://github.com/garrison2025/Elden-Ring/actions/runs/41291997231).

Independent equipment restriction references (not new comparator golden outputs):
- [Radagon Scarseal documentation](https://eldenring.wiki.gg/wiki/Radagon%27s_Scarseal)
- [Radagon Soreseal documentation](https://eldenring.wiki.gg/wiki/Radagon%27s_Soreseal)
- [Marika seals variants documentation](https://eldenring.fandom.com/wiki/Marika%27s_Seals)
- [Players on duplicates/tiers](https://steamcommunity.com/app/1245620/discussions/0/4511002742441868752/)

## Implementation and acceptance

- Central `reviewTalismanLoadoutCompatibility()` yields explicit conflict type, actual evidence tier and narrowly worded note. Known individual weights remain shown but are relabelled raw *non-equipable* arithmetic subtotals when illegal.
- `evaluateBuildLoadout` withholds exactTotal and roll tier on conflict. No declaration that the current public comparator necessarily rejects all such inputs in both click orders.
- UI describes every conflict's source quality and does not silently display an absent combined effect as a checked result.
- Existing direct numerical scenarios (including Scarseal + Marika Scarseal **-21%** and both Soreseals **-32.25%**) are unchanged and regression-tested.
- Still to investigate through two independent browser captures: reverse Radagon selector order, both Marika orders, repeated-item selector behavior, and every more general family/upgrade-tier restriction. These are **open parity tasks**, not results from this change.

No paid runtime API, backend, extra database or automatic deployment required. Existing noindex/coverage gates remain unchanged.
