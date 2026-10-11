import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initScene } from './scene.js';
import { profile, skills, experience, projects, education } from './data.js';

gsap.registerPlugin(ScrollTrigger);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- contenu ---------- */
$('#skills-grid').innerHTML = skills.map((g) => `
  <div class="skill-card reveal">
    <h3>${esc(g.group)}</h3>
    <div class="chips">${g.items.map((i) => `<span class="chip">${esc(i)}</span>`).join('')}</div>
  </div>`).join('');

$('#timeline').innerHTML = experience.map((e) => `
  <li class="tl reveal">
    <div class="tl__period">${esc(e.period)}</div>
    <div class="tl__role">${esc(e.role)}</div>
    <div class="tl__org">${esc(e.org)} <em>· ${esc(e.type)}</em></div>
    <p class="tl__text">${esc(e.text)}</p>
  </li>`).join('');

$('#projects-grid').innerHTML = projects.map((p) => `
  <article class="project reveal">
    <div>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.text)}</p>
      <div class="chips">${p.stack.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</div>
    </div>
    ${p.link ? `<a class="project__link mono" href="${esc(p.link)}" target="_blank" rel="noopener">Voir le projet →</a>` : ''}
  </article>`).join('');

$('#edu').innerHTML = education.map((e) => `
  <div class="reveal"><small>${esc(e.year)}</small><b>${esc(e.title)}</b><span>${esc(e.place)}</span></div>`).join('');

const mail = $('#mail');
mail.href = `mailto:${profile.email}`;
mail.textContent = profile.email;
const links = [
  profile.phone && `<a href="tel:${profile.phoneHref}">${esc(profile.phone)}</a>`,
  profile.github && `<a href="${esc(profile.github)}" target="_blank" rel="noopener">GitHub</a>`,
  profile.linkedin && `<a href="${esc(profile.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`,
].filter(Boolean);
$('#links').innerHTML = links.join('');
$('#year').textContent = new Date().getFullYear();

// découpe le texte "À propos" en mots pour l'effet de révélation au scroll
const aboutEl = $('.reveal-words');
aboutEl.innerHTML = aboutEl.textContent.trim().split(/\s+/).map((w) => `<span class="w">${esc(w)}</span>`).join(' ');

/* ---------- scène 3D ---------- */
const scene = initScene($('#bg'), { reduced });

/* ---------- scroll fluide ---------- */
let lenis;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { offset: -20 }) : (target === 0 ? scrollTo(0, 0) : target.scrollIntoView());
  })
);

/* ---------- animations ---------- */
function intro() {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.from('.line__in', { yPercent: 115, duration: 1.2, stagger: 0.12 })
    .from('.eyebrow, .hero__sub, .hero__actions, .scroll', { y: 24, opacity: 0, duration: 0.9, stagger: 0.1 }, '-=0.8')
    .from('.nav', { y: -40, opacity: 0, duration: 0.8 }, '-=0.9');
}

function scrollAnims() {
  if (scene) {
    ScrollTrigger.create({
      trigger: document.body, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => (scene.state.scroll = self.progress),
    });
  }
  $$('.reveal').forEach((el) => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  gsap.to('.about__text .w', {
    opacity: 1, stagger: 0.05, ease: 'none',
    scrollTrigger: { trigger: '.about__text', start: 'top 80%', end: 'bottom 45%', scrub: true },
  });
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count, suffix = el.dataset.suffix || '';
    const o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 1.6, ease: 'power2.out',
      onUpdate: () => (el.textContent = Math.round(o.v) + suffix),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
  gsap.to('.marquee__track', {
    xPercent: -50, ease: 'none', duration: 28, repeat: -1,
  });
  gsap.to('.marquee__track', {
    skewX: 0, scrollTrigger: { trigger: '.marquee', scrub: 0.5, onUpdate: (s) => gsap.to('.marquee__track', { skewX: -s.getVelocity() / 400, overwrite: 'auto', duration: 0.4 }) },
  });
}

function interactions() {
  if (matchMedia('(hover: none)').matches) return;
  const cur = $('.cursor');
  const xTo = gsap.quickTo(cur, 'x', { duration: 0.25, ease: 'power3' });
  const yTo = gsap.quickTo(cur, 'y', { duration: 0.25, ease: 'power3' });
  addEventListener('pointermove', (e) => { cur.style.opacity = 1; xTo(e.clientX); yTo(e.clientY); });
  $$('a, .project, .chip').forEach((el) => {
    el.addEventListener('mouseenter', () => cur.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cur.classList.remove('is-hover'));
  });
  // boutons magnétiques
  $$('.magnetic').forEach((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
    const my = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.3);
      my((e.clientY - r.top - r.height / 2) * 0.3);
    });
    el.addEventListener('pointerleave', () => { mx(0); my(0); });
  });
  // cartes projet : tilt 3D + halo
  $$('.project').forEach((el) => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.4 });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.4 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', `${x * 100}%`);
      el.style.setProperty('--my', `${y * 100}%`);
      ry((x - 0.5) * 10); rx((0.5 - y) * 10);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* ---------- loader puis lancement ---------- */
function start() {
  gsap.to('.loader', {
    yPercent: -100, duration: 0.9, ease: 'power4.inOut', delay: 0.15,
    onComplete: () => $('.loader').remove(),
  });
  if (!reduced) intro();
  scrollAnims();
  interactions();
}

if (reduced) {
  $('.loader').remove();
  $$('.reveal').forEach((el) => (el.style.opacity = 1));
  scrollAnims();
} else {
  const c = $('.loader__count');
  const o = { v: 0 };
  gsap.to(o, { v: 100, duration: 1.2, ease: 'power2.inOut', onUpdate: () => (c.textContent = Math.round(o.v)), onComplete: start });
}
