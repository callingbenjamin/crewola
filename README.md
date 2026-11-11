# Crewola

Website for **crewola.com**. Crewola is a managed workflow service for home service companies, starting with HVAC and also covering plumbing, electrical and roofing, that turns service calls, quote requests and follow-ups into booked visits and clear handoffs, with your dispatchers and estimators in control. Pricing and dispatch always need human approval. Built and run by [Actuathron](https://actuathron.com/).

| Page | URL |
| --- | --- |
| Home (trade enquiries, workflow scenarios, enquiry form, FAQ) | `/` |
| Guides | `/guides` |
| Guide pages | `/guides/home-services-missed-enquiries`, `/guides/approval-rules`, `/guides/workflow-exceptions` |
| Privacy | `/privacy` |

The enquiry form opens an email to `sales@crewola.com` (or downloads a text copy) instead of posting to a server.

## How it is built

Plain static HTML, CSS and JavaScript. No framework. The only npm dependency is `@vercel/functions`, used by `middleware.js`; run `npm install` once. Node 20+ is required.

```
src/content/sectors/home-services.json all the words on the home page (edit this to change copy)
src/content/guides/*.json    one file per guide: summary, sections, FAQ, related links
src/site.mjs                 name, domain, contact email, guide order, last-updated dates
src/seo.mjs                  JSON-LD builders (Organization, WebSite, WebPage, Service, HowTo, Article, FAQPage, BreadcrumbList)
src/llms.mjs                 writes llms.txt and llms-full.txt from the same content
src/layout.mjs               shared page shell: header, footer, logo, shared copy
src/pages/                   page templates: home (sector.mjs), guides, privacy + 404
src/crawlers.mjs             blocked and allowed crawler lists and the content signal
public/                      copied as-is: styles.css, site.js, fonts, media, share image, icons
public/brand/                logo files (SVG); the header and footer inline crewola-logo.svg
build.mjs                    renders everything into dist/
middleware.js                Vercel Routing Middleware: 403 for AI training crawlers, /robots.txt always readable
scripts/check.mjs            links and anchors, one JSON-LD block per page, FAQ and HowTo schema matching the page,
                             meta description on the page, share-image alt text, robots.txt groups and Content-Signal,
                             llms.txt sections, canonicals, no emojis
scripts/test-middleware.mjs  tests middleware.js with blocked and allowed user agents
scripts/make-images.py       legacy image utility; do not regenerate the preserved logo, icons or share image for this port
scripts/make-responsive.py   makes AVIF and WebP poster sizes for the hero and closing call
```

## Commands

```
npm run build    # build into dist/
npm run check    # build, run the checks, test the middleware
npm run dev      # build and serve dist/ at http://localhost:4321
```

## AI crawlers

No AI training: robots.txt disallows AI training crawlers and carries `Content-Signal: search=yes, ai-input=yes, ai-train=no` in every group, and `middleware.js` returns 403 to training crawlers that use their own user agent. A Vercel firewall rule, 'Block AI training crawlers', blocks the same user agents at the edge (everything except /robots.txt). Search and AI answer crawlers are allowed.

## Hosting

Vercel project `crewola`, built with `npm run build` and served from `dist/` (see `vercel.json`). `www.crewola.com` redirects (308) to `crewola.com`.

## Page package port (11 November 2026)

The home page replaces the previous Crewola home with the archived Actuathron home-services build: its page template, header/footer structure, stylesheet, browser script, copy, fonts, hero clip and closing-call posters. Crewola's original logo files, icons, manifest and share image remain unchanged. Media attribution is in CREDITS.md only.

The page uses “Every enquiry. A clearer schedule.” as its H1. Titles end with ` | Crewola by Actuathron`. The header keeps the small “by Actuathron” text and both the hero and footer link their Actuathron credit. Industries, Blog, Demo Console and the self-referential “Visit crewola.com” action have been removed. Resources contains Guides and Privacy; How it works links to `/#how`.

`src/pages/home.mjs` contains only the shared workflow diagram and marquee helpers used by the home-services template. `src/industry-art.mjs` contains its decorative trade motif. Fonts and all media are self-hosted; the script uses CSS classes for reveal timing to respect the CSP. The hero video is a muted loop with no controls and no focusable parts. It pauses outside the viewport and in hidden tabs, and respects reduced motion. scripts/check.mjs fails the build if a button, tabindex or play/pause wording appears in the hero.

The approval-rules and workflow-exceptions guide JSON files are preserved verbatim. Their legacy related links remain valid through single-hop permanent redirects. `vercel.json` redirects the removed HVAC guide to the new home-services guide, human-in-the-loop to approval-rules, and the staff-time and baseline guides to the index, including matching Markdown routes.

Every page has a Markdown copy, including `/404.md`; the 404 remains noindex. `llms.txt` lists them and `llms-full.txt` combines the same content, including all three synthetic scenarios, the guides index and privacy notice. The sitemap uses the 11 November layout release date; Article schema preserves the retained guides' original content dates. The IndexNow endpoint imports `PATHS` directly, so it submits the new six-page URL list after a production deployment receives traffic. Local builds do not submit anything.

The preserved share image still says “Your back office that never clocks out, for home service companies.” Its alt text describes that image; its headline intentionally differs from the new H1. The brand checks enforce the package H1, title suffix and header credit. No browser performance or visual checks run as part of the port; the parent handles those.
