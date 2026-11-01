// Brand rules for the name Lucidrail, used by scripts/check.mjs.
// Lucidrail is a separate product that governs AI agents. The site may name it, but only spelled "Lucidrail"
// (lowercase only inside its web address), and never as the provider of a service: Actuathron delivers the services.

// Anything that looks like the name, in any case or spelling: Lucidrail, LucidRail, Lucid Rail, Lucid-rail, Lucidrial ...
const NAME_LIKE = /\blucid[\s-]?r(?:ail|ial|ale|el|eil)s?\b/gi;
// The two forms allowed: the name as written, and the lowercase domain (lucidrail.ai, lucidrail.com).
const allowedAt = (text, m) => m[0] === 'Lucidrail' || (m[0] === 'lucidrail' && /^\.(?:ai|com)\b/.test(text.slice(m.index + m[0].length)));

// Words that would make Lucidrail the provider of a service, in the clause that starts with its name.
const PROVIDER = /\b(?:deliver(?:s|ed|ing)?|provid(?:es|ed|ing|er)s?\b|offer(?:s|ed|ing)?|runs?\b|build(?:s|ing)?\b|consult\w*|implement(?:s|ed|ing)?|services?\b|pilots?\b|workforces?\b)/i;
const NEGATION = /\b(?:not|never|no|doesn['’]t|isn['’]t)\b/i;

export function misspellings(text) {
  return [...text.matchAll(NAME_LIKE)].filter(m => !allowedAt(text, m)).map(m => m[0]);
}

// Returns the clauses that describe Lucidrail as a service provider.
export function providerClaims(text) {
  const found = [];
  for (const m of text.matchAll(/Lucidrail/g)) {
    const before = text.slice(Math.max(0, m.index - 40), m.index);
    // "services from Lucidrail", "a Lucidrail pilot", "Lucidrail's services"
    if (/\b(?:services?|pilots?|workforces?)\s+(?:from|by|of)\s+$/i.test(before) || /^['’]s\s+(?:services?|pilots?|workforces?)\b/i.test(text.slice(m.index + 9)) || /^\s+(?:services?|pilots?|workforces?)\b/i.test(text.slice(m.index + 9))) {
      found.push(text.slice(m.index, m.index + 60));
      continue;
    }
    // The clause after the name, up to the next sentence or clause break.
    const clause = text.slice(m.index + 9).split(/[.;:!?\n(]|,\s*and\b|\s—\s/)[0];
    if (PROVIDER.test(clause) && !NEGATION.test(clause)) found.push(`Lucidrail${clause}`);
  }
  return found;
}

// Actuathron no longer offers a dental service, and no longer sells a pilot (decisions of 28 October 2026).
// The built site must not mention either in any form: dental, dentist, dentistry, pilot, pilots. Words that
// merely contain the letters, such as "incidental" or "autopilot", pass. The only allowed places are the 308
// redirects in vercel.json.
const RETIRED = /\b(?:dent(?:al|ist)|pilot)\w*/gi;
export const retiredTerms = text => [...String(text).matchAll(RETIRED)].map(m => m[0]);
