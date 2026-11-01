// Sanity checks on the built site: every internal link and anchor resolves, no leftover text slipped in,
// structured data parses and matches the visible FAQ, and the crawler files exist.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BLOCKED_ROBOTS, ALLOWED_ROBOTS, SIGNAL } from '../src/crawlers.mjs';
import { misspellings, providerClaims, retiredTerms } from '../src/brand.mjs';

const DIST = 'dist';
const files = [];
const walk = dir => readdirSync(dir).forEach(f => {
  const p = join(dir, f);
  statSync(p).isDirectory() ? walk(p) : files.push(p);
});
walk(DIST);

const pages = files.filter(f => f.endsWith('.html'));
const routeFile = route => {
  if (route === '/') return join(DIST, 'index.html');
  const p = join(DIST, route);
  if (existsSync(p) && statSync(p).isFile()) return p;
  if (existsSync(p + '.html')) return p + '.html';
  if (existsSync(join(p, 'index.html'))) return join(p, 'index.html');
  return null;
};
const ids = file => new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));

const problems = [];
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  // Lucidrail may be named as the separate governance product: spelled "Lucidrail", never as a service provider.
  for (const w of misspellings(html)) problems.push(`${page}: write "Lucidrail", not "${w}"`);
  const text = html.replace(/<script(?! type="application\/ld\+json")[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  const metas = [...html.matchAll(/<meta [^>]*content="([^"]*)"/g)].map(m => m[1]).join(' . ');
  for (const c of providerClaims(`${text} . ${metas}`)) problems.push(`${page}: describes Lucidrail as a service provider ("${c.trim()}")`);
  if (/\bundefined\b|\[object Object\]/.test(html)) problems.push(`${page}: template rendered an empty value`);
  const srcsets = [...html.matchAll(/srcset="([^"]+)"/g)].flatMap(m => m[1].split(',').map(c => c.trim().split(/\s+/)[0]));
  const refs = [...[...html.matchAll(/(?:href|src|poster)="([^"]+)"/g)].map(m => m[1]), ...srcsets];
  for (const ref of refs) {
    if (/^(https?:|mailto:)/.test(ref)) continue;
    const [path, hash] = ref.replace(/\?v=[0-9a-f]+/, '').split('#');
    const target = path === '' ? page : routeFile(path);
    if (!target) { problems.push(`${page}: broken link ${ref}`); continue; }
    if (hash && target.endsWith('.html') && !ids(target).has(hash)) problems.push(`${page}: missing anchor ${ref}`);
  }
  // Structured data must parse, and an FAQPage must carry exactly the questions the page shows.
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const isNotFound = page.endsWith('404.html');
  if (!isNotFound && blocks.length !== 1) problems.push(`${page}: expected one JSON-LD block, found ${blocks.length}`);
  for (const b of blocks) {
    let data;
    try { data = JSON.parse(b); } catch (e) { problems.push(`${page}: JSON-LD does not parse (${e.message})`); continue; }
    const nodes = data['@graph'] ?? [data];
    const faq = nodes.find(n => n['@type'] === 'FAQPage');
    const shown = [...html.matchAll(/<details><summary>([^<]*)<\/summary>/g)].map(m => m[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"'));
    if (shown.length && !faq) problems.push(`${page}: shows an FAQ but has no FAQPage markup`);
    if (faq && JSON.stringify(faq.mainEntity.map(q => q.name)) !== JSON.stringify(shown)) problems.push(`${page}: FAQPage questions differ from the visible FAQ`);
  }
  // The meta description is the page's one-sentence definition, so it must also be visible on the page, word for word.
  const decode = t => t.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const meta = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
  const visible = decode(html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
  if (!isNotFound && (!meta || !visible.includes(meta))) problems.push(`${page}: the meta description does not appear in the visible text`);
  if (!/<meta property="og:image:alt" content="[^"]+"/.test(html) || !/<meta name="twitter:image:alt" content="[^"]+"/.test(html)) problems.push(`${page}: missing og:image:alt or twitter:image:alt`);
  // A HowTo must list exactly the steps the page shows, and a Service must use the page's definition.
  for (const b of blocks) {
    let nodes; try { const d = JSON.parse(b); nodes = d['@graph'] ?? [d]; } catch { continue; }
    const howto = nodes.find(n => n['@type'] === 'HowTo');
    if (howto) {
      const list = html.match(/<ol class="start-steps">([\s\S]*?)<\/ol>/)?.[1] ?? '';
      const shown = [...list.matchAll(/<strong>([^<]*)\.<\/strong>/g)].map(m => decode(m[1]));
      if (JSON.stringify(howto.step.map(x => x.name)) !== JSON.stringify(shown)) problems.push(`${page}: HowTo steps differ from the visible steps`);
    }
    const svc = nodes.find(n => n['@type'] === 'Service');
    if (svc && svc.description !== meta) problems.push(`${page}: Service description differs from the page definition`);
    if (svc) for (const k of ['image', 'availableChannel', 'audience', 'provider']) if (!svc[k]) problems.push(`${page}: Service has no ${k}`);
  }
  if (!isNotFound && !/<link rel="canonical"/.test(html)) problems.push(`${page}: no canonical link`);
  if (isNotFound && !/<meta name="robots" content="noindex">/.test(html)) problems.push(`${page}: 404 page must be noindex`);
}
for (const f of ['robots.txt', 'sitemap.xml', 'llms.txt', 'llms-full.txt']) if (!existsSync(join(DIST, f))) problems.push(`${f}: missing`);
// robots.txt: the AI training group comes first and disallows everything; each search and answer crawler and "*"
// has its own Allow group; every group carries the content signal; no other agents appear.
if (existsSync(join(DIST, 'robots.txt'))) {
  const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
  const groups = robots.split(/\n\s*\n/).map(g => g.trim().split('\n').filter(l => !l.startsWith('#'))).filter(g => g[0]?.startsWith('User-agent:'))
    .map(lines => ({ agents: lines.filter(l => l.startsWith('User-agent:')).map(l => l.slice('User-agent:'.length).trim()), rules: lines.filter(l => !l.startsWith('User-agent:')) }));
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  if (!groups.length || !same(groups[0].agents, BLOCKED_ROBOTS)) problems.push(`robots.txt: the first group must list exactly the AI training crawlers in src/crawlers.mjs`);
  else if (!same(groups[0].rules, [SIGNAL, 'Disallow: /'])) problems.push(`robots.txt: the AI training group must be "${SIGNAL}" then "Disallow: /"`);
  for (const a of [...ALLOWED_ROBOTS, '*']) {
    const g = groups.find(g => g.agents.includes(a));
    if (!g || g.agents.length !== 1 || !same(g.rules, [SIGNAL, 'Allow: /'])) problems.push(`robots.txt: ${a} needs its own group with "${SIGNAL}" and "Allow: /"`);
  }
  for (const g of groups) if (!g.rules.includes(SIGNAL)) problems.push(`robots.txt: group "${g.agents.join(', ')}" lacks "${SIGNAL}"`);
  const known = [...BLOCKED_ROBOTS, ...ALLOWED_ROBOTS, '*'];
  for (const a of groups.flatMap(g => g.agents)) if (!known.includes(a)) problems.push(`robots.txt: unexpected agent "${a}"; add it to src/crawlers.mjs`);
  const all = groups.flatMap(g => g.agents);
  if (new Set(all).size !== all.length) problems.push('robots.txt: an agent appears in more than one group');
}
if (existsSync(join(DIST, 'llms.txt')) && !readFileSync(join(DIST, 'llms.txt'), 'utf8').includes('\n## AI training\n')) problems.push('llms.txt: missing the "AI training" policy section');
if (existsSync(join(DIST, 'llms.txt')) && !readFileSync(join(DIST, 'llms.txt'), 'utf8').includes('\n## For AI assistants\n')) problems.push('llms.txt: missing the "For AI assistants" section');
const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}\u{FE0F}]/u;
for (const f of files.filter(f => /\.(html|css|js|xml|txt)$/.test(f) && !f.endsWith('OFL.txt'))) {
  if (emoji.test(readFileSync(f, 'utf8'))) problems.push(`${f}: contains an emoji`);
}
for (const f of files.filter(f => /\.(css|js|xml|txt)$/.test(f) && !f.endsWith('OFL.txt'))) {
  const body = readFileSync(f, 'utf8');
  for (const w of misspellings(body)) problems.push(`${f}: write "Lucidrail", not "${w}"`);
  for (const c of providerClaims(body)) problems.push(`${f}: describes Lucidrail as a service provider ("${c.trim()}")`);
}
// Retired terms: no file name or text file in the built site may mention dental or a pilot.
for (const f of files) {
  for (const w of retiredTerms(f)) problems.push(`${f}: file name mentions a retired term ("${w}")`);
  if (/\.(html|css|js|mjs|json|xml|txt|svg|webmanifest)$/.test(f)) for (const w of new Set(retiredTerms(readFileSync(f, 'utf8')))) problems.push(`${f}: mentions a retired term ("${w}"); there is no dental service and no pilot`);
}

// Request films: every card (the hero, each scene and the workflow) is a film of 4 to 6 shots that opens on the
// customer's message, has a customer step, and whose summary and closing line count each step once, by who does
// it, adding up to the steps on that card. The llms files' summaries must add up too.
{
  const text = h => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
  const sums = (line, count) => {
    const m = /^(\d+) steps: ([^·]+?)(?: · .+)?\.?$/.exec(line || '');
    if (!m) return false;
    const parts = m[2].split(', ').map(p => /^(\d+) by \S/.exec(p));
    if (parts.some(p => !p)) return false;
    const total = parts.reduce((t, p) => t + Number(p[1]), 0);
    return total === Number(m[1]) && (count === undefined || total === count);
  };
  const home = readFileSync(join(DIST, 'index.html'), 'utf8');
  const starts = [...home.matchAll(/<div class="film(?: film-compact)?" /g)].map(m => m.index);
  if (starts.length < 5) problems.push(`index.html: expected the hero, workflow and three scenario films (found ${starts.length})`);
  starts.forEach((start, i) => {
    const chunk = home.slice(start, home.indexOf('</ol></div>\n<div class="film-foot">', start));
    const shots = chunk.split(/<li class="shot k\d/).slice(1);
    if (shots.length < 4 || shots.length > 6) problems.push(`index.html: film ${i + 1} has ${shots.length} shots (4 to 6 expected)`);
    if (!/class="film-step lane-customer/.test(shots[0] || '') || !/class="fb fb-customer/.test(shots[0] || '')) problems.push(`index.html: film ${i + 1} does not open on the customer's message`);
    if (shots.some(sh => !/class="shot-title"/.test(sh))) problems.push(`index.html: film ${i + 1} has a shot without a title line`);
    const count = (chunk.match(/class="film-step /g) || []).length;
    const rest = home.slice(start, home.indexOf('</div>\n</div>', home.indexOf('<div class="film-foot">', start)));
    for (const cls of ['film-summary', 'film-end']) {
      const m = new RegExp(`<p class="${cls}[^"]*">([\\s\\S]*?)<\\/p>`).exec(rest);
      if (!m || !sums(text(m[1]), count)) problems.push(`index.html: film ${i + 1} ${cls} does not add up to ${count} steps (${m ? text(m[1]) : 'missing'})`);
    }
  });
  for (const f of ['llms.txt', 'llms-full.txt']) {
    const body = readFileSync(join(DIST, f), 'utf8');
    for (const m of body.matchAll(/(\d+ steps: [^.;)\n]+)/g)) if (!sums(m[1])) problems.push(`${f}: summary does not add up (${m[1]})`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`OK: ${pages.length} pages, ${files.length} files, all links and anchors resolve.`);
