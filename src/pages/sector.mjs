import { SITE } from '../site.mjs';
import { esc, arrow, page, header, footer, promiseStrip, faqList, answerBlock, boundaryLinks, COST_FAQ } from '../layout.mjs';
import { graph, webPage, faqPage, service, serviceId, howTo } from '../seo.mjs';
import { asset, posterPicture } from '../assets.mjs';
// The hero image fills the viewport width, or more on tall screens.

// accent: wraps the headline's accent phrase (hero.accent) in a span. The words stay plain text in the HTML.
function accent(html, phrase) {
  if (!phrase) return html;
  const p = esc(phrase);
  if (!html.includes(p)) throw new Error(`hero.accent "${phrase}" is not in the headline`);
  return html.replace(p, `<span class="h1-accent">${p}</span>`);
}

export const HERO_SIZES = 'max(100vw, 178vh)';

const VOLUMES = ['Not sure yet', 'Under 25', '25–100', '101–300', 'More than 300'];

export const ENQUIRY_FAQ = {
  q: 'What happens to my enquiry details?',
  a: 'They stay in your browser until you send them. This page does not submit or store the form details on a server. Opening an email draft hands those details to your email app; you decide whether to send it. Downloading saves a text copy to your device. Hosting access logs are separate from this form.',
};

// The one task the home page supports, as numbered steps. The same list feeds the HowTo markup.
export const startSteps = d => [
  { name: 'Choose the workflow', text: `Pick one workflow in the form on this page, such as ${d.form.workflows[0].toLowerCase()}, and list the tools you use today.` },
  { name: 'Send the enquiry', text: `Review the enquiry, then send it to ${SITE.email} from your own email app.` },
  { name: 'Agree the terms', text: 'Agree the scope, approval rules, fees, limits and how results are measured. Integration feasibility is assessed first.' },
  { name: 'Test with sample data', text: 'Run the agreed rules on synthetic examples before any live data is connected.' },
  { name: 'Go live', text: 'Go live with the agreed rules, with regular reports on results and staff time.' },
];

const pad = n => String(n).padStart(2, '0');
export const ACTOR = { agent: 'Agent', team: 'Human', customer: 'Customer' };
export const LANES = ['customer', 'agent', 'team'];
export const LANE_NAME = { customer: 'Customer', agent: `${SITE.name} agent`, team: 'Your team' };
export const STAGES = ['Intake', 'Work', 'Hand-off', 'Close'];

// Simple line icons, drawn once in an SVG sprite and referenced by each step (no emoji, no images).
const ICON_PATHS = {
  inbox: 'M4 13h4l1.5 2.5h5L16 13h4M5.5 5h13L20 13v5.5a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5V13z',
  tag: 'M3.5 11.5V4h7.5l9 9-7.5 7.5zM7.5 8h.01',
  search: 'M11 4.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM20 20l-4.4-4.4',
  rule: 'M4 7l2 2 3.5-3.5M4 15l2 2 3.5-3.5M13 8h7M13 16h7',
  pen: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  handoff: 'M4 9h14l-3.5-3.5M20 15H6l3.5 3.5',
  clock: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM12 8v4.5l3 2',
  check: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM8.5 12.5l2.5 2.5 4.5-5',
  send: 'M20 4L4 11l6.5 2.5L13 20zM20 4l-9.5 9.5',
  archive: 'M4 5h16v4H4zM5.5 9v10h13V9M10 13h4',
  shield: 'M12 3.5l7 3v5c0 4.3-2.9 7.6-7 9.5-4.1-1.9-7-5.2-7-9.5v-5zM9 12l2 2 4-4',
  tick: 'M5 12.5l4.5 4.5L19 7.5',
  'a-customer': 'M12 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5',
  'a-agent': 'M7 7h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM12 4v3M9.5 12h.01M14.5 12h.01',
  'a-team': 'M9 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM16.5 7.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8M15 14.4c2.6-.2 4.6 1.4 5.2 4.1',
};
export const iconSprite = () => `<svg class="sprite" aria-hidden="true" focusable="false">${Object.entries(ICON_PATHS).map(([k, d]) => `<symbol id="i-${k}" viewBox="0 0 24 24"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>`).join('')}</svg>`;
export const icon = (k, cls = '') => `<svg class="ic${cls ? ` ${cls}` : ''}" aria-hidden="true" focusable="false"><use href="#i-${k}"/></svg>`;

// Who does each step: every summary counts each step once, by who does it, so the parts always add up to the step
// total. Approvals are not counted here: they mark steps already counted, so a separate number would read as a share.
const BY = [['agent', `by ${SITE.name}`], ['customer', 'by the customer'], ['team', 'by your team']];
export const flowSummary = steps => {
  const parts = BY.map(([actor, who]) => [steps.filter(s => s.actor === actor).length, who]).filter(([n]) => n > 0);
  if (parts.reduce((sum, [n]) => sum + n, 0) !== steps.length) throw new Error('Summary counts do not add up to the step total');
  return `${steps.length} steps: ${parts.map(([n, who]) => `${n} ${who}`).join(', ')}`;
};
// The closing line of a run repeats the summary with the enquiry's final status.
export const flowEnd = steps => {
  const last = steps[steps.length - 1].status;
  return `${flowSummary(steps)} · ${last.charAt(0).toLowerCase()}${last.slice(1)}`;
};

// A request run, built the same way on every Actuathron site: three lanes (customer, Crewola, your team), a
// bold one-to-three-word label and an icon per step, phase headers, a checkpoint marker wherever your team
// approves, and an example conversation. Every word is in the HTML, so it reads the same without JavaScript, to
// screen readers and to crawlers; styles.css plays it in order on a loop and site.js only starts and pauses it.
// The layout is fixed from first paint: playing only changes opacity and transform, never a filter or a scale on text. No style
// attributes (CSP style-src 'self'): timing comes from the sN/pK classes below.
const LANE_KEYS = [['customer', 'Customer'], ['agent', SITE.name], ['team', 'Your team']];
export const checkpoint = `<span class="run-check">${icon('shield', 'run-ic')}Your team approves</span>`;
export const actorIcon = (lane, cls = 'run-ic run-actor-ic') => icon(`a-${lane}`, cls);
// A request film, built the same way on every card (the hero, each scenario and the workflow): six short shots cut
// together like a product video. Each shot is one moment of the enquiry, a big title line and a mock app screen:
// the shopper's message, the record check, the approval, the hand-off, staff confirming, and an end card with the
// summary. Every word is in the HTML, so the film reads as a storyboard without JavaScript, with reduced motion, to
// screen readers and to crawlers; styles.css plays the shots in one fixed frame on a loop, with no controls, and
// site.js only starts and pauses it. No style attributes (CSP style-src 'self'): each shot's place comes from its kN class.
// Steps fall into shots by what they do, so the shots follow the step data and every step appears exactly once.
const SHOT_OF = { inbox: 0, tag: 1, search: 1, rule: 1, pen: 2, handoff: 3, clock: 3, check: 4, send: 4, archive: 5 };
export const FILM_SHOTS = 6;
const approvalLine = m => m.from === 'team' && /^Approved\b/.test(m.text);
// One or two lines per shot: every line if there are two or fewer, otherwise the last line of each step.
const shotLines = steps => {
  const all = steps.flatMap(st => st.chat.filter(m => !approvalLine(m)));
  const lines = all.length <= 2 ? all : steps.map(st => st.chat.filter(m => !approvalLine(m)).pop()).filter(Boolean);
  return lines.slice(0, 2);
};
export const filmShots = steps => {
  const shots = Array.from({ length: FILM_SHOTS }, () => []);
  steps.forEach((st, i) => shots[SHOT_OF[st.icon]]?.push({ ...st, i }));
  return shots;
};
export function film(scene, { compact = false } = {}) {
  const { steps, people, titles } = scene;
  const shots = filmShots(steps);
  const firstName = people.team.split(',')[0];
  const owner = scene.owner || people.team.split(', ')[1]?.replace(/^./, c => c.toUpperCase()) || 'Your team';
  const speaker = m => (m.from === 'agent' && m.note ? 'note' : m.from);
  const bubble = (m, cls) => {
    const who = speaker(m);
    const lane = who === 'note' ? 'agent' : who;
    const label = { customer: `<span class="visually-hidden">${esc(people.customer)} (example customer): </span>`, agent: `<b class="fb-who">${SITE.name} draft:</b> `, note: '<b class="fb-who">Note:</b> ', team: `<b class="fb-who">${esc(firstName)}:</b> ` }[who];
    return `<p class="fb fb-${who} lane-${lane} ${cls}">${actorIcon(lane, 'f-ic')}<span>${label}${esc(m.text)}</span></p>`;
  };
  const approve = (st, cls) => {
    const line = st.chat.find(approvalLine);
    return `<div class="f-approve ${cls}">${checkpoint}<span class="f-btn"><span class="f-btn-idle">Approve and send</span><span class="f-btn-done">${icon('tick', 'f-ic')}${esc(firstName)}: ${esc(line ? line.text : 'Approved.')}</span><i class="f-tap" aria-hidden="true"></i></span></div>`;
  };
  const win = (bar, body, cls = '') => `<div class="f-win${cls}"><p class="f-bar"><span class="f-dots" aria-hidden="true"><i></i><i></i><i></i></span>${bar}</p><div class="f-body">${body}</div></div>`;
  const ui = [
    // 1. The shopper's message arrives on a phone.
    sh => {
      const [m] = shotLines(sh);
      return `<div class="f-phone"><p class="f-src">${esc(scene.source || 'Website enquiry')}</p><span class="f-typing a0" aria-hidden="true"><i></i><i></i><i></i></span>${bubble(m, 'a1')}<p class="f-meta a2">${esc(people.customer)} · example customer</p></div>`;
    },
    // 2. Crewola reads it and checks the record: tags appear, then the notes.
    sh => win(`Enquiry · ${esc(people.customer)}`, `<ul class="f-tags">${sh.map((st, j) => `<li class="f-tag lane-agent a${j + 1}">${icon(st.icon, 'f-ic')}${esc(st.status)}</li>`).join('')}<li class="f-tag lane-team a${Math.min(sh.length + 1, 3)}">${actorIcon('team', 'f-ic')}Owner: ${esc(owner)}</li></ul>${shotLines(sh).map((m, j) => bubble(m, `a${j + 2}`)).join('')}`),
    // 3. The reply is drafted and your team approves it.
    sh => win(`Draft reply · to ${esc(people.customer)}`, `${shotLines(sh).map(m => bubble(m, 'a1')).join('')}${approve(sh.find(st => st.approval) || sh[0], 'a2')}`),
    // 4. Hand-off: a brief arrives with the right person; the reminder follows.
    sh => {
      const [a, b] = shotLines(sh);
      return win(`To: ${esc(people.team)}`, `<div class="f-brief a1">${icon('handoff', 'f-ic f-brief-ic')}<div><p class="f-brief-t">Brief from ${SITE.name}</p>${bubble(a, '')}</div></div>${b ? bubble(b, 'a3') : ''}`, ' f-win-inbox');
    },
    // 5. Staff confirm, and the confirmation goes to the customer once approved.
    sh => {
      const ap = sh.find(st => st.approval);
      return win(`Enquiry · ${esc(people.customer)}`, `${shotLines(sh).map((m, j) => bubble(m, `a${j + 1}`)).join('')}${ap ? `<p class="f-ok a3">${checkpoint}<span>${esc(ap.approval)}</span></p>` : ''}`);
    },
    // 6. End card: closed and logged, with the summary that adds up.
    sh => `<div class="f-end"><span class="f-end-mark a0" aria-hidden="true">${icon('tick', 'f-ic')}</span><p class="f-end-name">${SITE.name}</p>${shotLines(sh).map(m => bubble(m, 'a1')).join('')}<p class="film-end a2">${esc(flowEnd(steps))}</p></div>`,
  ];
  const CAM = ['cam-push', 'cam-zoom cam-at-tags', 'cam-zoom cam-at-approve', 'cam-pan', 'cam-push', 'cam-push'];
  const stepsOf = sh => `<ol class="shot-steps" start="${sh[0].i + 1}">${sh.map(st => `<li class="film-step lane-${st.actor}">${actorIcon(st.actor, 'f-ic')}<span><span class="f-num">${pad(st.i + 1)}</span> ${esc(st.label)}<span class="visually-hidden">, ${ACTOR[st.actor].toLowerCase()} (${esc(st.who)})${st.approval ? ', your team approves' : ''}</span></span></li>`).join('')}</ol>`;
  return `<div class="film${compact ? ' film-compact' : ''}" role="group" aria-label="Example film: ${esc(scene.tab)}">
<div class="film-frame"><ol class="film-shots">${shots.map((sh, k) => `<li class="shot k${k} shot-${['message', 'check', 'approve', 'handoff', 'confirm', 'end'][k]}"><div class="shot-cam ${CAM[k]}"><p class="shot-title"><span class="visually-hidden">Scene ${k + 1} of ${FILM_SHOTS}: </span>${esc(titles[k])}</p><div class="shot-ui">${ui[k](sh)}</div>${stepsOf(sh)}</div></li>`).join('')}</ol></div>
<div class="film-foot"><p class="film-summary">${esc(flowSummary(steps))}</p></div>
</div>`;
}
export const legend = `<p class="run-legend">${LANE_KEYS.map(([key, name]) => `<span class="lane-key lane-${key}">${actorIcon(key)}${esc(name)}</span>`).join(' ')} ${checkpoint}</p>`;

// The workflow overview: eight steps, two per phase, each with its actor, icon and any approval. The page shows
// them as a run card, the same component as the scenarios; the full wording of each step sits in a closed
// <details> under it and in llms.txt.
const FLOW_PHASE = [0, 0, 1, 1, 2, 2, 3, 3];
const flowRun = w => ({ tab: 'Workflow', people: w.people, titles: w.titles, steps: w.steps.map((s, i) => ({ ...s, stage: FLOW_PHASE[i] + 1 })) });

// The home page, built from the one service file in src/content/sectors. Its "In short" answer links to the
// guide whose `sector` is this service, if there is one.
export const SITE_FAQ = [
  { q: `Who is ${SITE.name} for?`, a: `Home service companies, starting with HVAC, whose office, dispatch and estimating teams handle a steady stream of service calls and quote requests. ${SITE.name} is for organisations only; there is no personal plan.` },
  { q: 'Does it send messages to customers on its own?', a: 'No. Your team reviews external messages before they go out, and approval rules are agreed before anything goes live.' },
  { q: 'Who makes the decisions?', a: 'Your team does. Drafts and handoffs are prepared for review; pricing, dispatch, diagnosis, safety decisions, discounts, exceptions and anything outside the agreed scope stay with the people responsible. Pricing and dispatch always need human approval.' },
  { q: 'Can we use real customer data before going live?', a: 'No. Use synthetic examples for discovery. Live data is connected only after a separate review of access, privacy, security, retention and the applicable agreements.' },
];

export function sectorPage(d, guides = []) {
  const media = `/media/${d.key}`;
  const path = '/';
  const faq = [...d.faq, ...SITE_FAQ, COST_FAQ, ENQUIRY_FAQ];
  // The first scenario is in the HTML, so the example reads the same without JavaScript; site.js takes over from there.
  const first = d.demo.scenes[0];
  const title = `${SITE.titleBrand} · ${d.hero.headline.join(' ').replace(/\s+/g, ' ').replace(/\.$/, '')}`;
  const steps = startSteps(d);
  const guide = guides.find(g => g.sector === d.key);
  if (d.workflow.steps.length !== FLOW_PHASE.length || d.workflow.steps.some(s => !ACTOR[s.actor] || !s.who || !s.title || !s.body || !ICON_PATHS[s.icon])) throw new Error(`${d.key}: the workflow needs 8 complete steps`);
  if (!d.workflow.intro || d.workflow.intro.split(/\s+/).length > 20) throw new Error(`${d.key}: the workflow intro needs one sentence of 20 words or fewer`);
  const flow = flowRun(d.workflow);
  for (const s of [flow, ...d.demo.scenes]) {
    if (s.steps.length < 6 || s.steps.length > 9) throw new Error(`${d.key}: scene "${s.tab}" needs 6 to 9 steps`);
    if (!s.steps.some(st => st.actor === 'customer')) throw new Error(`${d.key}: scene "${s.tab}" needs a customer step`);
    if (!s.people?.customer || !s.people?.team) throw new Error(`${d.key}: scene "${s.tab}" needs people`);
    for (const st of s.steps) if (!Array.isArray(st.chat) || st.chat.length < 1 || st.chat.length > 2 || st.chat.some(m => !ACTOR[m.from] || !m.text || m.text.length > 100)) throw new Error(`${d.key}: scene "${s.tab}" needs 1 or 2 short messages per step`);
    if (!Array.isArray(s.titles) || s.titles.length !== FILM_SHOTS || s.titles.some(t => t.split(/\s+/).length < 2 || t.split(/\s+/).length > 4)) throw new Error(`${d.key}: scene "${s.tab}" needs ${FILM_SHOTS} title lines of 2 to 4 words`);
    const shots = filmShots(s.steps);
    if (shots.flat().length !== s.steps.length || shots.some(sh => !sh.length)) throw new Error(`${d.key}: scene "${s.tab}" needs every step in one of the ${FILM_SHOTS} film shots, and every shot filled`);
    if (shots.some((sh, k) => k && sh[0].i < shots[k - 1].at(-1).i)) throw new Error(`${d.key}: scene "${s.tab}" film shots must follow the step order`);
    if (!shots[0].some(st => st.actor === 'customer')) throw new Error(`${d.key}: scene "${s.tab}" film must open on the customer's message`);
    if (!shots[2].some(st => st.approval)) throw new Error(`${d.key}: scene "${s.tab}" film needs an approval in its third shot`);
    for (const st of s.steps) if (!ACTOR[st.actor] || !st.status || !st.does || !st.label || st.label.split(' ').length > 3 || !ICON_PATHS[st.icon] || !(st.stage >= 1 && st.stage <= STAGES.length)) throw new Error(`${d.key}: scene "${s.tab}" has an incomplete step`);
  }
  const main = `${iconSprite()}<section class="hero" aria-labelledby="headline">
<div class="hero-media" aria-hidden="true">${posterPicture(d.key, { sizes: HERO_SIZES, attrs: 'fetchpriority="high"' })}<video id="hero-video" muted loop playsinline preload="metadata" tabindex="-1"><source src="${asset(`${media}/hero.mp4`)}" type="video/mp4"></video></div>
<div class="hero-wash" aria-hidden="true"></div>
<div class="wrap hero-content">
<div class="hero-copy">
<div class="eyebrow">${esc(d.hero.eyebrow)}</div>
<h1 id="headline">${accent(esc(d.hero.headline[0]), d.hero.accent)} <em>${esc(d.hero.headline[1])}</em></h1>
<p class="intro">${esc(d.hero.intro)}</p>
<div class="actions"><a class="btn" href="#start">Talk to us ${arrow}</a><a class="btn outline" href="#example">See the workflow <span aria-hidden="true">↓</span></a></div>
<p class="micro">${esc(d.hero.audience)}<br>Pricing and dispatch always need human approval.</p>
</div>
<figure class="hero-card">
${film(first, { compact: true })}
<figcaption>Illustrative example · synthetic data</figcaption>
</figure>
</div>
<div class="hero-foot"><span>${esc(d.hero.foot)}</span><button type="button" class="video-control" id="video-toggle">Pause video</button></div>
</section>
<div class="wrap">
${promiseStrip()}
${answerBlock({ ...d.summary, link: guide ? { href: `/guides/${guide.slug}`, label: guide.title } : { href: '/guides/staff-minutes-per-resolved-request', label: 'How results are measured' } }, d.scope)}
<div class="statement"><p>${esc(d.statement[0])} <strong>${esc(d.statement[1])}</strong></p></div>
<section id="workflow">
<div class="section-head"><div><div class="eyebrow">${esc(d.workflow.eyebrow)}</div><h2>${esc(d.workflow.heading)}</h2></div><p>${esc(d.workflow.intro)}</p></div>
<figure class="wf-card">
${film(flow)}
<figcaption>Illustrative example · synthetic data</figcaption>
</figure>
<details class="wf-more">
<summary>Read every step</summary>
<p>${esc(d.workflow.body)}</p>
<ol class="wf-steps">${d.workflow.steps.map((s, i) => `<li class="lane-${s.actor}"><h3><span class="number">${pad(i + 1)}</span> ${esc(s.title)} <span class="wf-who">${esc(s.who)} · ${STAGES[FLOW_PHASE[i]]}</span></h3><p>${esc(s.body)}</p>${s.approval ? `<p class="wf-approval"><strong>Human approval:</strong> ${esc(s.approval)}</p>` : ''}</li>`).join('\n')}</ol>
</details>
</section>
</div>
<section class="demo-section" id="example"><div class="wrap">
<div class="section-head"><div><div class="eyebrow">${esc(d.demo.eyebrow)}</div><h2>${esc(d.demo.heading)}</h2></div><p>${esc(d.demo.body)}</p></div>
<div class="demo">
<aside class="demo-side"><div class="label">Choose a scenario</div><div class="tabs" role="group" aria-label="Example scenarios">${d.demo.scenes.map((s, i) => `<button type="button" class="tab${i === 0 ? ' active' : ''}" aria-pressed="${i === 0}" aria-controls="scene-${i}">${esc(s.tab)}</button>`).join('')}</div>${legend}<p class="micro">Each scenario uses synthetic data to show one enquiry end to end, from the first message to closed and logged. Agent steps are prepared by ${SITE.name}; human steps are your staff.</p></aside>
<div class="demo-body" id="demo-panel">
<div class="demo-titlebar"><span>${SITE.name} / Service calls</span><span>Illustrative example · synthetic data</span></div>
<div class="scenes">
${d.demo.scenes.map((s, i) => `<article class="scene${i === 0 ? ' is-active' : ''}" id="scene-${i}" aria-label="${esc(s.tab)} scenario">
<div class="demo-meta"><span>${esc(s.source)}</span><span class="pill">Owner: ${esc(s.owner)}</span></div>
${film(s)}
<details class="wf-more scene-more">
<summary>Read every step</summary>
<p>Request: “${esc(s.request)}” Rule: ${esc(s.rule)}</p>
<ol class="wf-steps">${s.steps.map((st, j) => `<li class="lane-${st.actor}"><h3><span class="number">${pad(j + 1)}</span> ${esc(st.label)} <span class="wf-who">${esc(st.who)} · ${STAGES[st.stage - 1]}</span></h3><p>${esc(st.does)}</p>${st.approval ? `<p class="wf-approval"><strong>Human approval:</strong> ${esc(st.approval)}</p>` : ''}</li>`).join('')}</ol>
</details>
</article>`).join('\n')}
</div>
<div class="demo-actions"><span class="demo-status">A local simulation. No live action is taken.</span></div>
</div>
</div>
<noscript><p>All three scenarios are shown in full above. You can contact <a href="mailto:${SITE.email}">${SITE.email}</a> to get started.</p></noscript>
</div></section>
<div class="wrap">
<section class="measure">
<div><div class="eyebrow">Value you can check</div><h2>See the results<br>in your numbers.</h2><p class="lede">We record how your team works today, then track the outcome, the exceptions, and the staff time needed to get there.</p></div>
<div>
<div class="measure-box"><span class="eyebrow">The measure we suggest</span><h3>${esc(d.measure.metric)}</h3><p>${esc(d.measure.metricBody)}</p></div>
<div class="boundary"><h3>${esc(d.measure.boundary)}</h3><p>${esc(d.measure.boundaryBody)}</p>${boundaryLinks(d.measure.boundaryLinks)}</div>
</div>
</section>
<section id="start"><div class="start-panel">
<div>
<div class="eyebrow">Get started</div>
<h2>Stop chasing<br>requests.</h2>
<p>Tell us where requests pile up. We agree the work, fees, limits, and how results are measured, then go live.</p>
<ul class="scope">${d.start.scope.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
<h3 class="start-head">How to start, step by step</h3>
<ol class="start-steps">${steps.map(s => `<li><strong>${esc(s.name)}.</strong> ${esc(s.text)}</li>`).join('')}</ol>
<p class="micro">Live once scope and access are agreed. Integration feasibility is assessed first.</p>
</div>
<div>
<form id="enquiry-form">
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
<p id="send-status" class="micro" role="status">Not sent yet. Open the email draft to send it to ${SITE.email}.</p>
<a class="btn" id="email-draft" href="mailto:${SITE.email}">Open email draft ${arrow}</a> <button class="btn download" id="download-brief" type="button">Download draft</button>
<p class="micro privacy-note">An email draft or a download stays on your device until you send it. <a href="/privacy">Privacy</a>.</p>
</div>
</div>
</div></section>
<section class="faq" id="questions">
<div><div class="eyebrow">Before we begin</div><h2>A few useful<br>answers.</h2></div>
<div>
${faqList(faq)}
</div>
</section>
</div>`;

  return page({
    path,
    title,
    jsonLd: graph([
      webPage({ path, title, description: d.description, updated: SITE.updated[path], mainEntity: serviceId() }),
      service(d),
      howTo(path, `How to start ${d.task} with ${SITE.name}`, steps),
      faqPage(path, faq),
          ]),
    description: d.description,
    image: '/og/home.png',
    imageAlt: `${SITE.name}: ${d.hero.headline.join(' ')} Set over a still of an indoor air-conditioning unit.`,
    bodyClass: d.key,
    header: header({
      links: [
        { href: '/guides', label: 'Guides' },
        { href: '#workflow', label: 'Workflow' },
        { href: '#questions', label: 'Questions' },
        { href: '#start', label: 'Talk to us', button: true },
      ],
    }),
    main,
    footer: footer({ current: 'home' }),
    config: {
      key: d.key,
      name: SITE.name,
      email: SITE.email,
      briefOrgLabel: d.form.briefOrgLabel,
      briefRecordsLine: d.form.briefRecordsLine,
    },
  });
}
