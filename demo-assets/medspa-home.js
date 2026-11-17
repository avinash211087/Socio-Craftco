(function(){
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
const $ = (s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];

/* ---------- smooth scroll ---------- */
let lenis = null;
if (hasGsap) gsap.registerPlugin(ScrollTrigger);
if (!reduce && typeof Lenis !== 'undefined') {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  if (hasGsap) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  }
  lenis.stop();
}
function scrollToEl(el){
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -20, duration: 1.4 });
  else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (id.length < 2 && id !== '#') return;
  e.preventDefault();
  document.body.classList.remove('menu-open');
  if (lenis) lenis.start();
  scrollToEl(id === '#top' || id === '#' ? document.body : $(id));
});

/* ---------- page transitions ---------- */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || e.metaKey || e.ctrlKey || a.target === '_blank') return;
  const href = a.getAttribute('href');
  if (!/^demo-medspa[\w-]*\.html/.test(href)) return;
  e.preventDefault();
  const c = $('#curtain');
  if (hasGsap && !reduce) gsap.fromTo(c, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: .7, ease: 'expo.inOut', onComplete: () => location.href = href });
  else location.href = href;
});
addEventListener('pageshow', e => { if (e.persisted) { const c = $('#curtain'); c.style.clipPath = 'inset(100% 0 0 0)'; if (hasGsap) gsap.set(c, { clipPath: 'inset(100% 0 0 0)' }); } });

/* ---------- mobile menu ---------- */
$('#burger').addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  if (lenis) open ? lenis.stop() : lenis.start();
});

/* ---------- nav hide/show ---------- */
let lastY = 0;
const nav = $('#nav');
function onScroll(y){
  nav.classList.toggle('scrolled', y > 40);
  nav.classList.toggle('hide', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
  lastY = y;
}
if (lenis) lenis.on('scroll', e => onScroll(e.scroll)); else addEventListener('scroll', () => onScroll(scrollY), { passive: true });

/* ---------- cursor ---------- */
if (fine) {
  const c = $('#cursor'), d = $('#cursorDot'), lbl = $('#cursorLabel');
  let mx = innerWidth/2, my = innerHeight/2, cx = mx, cy = my;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; d.style.transform = `translate(${mx}px,${my}px)`; });
  (function loop(){ cx += (mx-cx)*.16; cy += (my-cy)*.16; c.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-cursor], a, button');
    c.classList.remove('hover','label');
    if (!t) return;
    const v = t.getAttribute('data-cursor');
    if (v && v !== 'hover') { lbl.textContent = v; c.classList.add('label'); }
    else c.classList.add('hover');
  });
  /* magnetic buttons */
  $$('.magnetic').forEach(b => {
    b.addEventListener('mousemove', e => {
      const r = b.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width/2) * .25, y = (e.clientY - r.top - r.height/2) * .35;
      b.style.transform = `translate(${x}px,${y}px)`;
    });
    b.addEventListener('mouseleave', () => { b.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1), color .5s'; b.style.transform = ''; setTimeout(()=>b.style.transition='',600); });
  });
  /* tilt tiers */
  $$('.tier').forEach(t => {
    t.addEventListener('mousemove', e => {
      const r = t.getBoundingClientRect(), px = (e.clientX - r.left)/r.width, py = (e.clientY - r.top)/r.height;
      t.style.transform = `rotateY(${(px-.5)*10}deg) rotateX(${(.5-py)*10}deg) translateZ(0)`;
      t.style.setProperty('--mx', px*100+'%'); t.style.setProperty('--my', py*100+'%');
    });
    t.addEventListener('mouseleave', () => t.style.transform = '');
  });
}

/* ---------- hero orbs canvas ---------- */
(function(){
  const cv = $('#orbs'), ctx = cv.getContext('2d');
  let W, H, dpr, mouse = {x:.5, y:.5}, sm = {x:.5,y:.5};
  const orbs = [
    {x:.79,y:.40,r:.19,d:1.0,s:.00030,p:0,  mx:.86,my:.20,mr:.42,c:['#FFFFFF','#F6E1D3','#D3A68C','#7A4237']},
    {x:.53,y:.17,r:.04,d:3.0,s:.00060,p:3.7,mx:.52,my:.12,mr:.07,c:['#FFFFFF','#F6E1D3','#C59D84','#6E3A33']},
    {x:.95,y:.83,r:.07,d:2.4,s:.00055,p:2.1,c:['#FFFFFF','#EED3C3','#B98172','#4E2724']},
    {x:.60,y:.60,r:.03,d:2.0,s:.0004, p:4.4,c:['#FFFFFF','#F1D6C6','#C59D84','#5A2E2A']},
  ];
  function size(){ dpr = Math.min(devicePixelRatio||1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W*dpr; cv.height = H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
  size(); addEventListener('resize', size);
  addEventListener('mousemove', e => { mouse.x = e.clientX/innerWidth; mouse.y = e.clientY/innerHeight; });
  let scrollShift = 0;
  function frame(t){
    sm.x += (mouse.x - sm.x)*.05; sm.y += (mouse.y - sm.y)*.05;
    ctx.clearRect(0,0,W,H);
    const base = Math.min(W, H*1.4);
    const mobile = W < 700;
    orbs.forEach(o => {
      if (mobile && o.mx === undefined) return;
      const fx = Math.sin(t*o.s + o.p)*14, fy = Math.cos(t*o.s*1.2 + o.p)*18;
      const px = (sm.x-.5)*-40*o.d, py = (sm.y-.5)*-30*o.d;
      const r = mobile ? o.mr * W * .5 : o.r * base;
      const x = (mobile ? o.mx : o.x)*W + fx + px;
      const y = (mobile ? o.my : o.y)*H + fy + py - scrollShift*o.d*.4;
      /* shadow */
      const sh = ctx.createRadialGradient(x+r*.25, y+r*.9, 0, x+r*.25, y+r*.9, r*1.1);
      sh.addColorStop(0,'rgba(78,39,36,.18)'); sh.addColorStop(1,'rgba(78,39,36,0)');
      ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(x+r*.25, y+r*.95, r*1.1, r*.35, 0, 0, Math.PI*2); ctx.fill();
      /* body */
      const g = ctx.createRadialGradient(x-r*.35, y-r*.4, r*.05, x, y, r);
      g.addColorStop(0,o.c[0]); g.addColorStop(.25,o.c[1]); g.addColorStop(.7,o.c[2]); g.addColorStop(1,o.c[3]);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
      /* iridescent rim */
      const rim = ctx.createRadialGradient(x+r*.3, y+r*.35, r*.55, x, y, r);
      rim.addColorStop(0,'rgba(255,255,255,0)'); rim.addColorStop(.85,'rgba(255,214,200,.0)'); rim.addColorStop(1,'rgba(255,230,215,.55)');
      ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
      /* specular */
      const sp = ctx.createRadialGradient(x-r*.38, y-r*.42, 0, x-r*.38, y-r*.42, r*.28);
      sp.addColorStop(0,'rgba(255,255,255,.95)'); sp.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle = sp; ctx.beginPath(); ctx.arc(x-r*.38, y-r*.42, r*.28, 0, Math.PI*2); ctx.fill();
    });
    if (!reduce) requestAnimationFrame(frame);
  }
  if (lenis) lenis.on('scroll', e => scrollShift = Math.min(e.scroll, 1200)); else addEventListener('scroll', ()=> scrollShift = Math.min(scrollY,1200), {passive:true});
  requestAnimationFrame(frame);
})();

/* ---------- before / after ---------- */
(function(){
  const ba = $('#ba'), after = $('#baAfter'), h = $('#baHandle');
  let drag = false;
  function set(clientX){
    const r = ba.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - r.left)/r.width));
    after.style.clipPath = `inset(0 0 0 ${p*100}%)`; h.style.left = p*100 + '%';
  }
  ba.addEventListener('pointerdown', e => { drag = true; ba.setPointerCapture(e.pointerId); set(e.clientX); });
  ba.addEventListener('pointermove', e => { if (drag || fine) set(e.clientX); });
  ba.addEventListener('pointerup', () => drag = false);
  ba.addEventListener('pointercancel', () => drag = false);
  ba.tabIndex = 0; ba.setAttribute('role','slider'); ba.setAttribute('aria-label','Before and after comparison');
  ba.addEventListener('keydown', e => {
    const cur = parseFloat(h.style.left || 50);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const n = Math.max(0, Math.min(100, cur + (e.key === 'ArrowLeft' ? -5 : 5)));
      after.style.clipPath = `inset(0 0 0 ${n}%)`; h.style.left = n + '%';
    }
  });
})();

/* ---------- FAQ ---------- */
$$('.qa button').forEach(b => b.addEventListener('click', () => {
  const qa = b.parentElement, open = !qa.classList.contains('open');
  $$('.qa').forEach(q => { q.classList.remove('open'); q.querySelector('button').setAttribute('aria-expanded','false'); });
  if (open) { qa.classList.add('open'); b.setAttribute('aria-expanded','true'); }
  setTimeout(() => hasGsap && ScrollTrigger.refresh(), 650);
}));

/* ---------- booking widget ---------- */
(function(){
  const state = { step:0, svc:null, dur:null, price:null, date:null, time:null, details:{} };
  const panels = $$('.panel'), bars = $$('.w-steps i'), next = $('#wNext'), back = $('#wBack'), wNav = $('#wNav');
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function hash(s){ let h = 0; for (const ch of s) h = (h*31 + ch.charCodeAt(0)) | 0; return Math.abs(h); }
  function go(n){
    state.step = n;
    panels.forEach(p => p.classList.toggle('active', +p.dataset.step === n));
    bars.forEach((b,i) => b.classList.toggle('on', i <= Math.min(n,3)));
    back.hidden = n === 0 || n === 4;
    wNav.style.display = n === 4 ? 'none' : '';
    next.innerHTML = n === 3 ? 'Confirm booking <span class="arr">→</span>' : 'Continue <span class="arr">→</span>';
    validate();
    if (n === 1) renderDays();
    if (n === 3) renderSummary();
  }
  function validate(){
    let ok = false;
    if (state.step === 0) ok = !!state.svc;
    if (state.step === 1) ok = !!(state.date && state.time);
    if (state.step === 2) ok = true;
    if (state.step === 3) ok = true;
    next.disabled = !ok;
  }
  $$('#svcOpts .opt').forEach(o => o.addEventListener('click', () => {
    $$('#svcOpts .opt').forEach(x => x.classList.remove('sel')); o.classList.add('sel');
    state.svc = o.dataset.svc; state.dur = o.dataset.dur; state.price = o.dataset.price; state.time = null;
    validate();
  }));
  function renderDays(){
    const box = $('#days'); box.innerHTML = '';
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const b = document.createElement('button');
      b.className = 'day'; b.type = 'button';
      b.innerHTML = `<small>${DAYS[d.getDay()]}</small><b>${d.getDate()}</b><small>${MON[d.getMonth()]}</small>`;
      if (d.getDay() === 0) b.disabled = true;
      if (state.date && d.getTime() === state.date.getTime()) b.classList.add('sel');
      b.addEventListener('click', () => { $$('.day').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); state.date = d; state.time = null; renderTimes(); validate(); });
      box.appendChild(b);
    }
    renderTimes();
  }
  function renderTimes(){
    const box = $('#times'); box.innerHTML = '';
    if (!state.date) { box.innerHTML = '<p style="grid-column:1/-1;color:var(--muted);font-size:14px">Select a day to see available times.</p>'; return; }
    const sat = state.date.getDay() === 6;
    const slots = sat ? ['9:00','9:30','10:30','11:00','12:00','1:30','2:30','3:00'] : ['9:00','9:30','10:30','11:00','12:30','1:30','2:00','3:00','4:00','4:30','5:30','6:00'];
    slots.forEach((t,i) => {
      const h = parseInt(t), pm = h < 9 || h === 12;
      const label = `${t} ${pm ? 'pm' : 'am'}`;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'time'; b.textContent = label;
      if (hash(state.date.toDateString() + state.svc + i) % 3 === 0) b.disabled = true;
      if (state.time === label) b.classList.add('sel');
      b.addEventListener('click', () => { $$('.time').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); state.time = label; validate(); });
      box.appendChild(b);
    });
  }
  function fmtDate(d){ return `${DAYS[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`; }
  function renderSummary(){
    const d = state.details;
    $('#summary').innerHTML = [
      ['Treatment', state.svc], ['Duration', state.dur], ['Price', state.price],
      ['When', `${fmtDate(state.date)} · ${state.time}`], ['Name', `${d.first} ${d.last}`], ['Contact', d.email]
    ].map(([k,v]) => `<div><span>${k}</span><b>${String(v).replace(/[<>&]/g,'')}</b></div>`).join('');
  }
  function checkForm(){
    const f = $('#detailsForm'); let ok = true;
    ['first','last','email','phone'].forEach(n => {
      const inp = f.elements[n], v = inp.value.trim();
      let good = v.length > 0;
      if (n === 'email') good = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (n === 'phone') good = v.replace(/\D/g,'').length >= 7;
      inp.closest('.field').classList.toggle('err', !good);
      if (!good) ok = false;
    });
    if (ok) state.details = Object.fromEntries(new FormData(f));
    return ok;
  }
  next.addEventListener('click', () => {
    if (state.step === 2 && !checkForm()) return;
    if (state.step === 3) {
      $('#doneName').textContent = state.details.first.replace(/[<>&]/g,'');
      $('#doneText').textContent = `${state.svc} on ${fmtDate(state.date)} at ${state.time}. A confirmation would go to ${state.details.email}.`;
      return go(4);
    }
    go(state.step + 1);
  });
  back.addEventListener('click', () => go(Math.max(0, state.step - 1)));
  $('#restart').addEventListener('click', () => { Object.assign(state, {svc:null,date:null,time:null}); $$('#svcOpts .opt').forEach(x => x.classList.remove('sel')); go(0); });
  $('#icsBtn').addEventListener('click', () => {
    const [hm, ap] = state.time.split(' '); let [h, m] = hm.split(':').map(Number);
    if (ap === 'pm' && h !== 12) h += 12;
    const s = new Date(state.date); s.setHours(h, m);
    const e = new Date(s.getTime() + parseInt(state.dur)*60000);
    const f = d => d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + 'T' + String(d.getHours()).padStart(2,'0') + String(d.getMinutes()).padStart(2,'0') + '00';
    const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Solenne Demo//EN','BEGIN:VEVENT','UID:'+Date.now()+'@solenne-demo','DTSTAMP:'+f(new Date()),'DTSTART:'+f(s),'DTEND:'+f(e),'SUMMARY:'+state.svc+' at Solenne Aesthetics','LOCATION:7150 E Camelback Rd Suite 210\\, Scottsdale\\, AZ','END:VEVENT','END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], {type:'text/calendar'})); a.download = 'solenne-appointment.ics'; a.click();
  });
  /* treatment card shortcuts */
  $$('[data-book]').forEach(b => b.addEventListener('click', () => {
    const o = $(`#svcOpts .opt[data-svc="${b.dataset.book}"]`);
    if (o) o.click();
    go(0); scrollToEl($('#book'));
  }));
  go(0);
  const pre = new URLSearchParams(location.search).get('t');
  if (pre) { const o = $(`#svcOpts .opt[data-svc="${CSS.escape(pre)}"]`); if (o) o.click(); }
})();

/* ---------- animations ---------- */
function splitWords(el){
  el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  return $$('.w', el);
}

function intro(){
  document.body.classList.remove('loading');
  if (lenis) lenis.start();
  if (location.hash.length > 1) { const tgt = document.querySelector(location.hash); if (tgt) setTimeout(() => { if (hasGsap) ScrollTrigger.refresh(); lenis ? lenis.scrollTo(tgt, { offset: -20, immediate: true }) : tgt.scrollIntoView(); }, 60); }
  if (!hasGsap) { $$('.reveal-up').forEach(e => { e.style.opacity = 1; e.style.transform = 'none'; }); return; }
  const tl = gsap.timeline();
  tl.from('.hero h1 .line > span', { yPercent: 110, rotate: 3, duration: 1.3, stagger: .1, ease: 'expo.out' })
    .from('.hero-p, .hero-ctas > *', { y: 30, opacity: 0, duration: 1, stagger: .08, ease: 'expo.out' }, '-=.9')
    .from('.nav > *', { y: -20, opacity: 0, duration: .9, stagger: .06, ease: 'expo.out' }, '-=1')
    .from('.hero-foot > *', { y: 16, opacity: 0, duration: .8, stagger: .06, ease: 'expo.out' }, '-=.8')
    .from('#orbs', { opacity: 0, scale: 1.08, duration: 2, ease: 'expo.out' }, 0);
}

function scrollAnims(){
  if (!hasGsap || reduce) {
    $$('.reveal-up').forEach(e => { e.style.opacity = 1; e.style.transform = 'none'; });
    $$('.count').forEach(c => c.textContent = c.dataset.to);
    $$('.step').forEach(s => s.classList.add('on'));
    return;
  }
  /* marquee scroll-reactive */
  const mq = $('#marquee');
  let mx = 0, vel = 0;
  if (lenis) lenis.on('scroll', e => vel = e.velocity);
  gsap.ticker.add(() => {
    mx -= .6 + Math.abs(vel) * .25;
    const half = mq.scrollWidth / 2;
    if (-mx >= half) mx += half;
    mq.style.transform = `translate3d(${mx}px,0,0)`;
  });

  /* section headings */
  $$('section .h2').forEach(h => {
    gsap.from($$('.line > span', h), { yPercent: 110, duration: 1.2, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
  });
  $$('.reveal-up').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  $$('.eyebrow').forEach(el => gsap.from(el, { opacity: 0, x: -20, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));

  /* manifesto word scrub */
  const words = splitWords($('#manifesto'));
  gsap.to(words, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: '#manifesto', start: 'top 80%', end: 'bottom 45%', scrub: true } });

  /* counters */
  $$('.count').forEach(c => {
    const o = { v: 0 };
    gsap.to(o, { v: +c.dataset.to, duration: 2, ease: 'power3.out', onUpdate: () => c.textContent = Math.round(o.v), scrollTrigger: { trigger: c, start: 'top 90%' } });
  });

  ScrollTrigger.matchMedia({
    '(min-width: 861px)': function(){
      /* pinned horizontal treatments */
      const track = $('#treatTrack');
      const dist = () => track.scrollWidth - innerWidth;
      const tween = gsap.to(track, { x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '#treatPin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
          onUpdate: s => gsap.set('#treatBar', { scaleX: s.progress }) } });
      $$('.card', track).forEach(card => {
        gsap.from(card, { y: 80, rotate: 2, opacity: .3, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 100%', end: 'left 60%', scrub: true } });
      });
      /* review row drift */
      gsap.fromTo('#revRow', { x: 0 }, { x: () => -($('#revRow').scrollWidth - innerWidth + 80), ease: 'none', scrollTrigger: { trigger: '.reviews', start: 'top bottom', end: 'bottom top', scrub: 1, invalidateOnRefresh: true } });
      /* footer wordmark */
      gsap.from('.wordmark', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: 'footer', start: 'top 80%', end: 'bottom bottom', scrub: true } });
    },
    '(max-width: 860px)': function(){
      $('#revRow').style.overflowX = 'auto';
      $('#revRow').style.width = 'auto';
      $('#revRow').style.paddingRight = 'var(--pad)';
    }
  });

  /* before/after reveal sweep */
  gsap.fromTo('#baAfter', { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 50%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '#ba', start: 'top 70%' } });
  gsap.fromTo('#baHandle', { left: '100%' }, { left: '50%', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '#ba', start: 'top 70%' } });

  /* process line + steps */
  gsap.to('#stepLine', { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '#steps', start: 'top 60%', end: 'bottom 60%', scrub: true } });
  $$('.step').forEach(s => ScrollTrigger.create({ trigger: s, start: 'top 62%', onEnter: () => s.classList.add('on'), onLeaveBack: () => s.classList.remove('on') }));
  $$('.step').forEach(s => gsap.from(s.children, { y: 30, opacity: 0, stagger: .06, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 80%' } }));

  /* tiers */
  gsap.from('.tier', { y: 80, opacity: 0, duration: 1.2, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: '.tiers', start: 'top 82%' } });

  /* booking panel rise */
  gsap.from('.book', { borderRadius: '0px', ease: 'none', scrollTrigger: { trigger: '.book', start: 'top bottom', end: 'top 40%', scrub: true } });
  gsap.from('#widget', { y: 100, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '#widget', start: 'top 88%' } });

  /* faq */
  gsap.from('.qa', { y: 30, opacity: 0, duration: 1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.faq-grid', start: 'top 80%' } });

  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
}

/* ---------- preloader ---------- */
(function(){
  const loader = $('#loader'), cnt = $('#count'), bar = $('#bar');
  let seen = false;
  try { seen = sessionStorage.getItem('solenne-seen') === '1'; sessionStorage.setItem('solenne-seen', '1'); } catch (e) {}
  if (!hasGsap || reduce || seen || location.hash.length > 1) { loader.remove(); scrollAnims(); intro(); return; }
  scrollAnims();
  const o = { v: 0 };
  const tl = gsap.timeline();
  tl.to('.loader-word span', { y: 0, duration: 1, ease: 'expo.out' })
    .to(o, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: () => { cnt.textContent = Math.round(o.v); bar.style.transform = `scaleX(${o.v/100})`; } }, 0)
    .to('.loader-word span', { yPercent: -100, duration: .7, ease: 'expo.in' }, '+=.1')
    .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut', onStart: intro, onComplete: () => loader.remove() }, '-=.2');
})();
})();
