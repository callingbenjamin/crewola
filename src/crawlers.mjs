// Crawler policy for crewola.com: no AI training, search and answer use allowed.
// Used by build.mjs (robots.txt, llms.txt) and scripts/check.mjs. middleware.js holds the matching 403 pattern.

// robots.txt names. Google-Extended, Applebot-Extended and Webzio-Extended are robots.txt control tokens only;
// those companies crawl with their main bots, so the tokens never appear in a User-Agent header.
export const BLOCKED_ROBOTS = [
  'GPTBot', 'ClaudeBot', 'anthropic-ai', 'Google-Extended', 'CCBot', 'Applebot-Extended', 'meta-externalagent', 'FacebookBot',
  'Bytespider', 'Amazonbot', 'cohere-ai', 'cohere-training-data-crawler', 'Diffbot', 'AI2Bot', 'Ai2Bot-Dolma', 'omgili',
  'Timpibot', 'ImagesiftBot', 'PanguBot', 'Webzio-Extended', 'img2dataset',
];
export const TOKEN_ONLY = ['Google-Extended', 'Applebot-Extended', 'Webzio-Extended'];

// Search and answer crawlers, each named in its own Allow group.
export const ALLOWED_ROBOTS = [
  'Googlebot', 'Bingbot', 'DuckDuckBot', 'Applebot', 'OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User',
  'PerplexityBot', 'Perplexity-User',
];

export const SIGNAL = 'Content-Signal: search=yes, ai-input=yes, ai-train=no';
