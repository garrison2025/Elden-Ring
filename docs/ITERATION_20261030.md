# October 30, 2026 — usability iteration

## Implemented

- **Build Planner:** live links to class optimization (same eight target attributes) and rune planning (current origin level to planned level). No backend, no new data source.
- **Class Optimizer:** supports prefilled target stats via URL and links the winning origin back to an editable build; edition-specific extra origins remain user-selectable.
- **Rune Calculator:** existing rune-budget field truly optional; optional, user-supplied runes per farming run to estimate the number of whole runs for the shortfall; entered URL `from`/`to` preset supported.
- **Equip Load:** actionable threshold advice for current load tier, with exact strict-inequality wording.
- **All calculators:** invalid required inputs clear stale displayed results instead of leaving the previous form's number on screen.
- **Tests:** pure helper tests for share links and farming runs; HTML/JS wiring tests. Desktop and 390px DOM-interaction checks in an isolated Chromium DOM harness.

## Limitations

- No fully validated item catalog, weapon AR, enemy damage or armor optimizer was added.
- Pure function/unit tests and isolated DOM-interaction tests do not substitute for real client golden-vector checks, live browser E2E, or Cloudflare deployment verification.
- The site must remain noindex when `SITE_URL` is absent. Do not activate SEO indexing merely to test these improvements.

## Validation checklist

1. `npm run check` (tests and build).
2. Check the four tools at 390px and desktop widths; edit inputs and confirm correct result or validation error.
3. Follow Build → Class → Build and Build → Runes navigation with URL parameters and confirm they are preserved.
4. Input invalid level, stat, or maximum equip load and ensure all results are cleared.
5. Once Cloudflare deploys, inspect the real pages and leave the early-stage unverified AR research unindexed.
