(function(){

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
const $ = (s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
let lenis = null;
if (hasGsap) gsap.registerPlugin(ScrollTrigger);
if (!reduce && typeof Lenis !== 'undefined') {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
}
function scrollToEl(el){ if (!el) return; if (lenis) lenis.scrollTo(el, { offset: -20, duration: 1.4 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || e.metaKey || e.ctrlKey || a.target === '_blank') return;
  const href = a.getAttribute('href');
  if (href.startsWith('#')) {
    e.preventDefault(); document.body.classList.remove('menu-open'); if (lenis) lenis.start();
    scrollToEl(href.length > 1 ? $(href) : document.body); return;
  }
  if (/^demo-medspa[\w-]*\.html/.test(href)) {
    e.preventDefault(); document.body.classList.remove('menu-open');
    const c = $('#curtain');
    if (hasGsap && !reduce) gsap.fromTo(c, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: .7, ease: 'expo.inOut', onComplete: () => location.href = href });
    else location.href = href;
  }
});
addEventListener('pageshow', e => { if (e.persisted) { const c = $('#curtain'); if (hasGsap) gsap.set(c, { clipPath: 'inset(100% 0 0 0)' }); else c.style.clipPath = 'inset(100% 0 0 0)'; } });
$('#burger').addEventListener('click', () => { const open = document.body.classList.toggle('menu-open'); if (lenis) open ? lenis.stop() : lenis.start(); });
let lastY = 0; const nav = $('#nav');
function onScroll(y){ nav.classList.toggle('scrolled', y > 40); nav.classList.toggle('hide', y > lastY && y > 400 && !document.body.classList.contains('menu-open')); lastY = y; }
if (lenis) lenis.on('scroll', e => onScroll(e.scroll)); else addEventListener('scroll', () => onScroll(scrollY), { passive: true });
if (fine) {
  const c = $('#cursor'), d = $('#cursorDot'), lbl = $('#cursorLabel');
  let mx = innerWidth/2, my = innerHeight/2, cx = mx, cy = my;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; d.style.transform = `translate(${mx}px,${my}px)`; });
  (function loop(){ cx += (mx-cx)*.16; cy += (my-cy)*.16; c.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-cursor], a, button, summary'); c.classList.remove('hover','label'); if (!t) return;
    const v = t.getAttribute('data-cursor'); if (v && v !== 'hover') { lbl.textContent = v; c.classList.add('label'); } else c.classList.add('hover');
  });
  $$('.magnetic').forEach(b => {
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX-r.left-r.width/2)*.25}px,${(e.clientY-r.top-r.height/2)*.35}px)`; });
    b.addEventListener('mouseleave', () => { b.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1), color .5s'; b.style.transform = ''; setTimeout(() => b.style.transition = '', 600); });
  });
}
function splitWords(el){ el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' '); return $$('.w', el); }
function commonAnims(){
  const c = $('#curtain');
  if (!hasGsap || reduce) { $$('.reveal-up').forEach(e => { e.style.opacity = 1; e.style.transform = 'none'; }); $$('.count').forEach(c => c.textContent = c.dataset.to); return false; }
  gsap.set(c, { clipPath: 'inset(0% 0 0 0)' });
  const tl = gsap.timeline();
  tl.to(c, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' })
    .from('.page-hero h1 .line > span', { yPercent: 110, rotate: 3, duration: 1.3, stagger: .1, ease: 'expo.out' }, '-=.45')
    .from('.page-hero .crumbs, .page-hero-sub > *', { y: 24, opacity: 0, duration: 1, stagger: .08, ease: 'expo.out' }, '-=1')
    .from('.nav > *', { y: -20, opacity: 0, duration: .9, stagger: .06, ease: 'expo.out' }, '-=1.1')
    .from('.hero-orb', { scale: 0, duration: 1.6, stagger: .12, ease: 'expo.out' }, '-=1.2');
  $$('section .h2').forEach(h => gsap.from($$('.line > span', h), { yPercent: 110, duration: 1.2, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } }));
  $$('.reveal-up').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
  $$('main .eyebrow').forEach(el => gsap.from(el, { opacity: 0, x: -20, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } }));
  $$('.hero-orb').forEach((o,i) => gsap.to(o, { yPercent: -40 - i*30, ease: 'none', scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: true } }));
  $$('.count').forEach(c => { const o = { v: 0 }; gsap.to(o, { v: +c.dataset.to, duration: 2, ease: 'power3.out', onUpdate: () => c.textContent = Math.round(o.v), scrollTrigger: { trigger: c, start: 'top 92%' } }); });
  ScrollTrigger.matchMedia({ '(min-width: 861px)': () => { gsap.from('.wordmark', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: 'footer', start: 'top 80%', end: 'bottom bottom', scrub: true } }); } });
  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
  return true;
}


const on = commonAnims();
if (on) {
  const words = splitWords($('#statement'));
  gsap.to(words, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: '#statement', start: 'top 80%', end: 'bottom 45%', scrub: true } });
  gsap.fromTo('#storyOrb1', { yPercent: 25 }, { yPercent: -25, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('#storyOrb2', { yPercent: 80 }, { yPercent: -120, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.to('#tlLine', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#tl', start: 'top 60%', end: 'bottom 60%', scrub: true } });
  $$('.tl-item').forEach(it => {
    ScrollTrigger.create({ trigger: it, start: 'top 62%', onEnter: () => it.classList.add('on'), onLeaveBack: () => it.classList.remove('on') });
    gsap.from(it.children, { y: 30, opacity: 0, duration: 1, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: it, start: 'top 85%' } });
  });
  gsap.from('.member', { y: 60, opacity: 0, duration: 1.2, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.team-grid', start: 'top 85%' } });
  ScrollTrigger.matchMedia({ '(min-width: 861px)': () => {
    gsap.fromTo('#spacesRow', { x: 0 }, { x: () => -($('#spacesRow').scrollWidth - innerWidth), ease: 'none', scrollTrigger: { trigger: '.spaces', start: 'top 70%', end: 'bottom 10%', scrub: 1, invalidateOnRefresh: true } });
  }});
} else {
  $$('.tl-item').forEach(i => i.classList.add('on'));
  const l = $('#tlLine'); if (l) l.style.transform = 'none';
}

})();
