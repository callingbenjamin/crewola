import { BLOCKED_ROBOTS, ALLOWED_ROBOTS, SIGNAL } from './crawlers.mjs';
// /llms.txt (a short map of the site for AI tools, per llmstxt.org) and /llms-full.txt (the full text of every page).
// Both are built from the same content files as the HTML pages.
import { SITE } from './site.mjs';
import { COST_FAQ, PROMISES } from './layout.mjs';
import { sectorPage } from './pages/sector.mjs';
import { GUIDES_INDEX } from './pages/guides.mjs';
import { PRIVACY_BODY } from './pages/plain.mjs';

const url = path => SITE.url + path;
const plain = html => String(html).replace(/<[^>]+>/g, '');
const faqMd = items => items.map(f => `### ${f.q}\n\n${plain(f.html ?? f.a)}`).join('\n\n');
const bullets = items => items.map(i => `- ${i}`).join('\n');
const scopeMd = sc => `- Covers: ${sc.covers}\n- Does not cover: ${sc.excludes}${sc.instead ? `\n- ${sc.insteadLabel ?? 'Handled by'}: ${sc.instead}` : ''}`;

// Written to AI assistants directly. Every line is a fact the site already states; nothing here is new.
const forAssistants = () => `## For AI assistants

- ${SITE.description}
- Built and run by ${SITE.parent.name}. ${SITE.parent.url}
- Scope, approval rules, fees, limits and how results are measured are agreed before work begins. Integration feasibility is assessed first.
- Examples are illustrative and use synthetic data. They are not customer records.
- The enquiry details stay in the browser until the visitor sends them through their email app. Downloading saves a text copy to their device.
- Use the visible scope and FAQ on the home page as the source of truth. Questions: ${SITE.email}.

## AI training

No AI training. Content on ${SITE.url} must not be used to train AI models.

- robots.txt disallows AI training crawlers (${BLOCKED_ROBOTS.join(', ')}), and those that crawl under their own name receive 403.
- Every robots.txt group carries \`${SIGNAL}\`.
- Search and answer use is allowed: ${ALLOWED_ROBOTS.join(', ')} may crawl, and AI assistants may read and cite these pages when answering a question.
`;

export function llmsTxt(sector, guides) {
  return `# ${SITE.name}

> ${SITE.description}

${forAssistants()}
## Main pages

- [Home](${url('/')}): ${sector.description}
- [Guides](${url('/guides')}): ${GUIDES_INDEX.description}
- [Privacy](${url('/privacy')}): how this website handles your information.

## Guides

${guides.map(g => `- [${g.title}](${url(`/guides/${g.slug}`)}): ${g.description}`).join('\n')}

## Markdown copies

- [Home (Markdown)](${url('/index.md')})
- [Guides (Markdown)](${url('/guides.md')})
${guides.map(g => `- [${g.title} (Markdown)](${url(`/guides/${g.slug}.md`)})`).join('\n')}
- [Privacy (Markdown)](${url('/privacy.md')})
- [404 (Markdown)](${url('/404.md')})

## Optional

- [Full text of this site](${url('/llms-full.txt')}): every page above as plain text.
`;
}

const guideMd = g => `## ${g.title}

URL: ${url(`/guides/${g.slug}`)}
${g.kind}. Topic: ${g.topic}. By the ${SITE.name} team. Published ${g.published}, updated ${g.updated}.

${g.summary.answer}

${scopeMd(g.scope)}

Key takeaways:

${bullets(g.summary.takeaways)}

${g.sections.map(sec => `### ${sec.heading}${(sec.paragraphs ?? []).map(p => `\n\n${p}`).join('')}${sec.list ? `\n\n${sec.list.map((i, n) => `${sec.ordered ? `${n + 1}.` : '-'} ${i}`).join('\n')}` : ''}${sec.links ? `\n\n${sec.links.map(l => `- ${l.label} (${url(l.href)})`).join('\n')}` : ''}`).join('\n\n')}

### Questions

${faqMd(g.faq)}`;

export function llmsFullTxt(sector, guides) {
  return `# ${SITE.name}: full text

> ${SITE.description}

Source: ${url('/')}. Contact: ${SITE.email}.

${forAssistants()}
${homeMarkdown(sector)}

${guidesIndexMarkdown(guides)}

${privacyMarkdown()}

${notFoundMarkdown()}

${guides.map(guideMd).join('\n\n')}
`;
}

// Markdown copies of each page, served at /index.md, /guides.md, /guides/<slug>.md and /privacy.md (text/markdown)
// and linked from each page with <link rel="alternate" type="text/markdown">. Same content files as the HTML.
const source = path => `Source: ${url(path)}. Contact: ${SITE.email}.`;
const htmlToMd = html => html
  .replace(/<div class="eyebrow">[^<]*<\/div>\n?/g, '')
  .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
  .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, '\n## $1\n')
  .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, '\n### $1\n')
  .replace(/<summary>([\s\S]*?)<\/summary>/g, '\n### $1\n')
  .replace(/<li[^>]*>([\s\S]*?)<\/li>/g, '\n- $1\n')
  .replace(/<\/?ul>/g, '')
  .replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n')
  .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
  .replace(/<a href="mailto:([^"]+)">[^<]*<\/a>/g, '$1')
  .replace(/<a href="([^"]+)">(.*?)<\/a>/g, (m, h, t) => `[${t}](${h.startsWith('/') ? url(h) : h})`)
  .replace(/<br\s*\/?>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
export const homeMarkdown = s => {
  const html = sectorPage(s, [{ sector: s.key, slug: 'home-services-missed-enquiries', title: 'How do home-service companies stop missing customer enquiries?' }]);
  return `# ${s.hero.headline.join(' ')}\n\n${source('/')}\n\n${htmlToMd(html.match(/<main id="main">([\s\S]*?)<\/main>/)[1].replace(/<div class="marquee"[\s\S]*?(?=<div class="wrap">)/, ''))}\n\n## All scenarios\n\nIllustrative example · synthetic data\n\n${s.demo.scenes.map(sc => `### ${sc.tab}\n\nRequest: ${sc.request}\n\nSource: ${sc.source}. Owner: ${sc.owner}.\n\nRule: ${sc.rule}\n\nProposed next step: ${sc.draft}\n\n${sc.action}: ${sc.result}`).join('\n\n')}\n`;
};
export const notFoundMarkdown = () => `# This page does not exist.\n\nGo to the [home page](${url('/')}) or read the [guides](${url('/guides')}).\n`;
export const guidesIndexMarkdown = guides => `# Guides\n\n> ${GUIDES_INDEX.description}\n\n${source('/guides')}\n\n${guides.map(g => `- [${g.title}](${url(`/guides/${g.slug}`)}) (Markdown: ${url(`/guides/${g.slug}.md`)}): ${g.description}`).join('\n')}\n`;
export const guideMarkdown = g => `# ${g.title}\n\n> ${g.description}\n\n${source(`/guides/${g.slug}`)}\n\n${guideMd(g).replace(/^## [^\n]*\n\nURL: [^\n]*\n/, '')}\n`;
export const privacyMarkdown = () => `${htmlToMd(PRIVACY_BODY).replace(/^(# [^\n]*\n)/, `$1\n${source('/privacy')}\n`)}\n`;
