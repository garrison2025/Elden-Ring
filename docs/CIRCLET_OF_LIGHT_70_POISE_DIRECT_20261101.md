# Circlet of Light — real site v1.17 direct evidence and 70 Poise fix

- Two independent Chrome browser sessions selected ONLY `Circlet of Light` in the exact Helm dropdown of Tarnished.dev public Build Planner with other armor empty.
- Both recorded **Head**, **Weight 1.0**, **Poise 5**, baseline final stats 10/10/10/10/10/10/10/10, equipped final stats 10/10/10/10/10/11/11/11.
- [GitHub Actions real two-pass run](https://github.com/garrison2025/Elden-Ring/actions/runs/41280906636), [JSON evidence artifact](https://github.com/garrison2025/Elden-Ring/actions/runs/41280906636/artifacts/13073152712).
- The first 568 pinned community item rows and all their original 549 weight/Poise, 514×12 derivative fields remain untouched.
- This new item is appended as **one additional DLC row (569 total)** with only the two browser-proven numeric fields eligible for Poise optimization. The 12 remaining metrics are `null`, and stat bonuses (INT/FAI/ARC +1) are documented but are **not** automatically applied to other calculators without an independent effect model.
- A four-piece directly observed reference combination includes Circlet 1.0/5, Tree Sentinel Armor 18.9/39, Preceptor's Gloves 2.1/3, Tree Sentinel Greaves 11.7/23: weight 33.7 and Poise 70. No constant or result override is permitted. The optimizer must solve from item rows and preserve roll-tier/exclusion logic.
- Actual global 550-item optimum comes from `node scripts/verify-circlet-70-live-source.mjs`; its CI log, not this document, is authoritative for the final combination. The supplement does not certify all DLC or the full Tarnished.dev multi-attribute optimizer.
