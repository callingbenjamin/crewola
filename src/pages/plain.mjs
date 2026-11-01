import { SITE } from '../site.mjs';
import { page, header, footer, HOME_IMAGE_ALT } from '../layout.mjs';
import { graph, webPage, breadcrumbs } from '../seo.mjs';

const nav = [
  { href: '/#workflow', label: 'Workflow' },
  { href: '/guides', label: 'Guides' },
  { href: '/#start', label: 'Talk to us', button: true },
];

function plainPage({ path, title, category, description, current, body, noindex = false }) {
  const full = `${title} — ${SITE.name}${category ? ` | ${category}` : ''}`;
  return page({
    path,
    title: full,
    noindex,
    jsonLd: noindex ? undefined : graph([
      webPage({ path, title: full, description, updated: SITE.updated[path] }),
      breadcrumbs(path, [{ name: SITE.name, path: '/' }, { name: title, path }]),
    ]),
    description,
    image: '/og/home.png',
    imageAlt: HOME_IMAGE_ALT,
    bodyClass: 'plain',
    header: header({ links: nav }),
    main: `<section class="page"><div class="wrap">${body}</div></section>`,
    footer: footer({ current }),
  });
}

const PRIVACY_DEFINITION = `This privacy notice explains how the ${SITE.name} website handles your information: it uses no cookies, analytics or trackers, and enquiries stay in your browser until you send them.`;

export function privacyPage() {
  return plainPage({
    path: '/privacy',
    title: 'Privacy',
    category: 'Website privacy notice',
    description: PRIVACY_DEFINITION,
    current: 'privacy',
    body: `<div class="eyebrow">Privacy</div>
<h1>How this website handles your information.</h1>
<p class="lead">${PRIVACY_DEFINITION}</p>
<p>Last updated 31 October 2026.</p>
<h2>What we collect</h2>
<p>This website does not use cookies, analytics, advertising trackers or third-party scripts. Fonts, images and videos are served from this website.</p>
<h2>Enquiries</h2>
<p>The enquiry form on the home page runs in your browser. Reviewing an enquiry does not send it anywhere and nothing is stored on our servers.</p>
<ul>
<li><strong>Open email draft</strong> hands the details to your own email app. Nothing is sent until you send that email to <a href="mailto:${SITE.email}">${SITE.email}</a>.</li>
<li><strong>Download draft</strong> saves a text copy to your device.</li>
</ul>
<p>Please do not include customer or transaction records in an enquiry. If you email us, we use your message only to reply and to discuss working together.</p>
<h2>Hosting</h2>
<p>The site is hosted by Vercel. Like most web hosts, Vercel keeps standard access logs (for example IP address, browser type and time of request) to run and protect the service.</p>
<h2>Contact</h2>
<p>Questions about this notice: <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>`,
  });
}

export function notFoundPage() {
  return plainPage({
    path: '/404',
    title: 'Page not found',
    description: 'This page does not exist.',
    current: null,
    noindex: true,
    body: `<div class="eyebrow">404</div>
<h1>This page does not exist.</h1>
<p>Go to the <a href="/">home page</a> or read the <a href="/guides">guides</a>.</p>`,
  });
}
