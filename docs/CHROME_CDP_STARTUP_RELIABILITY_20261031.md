# Chrome CDP startup reliability — 2026-10-31

## Why this change

The main-branch browser smoke job for PR #51 had one failed attempt at:
https://github.com/garrison2025/Elden-Ring/actions/runs/41163009225

The logged error was **"Chrome CDP failed to open"**, before the suite could exercise a single Build Planner or equipment page. The exact same commit **passed on the rerun**, so the observed failure is a browser-harness/runner startup flake, **not** proof of a website regression. The prior launcher hardcoded port `9227`, silently discarded Chrome stderr, and polled a fixed endpoint for about 13.5 seconds.

## Updated launcher contract

- Chrome starts with `--remote-debugging-port=0`, so Chrome chooses an unused port. Only the chosen temp profile's `DevToolsActivePort` file supplies the assigned port.
- The test discovers `http://127.0.0.1:<assigned-port>/json/list`, checking that the target WebSocket belongs to that **same loopback port** and a `/devtools/page/` endpoint. It does not contact a public host or API.
- Each startup attempt has a **20-second bounded CDP readiness wait** and a **10-second WebSocket-open timeout**.
- At most **two attempts** are allowed for *Chrome startup only*, using new unique temporary profiles. Failed children are terminated, temporary profiles removed, and diagnostic messages limited in size.
- If the browser launches but a site check fails, the original acceptance suite still **fails the job**. It is never retried or automatically marked passing.
- On two unsuccessful starts the job fails with both attempt diagnostics, including a small bounded excerpt of Chrome stderr, rather than the opaque `Chrome CDP failed to open` message.
- This change introduces **no Playwright/Puppeteer dependency**, no paid API, no network service, and does not alter browser-tested site behavior.

## Regression coverage

`tests/browser-cdp-startup.test.mjs` uses fake port files, mock CDP responses and a deterministic virtual clock. It checks:
1. valid/invalid Chrome port file;
2. delayed port file and delayed page-target discovery;
3. forged/non-loopback WebSocket URL and wrong port;
4. early Chrome exit versus readiness timeout;
5. retry scope (initialization only), existing website failures remain fail-closed.

GitHub Actions runs `npm run check` and Chrome desktop/mobile smoke independently on PRs and main. A green rerun confirms the launcher worked at that point; it does **not** prove that external runner failures can never recur.

## Other release gates unchanged

The website still defaults to `noindex`, weapon AR remains research-only, **408** community weapon rows and **7** source conflicts remain unchanged, and **0** independently approved game-client AR screenshot goldens are available. The task does not claim to fix game-data correctness or authorize an indexing release.
