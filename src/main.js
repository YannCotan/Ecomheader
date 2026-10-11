import './style.css';
import gsap from 'gsap';
import { createYard } from './yard.js';
import { items, profile, zoneMeta, kindLabel } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) gsap.globalTimeline.timeScale(8);

const byId = Object.fromEntries(items.map((i) => [i.id, i]));
const zoneKeys = Object.keys(zoneMeta);

/* ---------- vue liste (contenu complet en HTML simple, aussi utilisé si WebGL est absent) ---------- */
function contactLines() {
  return [
    `<a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>`,
    `<span>${esc(profile.phone)}</span>`,
    profile.github && `<a href="${esc(profile.github)}" target="_blank" rel="noopener">GitHub</a>`,
    profile.linkedin && `<a href="${esc(profile.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`,
  ].filter(Boolean);
}
$('#list-body').innerHTML = `
  <h1>${esc(profile.name)}</h1>
  <p class="mono">Développeur web fullstack · Abidjan · Disponible en freelance</p>
  ${zoneKeys.map((z) => `
    <section>
      <h2><span class="mono">${esc(zoneMeta[z].tag)}</span> ${esc(zoneMeta[z].name)}</h2>
      ${items.filter((i) => i.zone === z).map((i) => `
        <article>
          <h3>${esc(i.title)}</h3>
          <p class="mono">${esc([i.sub, i.period].filter(Boolean).join(' · '))}</p>
          ${i.body.map((b) => `<p>${esc(b)}</p>`).join('')}
          ${i.kind === 'contact' ? `<p class="clist">${contactLines().join(' · ')}</p>` : ''}
        </article>`).join('')}
    </section>`).join('')}`;

const listEl = $('#list');
const openList = () => { listEl.hidden = false; document.body.classList.add('is-list'); listEl.scrollTop = 0; $('#list-close').focus(); };
const closeList = () => { listEl.hidden = true; document.body.classList.remove('is-list'); };
$('#list-close').addEventListener('click', closeList);

/* ---------- étiquettes de zone ---------- */
const tagEls = {};
$('#zonetags').innerHTML = zoneKeys.map((z) => `<button class="ztag" data-zone="${z}"><b>${esc(zoneMeta[z].tag)}</b>${esc(zoneMeta[z].name)}</button>`).join('');
$$('.ztag').forEach((el) => (tagEls[el.dataset.zone] = el));

/* ---------- panneau « manifeste » ---------- */
const panel = $('#panel');
let current = null;
const tip = $('#tip');

function barcode(seedText) {
  let x = 0, out = '';
  for (let i = 0; i < 46; i++) {
    const v = (seedText.charCodeAt(i % seedText.length) * (i + 3)) % 5;
    const w = 1 + (v % 3);
    if (i % 2 === 0) out += `<rect x="${x}" y="0" width="${w}" height="38"/>`;
    x += w + 1;
  }
  return { out, width: x };
}

function renderPanel(item) {
  const list = items.filter((i) => i.zone === item.zone);
  const idx = list.indexOf(item);
  $('#p-kind').textContent = `${kindLabel[item.kind]} · Zone ${zoneMeta[item.zone].tag}`;
  $('#p-iso').textContent = `${item.iso}   ${item.sizeCode}`;
  $('#p-title').textContent = item.title;
  $('#p-sub').textContent = [item.sub, item.period].filter(Boolean).join(' · ');
  let body = item.body.map((b) => `<p>${esc(b)}</p>`).join('');
  if (item.kind === 'contact') {
    body += `<div class="contact">
      <div class="row"><span class="mono">E-mail</span><a href="mailto:${esc(profile.email)}" id="mail">${esc(profile.email)}</a><button class="copy mono" data-copy="${esc(profile.email)}">Copier</button></div>
      <div class="row"><span class="mono">Téléphone</span><span>${esc(profile.phone)}</span><button class="copy mono" data-copy="${esc(profile.phone)}">Copier</button></div>
      ${profile.github ? `<div class="row"><span class="mono">GitHub</span><a href="${esc(profile.github)}" target="_blank" rel="noopener">Ouvrir ↗</a></div>` : ''}
      ${profile.linkedin ? `<div class="row"><span class="mono">LinkedIn</span><a href="${esc(profile.linkedin)}" target="_blank" rel="noopener">Ouvrir ↗</a></div>` : ''}
    </div>`;
  }
  $('#p-body').innerHTML = body;
  $('#p-tags').innerHTML = item.tags.map((t) => `<li>${esc(t)}</li>`).join('');
  $('#p-count').textContent = `${idx + 1} / ${list.length}`;
  const multi = list.length > 1;
  $('.pager').style.visibility = multi ? 'visible' : 'hidden';
  const bc = barcode(item.iso);
  const svg = $('#p-barcode');
  svg.setAttribute('viewBox', `0 0 ${bc.width} 38`); svg.setAttribute('width', bc.width * 1.6);
  svg.innerHTML = bc.out;
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('.copy');
  if (!b) return;
  const txt = b.dataset.copy;
  const done = () => { b.textContent = 'Copié'; setTimeout(() => (b.textContent = 'Copier'), 1400); };
  (navigator.clipboard?.writeText(txt) ?? Promise.reject()).then(done).catch(() => {
    const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  });
});

function showPanel(item) {
  current = item;
  const open = !!item;
  panel.classList.toggle('open', open);
  panel.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('has-panel', open);
  if (open) { renderPanel(item); panel.querySelector('.panel__scroll').scrollTop = 0; $('#p-close').focus({ preventScroll: true }); }
  tip.hidden = true;
}

let yard = null;
const canvas = $('#yard');

const near = (dir) => {
  if (!current) return;
  const list = items.filter((i) => i.zone === current.zone);
  yard.select(list[(list.indexOf(current) + dir + list.length) % list.length].id);
};
$('#p-prev').addEventListener('click', () => near(-1));
$('#p-next').addEventListener('click', () => near(1));
$('#p-close').addEventListener('click', () => yard?.close());
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (!listEl.hidden) closeList(); else yard?.close(); }
  else if (e.key === 'ArrowRight') near(1);
  else if (e.key === 'ArrowLeft') near(-1);
});

/* ---------- navigation ---------- */
function goZone(z) {
  if (!yard) return openList();
  if (current) { yard.close(); }
  setTimeout(() => yard.flyZone(z), current ? 50 : 0);
}
$$('[data-zone]').forEach((b) => b.addEventListener('click', () => {
  const z = b.dataset.zone;
  if (z === 'gate') yard ? yard.select('contact') : openList();
  else goZone(z);
}));
$('[data-action="list"]').addEventListener('click', openList);
$('[data-action="about"]').addEventListener('click', () => {
  yard?.close();
  introEl.classList.remove('gone');
  gsap.fromTo(introEl, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
});

/* ---------- entrée et chargement ---------- */
const introEl = $('#intro');
function enter() {
  gsap.to(introEl, { y: 40, opacity: 0, duration: 0.5, ease: 'power2.in', onComplete: () => introEl.classList.add('gone') });
  yard?.enter();
}
$('#go').addEventListener('click', enter);

function init() {
  try {
    yard = createYard({
      canvas, items, tagEls, reduced,
      onSelect: showPanel,
      onHover: (item, x, y) => {
        if (!item || current) { tip.hidden = true; return; }
        tip.hidden = false;
        tip.textContent = `${item.title} · ${kindLabel[item.kind]}`;
        tip.style.transform = `translate(${x + 16}px, ${y + 16}px)`;
      },
    });
  } catch (e) {
    console.error(e);
  }
}

const fontsReady = Promise.race([
  Promise.all(['700 40px "Barlow Condensed"', '500 20px "IBM Plex Mono"'].map((f) => document.fonts.load(f))),
  new Promise((r) => setTimeout(r, 2500)),
]);

fontsReady.then(() => {
  init();
  const loader = $('#loader');
  gsap.to(loader, { opacity: 0, duration: 0.5, onComplete: () => loader.remove() });
  if (!yard) { introEl.classList.add('gone'); document.body.classList.add('no-webgl'); openList(); }
  else gsap.from(introEl.querySelector('.intro__in'), { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 });
});
