// Site-wide settings for crewola.com.
export const SITE = {
  name: 'Crewola',
  // Brand line for <title>, og:title, twitter:title and og:site_name only. The logo, wordmark and footer stay as they are.
  titleBrand: 'Crewola by Actuathron',
  url: 'https://crewola.com',
  // Enquiries go to the Crewola sales inbox: Crewola is Actuathron's service for home service companies.
  email: 'sales@crewola.com',
  // The package definition: home-page introduction, Organization, Service and llms.txt.
  description: 'Crewola for Home Services is a managed workflow service for home-service companies and their trade teams that turns plumbing, HVAC, electrical and roofing enquiries into organised quote requests, appointment proposals and follow-ups, within the rules your team sets.',
  // The short definition every meta, og and twitter description starts with (search and share snippets stop at
  // about 160 characters). It is the start of the full definition above, with nothing added.
  definition: 'Crewola for Home Services is a managed workflow service for home-service companies and their trade teams.',
  // The plain-words category used after "|" in page titles.
  category: 'Enquiry handling for home service companies',
  // The enterprise offer. There is no personal or consumer plan.
  offer: 'Crewola for home service companies',
  // The company that runs the service.
  parent: { name: 'Actuathron', url: 'https://actuathron.com/' },
  // The one service, rendered as the home page from src/content/sectors/<sector>.json.
  sector: 'home-services',
  guides: ['home-services-missed-enquiries', 'approval-rules', 'workflow-exceptions'],
  // IndexNow key, served at /<key>.txt from public/. After each production deploy goes live, middleware.js asks
  // api/indexnow-*.js to submit every sitemap URL to api.indexnow.org (see that file).
  indexNowKey: 'c0177b9bc1b65184a7276aae02f9e862',
  // Last real content change of each page (YYYY-MM-DD), used for sitemap lastmod and dateModified.
  // The sitemap uses the layout release date; guides retain their original article dates in JSON.
  updated: {
    '/': '2026-11-11',
    '/guides': '2026-11-11',
    '/privacy': '2026-11-11',
  },
};

// Every indexable page, in sitemap order: the sitemap (build.mjs) and the IndexNow ping (api/indexnow-*.js) both use it.
export const PATHS = ['/', '/guides', ...SITE.guides.map(s => `/guides/${s}`), '/privacy'];
