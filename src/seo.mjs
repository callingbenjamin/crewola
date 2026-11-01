// Structured data (schema.org JSON-LD) for search engines and AI answer engines.
// Every block is built from the same content the page shows, so markup and visible text cannot drift apart.
import { SITE } from './site.mjs';

const ORG_ID = `${SITE.url}/#organization`;
const SITE_ID = `${SITE.url}/#website`;

const plain = html => String(html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const abs = path => SITE.url + (path === '/' ? '/' : path);

export const organization = () => ({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: SITE.name,
  url: `${SITE.url}/`,
  logo: { '@type': 'ImageObject', url: `${SITE.url}/icon-512.png`, width: 512, height: 512 },
  description: SITE.description,
  email: SITE.email,
  contactPoint: { '@type': 'ContactPoint', contactType: 'sales', email: SITE.email },
  parentOrganization: { '@type': 'Organization', name: SITE.parent.name, url: SITE.parent.url },
});

export const website = () => ({
  '@type': 'WebSite',
  '@id': SITE_ID,
  name: SITE.name,
  url: `${SITE.url}/`,
  publisher: { '@id': ORG_ID },
  inLanguage: 'en',
});

// mainEntity: the @id of the thing the page is about (a Service or an Article), when there is one.
export const webPage = ({ path, title, description, updated, type = 'WebPage', mainEntity }) => ({
  '@type': type,
  '@id': `${abs(path)}#webpage`,
  url: abs(path),
  name: title,
  description,
  isPartOf: { '@id': SITE_ID },
  inLanguage: 'en',
  ...(updated ? { dateModified: updated } : {}),
  ...(mainEntity ? { mainEntity: { '@id': mainEntity } } : {}),
});

export const serviceId = () => `${abs('/')}#service`;

// steps: [{ name, text }], the same list the page renders as a numbered list.
export const howTo = (path, name, steps) => ({
  '@type': 'HowTo',
  '@id': `${abs(path)}#howto`,
  name,
  step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text })),
});

// items: [{ q, a } | { q, html }], the same list the page renders with faqList().
export const faqPage = (path, items) => ({
  '@type': 'FAQPage',
  '@id': `${abs(path)}#faq`,
  mainEntity: items.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: plain(f.html ?? f.a) },
  })),
});

// crumbs: [{ name, path }], starting at home.
export const breadcrumbs = (path, crumbs) => ({
  '@type': 'BreadcrumbList',
  '@id': `${abs(path)}#breadcrumbs`,
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
});

// Built only from the home page itself: its definition, scope, audience and enquiry channel. No price is stated.
export const service = d => ({
  '@type': 'Service',
  '@id': serviceId(),
  name: SITE.name,
  serviceType: 'Managed workflow service',
  description: d.description,
  disambiguatingDescription: `Covers: ${d.scope.covers} Does not cover: ${d.scope.excludes}`,
  url: abs('/'),
  image: `${SITE.url}/og/home.png`,
  provider: { '@id': ORG_ID },
  brand: { '@id': ORG_ID },
  audience: { '@type': 'BusinessAudience', name: d.hero.audience.replace(/^For /, '') },
  mainEntityOfPage: { '@id': `${abs('/')}#webpage` },
  availableChannel: {
    '@type': 'ServiceChannel',
    name: 'Enquiry by email',
    serviceUrl: `${abs('/')}#start`,
    availableLanguage: 'en',
  },
});

export const article = g => ({
  '@type': 'Article',
  '@id': `${abs(`/guides/${g.slug}`)}#article`,
  headline: g.title,
  description: g.description,
  url: abs(`/guides/${g.slug}`),
  mainEntityOfPage: { '@id': `${abs(`/guides/${g.slug}`)}#webpage` },
  articleSection: g.topic,
  datePublished: g.published,
  dateModified: g.updated,
  author: { '@id': ORG_ID },
  publisher: { '@id': ORG_ID },
  image: `${SITE.url}/og/home.png`,
  inLanguage: 'en',
});

// One @graph per page; Organization and WebSite are on every page so each page stands on its own.
export const graph = nodes => ({ '@context': 'https://schema.org', '@graph': [organization(), website(), ...nodes] });
