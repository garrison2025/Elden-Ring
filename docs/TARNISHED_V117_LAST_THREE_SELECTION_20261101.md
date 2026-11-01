# Public Tarnished.dev v1.17: final three missing-Req weapon selection diagnostics (2026-11-01)

[Actual public Chromium Actions: run 41268225982](https://github.com/garrison2025/Elden-Ring/actions/runs/41268225982). **Two complete independent browser processes** obtained identical results. Public-site version v1.17, Wretch all-10 and all-99 stat presets, exact selected item/affinity, upgrade +0, one-handed, no buffs were checked. Multiple spelling and Standard/None affinity candidates were attempted for Great Épée.

| Weapon | All five attributes 10 | All five attributes 99 | Direct five-number Req visible? |
|---|---|---|---|
| Serpent-hunter | Exact site name `Serpent-Hunter`, `None`, **AR 123** | Exact site name `Serpent-Hunter`, `None`, **AR 216** | No; item **was activated** |
| Steel-wire Torch | Exact site name `Steel-Wire Torch`, `None`, **AR 177** | Exact site name `Steel-Wire Torch`, `None`, **AR 228** | No; item **was activated** |
| Great Épée | No exact activated item | No exact activated item | No; selection unresolved |

The four AR totals above are *actual public page observations*, not local engine math matches and not direct proof of any Req tuple. The accepted-Req count **remains 458/487**; 29 remain unobserved. None of these three gains a Req VERIFIED badge.

## What changed

- Serpent-Hunter and Steel-Wire Torch are no longer classified as simply unselectable. Both were **confirmed active**, at two different legitimate input profiles, in two independent browser reads. The site displayed scaling and Total AR, but no `Req:` values. An attempt to re-add the same aliases will not uncover this missing field.
- Great Épée remains a **site selection/option lookup** problem. Testing `Great Epee`, `Great Épée`, `Great Epée`, `Great EPEE` at two attribute configurations (including Standard/None) returned the placeholder instead of an active item. That does not prove the public site lacks the weapon; the actual visible dropdown option inventory needs inspecting.
- The separate pinned versioned source and older community requirements cannot substitute for the missing actual site Req field. Even when other fields (weight/AR) are observed, the field-specific Req acceptance rule is unchanged.

Evidence manifest: `scripts/tarnished-v117-last-three-selection-summary.json`. Raw per-alias/per-input observations are retained in the two browser-run workflow artifacts.

No new numerical AR-engine parity, weight, game-client, copyright/reuse, SEO or production release claims are made. Keep `noindex` unchanged.
