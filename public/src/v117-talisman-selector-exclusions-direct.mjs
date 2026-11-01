/** Authentic public Tarnished.dev v1.17 real selector observations.
 * Each selected-token result matched in TWO independent fresh Chrome runs.
 * No numeric effect is asserted or reconstructed from these rejected inputs.
 * Source: https://github.com/garrison2025/Elden-Ring/actions/runs/41294550820
 * Only the exact ordered two-click scene and naked Wretch all-10 context applies.
 */
const records=[
  {
    "names": [
      "Radagon's Soreseal",
      "Radagon's Scarseal"
    ],
    "actualSelectedNames": [
      "Radagon's Soreseal"
    ],
    "selectorOutcome": "FIRST_ONLY",
    "index": 0,
    "reference": "Tarnished.dev public v1.17",
    "sourceRun": "https://github.com/garrison2025/Elden-Ring/actions/runs/41294550820",
    "independentChromiumPasses": 2,
    "certifiesOnly": "Observed selector state after two clicks on naked Wretch all-10 Build page; no numeric effect or game-client equipability certification."
  },
  {
    "names": [
      "Marika's Scarseal",
      "Marika's Soreseal"
    ],
    "actualSelectedNames": [
      "Marika's Scarseal"
    ],
    "selectorOutcome": "FIRST_ONLY",
    "index": 1,
    "reference": "Tarnished.dev public v1.17",
    "sourceRun": "https://github.com/garrison2025/Elden-Ring/actions/runs/41294550820",
    "independentChromiumPasses": 2,
    "certifiesOnly": "Observed selector state after two clicks on naked Wretch all-10 Build page; no numeric effect or game-client equipability certification."
  },
  {
    "names": [
      "Marika's Soreseal",
      "Marika's Scarseal"
    ],
    "actualSelectedNames": [
      "Marika's Soreseal"
    ],
    "selectorOutcome": "FIRST_ONLY",
    "index": 2,
    "reference": "Tarnished.dev public v1.17",
    "sourceRun": "https://github.com/garrison2025/Elden-Ring/actions/runs/41294550820",
    "independentChromiumPasses": 2,
    "certifiesOnly": "Observed selector state after two clicks on naked Wretch all-10 Build page; no numeric effect or game-client equipability certification."
  },
  {
    "names": [
      "Radagon's Scarseal",
      "Radagon's Scarseal"
    ],
    "actualSelectedNames": [],
    "selectorOutcome": "NONE_SELECTED",
    "index": 3,
    "reference": "Tarnished.dev public v1.17",
    "sourceRun": "https://github.com/garrison2025/Elden-Ring/actions/runs/41294550820",
    "independentChromiumPasses": 2,
    "certifiesOnly": "Observed selector state after two clicks on naked Wretch all-10 Build page; no numeric effect or game-client equipability certification."
  },
  {
    "names": [
      "Starscourge Heirloom",
      "Starscourge Heirloom"
    ],
    "actualSelectedNames": [],
    "selectorOutcome": "NONE_SELECTED",
    "index": 4,
    "reference": "Tarnished.dev public v1.17",
    "sourceRun": "https://github.com/garrison2025/Elden-Ring/actions/runs/41294550820",
    "independentChromiumPasses": 2,
    "certifiesOnly": "Observed selector state after two clicks on naked Wretch all-10 Build page; no numeric effect or game-client equipability certification."
  },
  {
    "names": [
      "Crimson Amber Medallion",
      "Crimson Amber Medallion +1"
    ],
    "actualSelectedNames": [
      "Crimson Amber Medallion"
    ],
    "selectorOutcome": "FIRST_ONLY",
    "index": 5,
    "reference": "Tarnished.dev public v1.17",
    "sourceRun": "https://github.com/garrison2025/Elden-Ring/actions/runs/41294550820",
    "independentChromiumPasses": 2,
    "certifiesOnly": "Observed selector state after two clicks on naked Wretch all-10 Build page; no numeric effect or game-client equipability certification."
  },
  {
    "names": [
      "Arsenal Charm",
      "Arsenal Charm +1"
    ],
    "actualSelectedNames": [
      "Arsenal Charm"
    ],
    "selectorOutcome": "FIRST_ONLY",
    "index": 6,
    "reference": "Tarnished.dev public v1.17",
    "sourceRun": "https://github.com/garrison2025/Elden-Ring/actions/runs/41294550820",
    "independentChromiumPasses": 2,
    "certifiesOnly": "Observed selector state after two clicks on naked Wretch all-10 Build page; no numeric effect or game-client equipability certification."
  },
  {
    "names": [
      "Erdtree's Favor",
      "Erdtree's Favor +2"
    ],
    "actualSelectedNames": [
      "Erdtree's Favor"
    ],
    "selectorOutcome": "FIRST_ONLY",
    "index": 7,
    "reference": "Tarnished.dev public v1.17",
    "sourceRun": "https://github.com/garrison2025/Elden-Ring/actions/runs/41294550820",
    "independentChromiumPasses": 2,
    "certifiesOnly": "Observed selector state after two clicks on naked Wretch all-10 Build page; no numeric effect or game-client equipability certification."
  }
];
const deepFreeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(deepFreeze);Object.freeze(v)}return v};
export const V117_DIRECT_SELECTOR_EXCLUSIONS=deepFreeze(records);
