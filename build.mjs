// Builds the static site into dist/: the home page from src/content/sectors, the guides, privacy and 404.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SITE } from './src/site.mjs';
import { sectorPage } from './src/pages/sector.mjs';
import { privacyPage, notFoundPage } from './src/pages/plain.mjs';
import { guidesIndexPage, guidePage } from './src/pages/guides.mjs';
import { llmsTxt, llmsFullTxt } from './src/llms.mjs';
import { BLOCKED_ROBOTS, ALLOWED_ROBOTS, SIGNAL } from './src/crawlers.mjs';

const OUT = 'dist';
const sector = JSON.parse(readFileSync(`src/content/sectors/${SITE.sector}.json`, 'utf8'));
const guides = SITE.guides.map(slug => JSON.parse(readFileSync(`src/content/guides/${slug}.json`, 'utf8')));
if (!sector.summary?.answer || !sector.summary?.takeaways?.length) throw new Error(`${sector.key}: add a summary block (question, answer, takeaways)`);

const write = (file, html) => {
  const path = join(OUT, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, html);
};

rmSync(OUT, { recursive: true, force: true });
cpSync('public', OUT, { recursive: true });

write('index.html', sectorPage(sector, guides));
write('guides/index.html', guidesIndexPage(guides));
for (const g of guides) write(`guides/${g.slug}/index.html`, guidePage(g));
write('privacy/index.html', privacyPage());
write('404.html', notFoundPage());

// lastmod: SITE.updated for fixed pages, each guide's own updated date for guides.
const lastmod = { ...SITE.updated, ...Object.fromEntries(guides.map(g => [`/guides/${g.slug}`, g.updated])) };
const paths = ['/', '/guides', ...guides.map(g => `/guides/${g.slug}`), '/privacy'];
for (const p of paths) if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod[p] ?? '')) throw new Error(`${p}: add its updated date (YYYY-MM-DD) to SITE.updated in src/site.mjs`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map(p => `  <url><loc>${SITE.url}${p}</loc><lastmod>${lastmod[p]}</lastmod></url>`).join('\n')}
</urlset>
`);

// No AI training. AI training crawlers share one Disallow group, listed first. Search and answer crawlers are named
// in their own Allow groups, so the intent is clear even to crawlers that ignore "*". Every group carries the
// content signal (https://contentsignals.org/), because a crawler reads only its own group.
// middleware.js also returns 403 to the training crawlers; the lists live in src/crawlers.mjs.
write('robots.txt', `# No AI training on this site.
# Content signals: search=yes allows search indexing and results; ai-input=yes allows use as input to AI answers;
# ai-train=no: this content must not be used to train AI models.
# AI training crawlers are disallowed, and those that crawl under their own name receive 403.
# Search and AI answer crawlers are allowed.

${BLOCKED_ROBOTS.map(c => `User-agent: ${c}`).join('\n')}
${SIGNAL}
Disallow: /

${[...ALLOWED_ROBOTS, '*'].map(c => `User-agent: ${c}\n${SIGNAL}\nAllow: /\n`).join('\n')}
Sitemap: ${SITE.url}/sitemap.xml
`);
write('llms.txt', llmsTxt(sector, guides));
write('llms-full.txt', llmsFullTxt(sector, guides));

console.log(`Built ${paths.length} pages into ${OUT}/`);
