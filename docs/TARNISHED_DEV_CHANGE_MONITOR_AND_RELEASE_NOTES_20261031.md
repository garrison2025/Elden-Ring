# Tarnished.dev competitor monitoring and first-party release changelog (2026-10-31)

## Confirmed competitor evidence

- https://www.tarnished.dev/ contains a server-rendered #updates-heading, followed by a six-entry top Recent Updates ordered list, plus a separate older archive.
- Current main-page version as of this baseline: **Elden Ring v1.17**.
- Latest visible competitor change: **2026-10-23**, armor optimizer fixes for skipped combinations and new exclusion controls. Competitor data v1.17 notice: **2026-08-28**.
- Official Bandai Namco update **2026-10-20**: App **1.17.2**, Regulation **1.17.3**. Do not treat Tarnished.dev v1.17 as official current client evidence.

## What the automation actually does

- GitHub Action: `.github/workflows/monitor-tarnished.yml`, scheduled **08:17 and 20:17 Asia/Shanghai** (00:17 and 12:17 UTC). GitHub cron can run later or be disabled for inactive repositories; it is not a real-time guarantee.
- Uses only Python standard library to retrieve public HTTPS HTML. No site API key, login, paid provider, third-party JS execution, gameplay automation or scraping of private endpoints.
- Extracts only the current six top-level dated update records, preserving nested bullet meaning for hashes. Tracks title/bullet edits, newly dated updates and version-label changes. Ignores style changes, ads, HTML order unrelated to this structured list, and older archive entries.
- Snapshot: `monitoring/tarnished-dev-baseline.json` from 2026-10-31 public page. Records only dates, short excerpts and content hashes—not full copied competitor articles, scripts, images or proprietary data.
- On change, automatically creates **one GitHub Issue per distinct observation fingerprint**, including original URL, date, priority and an independent verification checklist. Existing issues (including closed) are checked to prevent duplicates. Pull request tests never create issues.
- If access fails, the updates section disappears or version is missing, the job **fails closed**. A broken fetch must never be reported as unchanged.
- Because the baseline stays stable until deliberately reviewed, if a later update occurs, subsequent checks will find the same change and deduplicate on the fingerprint. A changed fingerprint opens a new review issue.
- PR checks run Python parser regression tests and read-only live source comparison; on code changes also run Node tests/build. The GitHub repo has Issues enabled.

## How an external change becomes our real site release

1. Monitor creates a GitHub Issue. **No automatic replacement of data, formulas or content.**
2. Review competitor description and **official Bandai Namco patch notes**. Decide whether the change concerns ARMOR, AR, SPELL, DAMAGE, BUILD, DLC or UX.
3. Evaluate whether our existing site has the same problem/feature. For math fixes, obtain real same-input source observations and replay with our independent engine; do not assume competitor source is always correct.
4. Implement own functionality in a feature PR, preserve attribution/licensing and add regression tests. Current Regulation 1.17.3 client certification remains separate.
5. After merge and passing CI, **then** add an accurate entry to `/updates/` and optional homepage Recent Updates. This is our product history, never an automatic copy of competitor announcements.

## Limits and future improvements

- The monitor watches competitor **announced changes**, not all unseen JS/database changes. Silent numeric changes require a separate periodic representative AR test suite; don't claim zero drift from unchanged changelog.
- A public changelog is good for user trust, QA traceability and return visitors; by itself, it does not establish Google search demand or prove correctness.
- This monitor is not an asynchronous ChatGPT task. It is a scheduled **GitHub Actions** workflow; users can see runs at https://github.com/garrison2025/Elden-Ring/actions/workflows/monitor-tarnished.yml and triage issues at https://github.com/garrison2025/Elden-Ring/issues.
