// Vercel Routing Middleware: second layer of the no-AI-training policy (robots.txt is the first).
// Known AI training crawlers get 403 on every page and file except /robots.txt, so they can still read the policy.
// Search and answer crawlers (Googlebot, Bingbot, DuckDuckBot, Applebot, OAI-SearchBot, ChatGPT-User,
// Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User), link previews and browsers pass through.
// scripts/test-middleware.mjs checks both sides; keep it in step with this pattern.
import { next, waitUntil } from '@vercel/functions';

// After a production deploy goes live, the first request to crewola.com on each middleware instance asks
// api/indexnow-*.js, in the background, to ping IndexNow. That response is CDN-cached per deployment, so it pings
// once per deploy. Previews and *.vercel.app hosts skip it, and it never blocks or delays the page.
export const INDEXNOW_PATH = '/api/indexnow-e44e3f31a514af816251a50c';
let indexNowAsked = false;

export const BLOCKED_UA = /(gptbot|claudebot|anthropic-ai|ccbot|bytespider|meta-externalagent|facebookbot|amazonbot|cohere-ai|cohere-training-data-crawler|diffbot|ai2bot|omgili|timpibot|imagesiftbot|pangubot|img2dataset)/i;

export const config = {
  // Fonts, the stylesheet, the script and icons are skipped to keep invocations low; they hold no site content.
  matcher: ['/((?!robots\\.txt|fonts/|styles\\.css|site\\.js|favicon\\.(?:svg|ico)|apple-touch-icon\\.png|icon-(?:192|512)\\.png|site\\.webmanifest).*)'],
};

export default function middleware(request) {
  const { pathname, origin, host } = new URL(request.url);
  if (!indexNowAsked && process.env.VERCEL_ENV === 'production' && !pathname.startsWith('/api/')) {
    indexNowAsked = true;
    if (host === 'crewola.com') try { waitUntil(fetch(origin + INDEXNOW_PATH).catch(() => {})); } catch {}
  }
  if (pathname === '/robots.txt') return next();
  if (BLOCKED_UA.test(request.headers.get('user-agent') ?? '')) {
    return new Response('403 Forbidden. AI training crawlers are not permitted on this site. See /robots.txt.\n', {
      status: 403,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
  return next();
}
