import { SITE } from '../site.mjs';
import { esc, page, header, footer, faqList, answerBlock, scopeBlock, HOME_IMAGE_ALT } from '../layout.mjs';
import { graph, webPage, faqPage, breadcrumbs, article } from '../seo.mjs';

const nav = [
  { href: '/#workflow', label: 'Workflow' },
  { href: '/guides', label: 'Guides' },
  { href: '/#start', label: 'Talk to us', button: true },
];

const fmtDate = iso => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const crumbTrail = items => `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map((c, i) => i === items.length - 1
  ? `<li><span aria-current="page">${esc(c.name)}</span></li>`
  : `<li><a href="${c.path}">${esc(c.name)}</a></li>`).join('')}</ol></nav>`;

const section = s => `<h2>${esc(s.heading)}</h2>
${(s.paragraphs ?? []).map(p => `<p>${esc(p)}</p>`).join('\n')}${s.list ? `\n<${s.ordered ? 'ol' : 'ul'}>${s.list.map(i => `<li>${esc(i)}</li>`).join('')}</${s.ordered ? 'ol' : 'ul'}>` : ''}${s.links ? `\n<ul>${s.links.map(l => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join('')}</ul>` : ''}`;

export const GUIDES_INDEX = {
  title: 'Guides',
  description: `${SITE.name} guides are practical how-tos and definitions for handling service calls and quote requests at HVAC companies and other home-service businesses: how to stop them getting missed, and how to measure the results.`,
  scope: {
    covers: 'Handling HVAC service calls, quote requests and follow-ups at home-service companies, and measuring the results.',
    excludes: 'Product documentation, prices and customer case studies.',
  },
  summary: {
    question: 'What are these guides?',
    answer: `${SITE.name} guides are practical how-tos and definitions for handling service calls and quote requests at HVAC companies and other home-service businesses: how to stop them getting missed, and how to measure the results. Each one stands on its own and links to the example workflow on the ${SITE.name} home page.`,
    takeaways: [
      'Guides you can use whether or not you work with us.',
      'Plain definitions of the terms we use.',
      'Updated when the way we work changes.',
    ],
  },
};

export function guidesIndexPage(guides) {
  const path = '/guides';
  const title = `Workflow guides — ${SITE.name} | Definitions and how-tos`;
  const crumbs = [{ name: SITE.name, path: '/' }, { name: 'Guides', path }];
  const body = `${crumbTrail(crumbs)}
<div class="eyebrow">Guides</div>
<h1>Stop losing enquiries.<br>Measure the results.</h1>
<p class="lead">${esc(GUIDES_INDEX.summary.answer)}</p>
${scopeBlock(GUIDES_INDEX.scope)}
<ul class="guide-list">${guides.map(g => `<li><a href="/guides/${g.slug}"><span class="eyebrow">${esc(g.kind)} · ${esc(g.topic)}</span><strong>${esc(g.title)}</strong><span>${esc(g.description)}</span></a></li>`).join('')}</ul>`;
  return page({
    path,
    title,
    description: GUIDES_INDEX.description,
    image: '/og/home.png',
    imageAlt: HOME_IMAGE_ALT,
    bodyClass: 'plain',
    header: header({ links: nav }),
    main: `<section class="page"><div class="wrap">${body}</div></section>`,
    footer: footer({ current: 'guides' }),
    jsonLd: graph([
      { ...webPage({ path, title, description: GUIDES_INDEX.description, updated: SITE.updated[path], type: 'CollectionPage' }),
        mainEntity: { '@type': 'ItemList', itemListElement: guides.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE.url}/guides/${g.slug}`, name: g.title })) } },
      breadcrumbs(path, crumbs),
    ]),
  });
}

// Every guide's call to action opens the enquiry form on the home page.
export function guidePage(g) {
  const path = `/guides/${g.slug}`;
  if (g.sector && g.sector !== SITE.sector) throw new Error(`${g.slug}: sector "${g.sector}" is not ${SITE.sector}`);
  const cta = '/#start';
  const title = `${g.title} — ${SITE.name} | ${g.kind}`;
  const crumbs = [{ name: SITE.name, path: '/' }, { name: 'Guides', path: '/guides' }, { name: g.shortTitle, path }];
  const updated = g.updated !== g.published ? ` · Updated <time datetime="${g.updated}">${fmtDate(g.updated)}</time>` : '';
  const body = `${crumbTrail(crumbs)}
<div class="guide-title">
<div class="eyebrow">${esc(g.kind)}</div>
<h1>${esc(g.title)}</h1>
<p class="byline">Topic: ${esc(g.topic)} · By the ${SITE.name} team · <time datetime="${g.published}">${fmtDate(g.published)}</time>${updated}</p>
</div>
</div></section>
<div class="wrap guide-answer">${answerBlock(g.summary, g.scope)}</div>
<section class="page guide-body"><div class="wrap">
${g.sections.map(section).join('\n')}
<h2>Questions</h2>
<div class="faq-list">
${faqList(g.faq)}
</div>
<h2>Related</h2>
<ul>${g.related.map(l => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join('')}</ul>
<p>Want this running in your team? <a href="${cta}">Talk to ${SITE.name}</a> or email <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>`;
  return page({
    path,
    title,
    description: g.description,
    image: '/og/home.png',
    imageAlt: HOME_IMAGE_ALT,
    bodyClass: 'plain guide',
    ogType: 'article',
    header: header({ links: nav }),
    main: `<section class="page guide-head"><div class="wrap">${body}</div></section>`,
    footer: footer({ current: null }),
    jsonLd: graph([
      webPage({ path, title, description: g.description, updated: g.updated, mainEntity: `${SITE.url}${path}#article` }),
      article(g),
      faqPage(path, g.faq),
      breadcrumbs(path, crumbs),
    ]),
  });
}
