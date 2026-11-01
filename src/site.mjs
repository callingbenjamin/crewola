// Site-wide settings for crewola.com.
export const SITE = {
  name: 'Crewola',
  url: 'https://crewola.com',
  // Enquiries go to the Crewola sales inbox: Crewola is Actuathron's service for home service companies.
  email: 'sales@crewola.com',
  // The one-sentence definition. It is the first paragraph of the home page, its meta description,
  // the Organization and Service descriptions and the first line of llms.txt, word for word.
  description: 'Crewola is a managed workflow service for home service companies, starting with HVAC, that turns service calls, quote requests and follow-ups into booked visits and clear handoffs, with your dispatchers and estimators in control.',
  // The plain-words category used after "|" in page titles.
  category: 'Enquiry handling for home service companies',
  // The enterprise offer. There is no personal or consumer plan.
  offer: 'Crewola for home service companies',
  // The company that runs the service.
  parent: { name: 'Actuathron', url: 'https://actuathron.com/' },
  // The one service, rendered as the home page from src/content/sectors/<sector>.json.
  sector: 'home-services',
  guides: ['hvac-missed-service-calls', 'staff-minutes-per-resolved-request', 'approval-rules', 'workflow-exceptions', 'human-in-the-loop-workflow', 'workflow-baseline'],
  // Last real content change of each page (YYYY-MM-DD), used for sitemap lastmod and dateModified.
  // Update the date when you change what a page says. Guides carry their own dates in their JSON files.
  updated: {
    '/': '2026-10-31',
    '/guides': '2026-10-31',
    '/privacy': '2026-10-31',
  },
};
