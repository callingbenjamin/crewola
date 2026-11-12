import { readFileSync } from 'node:fs';
import { SITE } from './site.mjs';
import { asset } from './assets.mjs';

export const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// JSON inside <script type="application/json">: keep "</script>" from closing the tag early.
export const jsonBlock = value => JSON.stringify(value).replace(/</g, '\\u003c');

// The logo: the amber mark (a fan in a chat bubble) and the wordmark (public/brand/crewola-logo.svg).
// Inline, the wordmark takes the text colour, so it reads ivory on the graphite header and footer.
const LOGO_FILE = readFileSync(new URL('../public/brand/crewola-logo.svg', import.meta.url), 'utf8').trim();
export const LOGO = LOGO_FILE
  .replace('<svg xmlns="http://www.w3.org/2000/svg" ', '<svg class="brand-logo" aria-hidden="true" focusable="false" ')
  .replace(/(<text\b[^>]*?)fill="#20292C"/, '$1fill="currentColor"');
if (!LOGO.includes('brand-logo') || !LOGO.includes('currentColor')) throw new Error('public/brand/crewola-logo.svg: expected one <svg> with a #20292C <text> wordmark');

const ARROW = '<span class="arr" aria-hidden="true">↗</span>';
export const arrow = ARROW;
export const arrowDown = '<span class="arr down" aria-hidden="true">↓</span>';

const pad2 = n => String(n).padStart(2, '0');

// A section label: spaced capitals. `tone` "accent" sets it in the signal colour. (A section index is no longer shown;
// a number passed here is ignored, so older callers keep working.)
export const eyebrow = (text, tone) =>
  `<div class="eyebrow${tone === 'accent' ? ' accent' : ''}"><span>${esc(text)}</span></div>`;

// jsonLd: a schema.org object from graph() in seo.mjs. noindex: keep the page out of search (404).
// imageAlt: one sentence naming the brand and what the share image shows.
// scripts: extra versioned module scripts from public/ (asset() URLs), loaded after site.js.
// styles: extra versioned stylesheets from public/, after styles.css. headScripts: plain versioned scripts that run
// before the page paints (no defer), for example to set a class on <html>; the CSP forbids inline scripts.
export function page({ path, title, description, summary, markdown, image, imageAlt, bodyClass = '', header, main, footer, config, jsonLd, ogType = 'website', noindex = false, scripts = [], styles = [], headScripts = [] }) {
  if (!imageAlt) throw new Error(`${path}: page() needs imageAlt for its share image`);
  const url = SITE.url + path;
  description = snippet(summary);
  const shareTitle = title;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">\n<link rel="alternate" type="text/markdown" href="/404.md">' : `<link rel="canonical" href="${url}">\n<link rel="alternate" type="text/markdown" href="${path === '/' ? '/index.md' : `${path}.md`}">`}
<meta name="theme-color" content="#0B0F11">
<meta name="color-scheme" content="dark">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(SITE.titleBrand)}">
<meta property="og:title" content="${esc(shareTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.url}${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE.url}${image}">
<meta name="twitter:image:alt" content="${esc(imageAlt)}">
<meta name="twitter:title" content="${esc(shareTitle)}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/site.webmanifest">
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
<link rel="preload" href="/fonts/geist-latin-v5.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/instrument-serif-latin-v5.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${asset('/styles.css')}">${styles.map(href => `\n<link rel="stylesheet" href="${href}">`).join('')}${headScripts.map(src => `\n<script src="${src}"></script>`).join('')}
<script src="${asset('/site.js')}" defer></script>${scripts.map(src => `\n<script type="module" src="${src}"></script>`).join('')}${jsonLd ? `\n<script type="application/ld+json">${jsonBlock(jsonLd)}</script>` : ''}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}><a class="skip" href="#main">Skip to content</a>
${header}
<main id="main">
${main}
</main>
${footer}${config ? `\n<script id="config" type="application/json">${jsonBlock(config)}</script>` : ''}
</body>
</html>
`;
}

const CHEVRON = '<svg class="chev" viewBox="0 0 12 8" width="10" height="7" aria-hidden="true" focusable="false"><path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function header({ label, links = [] }) {
  const cta = links.find(l => l.button) ?? { href: '/#start', label: 'Talk to us' };
  const resourceLinks = '<a href="/guides"><strong>Guides</strong><span>How-tos and definitions</span></a><a href="/privacy"><strong>Privacy</strong><span>Website privacy notice</span></a>';
  const menu = (id, name, body) => `<div class="menu"><button type="button" class="menu-btn" aria-expanded="false" aria-controls="${id}">${name}${CHEVRON}</button><div class="menu-panel" id="${id}">${body}</div></div>`;
  const buttons = `<a class="btn" href="${cta.href}">${esc(cta.label)}</a>`;
  const desktop = `${menu('menu-resources', 'Resources', resourceLinks)}<a href="/#how">How it works</a>${buttons}`;
  const mobile = `<p class="m-h">Resources</p>${resourceLinks}<a href="/#how"><strong>How it works</strong></a>${buttons}`;
  return `<header class="top"><div class="wrap nav"><div class="lockup"><a class="brand" href="/" aria-label="${SITE.name} home">${LOGO}</a><span class="brand-by">by Actuathron</span></div><nav class="desktop" aria-label="Main navigation">${desktop}</nav><details class="mobile"><summary>Menu</summary><nav aria-label="Mobile navigation">${mobile}</nav></details></div></header>`;
}

export function footer({ sectors, current }) {
  const link = (href, label, key) => `<li><a href="${href}"${key && key === current ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`;
  return `<footer class="footer"><div class="wrap">
<div class="foot-grid">
<div class="foot-brand"><a class="brand" href="/" aria-label="${SITE.name} home">${LOGO}</a><p>Service calls and quote requests, followed through with your team in control.</p></div>
<nav class="foot-nav" aria-label="Footer">
<div class="foot-col"><p class="foot-h">Resources</p><ul>${link('/guides', 'Guides', 'guides')}${link('/privacy', 'Privacy', 'privacy')}</ul></div>
<div class="foot-col"><p class="foot-h">Contact</p><ul><li><a href="mailto:${SITE.email}">${SITE.email}</a></li></ul></div>
</nav>
</div>
<div class="foot-bottom"><span class="governance">Built and run by <a href="https://actuathron.com/" rel="noopener">Actuathron</a>.</span>
<span class="copyright">© ${new Date().getFullYear()} ${SITE.name}</span></div>
</div></footer>`;
}

// The four principles, listed in the Markdown version of the home page (src/markdown.mjs).
export const PROMISES = ['Every request followed up', 'Agreed approval rules', 'Results you can measure', 'A person in control'];

export const COST_FAQ = {
  q: 'What does it cost?',
  a: 'The fees are agreed with you before work begins. We agree a fixed scope, setup fee, monthly service fee and usage limit first; there is no charge to prepare an enquiry.',
};

// Share image for the home page, guides and plain pages.
export const HOME_IMAGE_ALT = `Crewola: Every Enquiry. A Clearer Schedule. Enquiry handling for home service companies.`;

// Scope stated as plain facts. scope: { covers, excludes, instead?, insteadLabel? } (insteadLabel defaults to "Handled by").
export const scopeBlock = scope => `<dl class="scope-facts">
<div><dt>Covers</dt><dd>${esc(scope.covers)}</dd></div>
<div><dt>Does not cover</dt><dd>${esc(scope.excludes)}</dd></div>${scope.instead ? `
<div><dt>${esc(scope.insteadLabel ?? 'Handled by')}</dt><dd>${esc(scope.instead)}</dd></div>` : ''}
</dl>`;

// The questions are plain text inside <summary>: scripts/check.mjs matches them against the FAQPage markup,
// and styles.css numbers them with a counter.
export const faqList = items => `<div class="faq-list">\n${items.map(f => `<details><summary>${esc(f.q)}</summary><p>${f.html ?? esc(f.a)}</p></details>`).join('\n')}\n</div>`;

// The FAQ section shared by the home and industry pages, on a pale scene.
export const faqSection = items => `<section class="faq sec light paper-2" id="questions"><div class="wrap faq-grid">
<div class="faq-head">${eyebrow('Before we begin')}<h2>A few useful<br>answers.</h2></div>
${faqList(items)}
</div></section>`;

// Links under a "decisions stay with people" block. links: [{ href, label }]
export const boundaryLinks = (links = []) => links.length ? `<ul class="boundary-links">${links.map(l => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join('')}</ul>` : '';

// Answer-first block: a direct one- or two-sentence answer to "what is this and who is it for", then the scope and
// the key takeaways. summary: { question, answer, takeaways: [string], link?: { href, label } }
// scope (optional) is rendered under the answer as Covers / Does not cover / Handled by.
export const answerBlock = (summary, scope) => `<section class="answer" id="in-short" aria-labelledby="in-short-q">
<div class="answer-label">${eyebrow('In short')}</div>
<div class="answer-main"><h2 id="in-short-q">${esc(summary.question)}</h2><p class="lead">${esc(summary.answer)}</p>${scope ? scopeBlock(scope) : ''}${summary.link ? `<p class="answer-link"><a href="${summary.link.href}">${esc(summary.link.label)}</a></p>` : ''}
<div class="takeaways"><h3>Key takeaways <span aria-hidden="true">${pad2(summary.takeaways.length)}</span></h3><ul>${summary.takeaways.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div></div>
</section>`;

export const snippet = summary => {
  const text = `${SITE.definition} ${summary}`;
  if (text.length > 160) throw new Error(`description over 160 characters (${text.length}): ${text}`);
  return text;
};
