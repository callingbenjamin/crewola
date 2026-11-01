// IndexNow ping, run after a production deploy is live (not from the build, which finishes before the deploy
// serves traffic, and not from a GitHub Action). middleware.js calls this path in the background (waitUntil) on the
// first request it sees on crewola.com. The response is cached on Vercel's CDN for the life of the deployment (the
// cache resets on each new deploy), so later calls are served from cache and do not ping again. Previews,
// *.vercel.app and any other host are skipped. Repeat submissions are harmless to IndexNow. Never throws.
import { SITE, PATHS } from '../src/site.mjs';

export default {
  async fetch(request) {
    const host = new URL(request.url).host;
    const deploy = process.env.VERCEL_DEPLOYMENT_ID ?? 'unknown';
    if (process.env.VERCEL_ENV !== 'production' || host !== new URL(SITE.url).host) {
      return new Response('skipped\n', { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
    }
    let status = 'error';
    try {
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ host, key: SITE.indexNowKey, keyLocation: `${SITE.url}/${SITE.indexNowKey}.txt`, urlList: PATHS.map(p => SITE.url + p) }),
        signal: AbortSignal.timeout(8000),
      });
      status = res.status;
    } catch (e) { status = `error ${e.message}`; }
    console.log(`IndexNow ping after go-live: deployment ${deploy}, commit ${process.env.VERCEL_GIT_COMMIT_SHA ?? ''}, ${PATHS.length} URLs, status ${status}, at ${new Date().toISOString()}`);
    return new Response(`IndexNow ${status}\n`, {
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'vercel-cdn-cache-control': 'max-age=31536000' },
    });
  },
};
