// Site-wide settings for crewola.com.
export const SITE = {
  name: 'Crewola',
  // Brand line for <title>, og:title, twitter:title and og:site_name only. The logo, wordmark and footer stay as they are.
  titleBrand: 'Crewola by Actuathron',
  url: 'https://crewola.com',
  // Enquiries go to the Crewola sales inbox: Crewola is Actuathron's service for home service companies.
  email: 'sales@crewola.com',
  // The one-sentence definition. It is the first paragraph of the home page, its meta description,
  // the Organization and Service descriptions and the first line of llms.txt, word for word.
  description: 'Crewola is a managed workflow service for home service companies, starting with HVAC, that turns service calls, quote requests and follow-ups into booked visits and clear handoffs, with your dispatchers and estimators in control.',
  // The short definition every meta, og and twitter description starts with (search and share snippets stop at
  // about 160 characters). It is the start of the full definition above, with nothing added.
  definition: 'Crewola is a managed workflow service for home service companies, starting with HVAC.',
  // The plain-words category used after "|" in page titles.
  category: 'Enquiry handling for home service companies',
  // The enterprise offer. There is no personal or consumer plan.
  offer: 'Crewola for home service companies',
  // The company that runs the service.
  parent: { name: 'Actuathron', url: 'https://actuathron.com/' },
  // The one service, rendered as the home page from src/content/sectors/<sector>.json.
  sector: 'home-services',
  guides: ['hvac-missed-service-calls', 'staff-minutes-per-resolved-request', 'approval-rules', 'workflow-exceptions', 'human-in-the-loop-workflow', 'workflow-baseline'],
  // IndexNow key, served at /<key>.txt from public/. After each production deploy goes live, middleware.js asks
  // api/indexnow-*.js to submit every sitemap URL to api.indexnow.org (see that file).
  indexNowKey: 'c0177b9bc1b65184a7276aae02f9e862',
  // Last real content change of each page (YYYY-MM-DD), used for sitemap lastmod and dateModified.
  // Update the date when you change what a page says. Guides carry their own dates in their JSON files.
  updated: {
    '/': '2026-10-31',
    '/guides': '2026-10-31',
    '/privacy': '2026-10-31',
  },
};

// Every indexable page, in sitemap order: the sitemap (build.mjs) and the IndexNow ping (api/indexnow-*.js) both use it.
export const PATHS = ['/', '/guides', ...SITE.guides.map(s => `/guides/${s}`), '/privacy'];
