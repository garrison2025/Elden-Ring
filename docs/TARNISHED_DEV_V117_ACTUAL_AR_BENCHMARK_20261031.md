# Tarnished.dev v1.17 numeric benchmark — first measured case

## Captured reference result

- Reference site: https://www.tarnished.dev/build-planner
- Displayed game-data version: v1.17, not necessarily current Regulation 1.17.3.
- Captured source reading (2026-10-31): Uchigatana, Standard, +0, right hand, one-handed, STR 40, DEX 40, INT 10, FAI 10, ARC 10 → **displayed Total AR 172**.
- Link: https://www.tarnished.dev/build-planner?str=40&dex=40&int=10&fai=10&arc=10&rh1=Uchigatana&aRh1=Standard&smith=0&somber=0&twoHanded=false
- **Evidence limitation:** this rendering was available on one fetch; repeated automated attempts to load the same state returned blank weapon slots. We do not claim reliable independent reproduction of this UI state. Its `sourceRepeatable` flag is `false`, and it cannot satisfy a green release gate.

## How the source-versus-source comparison works

- `public/src/tarnished-reference-benchmark.mjs` explicitly records observed third-party AR and the exact five attributes/weapon/affinity/upgrade/grip. External data is never run as code.
- The existing optional `npm run audit:real-v117` retrieves the previously pinned v1.17 community JSON via HTTPS and checks numerical calculations with the site's own converter and AR engine. It now writes only a compact comparison result into `.audit/tarnished-v117-reference-comparison.json`.
- It distinguishes numerical matches, numerical differences, missing weapon variant, and blocked source conversion; none of these is confused with current-version client verification.
- Existing 3296-variant source snapshot and 14 independent current-reference examples are unaffected.
- Source provenance link points to `tarnished.dev`, not the unrelated `tarnished.app`.

## Minimum benchmark acceptance matrix (results PENDING, not fabricated)

Required for a usable reference-tested v1.17 AR release: **at least 12 stable source outputs**, 4 different weapons including at least 1 DLC, +0/intermediate/max upgrades, Standard/Keen/Heavy or other source-supported affinities, one-hand and two-hand inputs, and controls for unmet stat requirements. Each result must be retrieved from the same user-visible control state on Tarnished.dev and matched with our converter.

Planned weapons: Uchigatana, Longsword, Greatsword, Blasphemous Blade, Rellana's Twin Blades, and Fire Knight's Greatsword where Tarnished.dev displays the relevant variants. Avoid making claims for unavailable variants.

Because the public widget currently returns empty weapon selections for many share URLs, the single observed result is a **preliminary case** and cannot pass the full benchmark. We prioritize trustworthy evidence over inflating the number of tests.

No game client, emulator, paid API, user login, scraped proprietary artwork or redistributed raw regulation parameters are necessary.
