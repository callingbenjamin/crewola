// Sanity checks on the built site: every internal link and anchor resolves, no leftover text slipped in,
// structured data parses and matches the visible FAQ, and the crawler files exist.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BLOCKED_ROBOTS, ALLOWED_ROBOTS, SIGNAL } from '../src/crawlers.mjs';
import { misspellings, providerClaims, retiredTerms } from '../src/brand.mjs';
import { SITE } from '../src/site.mjs';
if (!SITE.description.startsWith(SITE.definition.slice(0, -1))) throw new Error('SITE.definition must be the start of SITE.description');

const DIST = 'dist';
const files = [];
const walk = dir => readdirSync(dir).forEach(f => {
  const p = join(dir, f);
  statSync(p).isDirectory() ? walk(p) : files.push(p);
});
walk(DIST);

const pages = files.filter(f => f.endsWith('.html'));
const redirects = JSON.parse(readFileSync('vercel.json', 'utf8')).redirects ?? [];
const routeFile = route => {
  route = redirects.find(r => r.source === route)?.destination ?? route;
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
  if (blocks.length !== 1) problems.push(`${page}: expected one JSON-LD block, found ${blocks.length}`);
  for (const b of blocks) {
    let data;
    try { data = JSON.parse(b); } catch (e) { problems.push(`${page}: JSON-LD does not parse (${e.message})`); continue; }
    const nodes = data['@graph'] ?? [data];
    const faq = nodes.find(n => n['@type'] === 'FAQPage');
    const shown = [...html.matchAll(/<details><summary>([^<]*)<\/summary>/g)].map(m => m[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"'));
    if (shown.length && !faq) problems.push(`${page}: shows an FAQ but has no FAQPage markup`);
    if (faq && JSON.stringify(faq.mainEntity.map(q => q.name)) !== JSON.stringify(shown)) problems.push(`${page}: FAQPage questions differ from the visible FAQ`);
    if (faq) {
      const clean = t => t.replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
      const answers = [...html.matchAll(/<details><summary>[^<]*<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map(m => clean(m[1]));
      if (JSON.stringify(faq.mainEntity.map(q => clean(q.acceptedAnswer.text))) !== JSON.stringify(answers)) problems.push(`${page}: FAQPage answers differ from visible answers`);
    }

  }
  // The meta description is the page's one-sentence definition, so it must also be visible on the page, word for word.
  const decode = t => t.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const meta = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
  const visible = decode(html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
  // Each description is SITE.definition (the start of the full definition) and one sentence the page shows, after an
  // optional "Guide: " style label, so it never says anything the site does not.
  const tail = meta.startsWith(`${SITE.definition} `) ? meta.slice(SITE.definition.length + 1).replace(/^[A-Z][a-z]+: /, '').replace(/\.$/, '') : null;
  if (!isNotFound && (!tail || !visible.includes(tail))) problems.push(`${page}: the meta description is not SITE.definition plus a sentence the page shows`);
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
    if (svc && svc.description !== SITE.description) problems.push(`${page}: Service description differs from the page definition`);
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
for (const f of files.filter(f => /\.(html|css|js|xml|txt|md)$/.test(f) && !f.endsWith('OFL.txt'))) {
  if (emoji.test(readFileSync(f, 'utf8'))) problems.push(`${f}: contains an emoji`);
}
for (const f of files.filter(f => /\.(css|js|xml|txt)$/.test(f) && !f.endsWith('OFL.txt'))) {
  const body = readFileSync(f, 'utf8');
  for (const w of misspellings(body)) problems.push(`${f}: write "Lucidrail", not "${w}"`);
  for (const c of providerClaims(body)) problems.push(`${f}: describes Lucidrail as a service provider ("${c.trim()}")`);
}
// Footage credits live in CREDITS.md only: no built page or text file names the stock library or says 'stock footage'.
for (const f of files.filter(f => /\.(html|css|js|json|xml|txt|webmanifest)$/.test(f) && !f.endsWith('OFL.txt'))) {
  if (/pexels|higgsfield|stock footage/i.test(readFileSync(f, 'utf8'))) problems.push(`${f}: footage credit belongs in CREDITS.md, not on the site`);
}
// Films have no controls: no button, role=button, link, field or tabindex anywhere inside a film.
for (const f of files.filter(f => f.endsWith('.html'))) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/<div class="film[ "][\s\S]*?<div class="film-foot">[\s\S]*?<\/div>\n<\/div>/g)) {
    if (/<(button|a|input|select|textarea|summary)\b|role="button"|tabindex=|film-(pause|replay|ctl)|flow-ctl/.test(m[0])) problems.push(`${f}: a film has a control or focusable element; films play on their own`);
  }
  if (/film-(pause|replay|ctl)|flow-ctl/.test(html)) problems.push(`${f}: leftover film control markup`);
}
// The hero background film has no control of any kind (Benjamin, Nov 1 2026: no buttons on animations; the video just
// loops). The hero section may hold links (its calls to action) but no button, form control, tabindex, native video
// controls or play/pause wording, and neither site.js nor styles.css may carry a hero video control.
{
  const html = readFileSync(join(DIST, 'index.html'), 'utf8');
  const hero = html.match(/<section class="hero[^"]*"[\s\S]*?<\/section>/)?.[0] ?? '';
  if (!hero) problems.push('index.html: hero section not found');
  const video = hero.match(/<video id="hero-video"[^>]*>/)?.[0] ?? '';
  if (!/ muted\b/.test(video) || !/ loop\b/.test(video) || !/ playsinline\b/.test(video)) problems.push('index.html: hero video must be muted, loop and playsinline');
  if (/ controls\b/.test(video)) problems.push('index.html: hero video must not have native controls');
  for (const [re, what] of [[/<(button|input|select|textarea|summary)\b/i, 'a button or form control'], [/\btabindex\s*=/i, 'a tabindex'], [/\b(pause|play)\s+video\b/i, 'play or pause wording'], [/video-(toggle|control)/i, 'a video control id or class']]) {
    if (re.test(hero)) problems.push(`index.html: the hero must not contain ${what}`);
  }
  for (const f of ['site.js', 'styles.css', 'index.md', 'llms-full.txt']) {
    const text = readFileSync(join(DIST, f), 'utf8');
    if (/video-(toggle|control)|\b(pause|play)\s+video\b/i.test(text)) problems.push(`${f}: mentions a hero video control`);
  }
}
// Retired terms: no file name or text file in the built site may mention retired trade or a retired offer.
for (const f of files) {
  for (const w of retiredTerms(f)) problems.push(`${f}: file name mentions a retired term ("${w}")`);
  if (/\.(html|css|js|mjs|json|xml|txt|md|svg|webmanifest)$/.test(f)) for (const w of new Set(retiredTerms(readFileSync(f, 'utf8')))) problems.push(`${f}: mentions a retired term ("${w}"); there is no retired trade service and no retired offer`);
}

// Search, answer and share readiness: descriptions, twitter:image, the deferred script, Markdown copies, IndexNow.
{
  const { SITE, PATHS } = await import('../src/site.mjs');
  const unesc = t => t.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  for (const f of pages) {
    const html = readFileSync(f, 'utf8');
    for (const k of ['name="description"', 'property="og:description"', 'name="twitter:description"']) {
      const m = new RegExp(`<meta ${k} content="([^"]*)">`).exec(html);
      const t = m ? unesc(m[1]) : '';
      if (!m) problems.push(`${f}: missing <meta ${k}>`);
      else if (t.length > 160) problems.push(`${f}: ${k} is ${t.length} characters (160 at most)`);
      else if (!t.startsWith(`${SITE.definition} `)) problems.push(`${f}: ${k} must start with SITE.definition`);
    }
    if (!html.includes('<meta name="twitter:card" content="summary_large_image">')) problems.push(`${f}: twitter:card must be summary_large_image`);
    if (!html.includes(`<meta name="twitter:image" content="${SITE.url}/og/home.png">`)) problems.push(`${f}: missing absolute twitter:image`);
    for (const m of html.matchAll(/<script\b[^>]*>/g)) {
      const tag = m[0];
      if (/type="application\/(ld\+)?json"/.test(tag)) continue;
      if (!/\sdefer\b|type="module"/.test(tag)) problems.push(`${f}: render-blocking script (${tag}); use defer or type="module"`);
    }
    const md = /<link rel="alternate" type="text\/markdown" href="([^"]+)">/.exec(html);
    if (md && !existsSync(join(DIST, md[1]))) problems.push(`${f}: Markdown copy ${md[1]} missing`);
    if (!md && !html.includes('<meta name="robots" content="noindex">')) problems.push(`${f}: no Markdown alternate link`);
  }
  const llms = readFileSync(join(DIST, 'llms.txt'), 'utf8');
  for (const f of ['index.md', 'guides.md', ...SITE.guides.map(s => `guides/${s}.md`), 'privacy.md']) {
    if (!existsSync(join(DIST, f))) problems.push(`${f}: missing Markdown copy`);
    else if (!readFileSync(join(DIST, f), 'utf8').startsWith('# ')) problems.push(`${f}: Markdown copy must start with a # heading`);
    if (!llms.includes(`(${SITE.url}/${f})`)) problems.push(`llms.txt: does not list /${f}`);
  }
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
  if (!vercel.headers.some(h => h.source === '/(.*)\\.md' && h.headers.some(x => x.key === 'Content-Type' && x.value.startsWith('text/markdown')))) problems.push('vercel.json: .md files must be served as text/markdown');
  const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  if (locs.join() !== PATHS.map(p => SITE.url + p).join()) problems.push('sitemap.xml and PATHS (the IndexNow URL list) differ');
  const k = join(DIST, `${SITE.indexNowKey}.txt`);
  if (!/^[a-f0-9]{32}$/.test(SITE.indexNowKey ?? '') || !existsSync(k) || readFileSync(k, 'utf8').trim() !== SITE.indexNowKey) problems.push('IndexNow key file missing or wrong');
  const { INDEXNOW_PATH } = await import('../middleware.js');
  if (!existsSync(`.${INDEXNOW_PATH}.js`)) problems.push(`middleware.js INDEXNOW_PATH ${INDEXNOW_PATH} has no function file`);
}

for (const f of pages) {
  const html = readFileSync(f, 'utf8');
  if (/ style=|<style\b|<script(?![^>]*type="application\/(?:ld\+)?json")(?![^>]*src=)/.test(html)) problems.push(`${f}: inline executable script or style violates CSP`);
  for (const title of [...html.matchAll(/<(?:title)>(.*?)<\/title>|<meta (?:property="og:title"|name="twitter:title") content="([^"]*)"/g)]) if (!(title[1] ?? title[2]).endsWith(' | Crewola by Actuathron')) problems.push(`${f}: incorrect title brand`);
}
const sourceFiles = [];
const scanSource = dir => readdirSync(dir).forEach(name => { const path = join(dir, name); statSync(path).isDirectory() ? scanSource(path) : sourceFiles.push(path); });
scanSource('src');
for (const f of sourceFiles) if (retiredTerms(readFileSync(f, 'utf8')).length) problems.push(`${f}: retired content in source`);
const excludedNames = /Sarah Chen|Elena Rodriguez|\bMarcus\b|\bPriya\b|Alex Johnson/i;
for (const f of [...sourceFiles, ...files.filter(f => /\.(html|md|txt|js|css|xml|json)$/.test(f) && !f.endsWith('OFL.txt'))]) {
  const text = readFileSync(f, 'utf8');
  if (excludedNames.test(text)) problems.push(`${f}: excluded example name`);
}
for (const r of redirects) {
  if (!r.permanent || redirects.some(next => next.source === r.destination) || !routeFile(r.destination)) problems.push(`vercel.json: invalid or chained redirect ${r.source}`);
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`OK: ${pages.length} pages, ${files.length} files, all links and anchors resolve.`);
