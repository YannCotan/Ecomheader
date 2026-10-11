import * as THREE from 'three';

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function toTex(c, repeat = false) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function ribs(x, w, h, step, vertical = true) {
  for (let i = 0; i < w; i += step) {
    const g = x.createLinearGradient(i, 0, i + step, 0);
    g.addColorStop(0, 'rgba(0,0,0,.32)');
    g.addColorStop(0.3, 'rgba(0,0,0,0)');
    g.addColorStop(0.72, 'rgba(255,255,255,.11)');
    g.addColorStop(1, 'rgba(0,0,0,.32)');
    x.fillStyle = g;
    x.fillRect(i, 0, step, h);
  }
}
function weather(x, w, h, r) {
  // coulures de rouille et éraflures
  for (let i = 0; i < 14; i++) {
    const px = r() * w, len = h * (0.2 + r() * 0.6), ww = 3 + r() * 14;
    const g = x.createLinearGradient(0, h * 0.05, 0, h * 0.05 + len);
    g.addColorStop(0, `rgba(90,45,20,${0.1 + r() * 0.12})`);
    g.addColorStop(1, 'rgba(90,45,20,0)');
    x.fillStyle = g;
    x.fillRect(px, h * 0.05, ww, len);
  }
  for (let i = 0; i < 220; i++) {
    x.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.07)';
    x.fillRect(r() * w, r() * h, 2 + r() * 14, 1 + r() * 3);
  }
}
function castings(x, w, h) {
  x.fillStyle = '#16150f';
  const cw = w * 0.025, ch = h * 0.09;
  for (const [px, py] of [[0, 0], [w - cw, 0], [0, h - ch], [w - cw, h - ch]]) x.fillRect(px, py, cw, ch);
}

export function sideTexture({ color, ink = '#f3efe4', label = '', code = '', sizeCode = '', w = 768, h = 330, ribStep = 10, office = false, seed = 1 }) {
  const [c, x] = canvas(w, h);
  const r = rng(seed);
  x.fillStyle = color; x.fillRect(0, 0, w, h);
  ribs(x, w, h, ribStep);
  x.fillStyle = 'rgba(0,0,0,.42)'; x.fillRect(0, 0, w, h * 0.045); x.fillRect(0, h * 0.95, w, h * 0.05);
  weather(x, w, h, r);
  castings(x, w, h);
  if (office) {
    const wx = w * 0.6, wy = h * 0.2, ww = w * 0.3, wh = h * 0.42;
    x.fillStyle = '#16150f'; x.fillRect(wx - 6, wy - 6, ww + 12, wh + 12);
    const g = x.createLinearGradient(wx, wy, wx + ww, wy + wh);
    g.addColorStop(0, '#d7ecf2'); g.addColorStop(0.5, '#8fb6c4'); g.addColorStop(1, '#5d8796');
    x.fillStyle = g; x.fillRect(wx, wy, ww, wh);
    x.fillStyle = '#16150f'; x.fillRect(wx + ww / 2 - 2, wy, 4, wh);
  }
  if (label) {
    let size = h * 0.34;
    x.font = `700 ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`;
    const maxW = (office ? w * 0.5 : w * 0.8);
    const wid = x.measureText(label.toUpperCase()).width;
    if (wid > maxW) { size *= maxW / wid; x.font = `700 ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`; }
    x.textBaseline = 'middle';
    x.fillStyle = ink;
    x.globalAlpha = 0.94;
    x.fillText(label.toUpperCase(), w * 0.07, h * 0.56);
    x.globalAlpha = 1;
  }
  x.fillStyle = ink; x.globalAlpha = 0.85;
  x.font = `500 ${h * 0.058}px "IBM Plex Mono", monospace`;
  x.textBaseline = 'alphabetic';
  if (code) x.fillText(code, w * 0.07, h * 0.185);
  if (sizeCode) { x.textAlign = 'right'; x.fillText(sizeCode, w * 0.96, h * 0.185); x.textAlign = 'left'; }
  x.font = `500 ${h * 0.04}px "IBM Plex Mono", monospace`;
  x.globalAlpha = 0.6;
  x.fillText('MAX GROSS 30480 KG · TARE 2200 KG', w * 0.07, h * 0.9);
  x.globalAlpha = 1;
  return toTex(c);
}

export function endTexture({ color, ink = '#f3efe4', code = '', door = true, seed = 1 }) {
  const w = 420, h = 450;
  const [c, x] = canvas(w, h);
  const r = rng(seed);
  x.fillStyle = color; x.fillRect(0, 0, w, h);
  ribs(x, w, h, 7);
  x.fillStyle = 'rgba(0,0,0,.42)'; x.fillRect(0, 0, w, h * 0.05); x.fillRect(0, h * 0.94, w, h * 0.06);
  castings(x, w, h);
  if (door) {
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(w / 2 - 2, h * 0.06, 4, h * 0.88);
    for (const px of [w * 0.17, w * 0.35, w * 0.65, w * 0.83]) {
      const g = x.createLinearGradient(px - 4, 0, px + 4, 0);
      g.addColorStop(0, '#6b6f70'); g.addColorStop(0.5, '#d9dcdc'); g.addColorStop(1, '#6b6f70');
      x.fillStyle = g; x.fillRect(px - 4, h * 0.1, 8, h * 0.8);
      x.fillStyle = '#16150f'; x.fillRect(px - 9, h * 0.48, 18, 22);
    }
  }
  weather(x, w, h, r);
  x.fillStyle = ink; x.globalAlpha = 0.85;
  x.font = `500 ${h * 0.045}px "IBM Plex Mono", monospace`;
  x.textAlign = 'right';
  if (code) x.fillText(code, w * 0.96, h * 0.14);
  x.globalAlpha = 1;
  return toTex(c);
}

export function ribTexture() {
  const [c, x] = canvas(512, 256);
  x.fillStyle = '#d6d6d0'; x.fillRect(0, 0, 512, 256);
  ribs(x, 512, 256, 8);
  x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, 0, 512, 12); x.fillRect(0, 244, 512, 12);
  weather(x, 512, 256, rng(7));
  return toTex(c);
}

export function groundTexture() {
  const [c, x] = canvas(512, 512);
  const r = rng(42);
  x.fillStyle = '#c9c3b4'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const v = r();
    x.fillStyle = v > 0.5 ? `rgba(255,255,255,${0.04 + r() * 0.06})` : `rgba(40,35,25,${0.04 + r() * 0.07})`;
    x.fillRect(r() * 512, r() * 512, 1 + r() * 3, 1 + r() * 3);
  }
  for (let i = 0; i < 18; i++) {
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 40 + r() * 60);
    g.addColorStop(0, 'rgba(60,50,35,.10)'); g.addColorStop(1, 'rgba(60,50,35,0)');
    x.save(); x.translate(r() * 512, r() * 512); x.fillStyle = g; x.fillRect(-120, -120, 240, 240); x.restore();
  }
  x.strokeStyle = 'rgba(40,35,25,.35)'; x.lineWidth = 3;
  x.strokeRect(0, 0, 512, 512);
  x.strokeStyle = 'rgba(40,35,25,.18)'; x.lineWidth = 1.5;
  x.beginPath(); x.moveTo(256, 0); x.lineTo(256, 512); x.moveTo(0, 256); x.lineTo(512, 256); x.stroke();
  return toTex(c, true);
}

export function barrierTexture() {
  const [c, x] = canvas(256, 32);
  for (let i = 0; i < 256; i += 32) { x.fillStyle = (i / 32) % 2 ? '#f3efe4' : '#d6361b'; x.fillRect(i, 0, 32, 32); }
  return toTex(c, true);
}
