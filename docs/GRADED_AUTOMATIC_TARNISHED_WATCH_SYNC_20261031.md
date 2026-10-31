# Tarnished.dev graded automatic synchronization — implementation (2026-10-31)

## Scope

This project has **no paid AI API and no continuously running code-writing agent**. A GitHub Actions monitor can automatically carry out deterministic low-risk edits and test them, but it cannot safely invent a new optimizer, damage formula or properly licensed game dataset from a competitor's prose change notice. Do not claim those changes are fully autonomous.

### Green tier: automatically implemented source-watch metadata ONLY

Every scheduled run (08:17 and 20:17 Beijing time) checks the six latest dated competitor notes plus source version. On detected new/edited notes, it independently creates a GitHub review Issue, stages precisely two files:

1. `monitoring/tarnished-dev-baseline.json` — new source version and short dated note hashes.
2. `public/data/tarnished-dev-watch.json` — attributed external observation displayed as a separate panel on `/updates/`.

The workflow fails if either staged path differs from the strict allowlist, requires Python safety regression plus `npm run check`, opens a metadata-only PR and attempts a squash merge with GitHub's own permissions/rules. Successful merges trigger normal Cloudflare Pages redeployment. Normal PR/checks, not a shadow deployment script, remain authoritative.

GitHub may prohibit Actions-created PRs or automatic merges depending on repository settings. On PR creation denial, the branch remains and the Issue persists; on merge denial, the PR is left for review. Do **not** bypass branch protections or solicit paid credentials/API keys to overcome these controls.

### Amber/red tier: automatic research task, not automatic code change

- P0: game version label or regulation change. Cross-check official Bandai Namco notes; no automatic source replacement.
- P1: weapon AR, damage, scaling, armor optimization, DLC coverage or other impactful math. Requires same-input numeric tests and independent implementation.
- P2: build/spell/effects or UI workflow feature. Requires scoped functionality and browser regression.
- P3: editorial/UX metadata. Still must not claim an unbuilt feature was shipped.

Every actual changed competitor release opens a deduplicated GitHub Issue, irrespective of tier. No tier is permitted to auto-edit weapon data, formulas, content rights, indexing approval or our own product changelog. Reviewers may delegate implementation to an AI coding agent if connected and authorized; that is a separate capability, not installed as part of this workflow.

## What a user sees

`/updates/` has two *separate* sections: **our real merged releases** and **Tarnished.dev external watch status**. External notes display using DOM `textContent` with short excerpts and an explicit `ourFeaturesUpdated:false` flag, never injected HTML. A competitor note therefore cannot masquerade as our new feature or as current Regulation 1.17.3 accuracy.

## Validation

- Python parser tests (`test_tarnished_monitor.py`) check nested entries, version labels, duplicate/no-op and failure states.
- Python snapshot staging tests (`test_tarnished_safe_sync.py`) enforce fixed paths, provenance, digest consistency, input bounds, P0/P1 classification and idempotency.
- Node contract tests ensure mutable future version baseline still passes tests, the external panel remains attributed, no unsafe HTML execution and no scripts that auto-edit site code.
- Site builds and browser smoke must pass before merging any contributor PR.

## Limitation

Monitoring a changelog cannot detect silent edits to a site's numerical output. The separate `tarnished-public-benchmark.yml` Chromium suite is the basis for further periodic drift checks; absent a confirmed new observation, don't assume all AR values stayed unchanged.

Workflow: https://github.com/garrison2025/Elden-Ring/actions/workflows/monitor-tarnished.yml
Issues: https://github.com/garrison2025/Elden-Ring/issues
