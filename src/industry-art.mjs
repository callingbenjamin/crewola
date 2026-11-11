// Drawn parts of each home-page industry card: one 24px line motif, shown before the scenario name on the card's
// sample slate. No copy lives here: words come from src/content/sectors/<key>.json. Every piece is decorative
// (aria-hidden), and colours come from public/styles.css, because the Content Security Policy forbids style attributes.
const motif = paths => `<svg class="industry-motif" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

export const INDUSTRY_ART = {
  'home-services': {
    motif: motif('<path d="M14.6 3.7a4.6 4.6 0 0 0-2.7 5.6L4.2 17a1.9 1.9 0 0 0 2.7 2.7l7.7-7.7a4.6 4.6 0 0 0 5.6-2.7l-2.8.5-1.9-1.9.5-2.8z"/>'),
  },
};
