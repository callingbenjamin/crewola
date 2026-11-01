// Tests the Lucidrail brand rules in src/brand.mjs: the right spelling passes, misspellings and
// any wording that makes Lucidrail a service provider fail.
import { misspellings, providerClaims, retiredTerms } from '../src/brand.mjs';

const cases = [
  // [text, misspellings expected, provider claims expected]
  ['Actuathron works. Lucidrail governs.', 0, 0],
  ['Actuathron builds and runs your AI workforce, and Lucidrail governs it.', 0, 0],
  ['Lucidrail is a separate product for governing AI agents, and it does not deliver services.', 0, 0],
  ['Lucidrail (https://lucidrail.ai/) is a separate product for governing AI agents.', 0, 0],
  ['LucidRail governs.', 1, 0],
  ['LUCIDRAIL', 1, 0],
  ['Lucid Rail', 1, 0],
  ['Lucid-rail', 1, 0],
  ['Lucidrial', 1, 0],
  ['lucidrail governs', 1, 0],
  ['Lucidrail delivers workflow pilots for hotel groups.', 0, 1],
  ['Lucidrail runs your AI workforce.', 0, 1],
  ['Lucidrail is a service company.', 0, 1],
  ['Lucidrail provides the services on this page.', 0, 1],
  ['Book a Lucidrail pilot today.', 0, 1],
  ["Lucidrail's services include hotels.", 0, 1],
  ['Workflow pilots from Lucidrail.', 0, 1],
];

let failed = 0;
for (const [text, spell, claims] of cases) {
  const s = misspellings(text).length, c = providerClaims(text).length;
  if (s !== spell || c !== claims) { failed++; console.error(`FAIL: "${text}" gave ${s} misspellings and ${c} provider claims, expected ${spell} and ${claims}`); }
}
// Retired offer: [text, matches expected]
const retired = [
  ['Actuathron for Dental', 1],
  ['dental groups and their practices', 1],
  ['Ask your dentist.', 1],
  ['DENTISTRY', 1],
  ['/media/dental/hero.mp4', 1],
  ['Plan a pilot', 1],
  ['Pilots run for 30 days.', 1],
  ['/guides/workflow-pilot-checklist', 1],
  ['incidental, accidental or consequential', 0],
  ['Set it on autopilot.', 0],
  ['Hotels, brokerages, dealerships, home services and property management', 0],
];
for (const [text, n] of retired) {
  const got = retiredTerms(text).length;
  if (got !== n) { failed++; console.error(`FAIL: "${text}" gave ${got} retired-offer matches, expected ${n}`); }
}
if (failed) process.exit(1);
console.log(`OK: ${cases.length} Lucidrail brand cases and ${retired.length} retired-offer cases.`);
