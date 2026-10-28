/* =========================================================
   AdsTube · Diwali Offer Landing Page 2026 — script.js
   ---------------------------------------------------------
   EDIT BEFORE LAUNCH: everything in CONFIG below.
   ========================================================= */
const CONFIG = {
  // Offer window (IST). Countdown: "Starts in" → "Ends in" → "Offer ended".
  offerStart: '2026-11-04T00:00:00+05:30',
  offerEnd:   '2026-11-08T23:59:59+05:30',

  // Form endpoints — your CRM / webhook URL [TBC]. Leave '' to skip sending (demo mode).
  leadEndpoint:  '',
  queryEndpoint: '',

  // Where the lead form redirects after a successful submit
  thankYouUrl: 'thank-you.html',

  // Contact
  phone: '+919026232414',
  whatsapp: '919120647421',
  whatsappText: "Hi AdsTube, I'd like to know more about the Diwali offer.",

  // Google Tag Manager container ID (GA4, Google Ads & Meta Pixel are configured inside GTM).
  // IDs to add in GTM: G-XXXXXXXXXX · AW-XXXXXXXXX · Meta PIXEL_ID
  gtmId: 'GTM-XXXXXXX',

  // Query form: plan list changes with the service picked [plans TBC]
  plans: {
    'YouTube Video Ads': ['[Starter plan — TBC]', '[Growth plan — TBC]', '[Pro plan — TBC]'],
    'Google Ads':        ['[Starter plan — TBC]', '[Growth plan — TBC]', '[Pro plan — TBC]'],
    'Meta Ads':          ['[Starter plan — TBC]', '[Growth plan — TBC]', '[Pro plan — TBC]'],
    'Video Marketing':   ['[Video production — TBC]', '[Video SEO — TBC]', '[Production + promotion — TBC]']
  },

  // CAPTCHA: 'checkbox' is a placeholder. For production, swap in reCAPTCHA / Turnstile
  // and return its token from getCaptchaToken() below.
  captcha: 'checkbox'
};

/* ---------------------------------------------------------
   Helpers
   --------------------------------------------------------- */
document.documentElement.classList.add('js');
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = n => String(n).padStart(2, '0');

/* ---------------------------------------------------------
   Tracking: everything lands in the dataLayer
   --------------------------------------------------------- */
window.dataLayer = window.dataLayer || [];
function track(event, params = {}) {
  window.dataLayer.push(Object.assign({ event }, params));
}

(function loadGTM() {
  const id = CONFIG.gtmId;
  if (!id || /X{4,}/.test(id)) return; // placeholder — not loaded
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(id);
  document.head.appendChild(s);
})();
const gtmLoaded = () => !!(window.google_tag_manager && window.google_tag_manager[CONFIG.gtmId]);

/* Attribution: save UTM, gclid, fbclid for the session */
const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
function captureAttribution() {
  const qs = new URLSearchParams(location.search);
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem('adstube_attr') || '{}'); } catch (e) {}
  ATTR_KEYS.forEach(k => { if (qs.get(k)) saved[k] = qs.get(k); });
  if (!saved.landing_page) saved.landing_page = location.href;
  if (!saved.referrer && document.referrer) saved.referrer = document.referrer;
  try { sessionStorage.setItem('adstube_attr', JSON.stringify(saved)); } catch (e) {}
  return saved;
}
const attribution = captureAttribution();

/* ---------------------------------------------------------
   Sound effects — opt-in, Web Audio, no files
   --------------------------------------------------------- */
const Sound = {
  on: false, ctx: null,
  init() {
    try { this.on = localStorage.getItem('adstube_sound') === 'on'; } catch (e) {}
    const btn = $('[data-sound]');
    if (!btn) return;
    this.render(btn);
    btn.addEventListener('click', () => {
      this.on = !this.on;
      try { localStorage.setItem('adstube_sound', this.on ? 'on' : 'off'); } catch (e) {}
      this.render(btn);
      track('sound_toggle', { sound_state: this.on ? 'on' : 'off' });
      if (this.on) this.chime();
    });
  },
  render(btn) {
    btn.setAttribute('aria-pressed', String(this.on));
    $('[data-sound-label]', btn).textContent = this.on ? 'Sound on' : 'Sound off';
    $('[data-sound-icon] use', btn).setAttribute('href', this.on ? '#i-sound-on' : '#i-sound-off');
    btn.setAttribute('aria-label', this.on ? 'Turn sound effects off' : 'Turn sound effects on');
  },
  audio() {
    if (!this.on) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!this.ctx) this.ctx = new AC();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(freq, start, dur, type = 'sine', vol = .18) {
    const ctx = this.audio(); if (!ctx) return;
    const t = ctx.currentTime + start;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur + .05);
  },
  chime()   { [1318.5, 1975.5, 2637].forEach((f, i) => this.tone(f, i * .02, 1.4 - i * .3, 'sine', .14 - i * .03)); }, // bell
  tick()    { this.tone(1800, 0, .05, 'square', .05); },
  sparkle() { [1568, 2093, 2637, 3136, 3520].forEach((f, i) => this.tone(f, i * .07, .35, 'triangle', .09)); }
};

/* ---------------------------------------------------------
   Contact links (tel / WhatsApp) + CTA tracking
   --------------------------------------------------------- */
function initLinks() {
  const waUrl = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(CONFIG.whatsappText);
  $$('[data-wa]').forEach(a => { a.href = waUrl; a.target = '_blank'; a.rel = 'noopener'; });

  document.addEventListener('click', e => {
    const a = e.target.closest('a, button');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('tel:')) track('click_to_call', { link_location: a.dataset.cta || a.className });
    if (href.includes('wa.me') || href.includes('whatsapp')) track('whatsapp_click', { link_location: a.dataset.cta || a.className });
    if (a.dataset.cta && a.dataset.cta !== 'form_submit') {
      track('cta_click', { cta_id: a.dataset.cta, cta_text: a.textContent.trim() });
      Sound.chime();
    }
  });
}

/* ---------------------------------------------------------
   Countdown: "Starts in" → "Ends in" → "Offer ended"
   --------------------------------------------------------- */
const START = new Date(CONFIG.offerStart).getTime();
const END   = new Date(CONFIG.offerEnd).getTime();
let ended = false;

function offerPhase(now = Date.now()) {
  if (now < START) return { phase: 'before', target: START };
  if (now <= END)  return { phase: 'live',   target: END };
  return { phase: 'ended', target: END };
}

function tickCountdown() {
  const { phase, target } = offerPhase();
  const diff = Math.max(0, target - Date.now());
  const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24,
        m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;

  const inline = $('[data-countdown-inline]');
  if (inline) inline.textContent = phase === 'ended' ? 'Offer ended'
    : (phase === 'before' ? 'Starts in ' : 'Ends in ') + `${d}d ${h}h ${pad(m)}m`;

  $$('[data-countdown-boxes]').forEach(box => {
    $('[data-d]', box).textContent = pad(d);
    $('[data-h]', box).textContent = pad(h);
    $('[data-m]', box).textContent = pad(m);
    $('[data-s]', box).textContent = pad(s);
  });
  const lbl = $('[data-countdown-label]');
  if (lbl) lbl.textContent = phase === 'before' ? 'Offer starts in' : 'Offer ends in';

  if (phase === 'ended' && !ended) setEndedState();
}

/* After the deadline the page says so and switches CTAs to "Enquire Now" */
function setEndedState() {
  ended = true;
  document.body.classList.add('offer-ended');
  $$('[data-cta-label]').forEach(el => { el.textContent = 'Enquire Now'; });
  const ann = $('[data-announce-text]');
  if (ann) ann.innerHTML = '🪔 <strong>The AdsTube Diwali offer has ended</strong> · Enquire for current packages';
  const ft = $('[data-final-title]'); if (ft) ft.textContent = 'The Diwali offer has closed';
  const fs = $('[data-final-sub]');   if (fs) fs.textContent = 'The offer closed at 11:59 PM IST on 8 November 2026. Enquire now for current packages.';
  const fk = $('[data-final-kicker]'); if (fk) fk.textContent = 'Offer ended';
  const ft2 = $('.form-card__title', $('[data-lead-form]') || document);
  if (ft2 && $('[data-lead-form]')) ft2.textContent = 'Enquire Now';
}

/* ---------------------------------------------------------
   Festive light string under the header
   --------------------------------------------------------- */
function initLights() {
  const wrap = $('[data-lights]'); if (!wrap) return;
  const colors = ['#F5B841', '#E8000F', '#FFFFFF'];
  const build = () => {
    const n = Math.ceil(window.innerWidth / 56) + 1;
    wrap.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.style.setProperty('--c', colors[i % 3]);
      s.style.setProperty('--d', (Math.random() * 2.4).toFixed(2) + 's');
      wrap.appendChild(s);
    }
  };
  build();
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(build, 200); });
}

/* ---------------------------------------------------------
   Headline rises word by word
   --------------------------------------------------------- */
function splitHeadline() {
  const h = $('[data-split]'); if (!h || reducedMotion) return;
  let i = 0;
  const wrapWords = node => {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'word';
          const inner = document.createElement('span'); inner.textContent = part;
          inner.style.setProperty('--i', i++);
          w.appendChild(inner); frag.appendChild(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) {
        // keep styled spans (e.g. red "Diwali") as one word
        const w = document.createElement('span'); w.className = 'word';
        const inner = document.createElement('span'); inner.style.setProperty('--i', i++);
        child.replaceWith(w); inner.appendChild(child); w.appendChild(inner);
      }
    });
  };
  h.setAttribute('aria-label', h.textContent.trim());
  wrapWords(h);
  $$('.word', h).forEach(w => w.setAttribute('aria-hidden', 'true'));
}

/* ---------------------------------------------------------
   Scroll reveals: headings slide in, cards stagger, stats count up
   --------------------------------------------------------- */
function initReveal() {
  $$('.stagger').forEach(g => Array.from(g.children).forEach((c, i) => c.style.setProperty('--si', i)));
  const targets = $$('.slide-in, .stagger');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach(t => t.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      $$('[data-count]', en.target).forEach(countUp);
      io.unobserve(en.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(t => io.observe(t));
}

function countUp(el) {
  if (el.dataset.done) return; el.dataset.done = '1';
  const end = +el.dataset.count, suffix = el.dataset.suffix || '';
  const t0 = performance.now(), dur = 1600;
  const step = now => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(end * e) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------------------------------------------------------
   Rising sparks canvas (pauses off-screen / hidden tab)
   --------------------------------------------------------- */
function initSparks() {
  const canvas = $('[data-sparks]'), hero = $('[data-hero]');
  if (!canvas || !hero || reducedMotion) return;
  const ctx = canvas.getContext('2d');
  const colors = ['245,184,65', '232,0,15', '255,140,40', '255,255,255'];
  let w, h, dpr, parts = [], running = false, visible = true, raf;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(70, w / 18));
    parts = Array.from({ length: count }, () => spawn(true));
  };
  const spawn = (anywhere) => ({
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : h + 10,
    r: Math.random() * 1.8 + .6,
    vy: Math.random() * .6 + .25,
    vx: (Math.random() - .5) * .25,
    a: Math.random() * .6 + .3,
    tw: Math.random() * Math.PI * 2,
    c: colors[Math.floor(Math.random() * colors.length)]
  });
  const frame = () => {
    ctx.clearRect(0, 0, w, h);
    parts.forEach((p, i) => {
      p.y -= p.vy; p.x += p.vx + Math.sin(p.tw) * .15; p.tw += .04;
      const fade = Math.min(1, p.y / (h * .5));
      const alpha = p.a * fade * (.6 + .4 * Math.sin(p.tw * 2));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.c},${Math.max(0, alpha)})`;
      ctx.shadowBlur = 8; ctx.shadowColor = `rgba(${p.c},.8)`;
      ctx.fill();
      if (p.y < -10) parts[i] = spawn(false);
    });
    raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!running && visible && !document.hidden) { running = true; raf = requestAnimationFrame(frame); } };
  const stop  = () => { running = false; cancelAnimationFrame(raf); };

  resize();
  window.addEventListener('resize', () => { resize(); });
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(hero);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  start();
}

/* ---------------------------------------------------------
   FAQ accordion
   --------------------------------------------------------- */
function initFAQ() {
  $$('.faq__q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq__item'), panel = document.getElementById(btn.getAttribute('aria-controls'));
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
      item.classList.toggle('is-open', !open);
      Sound.tick();
      if (!open) track('faq_open', { faq_question: btn.textContent.trim() });
    });
  });
}

/* ---------------------------------------------------------
   Form validation helpers
   --------------------------------------------------------- */
const RULES = {
  name:     v => v.trim().length >= 2 || 'Please enter your name.',
  phone:    v => /^[6-9]\d{9}$/.test(v.replace(/\D/g, '')) || 'Enter a valid 10-digit Indian mobile number.',
  business: v => v.trim().length >= 2 || 'Please enter your business name.',
  service:  v => !!v || 'Please select a service.',
  budget:   v => !!v || 'Please select a monthly budget range.',
  plan:     v => !!v || 'Please select a plan.',
  video_url: v => {
    if (!v.trim()) return true;
    try { const u = new URL(v.trim()); return /^https?:$/.test(u.protocol) && u.hostname.includes('.') || 'Enter a valid YouTube or web link.'; }
    catch (e) { return 'Enter a valid YouTube or web link (starting with https://).'; }
  }
};

function setError(field, msg) {
  const wrap = field.closest('.field'), err = wrap && $('.field__err', wrap);
  if (!wrap) return;
  wrap.classList.toggle('is-invalid', !!msg);
  field.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (err) err.textContent = msg || '';
}

function validateForm(form, names) {
  const errors = [];
  names.forEach(n => {
    const el = form.elements[n]; if (!el) return;
    const res = RULES[n] ? RULES[n](el.value) : true;
    const msg = res === true ? '' : res;
    setError(el, msg);
    if (msg) errors.push(el);
  });
  return errors;
}

function bindLiveValidation(form, names, formName) {
  let started = false;
  form.addEventListener('focusin', () => {
    if (!started) { started = true; track('form_start', { form_name: formName }); }
  });
  names.forEach(n => {
    const el = form.elements[n]; if (!el) return;
    const evt = el.tagName === 'SELECT' ? 'change' : 'blur';
    el.addEventListener(evt, () => { if (el.closest('.field').classList.contains('is-invalid') || el.value) validateForm(form, [n]); });
    if (n === 'phone') el.addEventListener('input', () => { el.value = el.value.replace(/\D/g, '').slice(0, 10); });
  });
}

function collect(form) {
  const data = {};
  new FormData(form).forEach((v, k) => { if (k !== 'website') data[k] = String(v).trim(); });
  if (data.phone) data.phone = '+91' + data.phone.replace(/\D/g, '');
  return Object.assign(data, attribution, {
    page_url: location.href,
    offer: 'diwali_2026',
    offer_phase: offerPhase().phase,
    submitted_at: new Date().toISOString()
  });
}

async function postJSON(url, payload) {
  if (!url) { console.info('[AdsTube] No endpoint set in CONFIG — payload:', payload); return true; }
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal, keepalive: true });
    return res.ok;
  } catch (e) { return false; }
  finally { clearTimeout(t); }
}

/* ---------------------------------------------------------
   8 · Lead form → CRM → thank-you page
   --------------------------------------------------------- */
function initLeadForm() {
  const form = $('[data-lead-form]'); if (!form) return;
  const fields = ['name', 'phone', 'business', 'service', 'budget'];
  const status = $('[data-status]', form), btn = $('button[type="submit"]', form);
  bindLiveValidation(form, fields, 'lead_form');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.textContent = '';
    const errors = validateForm(form, fields);
    if (errors.length) {
      errors[0].focus();
      track('form_error', { form_name: 'lead_form', error_fields: errors.map(f => f.name).join(',') });
      return;
    }
    const service = form.elements.service.value;
    const go = () => { location.href = CONFIG.thankYouUrl + '?service=' + encodeURIComponent(service); };
    try { sessionStorage.setItem('adstube_service', service); } catch (err) {}

    // Spam honeypot: bots fill it — pretend success, send nothing
    if (form.elements.website.value) { go(); return; }

    const label = $('[data-cta-label]', btn), original = label.textContent;
    btn.disabled = true; label.textContent = 'Sending…';

    const payload = Object.assign(collect(form), { lead_type: 'lead' });
    const ok = await postJSON(CONFIG.leadEndpoint, payload);
    if (!ok) {
      btn.disabled = false; label.textContent = original;
      status.textContent = "Sorry, we couldn't send your enquiry. Please try again, or call / WhatsApp us.";
      track('form_error', { form_name: 'lead_form', error_fields: 'network' });
      return;
    }
    Sound.sparkle();

    // Lead event waits for GTM before redirecting, so the conversion is not lost
    let done = false; const once = () => { if (!done) { done = true; go(); } };
    track('generate_lead', {
      form_name: 'lead_form', lead_type: 'lead', service, budget: form.elements.budget.value,
      eventCallback: once, eventTimeout: 2000
    });
    setTimeout(once, gtmLoaded() ? 2200 : 400);
  });
}

/* ---------------------------------------------------------
   10 · Query (quote) form → inline thanks, no redirect
   --------------------------------------------------------- */
function getCaptchaToken(form) {
  // Placeholder checkbox. Replace with: return grecaptcha.getResponse() / turnstile.getResponse()
  return form.elements.captcha.checked ? 'checkbox-placeholder' : '';
}

function initQueryForm() {
  const form = $('[data-query-form]'); if (!form) return;
  const fields = ['name', 'phone', 'video_url', 'service', 'plan'];
  const service = form.elements.service, plan = form.elements.plan;
  const status = $('[data-status]', form), btn = $('button[type="submit"]', form);
  bindLiveValidation(form, fields, 'query_form');

  service.addEventListener('change', () => {
    const list = CONFIG.plans[service.value] || [];
    plan.innerHTML = '';
    plan.appendChild(new Option(list.length ? 'Select a plan' : 'Select a service first', ''));
    list.forEach(p => plan.appendChild(new Option(p, p)));
    plan.disabled = !list.length;
    setError(plan, '');
  });

  const cap = form.elements.captcha;
  cap.addEventListener('change', () => { if (cap.checked) setError(cap, ''); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.textContent = '';
    const errors = validateForm(form, fields);
    const token = getCaptchaToken(form);
    if (!token) { setError(cap, 'Please confirm you are not a robot.'); errors.push(cap); }
    else setError(cap, '');
    if (errors.length) {
      errors[0].focus();
      track('form_error', { form_name: 'query_form', error_fields: errors.map(f => f.name).join(',') });
      return;
    }
    const success = $('[data-success]', form);
    if (form.elements.website.value) { success.hidden = false; return; } // honeypot

    btn.disabled = true; btn.textContent = 'Sending…';
    const payload = Object.assign(collect(form), { lead_type: 'query', captcha_token: token });
    delete payload.captcha;
    const ok = await postJSON(CONFIG.queryEndpoint, payload);
    btn.disabled = false; btn.textContent = 'Get Quote';
    if (!ok) {
      status.textContent = "Sorry, we couldn't send your request. Please try again, or call / WhatsApp us.";
      track('form_error', { form_name: 'query_form', error_fields: 'network' });
      return;
    }
    Sound.sparkle();
    track('query_submit', { form_name: 'query_form', lead_type: 'query', service: service.value, plan: plan.value });
    success.hidden = false;
    success.setAttribute('tabindex', '-1'); success.focus();
  });
}

/* ---------------------------------------------------------
   Mobile sticky bar hides while a form is on screen
   --------------------------------------------------------- */
function initMobileBar() {
  const bar = $('[data-mbar]'); if (!bar || !('IntersectionObserver' in window)) return;
  const zones = new Set();
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => en.isIntersecting ? zones.add(en.target) : zones.delete(en.target));
    const hide = zones.size > 0;
    bar.classList.toggle('is-hidden', hide);
    document.body.classList.toggle('mbar-hidden', hide); // sound button drops back down
  }, { threshold: .2 });
  $$('[data-form-zone] form').forEach(f => io.observe(f));
}

/* ---------------------------------------------------------
   Thank-you page
   --------------------------------------------------------- */
function initThankYou() {
  const el = $('[data-ty-service]'); if (!el) return;
  let service = new URLSearchParams(location.search).get('service');
  if (!service) { try { service = sessionStorage.getItem('adstube_service'); } catch (e) {} }
  el.textContent = service || 'your campaign';
  track('thank_you_view', { service: service || '' });
}

/* ---------------------------------------------------------
   Boot
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  Sound.init();
  initLinks();
  initLights();
  splitHeadline();
  initReveal();
  initSparks();
  initFAQ();
  initLeadForm();
  initQueryForm();
  initMobileBar();
  initThankYou();
  if ($('[data-countdown-inline], [data-countdown-boxes]')) {
    tickCountdown();
    setInterval(tickCountdown, 1000);
  }
});
