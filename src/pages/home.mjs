import { esc } from '../layout.mjs';
import { INDUSTRY_ART } from '../industry-art.mjs';
const pad2 = n => String(n).padStart(2, '0');
const motif = key => INDUSTRY_ART[key].motif;
export const HERO_SIZES = 'max(100vw, 178vh)';
export const stepsDiagram = steps => `<ol class="steps">${steps.map((s, i) => `<li class="step"><div class="step-node" aria-hidden="true"><span>${pad2(i + 1)}</span></div><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p>${s.example ? `<p class="step-example">${esc(s.example)}</p>` : ''}</li>`).join('')}</ol>`;

// Two rows of workflow names, drifting in opposite directions. items: [{ key, label }] (key: the industry, for
// its icon). Each row holds its items twice so the loop has no seam; the second copy is hidden with reduced motion.
// Decorative: the same names are listed on the industry pages.
export function marquee(items) {
  const chip = (it, i, copy) => `<span class="chip t${i % 3}"${copy ? ' data-copy' : ''}><span class="chip-icon">${motif(it.key)}</span>${esc(it.label)}</span>`;
  // A short row is repeated until it is long enough to fill the band, then doubled for the loop.
  const row = (list, rev) => {
    const times = Math.max(1, Math.ceil(7 / list.length));
    const once = Array.from({ length: times }, (_, t) => list.map((it, i) => chip(it, i, t > 0))).flat().join('');
    return `<div class="marquee-row${rev ? ' rev' : ''}">${once}${Array.from({ length: times }, () => list.map((it, i) => chip(it, i, true))).flat().join('')}</div>`;
  };
  const half = Math.ceil(items.length / 2);
  return `<div class="marquee" aria-hidden="true">${row(items.slice(0, half), false)}${row(items.slice(half), true)}</div>`;
}
