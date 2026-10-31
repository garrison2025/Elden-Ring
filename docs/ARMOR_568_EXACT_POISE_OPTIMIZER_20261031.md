# Exact source-wide Poise optimizer — 2026-10-31

**Scope:** independently authored, user-initiated source reference research in `/armor-optimizer/`. **Not** full Tarnished.dev v1.17 armor/damage/Build parity or current game regulation verification.

## Source and fidelity
- User voluntarily loads the same pinned public [568 community armors](https://github.com/deliton/eldenring-api/blob/3d9cefcfcda7066796b9553825449039c2073926/api/public/data/armors.json) as the optional Build Planner armor autocomplete. No images, descriptions, source JavaScript, lore text or upstream data file bundled on site.
- Source categories total **167 Helm, 203 Chest Armor, 94 Gauntlet/Gauntlets and 104 Leg Armor**.
- 3 records have no valid single Poise field. Their Poise is **unknown**, never the number zero, and they are explicitly excluded from a max-source-Poise optimization.
- Data version and redistribution rights remain unverified. Published source metrics have not been cross-checked against Regulation 1.17.3 game menus, and may be incomplete or outdated.

## Algorithm
- Objective: **maximize the additive Poise values reported by this snapshot**, not negate attacks, optimize armor effects, or maximize fashion.
- Select exactly one item OR an empty slot in each Head/Chest/Arms/Legs position, with optional named exclusions. Uses the same user-entered maximum equip load, reserved gear weight and selected 30/70/100% tier from existing manual optimizer.
- Equip tier boundaries are strict: the solution must be **below**, not equal to, the tier weight limit. Input weights normalized to thousandths; no silent float fuzz or fabricated missing Poise.
- Exact dynamic programming stores the best Poise subset for each permitted weight state after each slot. Equal Poise is resolved by lighter weight, then stable ID sort, with no arbitrary 12-candidates-per-slot cap. Runs off the browser main thread via a Worker.
- Shows four actual picked source records with per-slot source weight and Poise; notes total equipped weight, Poise, roll tier, 3 unknown exclusions and explicit exclusions. Empty slots allowed, and **no-solution** states are not filled with fake outputs.
- Original manually entered CSV solver and its fictional startup examples remain available and separate. No premium API or server storage.

## Tests
- Unit tests compare the exact optimizer against full brute-force enumeration for **20 deterministic smaller four-slot scenarios** and exercise strict tier boundaries, reserved gear weight, minimum Poise, exclusions and malformed inputs.
- Source parser fails closed on duplicate IDs, count changes and malformed weights. Public-source test explicitly loads 568 rows in real Chrome and verifies 3 Poise unknowns, source-wide exact Worker result and four position rows, while retaining 375px layout regression.
- Research route stays `noindex`, no changes to the reviewed five-route Cloudflare main sitemap.

## STILL REQUIRED FOR FULL PARITY
Version-verified armor with DLC and Tarnished Pack flags; selected equipment ownership, exact all-elements negation/resistance and armor effects; Great Rune/talisman/buff stacking, enemy damage and precise spell scaling; source re-use rights and game-client golden observations. Master issue [#86](https://github.com/garrison2025/Elden-Ring/issues/86) stays OPEN.
