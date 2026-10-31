# Free Cloudflare deployment build gate — October 31, 2026

**Problem:** On Oct 31, the repository's private `ubuntu-latest` GitHub Actions checks `verify`, `browser-smoke` and `v117-raw-math-parity` started failing within ~2–4 seconds with empty `steps` and no retrievable runner logs. The preceding commit had passed the same jobs. The failure is **pre-runner / pre-test**; it is not evidence that the Node assertions failed. The exact GitHub account reason (monthly Actions minutes, billing limit, permission/runner issue or other policy) is **not confirmed** from read-only connector APIs.

GitHub official billing reference: https://docs.github.com/en/actions/concepts/billing-and-usage . GitHub private-repository hosted runner capacity uses an account-level monthly compute allowance, unlike public repos. Do **not** change repository visibility or enable a paid budget to bypass this; those actions require explicit owner decisions.

## Implemented no-API build gate

Cloudflare Pages currently executes the repository's build command `npm run build` to produce `dist/`. That command now uses a strict `&&` chain:

```sh
npm run test
npm run verify:ar
node scripts/build.mjs
npm run verify:deployment
```

Any failure exits nonzero before Cloudflare can publish **that candidate build**.

- **Unit / data / source validation:** the checked-in Node test suite, including seven historic Regulation conflicts, Stone-Sheathed 89/119 and 3.5/5 dispute, missing AR goldens, calculator behavior, release index gates and pages.
- **AR verification:** local synthetic/reference CLI checks; not screenshots and not the independently fetched 1.17 parameter data.
- **Compile static research site:** source catalog/ledger validation, generated evidence and strict `noindex` by default.
- **Artifact verification:** checks exact bundled source/evidence agreement, generated HTML, source links, version and research route SEO restrictions.

`npm run check` aliases `npm run build` to avoid redundant full tests in a single GitHub Actions job. `node scripts/build.mjs` remains deliberately callable in the isolated unit tests that simulate site builds; those tests are included in `npm run test`. The Cloudflare gate uses **no paid API, server or database**; it uses the existing free build environment and its standard quotas.

## Important limitations

1. A green Cloudflare build is an assertion that **the deployed candidate passed the Node suite and artifact checks**. It **does not substitute for actual Chrome desktop/mobile tests**, which remain in the GitHub `browser-smoke` workflow.
2. The pinned v1.17 independent-source audit requires an external remote fetch and remains a separate GitHub check. Cloudflare build cannot certify it.
3. An upload of user-provided local Regulation JSON does not authenticate provenance. The current game client's independently reviewed AR screenshots remain **zero**.
4. Do not claim the 416 existing catalog records are the complete full game roster merely because each row has a published +0 attack candidate.
5. Verify the **Cloudflare Pages project build command still invokes `npm run build`**. A configuration change to `node scripts/build.mjs` would bypass the stronger npm quality chain. Check Cloudflare Pages > project > Settings > Builds & deployments. This repo file alone cannot read that private dashboard setting.
6. GitHub account owner can diagnose the pre-runner errors at Settings > Billing and licensing / Billing and plans > Usage / Actions, and the failed run UI. For no-cost alternative, self-hosted runner is possible, but requires machine setup; no change made here.

**Unchanged:** Private repository status, seven historic conflict review statuses, separate Stone and Ritual discrepancies, research `noindex`, and zero original game AR screenshot goldens.
