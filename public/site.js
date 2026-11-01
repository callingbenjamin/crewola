'use strict';
// Shared behaviour for every Crewola page. Each block only runs when its markup is present.
const $ = id => document.getElementById(id);

// Header: compact bar once the page scrolls. Two thresholds, so a page resting near the line never flips it back
// and forth.
const header = document.querySelector('.top');
if (header) {
  const updateHeader = () => {
    const on = header.classList.contains('scrolled');
    if (!on && window.scrollY > 90) header.classList.add('scrolled');
    else if (on && window.scrollY < 40) header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', updateHeader, { passive: true });
  // No check at start-up: reading the scroll position then forces the layout that follows the web font swap into
  // one long script task. A page opened part-way down (an anchor link or a reload) fires a scroll event anyway.
}
document.querySelectorAll('.mobile nav a').forEach(a =>
  a.addEventListener('click', () => document.querySelector('.mobile').removeAttribute('open')));

const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const configEl = $('config');
const config = configEl ? JSON.parse(configEl.textContent) : null;

// Request films: each card is a short product film of six shots cut together in one fixed frame. The shots and
// every word are already in the HTML (a storyboard without JavaScript or with reduced motion); styles.css plays
// them on a loop, and this only starts and pauses the CSS animations and replays a film from its first shot. A
// film plays while a quarter of it is on screen, its scenario is the one shown, and the visitor has not paused it.
const films = [...document.querySelectorAll('.film')];
// Replay: the animations restart in place, on the first shot. The first shot is the resting state, so the frame
// is never empty, and only the shots animate: the card, its frame and its height never change.
const restart = film => {
  film.classList.add('is-reset');
  void film.offsetWidth;
  film.classList.remove('is-reset');
};
const seen = new Set();
const sync = film => film.classList.toggle('is-playing', seen.has(film) && !film.paused && !film.closest('.scene:not(.is-active)'));
const syncAll = () => films.forEach(sync);
films.forEach(film => {
  const pause = film.querySelector('.film-pause');
  film.querySelector('.film-replay').addEventListener('click', () => {
    restart(film);
    if (film.paused) pause.click();
  });
  pause.addEventListener('click', () => {
    film.paused = !film.paused;
    pause.textContent = film.paused ? 'Play' : 'Pause';
    pause.setAttribute('aria-pressed', String(Boolean(film.paused)));
    sync(film);
  });
});
if (films.length && !motion.matches) document.documentElement.classList.add('flow-on'); // The controls were in the layout already, just invisible.
if (!('IntersectionObserver' in window)) { films.forEach(f => seen.add(f)); syncAll(); }
else {
  // Starts once a quarter of the film is on screen and pauses only when it has left the screen entirely, so a film
  // at the edge of the window never stutters between playing and paused.
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.intersectionRatio >= 0.25) seen.add(e.target);
    else if (!e.isIntersecting) seen.delete(e.target);
    sync(e.target);
  }), { threshold: [0, 0.25] });
  films.forEach(f => io.observe(f));
}

// Scenario tabs: the scenarios share one place on the page, so switching is a hard cut that moves nothing, and the
// chosen film plays from its first shot.
const scenes = [...document.querySelectorAll('.scene')];
const tabs = [...document.querySelectorAll('.tab')];
if (scenes.length && tabs.length) {
  const show = index => {
    tabs.forEach((b, i) => { b.classList.toggle('active', i === index); b.setAttribute('aria-pressed', String(i === index)); });
    scenes.forEach((s, i) => { s.classList.toggle('is-active', i === index); s.inert = i !== index; });
    const film = scenes[index].querySelector('.film');
    if (film) restart(film);
    syncAll();
  };
  scenes.forEach(s => { s.inert = !s.classList.contains('is-active'); });
  tabs.forEach((b, i) => b.addEventListener('click', () => show(i)));
}

// Enquiry: prepared in the browser, then sent by the visitor's own email app or saved as a file.
const form = $('enquiry-form');
if (config && form) {
  let brief = '';
  form.addEventListener('input', () => { $('draft-preview').hidden = true; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const f = new FormData(form);
    const v = k => String(f.get(k) || '').trim();
    brief = `Crewola enquiry

${config.briefOrgLabel}: ${v('organisation')}
Contact: ${v('name')}
Work email: ${v('email')}
Workflow: ${v('workflow')}
Current tools: ${v('tools') || 'To discuss'}
Approximate weekly volume: ${v('volume')}

I would like to discuss this workflow for our team. Please help confirm scope, integration feasibility, data handling, how results are measured, setup fee and ongoing costs.

${config.briefRecordsLine}`;
    $('brief-text').textContent = brief;
    $('email-draft').href = 'mailto:' + config.email
      + '?subject=' + encodeURIComponent(`${config.name} enquiry — ${v('organisation')}`)
      + '&body=' + encodeURIComponent(brief);
    $('draft-preview').hidden = false;
    $('draft-preview').focus();
  });
  $('download-brief').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `crewola-enquiry.txt`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

// Hero video: honours reduced motion and stays under the visitor's control.
const video = $('hero-video');
const videoToggle = $('video-toggle');
if (video && videoToggle) {
  let userPaused = false;
  const update = () => {
    // The play/pause symbol is drawn by CSS and not spoken, so the button's name is exactly its visible words.
    videoToggle.textContent = video.paused ? 'Play video' : 'Pause video';
    videoToggle.classList.toggle('is-paused', video.paused);
    video.classList.toggle('is-playing', !video.paused);
  };
  const start = async () => { try { await video.play(); } catch { update(); } };
  video.muted = true;
  video.addEventListener('play', update);
  video.addEventListener('pause', update);
  video.addEventListener('error', () => { videoToggle.hidden = true; });
  videoToggle.addEventListener('click', () => {
    if (video.paused) { userPaused = false; start(); } else { userPaused = true; video.pause(); }
  });
  motion.addEventListener('change', () => {
    if (motion.matches) { video.pause(); videoToggle.hidden = true; }
    else { videoToggle.hidden = false; if (!userPaused) start(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else if (!motion.matches && !userPaused) start();
  });
  if (motion.matches) videoToggle.hidden = true; else start();
}

// Home hero: slow crossfade through the industry photographs.
const slides = document.querySelectorAll('.hero-slides img');
if (slides.length > 1) {
  let i = 0, timer = null;
  const label = $('slide-label');
  // Later slides ship without image URLs (see posterPicture in src/assets.mjs); load one a slide ahead of time.
  const load = img => {
    if (!img.dataset.src) return;
    img.parentElement.querySelectorAll('source[data-srcset]').forEach(s => { s.srcset = s.dataset.srcset; s.removeAttribute('data-srcset'); });
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  };
  const step = () => {
    slides[i].classList.remove('on');
    i = (i + 1) % slides.length;
    load(slides[i]);
    slides[i].classList.add('on');
    load(slides[(i + 1) % slides.length]);
    if (label) label.textContent = slides[i].dataset.label;
  };
  const run = () => {
    if (timer || motion.matches || document.hidden) return;
    timer = setInterval(step, 5000);
    // Fetch the next photo once the page has finished loading, well before the first crossfade.
    if (document.readyState === 'complete') load(slides[(i + 1) % slides.length]);
    else window.addEventListener('load', () => load(slides[(i + 1) % slides.length]), { once: true });
  };
  const stop = () => { clearInterval(timer); timer = null; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : run()));
  motion.addEventListener('change', () => (motion.matches ? stop() : run()));
  run();
}
