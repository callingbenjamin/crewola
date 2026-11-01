// Tests for middleware.js: AI training crawlers get 403 everywhere except /robots.txt;
// search and answer crawlers, link previews and browsers always pass.
import middleware, { BLOCKED_UA, config } from '../middleware.js';
import { BLOCKED_ROBOTS, TOKEN_ONLY, ALLOWED_ROBOTS } from '../src/crawlers.mjs';

const problems = [];
const status = (ua, path = '/') => {
  const res = middleware(new Request(`https://crewola.com${path}`, { headers: ua ? { 'user-agent': ua } : {} }));
  return res.headers.get('x-middleware-next') === '1' ? 'next' : res.status;
};

// User-Agent strings as the operators publish them.
const BLOCKED_UAS = {
  GPTBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot',
  ClaudeBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  'anthropic-ai': 'anthropic-ai',
  CCBot: 'CCBot/2.0 (https://commoncrawl.org/faq/)',
  'meta-externalagent': 'meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)',
  FacebookBot: 'Mozilla/5.0 (compatible; FacebookBot/1.0; +https://developers.facebook.com/docs/sharing/webmasters/facebookbot/)',
  Bytespider: 'Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)',
  Amazonbot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot) Chrome/119.0.6045.214 Safari/537.36',
  'cohere-ai': 'cohere-ai',
  'cohere-training-data-crawler': 'cohere-training-data-crawler/1.0',
  Diffbot: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36 (compatible; Diffbot/0.1; +http://www.diffbot.com)',
  AI2Bot: 'Mozilla/5.0 (compatible) AI2Bot (+https://www.allenai.org/crawler)',
  'Ai2Bot-Dolma': 'Ai2Bot-Dolma (+https://www.allenai.org/crawler)',
  omgili: 'omgili/0.5 +http://omgili.com',
  Timpibot: 'Timpibot/0.8 (+http://www.timpi.io)',
  ImagesiftBot: 'Mozilla/5.0 (compatible; ImagesiftBot; +imagesift.com)',
  PanguBot: 'Mozilla/5.0 (compatible; PanguBot/1.0; +https://www.huawei.com)',
  img2dataset: 'Mozilla/5.0 (compatible; img2dataset; +https://github.com/rom1504/img2dataset)',
};
const ALLOWED_UAS = {
  Googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Googlebot smartphone': 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Googlebot-Image': 'Googlebot-Image/1.0',
  'Google-InspectionTool': 'Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)',
  Bingbot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36',
  DuckDuckBot: 'DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)',
  Applebot: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)',
  'OAI-SearchBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  'ChatGPT-User': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
  'Claude-SearchBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +Claude-SearchBot@anthropic.com)',
  'Claude-User': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)',
  PerplexityBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  'Perplexity-User': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)',
  'Facebook link preview': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'Meta link fetcher': 'meta-externalfetcher/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)',
  Twitterbot: 'Twitterbot/1.0',
  Slackbot: 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  LinkedInBot: 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
  Discordbot: 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
  WhatsApp: 'WhatsApp/2.23.20.0',
  Chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  Safari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
  Firefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0',
  Lighthouse: 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
  'no user agent': '',
};

for (const [name, ua] of Object.entries(BLOCKED_UAS)) {
  for (const path of ['/', '/hotels', '/guides/approval-rules', '/llms.txt', '/media/hotels.webp']) if (status(ua, path) !== 403) problems.push(`${name} should get 403 on ${path}`);
  if (status(ua, '/robots.txt') !== 'next') problems.push(`${name} must be able to read /robots.txt`);
}
for (const [name, ua] of Object.entries(ALLOWED_UAS)) {
  for (const path of ['/', '/hotels', '/robots.txt']) if (status(ua, path) !== 'next') problems.push(`${name} must pass on ${path}`);
}
// Every crawler disallowed in robots.txt that sends its own User-Agent is covered by a 403 test, and the pattern
// never matches an allowed name, even on its own.
for (const bot of BLOCKED_ROBOTS.filter(b => !TOKEN_ONLY.includes(b))) {
  if (!BLOCKED_UAS[bot]) problems.push(`${bot}: disallowed in robots.txt but has no 403 test`);
  if (!BLOCKED_UA.test(bot)) problems.push(`${bot}: disallowed in robots.txt but not matched by BLOCKED_UA`);
}
for (const bot of ALLOWED_ROBOTS) {
  if (!ALLOWED_UAS[bot]) problems.push(`${bot}: allowed in robots.txt but has no pass test`);
  if (BLOCKED_UA.test(bot)) problems.push(`${bot}: allowed in robots.txt but matched by BLOCKED_UA`);
}
// The matcher keeps /robots.txt out of the middleware and keeps pages and media in.
const matcher = new RegExp(`^${config.matcher[0]}$`);
for (const p of ['/', '/hotels', '/guides', '/llms.txt', '/llms-full.txt', '/sitemap.xml', '/media/hotels.webp', '/og/home.png']) if (!matcher.test(p)) problems.push(`matcher must include ${p}`);
for (const p of ['/robots.txt', '/fonts/a.woff2', '/styles.css', '/site.js']) if (matcher.test(p)) problems.push(`matcher should skip ${p}`);

if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`OK: middleware blocks ${Object.keys(BLOCKED_UAS).length} training crawlers and passes ${Object.keys(ALLOWED_UAS).length} allowed user agents; /robots.txt is open to all.`);
