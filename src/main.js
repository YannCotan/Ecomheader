import './style.css';
import gsap from 'gsap';
import { createYard } from './yard.js';
import { PHOTOS } from './home.js';
import portrait from './photos/portrait.jpg?inline';
import { items, profile, zoneMeta, kindLabel, hobbies, about } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) gsap.globalTimeline.timeScale(8);

const zoneKeys = Object.keys(zoneMeta);
$('#intro-photo').src = portrait;

/* ---------- vue liste (contenu complet en HTML simple, aussi utilisé si WebGL est absent) ---------- */
function contactLines() {
  return [
    `<a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>`,
    `<span>${esc(profile.phone)}</span>`,
    profile.github && `<a href="${esc(profile.github)}" target="_blank" rel="noopener">GitHub</a>`,
    profile.linkedin && `<a href="${esc(profile.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`,
  ].filter(Boolean);
}
function listEntries(z) {
  return z === 'bureau' ? hobbies.map((h) => ({ title: h.label, sub: 'Hors code', body: [h.text.replace(/ Clique[^.]*\./, '')], kind: 'hobby' })) : items.filter((i) => i.zone === z);
}
$('#list-body').innerHTML = `
  <div class="list__me"><img src="${portrait}" alt="Yann Cotan" width="96" height="96" /><div>
    <h1>${esc(profile.name)}</h1>
    <p class="mono">${esc(about.line)}</p>
    <p class="mono">Développeur web fullstack · Abidjan · Disponible en freelance</p>
  </div></div>
  ${zoneKeys.map((z) => `
    <section>
      <h2><span class="mono">${esc(zoneMeta[z].tag)}</span> ${esc(zoneMeta[z].name)}</h2>
      ${listEntries(z).map((i) => `
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

/* ---------- état de l'interface ---------- */
let yard = null;
let current = null;      // conteneur ouvert
let inHome = false;      // dans la chambre
let homeOpen = false;    // fenêtre des hobbies ouverte
let homeTab = 0;
let traveling = false;
const tip = $('#tip');
const panel = $('#panel');
const deskEl = $('#desk');
const sync = () => {
  document.body.classList.toggle('has-panel', !!current || homeOpen);
  document.body.classList.toggle('at-home', inHome);
  $('#hint').textContent = inHome
    ? 'Glisser : tourner · Molette : zoom · Clic sur un objet (écrans, étagère, platine, voitures, cadres) pour en savoir plus'
    : 'Glisser : tourner · Molette : zoom · Clic droit : déplacer · Clic sur un conteneur : l\'ouvrir';
};

/* ---------- manifeste (conteneurs) ---------- */
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
      ${profile.github ? `<div class="row"><span class="mono">GitHub</span><a href="${esc(profile.github)}" target="_blank" rel="noopener">github.com/YannCotan ↗</a></div>` : ''}
      ${profile.linkedin ? `<div class="row"><span class="mono">LinkedIn</span><a href="${esc(profile.linkedin)}" target="_blank" rel="noopener">Ouvrir ↗</a></div>` : ''}
    </div>`;
  }
  $('#p-body').innerHTML = body;
  $('#p-tags').innerHTML = item.tags.map((t) => `<li>${esc(t)}</li>`).join('');
  $('#p-count').textContent = `${idx + 1} / ${list.length}`;
  $('.pager').style.visibility = list.length > 1 ? 'visible' : 'hidden';
  const bc = barcode(item.iso);
  const svg = $('#p-barcode');
  svg.setAttribute('viewBox', `0 0 ${bc.width} 38`); svg.setAttribute('width', bc.width * 1.6);
  svg.innerHTML = bc.out;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('.copy');
  if (!b) return;
  const done = () => { b.textContent = 'Copié'; setTimeout(() => (b.textContent = 'Copier'), 1400); };
  (navigator.clipboard?.writeText(b.dataset.copy) ?? Promise.reject()).then(done).catch(() => {
    const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  });
});
function showPanel(item) {
  current = item;
  const open = !!item;
  panel.classList.toggle('open', open);
  panel.setAttribute('aria-hidden', String(!open));
  sync();
  if (open) { renderPanel(item); panel.querySelector('.panel__scroll').scrollTop = 0; $('#p-close').focus({ preventScroll: true }); }
  tip.hidden = true;
}

/* ---------- fenêtre « chez moi » : un onglet par hobby ---------- */
function renderHome() {
  $('#d-tabs').innerHTML = hobbies.map((h, i) => `<button role="tab" aria-selected="${i === homeTab}" data-tab="${i}">${esc(h.label)}</button>`).join('');
  const h = hobbies[homeTab];
  let html = `<h2>${esc(h.label)}</h2><div class="body"><p>${esc(h.text)}</p></div>`;
  if (h.audio) html += `<button class="lofi mono" id="lofi">${yard?.lofiPlaying ? 'Couper l\'ambiance' : 'Lancer l\'ambiance lo-fi'}</button>`;
  if (h.gallery) html += `<div class="gallery">${PHOTOS.map((p, i) => `<button data-photo="${i}" aria-label="Agrandir la photo : ${esc(p.caption)}"><img src="${p.src}" alt="${esc(p.caption)}" loading="lazy" /></button>`).join('')}</div>`;
  if (h.picks.length) html += `<ul class="picks">${h.picks.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  else if (h.soon) html += '<p class="mono soon">Mes favoris arrivent bientôt.</p>';
  $('#d-body').innerHTML = html;
}
function openHomeTab(i, fly = true) {
  homeTab = (i + hobbies.length) % hobbies.length;
  homeOpen = true;
  deskEl.classList.add('open'); deskEl.setAttribute('aria-hidden', 'false');
  sync(); renderHome(); tip.hidden = true;
  if (fly) yard?.focusHome(hobbies[homeTab].id);
}
function closeHomePanel() {
  homeOpen = false;
  deskEl.classList.remove('open'); deskEl.setAttribute('aria-hidden', 'true');
  sync(); yard?.focusHome('home');
}
$('#d-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) openHomeTab(+b.dataset.tab); });
$('#d-close').addEventListener('click', closeHomePanel);
$('#d-body').addEventListener('click', (e) => {
  const ph = e.target.closest('[data-photo]'); if (ph) return openPhoto(+ph.dataset.photo);
  if (e.target.closest('#lofi')) { yard.toggleLofi(); renderHome(); }
});

/* ---------- photo en grand ---------- */
const lb = $('#lightbox');
function openPhoto(i) {
  const p = PHOTOS[i];
  $('#lb-img').src = p.src; $('#lb-img').alt = p.caption; $('#lb-cap').textContent = p.caption;
  lb.hidden = false; $('#lb-close').focus();
}
const closePhoto = () => { lb.hidden = true; };
lb.addEventListener('click', closePhoto);

/* ---------- voyage dans le temps ---------- */
const warp = $('#warp'), wc = $('#warp-c'), wg = wc.getContext('2d'), clock = $('#warp-clock'), wlabel = $('#warp-label');
const stars = Array.from({ length: 260 }, () => ({ a: Math.random() * Math.PI * 2, r: Math.random(), s: 0.3 + Math.random() }));
let warpSpeed = 0, warpRaf = 0, warpFlash = 0;
function drawWarp() {
  const w = (wc.width = innerWidth), h = (wc.height = innerHeight), cx = w / 2, cy = h / 2, R = Math.hypot(cx, cy);
  wg.fillStyle = `rgba(7,7,11,${0.55 - warpSpeed * 0.3})`; wg.fillRect(0, 0, w, h);
  wg.lineCap = 'round';
  for (const s of stars) {
    const r0 = s.r * R, r1 = Math.min(R * 1.2, r0 + (6 + warpSpeed * 160 * s.s) * (0.4 + s.r));
    wg.strokeStyle = s.s > 0.8 ? '#22d3ee' : s.s > 0.5 ? '#ff5b14' : '#f3efe4';
    wg.lineWidth = 1 + s.s * 2 + warpSpeed * 2;
    wg.beginPath(); wg.moveTo(cx + Math.cos(s.a) * r0, cy + Math.sin(s.a) * r0); wg.lineTo(cx + Math.cos(s.a) * r1, cy + Math.sin(s.a) * r1); wg.stroke();
    s.r += (0.004 + warpSpeed * 0.05) * s.s; if (s.r > 1) { s.r = Math.random() * 0.1; s.a = Math.random() * Math.PI * 2; }
  }
  wg.strokeStyle = 'rgba(240,180,0,.5)'; wg.lineWidth = 3;
  for (let i = 0; i < 4; i++) { const rr = ((performance.now() / (900 - warpSpeed * 500) + i / 4) % 1) * R; wg.beginPath(); wg.arc(cx, cy, rr, 0, 7); wg.stroke(); }
  if (warpFlash > 0) { wg.fillStyle = `rgba(255,243,200,${warpFlash})`; wg.fillRect(0, 0, w, h); }
  warpRaf = requestAnimationFrame(drawWarp);
}
const hhmm = (min) => { const m = ((Math.round(min) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

function travel(to) {
  if (traveling || !yard || (to === 'home') === inHome) return;
  traveling = true;
  if (current) yard.close();
  if (homeOpen) { homeOpen = false; deskEl.classList.remove('open'); }
  tip.hidden = true;
  const go = to === 'home';
  const t0 = go ? 14 * 60 + 32 : 22 * 60 + 47, t1 = go ? 22 * 60 + 47 : 24 * 60 + 8 * 60 + 15;
  const o = { m: t0 };
  wlabel.textContent = go ? 'Direction : chez moi' : 'Retour au terminal';
  clock.textContent = hhmm(t0);
  warp.classList.add('on');
  cancelAnimationFrame(warpRaf); drawWarp();
  const spd = { v: 0 };
  const tl = gsap.timeline({ onComplete: () => { warp.classList.remove('on'); cancelAnimationFrame(warpRaf); traveling = false; } });
  tl.to(spd, { v: 1, duration: 1.3, ease: 'power2.in', onUpdate: () => (warpSpeed = spd.v) })
    .to(o, { m: t1, duration: 2.6, ease: 'power1.inOut', onUpdate: () => (clock.textContent = hhmm(o.m)) }, 0)
    .to({}, { duration: 0.01, onComplete: () => { yard.setWorld(to); inHome = go; sync(); document.title = go ? 'Chez Yann' : 'Terminal Cotan'; } }, 1.3)
    .to({ f: 0 }, { f: 1, duration: 0.25, onUpdate() { warpFlash = this.targets()[0].f; } }, 1.15)
    .to({ f: 1 }, { f: 0, duration: 0.9, onUpdate() { warpFlash = this.targets()[0].f; } }, 1.45)
    .to(spd, { v: 0, duration: 1.2, ease: 'power2.out', onUpdate: () => (warpSpeed = spd.v) }, 1.5)
    .to(wlabel, { opacity: 0, duration: 0.4 }, 2.5).set(wlabel, { opacity: 1 })
    .to(warp, { opacity: 0, duration: 0.5 }, 2.7).set(warp, { opacity: '' });
}

/* ---------- scène ---------- */
const canvas = $('#yard');
function init() {
  try {
    yard = createYard({
      canvas, items, tagEls, reduced,
      onSelect: showPanel,
      onPortal: () => travel('home'),
      onHomeHot: (id) => openHomeTab(Math.max(0, hobbies.findIndex((h) => h.id === id))),
      onPhoto: openPhoto,
      onHover: (item, x, y) => {
        if (!item || current || homeOpen) { tip.hidden = true; return; }
        tip.hidden = false;
        tip.textContent = `${item.title} · ${kindLabel[item.kind]}`;
        tip.style.transform = `translate(${x + 16}px, ${y + 16}px)`;
      },
    });
  } catch (e) { console.error(e); }
}
const near = (dir) => {
  if (!current) return;
  const list = items.filter((i) => i.zone === current.zone);
  yard.select(list[(list.indexOf(current) + dir + list.length) % list.length].id);
};
$('#p-prev').addEventListener('click', () => near(-1));
$('#p-next').addEventListener('click', () => near(1));
$('#p-close').addEventListener('click', () => yard?.close());
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!lb.hidden) closePhoto(); else if (!listEl.hidden) closeList(); else if (homeOpen) closeHomePanel(); else if (inHome) travel('yard'); else yard?.close();
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const d = e.key === 'ArrowRight' ? 1 : -1;
    if (homeOpen) openHomeTab(homeTab + d); else near(d);
  }
});

/* ---------- navigation ---------- */
function goZone(z) {
  if (!yard) return openList();
  if (current) yard.close();
  setTimeout(() => yard.flyZone(z), current ? 50 : 0);
}
$$('[data-zone]').forEach((b) => b.addEventListener('click', () => {
  const z = b.dataset.zone;
  if (z === 'bureau') yard ? travel('home') : openList();
  else if (z === 'gate') yard ? yard.select('contact') : openList();
  else goZone(z);
}));
$('[data-action="list"]').addEventListener('click', openList);
$('[data-action="back"]').addEventListener('click', () => travel('yard'));
$('[data-action="about"]').addEventListener('click', () => {
  yard?.close();
  introEl.classList.remove('gone');
  gsap.fromTo(introEl, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
});
$('#cta').addEventListener('click', () => (yard ? yard.select('contact') : openList()));

/* ---------- entrée et chargement ---------- */
const introEl = $('#intro');
function enter(thenContact = false) {
  gsap.to(introEl, { y: 40, opacity: 0, duration: 0.5, ease: 'power2.in', onComplete: () => introEl.classList.add('gone') });
  yard?.enter();
  document.body.classList.add('entered');
  if (thenContact) setTimeout(() => yard?.select('contact'), 700);
}
$('#go').addEventListener('click', () => enter());
$('#go-contact').addEventListener('click', () => enter(true));

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
