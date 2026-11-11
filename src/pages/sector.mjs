import { SITE } from '../site.mjs';
import { esc, arrow, eyebrow, page, header, footer, faqSection, answerBlock, boundaryLinks, HOME_IMAGE_ALT, COST_FAQ } from '../layout.mjs';
import { graph, webPage, faqPage, breadcrumbs, service, serviceId, howTo } from '../seo.mjs';
import { asset, posterPicture } from '../assets.mjs';
import { HERO_SIZES, stepsDiagram, marquee } from './home.mjs';


const VOLUMES =['Not sure yet', 'Under 25', '25–100', '101–300', 'More than 300'];

export const ENQUIRY_FAQ = {
  q: 'What happens to my enquiry details?',
  a: 'They stay in your browser until you send them. This page does not submit or store the form details on a server. Opening an email draft hands those details to your email app; you decide whether to send it. Downloading saves a text copy to your device. Hosting access logs are separate from this form.',
};

// The one task each industry page supports, as numbered steps. The same list feeds the HowTo markup.
export const startSteps = d => [
  { name: 'Choose the workflow', text: `Pick one workflow in the form on this page, such as ${d.form.workflows[0].toLowerCase()}, and list the tools you use today.` },
  { name: 'Send the enquiry', text: `Review the enquiry, then send it to ${SITE.email} from your own email app.` },
  { name: 'Agree the terms', text: 'Agree the scope, approval rules, fees, limits and how results are measured. Integration feasibility is assessed first.' },
  { name: 'Test with sample data', text: 'Run the agreed rules on synthetic examples before any live data is connected.' },
  { name: 'Go live', text: 'Go live with the agreed rules, with regular reports on results and staff time.' },
];

// One concrete, illustrative example per workflow step, taken from the first scenario.
const stepExamples = s => [
  `Example: ${s.request} Owner: ${s.owner.toLowerCase()}.`,
  `Example rule: ${s.rule} Example draft: ${s.draft}`,
  `Example result: ${s.result}`,
];

const pad2 = n => String(n).padStart(2, '0');

// One industry page. `d` is a file from src/content/sectors. Its "In short" answer links to the guide whose
// `sector` is this page, if there is one.
export function sectorPage(d, guides = []) {
  const media = `/media/${d.key}`;
  const path = '/';
  const faq = [...d.faq, COST_FAQ, ENQUIRY_FAQ];
  // The first scenario is in the HTML, so the example reads the same without JavaScript; site.js takes over from there.
  const first = d.demo.scenes[0];
  const title = `${d.topic} | ${SITE.titleBrand}`;
  const steps = startSteps(d);
  const guide = guides.find(g => g.sector === d.key);
  const examples = stepExamples(first);
  if (d.workflow.steps.length !== examples.length) throw new Error(`${d.key}: workflow.steps needs exactly ${examples.length} steps`);
  // The names that drift across the workflow section: this industry's workflows, then its example scenarios.
  const names = [...d.form.workflows, ...d.demo.scenes.map(x => x.tab)].map(label => ({ key: d.key, label }));
  const main = `<section class="hero hero-sector" aria-labelledby="headline">
<div class="hero-media" aria-hidden="true">${posterPicture(d.key, { sizes: HERO_SIZES, attrs: 'fetchpriority="high"' })}<video id="hero-video" muted loop playsinline preload="metadata" tabindex="-1"><source src="${asset(`${media}/hero.mp4`)}" type="video/mp4"></video></div>
<div class="hero-wash" aria-hidden="true"></div>
<div class="film-stage"><div class="wrap">
<figure class="film-card hero-card">
<div class="hero-card-head"><span>Incoming request</span><span>${esc(d.name)}</span></div>
<p class="hero-card-request">“${esc(d.hero.request)}”</p>
<p class="hero-card-label">What happens next</p>
<ol class="handoff">${d.hero.next.map((s, i) => `<li><span class="number">${pad2(i + 1)}</span><strong>${esc(s.who)}</strong><span>${esc(s.does)}</span></li>`).join('')}</ol>
<figcaption>Illustrative example · synthetic data</figcaption>
</figure>
</div></div>
<div class="wrap hero-content">
<div class="hero-copy">
${eyebrow(`${SITE.name} · ${d.hero.eyebrow}`)}
<h1 id="headline"><span>${esc(d.hero.headline[0])}</span> <span>${esc(d.hero.headline[1])}</span></h1>
</div>
<div class="hero-side">
<p class="intro">${esc(d.hero.intro)}</p>
<div class="actions"><a class="btn outline" href="#start">Talk to us</a><a class="btn outline" href="#example">See the workflow</a></div>
<p class="micro">${esc(d.hero.audience)}. ${esc(d.hero.foot)}<br>Built and run by Actuathron.</p>
</div>
</div>
<div class="hero-foot"><button type="button" class="video-control" id="video-toggle">Pause video</button></div>
</section>
<div class="scene"><div class="wrap">
${answerBlock({ ...d.summary, link: guide ? { href: `/guides/${guide.slug}`, label: guide.title } : { href: '/guides/staff-minutes-per-resolved-request', label: 'How results are measured' } }, d.scope)}
</div></div>
<div class="statement"><div class="wrap"><p>${esc(d.statement[0])} <strong>${esc(d.statement[1])}</strong></p></div></div>
<section id="how" class="sec raised workflow"><div class="wrap">
<div class="center-head">${eyebrow(d.workflow.eyebrow)}<h2>${esc(d.workflow.heading)}</h2><p>This page covers one task: ${esc(d.task)}. ${esc(d.workflow.body)}</p></div>
</div>
${marquee(names)}
<div class="wrap">
${stepsDiagram(d.workflow.steps.map((s, i) => ({ ...s, example: examples[i] })))}
<p class="micro example-note">Illustrative example with synthetic data, from the “${esc(first.tab)}” scenario below. It is not a customer record.</p>
</div></section>
<section class="scn-section sec deep" id="example"><div class="wrap">
<div class="section-head"><div>${eyebrow(d.demo.eyebrow)}<h2>${esc(d.demo.heading)}</h2></div><p>${esc(d.demo.body)}</p></div>
<div class="scn">
<aside class="scn-side"><div class="label">Choose a scenario</div><div class="tabs" role="group" aria-label="Example scenarios">${d.demo.scenes.map((s, i) => `<button type="button" class="tab${i === 0 ? ' active' : ''}" aria-pressed="${i === 0}" aria-controls="scn-panel"><span class="tab-n" aria-hidden="true">${pad2(i + 1)}</span>${esc(s.tab)}</button>`).join('')}</div><p class="micro">Illustrative demo with synthetic data. These examples show how the workflow runs; they do not connect to live systems.</p></aside>
<div class="scn-body" id="scn-panel">
<div class="scn-titlebar"><span>${SITE.name} / ${esc(d.name)}</span><span>Illustrative example</span></div>
<ol class="scn-track"><li class="done"><span class="track-n" aria-hidden="true">01</span>Request captured</li><li class="done"><span class="track-n" aria-hidden="true">02</span>Next step prepared</li><li id="scn-stage"><span class="track-n" aria-hidden="true">03</span>Your team decides<em id="scn-stage-state">Waiting</em></li></ol>
<div class="scn-inner">
<dl class="scn-meta"><div><dt>Source</dt><dd id="scn-source">${esc(first.source)}</dd></div><div><dt>Owner</dt><dd id="scn-owner">${esc(first.owner)}</dd></div></dl>
<p class="request" id="scn-request">${esc(first.request)}</p>
<div class="rule"><span class="rule-label">Rule</span><span id="scn-rule">${esc(first.rule)}</span></div>
<p class="draft-label">Proposed next step</p>
<p class="draft" id="scn-draft">${esc(first.draft)}</p>
<div class="scn-actions"><button class="btn" id="scn-act" type="button">${esc(first.action)}</button><button class="reset" id="scn-reset" type="button">Reset example</button></div>
<div class="scn-status" id="scn-status" role="status" aria-live="polite"></div>
</div>
</div>
</div>
<noscript><p>The interactive example requires JavaScript. You can contact <a href="mailto:${SITE.email}">${SITE.email}</a> to get started.</p></noscript>
</div></section>
<section class="measure">
<div class="measure-copy light">${eyebrow('Value you can check')}<h2>See the results<br>in your numbers.</h2><p class="lede">We record how your team works today, then track the outcome, the exceptions, and the staff time needed to get there.</p>
<div class="readout"><span class="readout-label">The measure we suggest</span><h3>${esc(d.measure.metric)}</h3><p>${esc(d.measure.metricBody)}</p></div>
<a class="btn dark" href="#start">Talk to us</a></div>
<div class="measure-photo">${posterPicture(d.key, { sizes: '(max-width: 1000px) 100vw, 50vw', maxWidth: 1280, attrs: 'loading="lazy" decoding="async"' })}
<div class="boundary"><h3>${esc(d.measure.boundary)}</h3><p>${esc(d.measure.boundaryBody)}</p>${boundaryLinks(d.measure.boundaryLinks)}</div></div>
</section>
<section id="start" class="start sec"><div class="wrap"><div class="start-panel">
<div>
${eyebrow('Get started', 'accent')}
<h2>Offload the<br>repetitive work.</h2>
<p>Tell us where requests pile up. We agree the work, fees, limits, and how results are measured, then go live.</p>
<ul class="scope">${d.start.scope.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
<h3 class="start-head">How to start, step by step</h3>
<ol class="start-steps">${steps.map(s => `<li><strong>${esc(s.name)}.</strong> ${esc(s.text)}</li>`).join('')}</ol>
<p class="micro">Live once scope and access are agreed. Integration feasibility is assessed first.</p>
</div>
<div>
<form id="enquiry-form" class="enquiry">
<p class="form-head"><span>Enquiry</span><span>${esc(d.name)}</span></p>
<div class="form-grid">
<div class="field full"><label for="organisation">${esc(d.form.orgLabel)}</label><input id="organisation" name="organisation" maxlength="100" required autocomplete="organization" placeholder="${esc(d.form.orgPlaceholder)}"></div>
<div class="field"><label for="name">Your name</label><input id="name" name="name" maxlength="80" required autocomplete="name" placeholder="Full name"></div>
<div class="field"><label for="email">Work email</label><input id="email" name="email" type="email" maxlength="140" required autocomplete="email" placeholder="${esc(d.form.emailPlaceholder)}"></div>
<div class="field full"><label for="workflow-choice">Workflow to explore</label><select id="workflow-choice" name="workflow">${d.form.workflows.map(w => `<option>${esc(w)}</option>`).join('')}</select></div>
<div class="field full"><label for="tools">Current tools <span class="optional">(optional)</span></label><input id="tools" name="tools" maxlength="180" placeholder="${esc(d.form.toolsPlaceholder)}"></div>
<div class="field full"><label for="volume">${esc(d.form.volumeLabel)}</label><select id="volume" name="volume">${VOLUMES.map(v => `<option>${v}</option>`).join('')}</select></div>
</div>
<button class="btn" type="submit">Review enquiry ${arrow}</button>
<p class="micro form-note">Review your enquiry, then send it to ${SITE.name} from your email app. ${esc(d.form.recordsNote)}</p>
</form>
<div id="draft-preview" class="draft-preview" tabindex="-1" hidden>
<strong>Review your enquiry</strong>
<pre id="brief-text"></pre>
<div class="draft-actions">
<p id="send-status" class="micro" role="status">Not sent yet. Open the email draft to send it to ${SITE.email}.</p>
<a class="btn" id="email-draft" href="mailto:${SITE.email}">Open email draft ${arrow}</a> <button class="btn download" id="download-brief" type="button">Download draft</button>
<p class="micro privacy-note">An email draft or a download stays on your device until you send it. <a href="/privacy">Privacy</a>.</p>
</div>
</div>
</div>
</div></div></section>
${faqSection(faq)}
<section class="cta">
<div class="cta-media" aria-hidden="true">${posterPicture('cta', { sizes: '112vw', attrs: 'loading="lazy" decoding="async"' })}</div>
<div class="wrap">
<h2>${esc(d.tagline)}</h2>
<p class="body">${esc(SITE.name)} is the Actuathron company for ${esc(d.hero.audience.replace(/^For /, ''))}.</p>
<div class="actions"><a class="btn outline" href="#start">Get in touch</a></div>
</div></section>`;

  return page({
    path,
    title,
    jsonLd: graph([
      webPage({ path, title, description: d.description, updated: SITE.updated[path], mainEntity: serviceId(d.key) }),
      service(d),
      howTo(path, `How to start ${d.task} with ${SITE.name}`, steps),
      faqPage(path, faq),
      breadcrumbs(path, [{ name: SITE.name, path: '/' }, { name: d.name, path }]),
    ]),
    summary: 'Pricing and dispatch need human approval.',
    markdown: '/index.md',
    image: '/og/home.png',
    imageAlt: HOME_IMAGE_ALT,
    bodyClass: `sector ${d.key}`,
    header: header({
      label: d.name,
      links: [{ href: '#start', label: 'Talk to us', button: true }],
    }),
    main,
    footer: footer({ current: 'home' }),
    config: {
      key: d.key,
      name: d.name,
      email: SITE.email,
      briefOrgLabel: d.form.briefOrgLabel,
      briefRecordsLine: d.form.briefRecordsLine,
      scenes: d.demo.scenes,
    },
  });
}
