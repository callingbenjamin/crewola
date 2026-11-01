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

const ARROW = '<span aria-hidden="true">↗</span>';
export const arrow = ARROW;

// jsonLd: a schema.org object from graph() in seo.mjs. noindex: keep the page out of search (404).
// imageAlt: one sentence naming the brand and what the share image shows.
export function page({ path, title, description, image, imageAlt, bodyClass = '', header, main, footer, config, jsonLd, ogType = 'website', noindex = false }) {
  if (!imageAlt) throw new Error(`${path}: page() needs imageAlt for its share image`);
  const url = SITE.url + path;
  const shareTitle = title.split(' — ')[0] === SITE.name ? title.replace(' — ', ': ') : title.split(' — ')[0];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<meta name="theme-color" content="#20292C">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${esc(shareTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.url}${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image:alt" content="${esc(imageAlt)}">
<meta name="twitter:title" content="${esc(shareTitle)}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/fonts/geist-latin-v5.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${asset('/styles.css')}">
<noscript><link rel="stylesheet" href="${asset('/noscript.css')}"></noscript>
<script src="${asset('/site.js')}" defer></script>${jsonLd ? `\n<script type="application/ld+json">${jsonBlock(jsonLd)}</script>` : ''}
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

// links: [{ href, label, button? }]
export function header({ label, links }) {
  const items = links.map(l => l.button
    ? `<a class="btn" href="${l.href}">${esc(l.label)} ${ARROW}</a>`
    : `<a href="${l.href}">${esc(l.label)}</a>`).join('');
  return `<header class="top"><div class="wrap nav"><a class="brand" href="/" aria-label="${SITE.name}${label ? ` ${esc(label)}` : ''} home">${LOGO}${label ? ` <small>${esc(label)}</small>` : ''}</a><nav class="desktop" aria-label="Main navigation">${items}</nav><details class="mobile"><summary>Menu</summary><nav aria-label="Mobile navigation">${items}</nav></details></div></header>`;
}

// footage: [{ credit, url }] for the stock video credits shown on the page.
export function footer({ current, footage = [] }) {
  const credits = footage.map(f => `${esc(f.credit)} · <a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">Pexels</a>`).join('; ');
  return `<footer class="footer"><div class="wrap">
<div class="foot-top"><a class="brand" href="/" aria-label="${SITE.name} home">${LOGO}</a><nav class="foot-links" aria-label="Footer"><a href="/"${current === 'home' ? ' aria-current="page"' : ''}>HVAC and home services</a><a href="/guides"${current === 'guides' ? ' aria-current="page"' : ''}>Guides</a><a href="/privacy"${current === 'privacy' ? ' aria-current="page"' : ''}>Privacy</a></nav></div>
<div class="foot-bottom"><span>Service calls and quote requests, followed through with your team in control. <a href="mailto:${SITE.email}">${SITE.email}</a></span><span class="governance">Built and run by <a href="${SITE.parent.url}" rel="noopener">${SITE.parent.name}</a>.</span><span class="copyright">© ${new Date().getFullYear()} ${SITE.name}</span></div>${footage.length ? `\n<div class="footage-note">Stock footage: ${credits}</div>` : ''}
</div></footer>`;
}

export const PROMISES = ['Every enquiry followed up', 'Agreed approval rules', 'Results you can measure', 'A person in control'];

export const promiseStrip = () =>
  `<div class="promise-strip">${PROMISES.map((p, i) => `<span><strong>0${i + 1}</strong> ${p}</span>`).join('')}</div>`;

export const COST_FAQ = {
  q: 'What does it cost?',
  a: 'The fees are agreed with you before work begins. We agree a fixed scope, setup fee, monthly service fee and usage limit first; there is no charge to prepare an enquiry.',
};

// Share image for the guides and plain pages.
export const HOME_IMAGE_ALT = `${SITE.name}: Every lead deserves a next step. ${SITE.category}.`;

// Scope stated as plain facts. scope: { covers, excludes, instead?, insteadLabel? } (insteadLabel defaults to "Handled by").
export const scopeBlock = scope => `<dl class="scope-facts">
<div><dt>Covers</dt><dd>${esc(scope.covers)}</dd></div>
<div><dt>Does not cover</dt><dd>${esc(scope.excludes)}</dd></div>${scope.instead ? `
<div><dt>${esc(scope.insteadLabel ?? 'Handled by')}</dt><dd>${esc(scope.instead)}</dd></div>` : ''}
</dl>`;

export const faqList = items => items.map(f => `<details><summary>${esc(f.q)}</summary><p>${f.html ?? esc(f.a)}</p></details>`).join('\n');

// Answer-first block: a direct one- or two-sentence answer to "what is this and who is it for", then key takeaways.
// links: [{ href, label }], guide links under a "decisions stay with people" block.
export const boundaryLinks = (links = []) => links.length ? `<ul class="boundary-links">${links.map(l => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join('')}</ul>` : '';

// summary: { question, answer, takeaways: [string], link?: { href, label } }
// scope (optional) is rendered under the answer as Covers / Does not cover / Handled by.
export const answerBlock = (summary, scope) => `<section class="answer" id="in-short" aria-labelledby="in-short-q">
<div><div class="eyebrow">In short</div><h2 id="in-short-q">${esc(summary.question)}</h2><p class="lead">${esc(summary.answer)}</p>${scope ? scopeBlock(scope) : ''}${summary.link ? `<p class="answer-link"><a href="${summary.link.href}">${esc(summary.link.label)}</a></p>` : ''}</div>
<div class="takeaways"><h3>Key takeaways</h3><ul>${summary.takeaways.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
</section>`;
