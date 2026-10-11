import * as THREE from 'three';
import plage from './photos/plage.jpg?inline';
import abidjan from './photos/abidjan.jpg?inline';
import soiree from './photos/soiree.jpg?inline';

// Chambre de gamer « à la maison », de nuit. Chaque objet cliquable ouvre un hobby.
export const PHOTOS = [
  { id: 'plage', src: plage, w: 600, h: 800, caption: 'Au bord de l\'océan, sur les rochers.' },
  { id: 'abidjan', src: abidjan, w: 720, h: 600, caption: 'Abidjan.' },
  { id: 'soiree', src: soiree, w: 480, h: 854, caption: 'Une soirée en ville.' },
];

export const HOME_VIEWS = {
  home: { pos: [0.9, 1.75, 3.9], target: [0, 1.15, -1.2] },
  code: { pos: [-0.25, 1.4, -0.3], target: [-0.25, 1.2, -2.25] },
  jeux: { pos: [0.62, 1.38, -0.1], target: [0.55, 1.0, -2.05] },
  manga: { pos: [-1.2, 1.7, 0.9], target: [-3.0, 1.55, -0.9] },
  musique: { pos: [-0.9, 1.4, 0.6], target: [-2.6, 0.85, -1.3] },
  voitures: { pos: [-0.9, 1.6, 1.9], target: [-3.0, 1.5, 0.1] },
  voyages: { pos: [0.9, 1.65, 1.1], target: [3.1, 1.5, -0.1] },
};

export function createHome() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a0a12');
  scene.fog = new THREE.Fog('#0a0a12', 9, 22);

  const pickables = [];
  const hotMats = [];           // { mat, id, amt }
  const animated = [];          // fonctions (dt, t) => void
  const S = (c, r = 0.7, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const add = (parent, geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); parent.add(o); return o; };
  const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  // marque un groupe comme cliquable pour un hobby donné
  const hot = (obj, id) => {
    obj.traverse((m) => {
      if (!m.isMesh) return;
      m.userData.hot = id;
      pickables.push(m);
      if (m.material.emissiveIntensity > 1.5) return; // matériaux RVB animés : pas de surbrillance
      m.material = m.material.clone();
      hotMats.push({ mat: m.material, id, base: m.material.color.clone() });
    });
  };

  // ---------- pièce
  const [fc, fg] = cv(512, 512);
  fg.fillStyle = '#3a2a22'; fg.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) { fg.fillStyle = i % 2 ? '#43322a' : '#35261f'; fg.fillRect(0, i * 64, 512, 62); fg.fillStyle = 'rgba(0,0,0,.35)'; fg.fillRect(0, i * 64 + 62, 512, 2); for (let k = 0; k < 40; k++) { fg.fillStyle = 'rgba(0,0,0,.06)'; fg.fillRect(Math.random() * 512, i * 64 + Math.random() * 60, 20 + Math.random() * 60, 1); } }
  const floorTex = tex(fc); floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(2, 1.6);
  const floor = add(scene, new THREE.PlaneGeometry(6.4, 5.2), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.6 }), 0, 0, -0.1);
  floor.rotation.x = -Math.PI / 2;
  const wallM = S('#1a1a26', 0.95);
  add(scene, B(6.4, 3, 0.1), wallM, 0, 1.5, -2.65);
  add(scene, B(0.1, 3, 5.2), wallM, -3.25, 1.5, -0.1);
  add(scene, B(0.1, 3, 5.2), wallM, 3.25, 1.5, -0.1);
  add(scene, B(6.4, 0.08, 0.1), S('#0d0d14'), 0, 0.04, -2.58);
  // tapis rond
  const rug = add(scene, new THREE.CircleGeometry(1.5, 48), S('#3a2a5a', 1), 0.3, 0.012, -0.6); rug.rotation.x = -Math.PI / 2;
  const ring = add(scene, new THREE.RingGeometry(1.35, 1.45, 48), S('#e5561b', 1), 0.3, 0.014, -0.6); ring.rotation.x = -Math.PI / 2;

  // ---------- fenêtre sur la nuit d'Abidjan (avec le port au loin)
  { const [c, g] = cv(512, 380);
    const sky = g.createLinearGradient(0, 0, 0, 380); sky.addColorStop(0, '#05061a'); sky.addColorStop(0.7, '#1c1840'); sky.addColorStop(1, '#4a2a50');
    g.fillStyle = sky; g.fillRect(0, 0, 512, 380);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.7})`; g.fillRect(Math.random() * 512, Math.random() * 200, 1.5, 1.5); }
    const moon = g.createRadialGradient(400, 70, 4, 400, 70, 60); moon.addColorStop(0, '#fffbe0'); moon.addColorStop(0.2, '#fff3c0'); moon.addColorStop(1, 'rgba(255,243,192,0)'); g.fillStyle = moon; g.fillRect(300, 0, 200, 160);
    g.fillStyle = '#0a0a14';
    for (let x = 0; x < 512; x += 26) { const h = 60 + ((x * 37) % 120); g.fillRect(x, 380 - h, 24, h); }
    for (let x = 0; x < 512; x += 26) { const h = 60 + ((x * 37) % 120); for (let y = 380 - h + 8; y < 372; y += 14) if (Math.random() > 0.55) { g.fillStyle = Math.random() > 0.5 ? '#ffd27a' : '#9fd6ff'; g.fillRect(x + 4 + (Math.random() > 0.5 ? 10 : 0), y, 6, 7); } g.fillStyle = '#0a0a14'; }
    g.fillStyle = '#0a0a14'; g.fillRect(70, 150, 5, 230); g.fillRect(40, 150, 90, 5); g.fillStyle = '#ff5b14'; g.fillRect(70, 146, 5, 5);
    const win = add(scene, new THREE.PlaneGeometry(1.7, 1.26), new THREE.MeshBasicMaterial({ map: tex(c) }), -2.0, 1.85, -2.59);
    const fm = S('#0d0d14', 0.6);
    add(scene, B(1.8, 0.06, 0.08), fm, -2.0, 2.5, -2.58); add(scene, B(1.8, 0.06, 0.08), fm, -2.0, 1.2, -2.58);
    add(scene, B(0.06, 1.36, 0.08), fm, -2.9, 1.85, -2.58); add(scene, B(0.06, 1.36, 0.08), fm, -1.1, 1.85, -2.58); add(scene, B(0.04, 1.3, 0.06), fm, -2.0, 1.85, -2.57);
  }

  // ---------- enseigne YANKO : néon RVB, une teinte par lettre qui défile
  const yanko = [];
  'YANKO'.split('').forEach((ch, i) => {
    const [c, g] = cv(128, 192);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 176px "Barlow Condensed", sans-serif';
    g.shadowColor = '#fff'; g.shadowBlur = 36; g.fillStyle = '#fff'; g.fillText(ch, 64, 100);
    g.shadowBlur = 10; g.fillText(ch, 64, 100);
    const m = new THREE.MeshBasicMaterial({ map: tex(c), transparent: true, depthWrite: false, toneMapped: false });
    add(scene, new THREE.PlaneGeometry(0.36, 0.54), m, 0.5 + (i - 2) * 0.38, 2.42, -2.58);
    yanko.push(m);
  });

  // ---------- bureau
  const wood = S('#7a5a3c', 0.65), dark = S('#17171f', 0.5, 0.4);
  add(scene, B(3.2, 0.06, 0.9), wood, 0.3, 0.76, -2.12);
  for (const [lx, lz] of [[-1.25, -2.5], [1.85, -2.5], [-1.25, -1.78], [1.85, -1.78]]) add(scene, B(0.06, 0.73, 0.06), dark, lx, 0.38, lz);
  const rgbMats = [];
  const rgb = (c = '#ff00aa') => { const m = new THREE.MeshStandardMaterial({ color: '#111', emissive: c, emissiveIntensity: 2.2 }); rgbMats.push(m); return m; };
  add(scene, B(3.0, 0.025, 0.04), rgb(), 0.3, 0.72, -1.7);   // bandeau sous le bureau
  add(scene, B(3.0, 0.03, 0.03), rgb(), 0.3, 1.64, -2.62);   // bandeau derrière les écrans

  // écrans
  const SW = 640, SH = 360;
  const mkScreen = () => { const [c, g] = cv(SW, SH); const t = tex(c); return { c, g, t }; };
  const code = mkScreen(), game = mkScreen();
  function monitor(screen, x, rotY, id) {
    const grp = new THREE.Group(); grp.position.set(x, 0, -2.3); grp.rotation.y = rotY;
    add(grp, B(0.18, 0.02, 0.18), dark, 0, 0.8, 0); add(grp, B(0.04, 0.22, 0.04), dark, 0, 0.9, 0);
    add(grp, B(0.98, 0.58, 0.035), S('#0a0a10', 0.4, 0.4), 0, 1.2, 0);
    add(grp, new THREE.PlaneGeometry(0.93, 0.523), new THREE.MeshBasicMaterial({ map: screen.t, toneMapped: false }), 0, 1.2, 0.02);
    scene.add(grp); hot(grp, id); return grp;
  }
  monitor(code, -0.3, 0.1, 'code');
  monitor(game, 0.9, -0.1, 'jeux');

  // tapis de bureau XXL
  add(scene, B(1.3, 0.004, 0.46), S('#0e0e16', 0.95), 0.45, 0.793, -1.88);
  add(scene, B(1.3, 0.005, 0.008), rgb('#ff5b14'), 0.45, 0.796, -1.655);
  add(scene, B(1.3, 0.005, 0.008), rgb('#ff5b14'), 0.45, 0.796, -2.105);

  // clavier mécanique 60 % RVB : 61 touches, boîtier alu, éclairage sous les touches, légendes
  const kb = new THREE.Group(); kb.position.set(0.17, 0.795, -1.86); kb.rotation.x = 0.07; scene.add(kb);
  const U = 0.0268, ROWS = [
    [['Esc', 1], ['1', 1], ['2', 1], ['3', 1], ['4', 1], ['5', 1], ['6', 1], ['7', 1], ['8', 1], ['9', 1], ['0', 1], ['-', 1], ['=', 1], ['⌫', 2]],
    [['Tab', 1.5], ['Q', 1], ['W', 1], ['E', 1], ['R', 1], ['T', 1], ['Y', 1], ['U', 1], ['I', 1], ['O', 1], ['P', 1], ['[', 1], [']', 1], ['\\', 1.5]],
    [['Caps', 1.75], ['A', 1], ['S', 1], ['D', 1], ['F', 1], ['G', 1], ['H', 1], ['J', 1], ['K', 1], ['L', 1], [';', 1], ["'", 1], ['Enter', 2.25]],
    [['Shift', 2.25], ['Z', 1], ['X', 1], ['C', 1], ['V', 1], ['B', 1], ['N', 1], ['M', 1], [',', 1], ['.', 1], ['/', 1], ['Shift', 2.75]],
    [['Ctrl', 1.25], ['Win', 1.25], ['Alt', 1.25], ['', 6.25], ['Alt', 1.25], ['Fn', 1.25], ['Menu', 1.25], ['Ctrl', 1.25]],
  ];
  const KW = 15 * U, KD = 5 * U;
  add(kb, B(KW + 0.03, 0.022, KD + 0.03), S('#1a1a24', 0.35, 0.7), 0, 0.011, 0);
  add(kb, B(KW + 0.034, 0.004, KD + 0.034), rgb('#7c5cff'), 0, 0.001, 0);              // halo sous le boîtier
  add(kb, new THREE.PlaneGeometry(KW + 0.005, KD + 0.005), rgb('#00e5ff'), 0, 0.0224, 0).rotation.x = -Math.PI / 2; // lumière entre les touches
  const keyCount = ROWS.reduce((n, r) => n + r.length, 0);
  const caps = new THREE.InstancedMesh(B(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.1 }), keyCount);
  const [lc, lg] = cv(1280, 430);
  lg.fillStyle = '#e8fbff'; lg.textAlign = 'center'; lg.textBaseline = 'middle';
  const mtx = new THREE.Matrix4(), col = new THREE.Color();
  let ki = 0;
  ROWS.forEach((row, r) => {
    let x = -KW / 2;
    row.forEach(([label, w]) => {
      const kw = w * U - 0.0036, cx = x + (w * U) / 2, cz = (r - 2) * U;
      mtx.compose(new THREE.Vector3(cx, 0.0235 + 0.0035, cz), new THREE.Quaternion(), new THREE.Vector3(kw, 0.014, U - 0.0036));
      caps.setMatrixAt(ki, mtx);
      const accent = label === 'Esc' || label === 'Enter';
      caps.setColorAt(ki, col.set(accent ? '#e5561b' : w > 1 && label !== '' ? '#2c2c3a' : '#1c1c26'));
      ki++;
      // légende (texte sur un canevas unique, 1 u = 80 px)
      if (label) { lg.font = `600 ${label.length > 2 ? 22 : 30}px "IBM Plex Mono", monospace`; lg.fillText(label, ((cx + KW / 2) / KW) * 1280, ((cz + KD / 2) / KD) * 430); }
      x += w * U;
    });
  });
  caps.castShadow = false; kb.add(caps);
  const legends = add(kb, new THREE.PlaneGeometry(KW, KD), new THREE.MeshBasicMaterial({ map: tex(lc), transparent: true, depthWrite: false, toneMapped: false }), 0, 0.0316, 0);
  legends.rotation.x = -Math.PI / 2; legends.renderOrder = 2;
  const cable = (pts, r = 0.0045) => add(scene, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 24, r, 6), S('#0a0a0f', 0.8), 0, 0, 0);
  cable([[0.17, 0.8, -2.02], [0.17, 0.79, -2.4], [0.3, 0.6, -2.58], [1.2, 0.2, -2.5], [2.05, 0.1, -2.2]]);
  hot(kb, 'jeux');

  // souris gaming : coque ergonomique, boutons, molette et bandeaux RVB
  const mouse = new THREE.Group(); mouse.position.set(0.88, 0.797, -1.86); mouse.rotation.y = 0.1; scene.add(mouse);
  const mBlack = S('#14141b', 0.4, 0.2);
  const body = add(mouse, new THREE.CapsuleGeometry(0.036, 0.075, 8, 20), mBlack, 0, 0.022, 0);
  body.rotation.x = Math.PI / 2; body.scale.set(1.15, 1, 0.58);
  add(mouse, new THREE.SphereGeometry(0.032, 16, 12), mBlack, 0, 0.026, 0.035).scale.set(1.1, 0.55, 1.3);
  for (const sx of [-0.0145, 0.0145]) add(mouse, B(0.026, 0.004, 0.058), S('#22222c', 0.35, 0.3), sx, 0.0425, -0.04);
  add(mouse, B(0.003, 0.0045, 0.062), S('#050508'), 0, 0.0428, -0.04);
  const wheel = add(mouse, new THREE.CylinderGeometry(0.0085, 0.0085, 0.013, 14), rgb('#ff2fa8'), 0, 0.046, -0.038); wheel.rotation.z = Math.PI / 2;
  for (const sz of [-0.012, 0.008]) add(mouse, B(0.004, 0.006, 0.016), S('#2c2c3a', 0.4), -0.0445, 0.022, sz);
  add(mouse, B(0.006, 0.0032, 0.1), rgb('#00e5ff'), -0.0415, 0.006, 0.0);
  add(mouse, B(0.006, 0.0032, 0.1), rgb('#00e5ff'), 0.0415, 0.006, 0.0);
  add(mouse, B(0.018, 0.0022, 0.018), rgb('#ff5b14'), 0, 0.0405, 0.05);
  cable([[0.88, 0.805, -1.95], [0.88, 0.8, -2.1], [0.95, 0.7, -2.5], [1.5, 0.3, -2.45], [2.05, 0.1, -2.15]]);
  hot(mouse, 'jeux');
  const hs = new THREE.Group(); hs.position.set(-0.95, 0.79, -1.95); scene.add(hs);
  add(hs, new THREE.CylinderGeometry(0.06, 0.07, 0.015, 16), dark, 0, 0, 0); add(hs, new THREE.CylinderGeometry(0.01, 0.01, 0.2, 8), dark, 0, 0.1, 0);
  const band = add(hs, new THREE.TorusGeometry(0.085, 0.014, 8, 20, Math.PI), dark, 0, 0.23, 0);
  for (const sx of [-0.085, 0.085]) { const e = add(hs, new THREE.CylinderGeometry(0.045, 0.045, 0.04, 16), S('#ff2fa8', 0.5), sx, 0.23, 0); e.rotation.z = Math.PI / 2; }
  const pad = new THREE.Group(); pad.position.set(-0.55, 0.795, -1.7); pad.rotation.y = 0.4; scene.add(pad);
  add(pad, B(0.16, 0.03, 0.1), S('#2b2b36', 0.5), 0, 0, 0);
  for (const gx of [-0.04, 0.04]) add(pad, new THREE.CylinderGeometry(0.015, 0.015, 0.02, 10), dark, gx, 0.022, 0);
  for (const [bx, bz, c] of [[0.06, -0.02, '#e5561b'], [0.075, 0.01, '#f0b400'], [0.045, 0.01, '#3a7a58']]) add(pad, new THREE.CylinderGeometry(0.008, 0.008, 0.01, 8), S(c, 0.5), bx, 0.02, bz);

  // PC tour (ventilateurs RVB)
  const tower = new THREE.Group(); tower.position.set(2.15, 0.26, -2.1); scene.add(tower);
  add(tower, B(0.24, 0.52, 0.5), S('#101018', 0.5, 0.5), 0, 0, 0);
  const glass = add(tower, B(0.005, 0.46, 0.44), new THREE.MeshStandardMaterial({ color: '#0a0a14', transparent: true, opacity: 0.55, roughness: 0.1 }), -0.121, 0, 0);
  for (const fy of [-0.14, 0, 0.14]) { const fan = add(tower, new THREE.TorusGeometry(0.055, 0.012, 8, 24), rgb('#7c5cff'), -0.125, fy, 0.0); fan.rotation.y = Math.PI / 2; animated.push((dt) => (fan.rotation.x += dt * 4)); }
  tower.rotation.y = 0.25;
  hot(tower, 'jeux');

  // enceintes + platine vinyle (musique)
  const music = new THREE.Group(); scene.add(music);
  const spk = (x) => {
    const g = new THREE.Group(); g.position.set(x, 0.97, -2.35); music.add(g);
    add(g, B(0.17, 0.28, 0.17), S('#101018', 0.6), 0, 0, 0);
    const cone = add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.012, 20), S('#2b2b36', 0.5), 0, -0.04, 0.09); cone.rotation.x = Math.PI / 2;
    const tw = add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.012, 14), S('#2b2b36', 0.5), 0, 0.07, 0.09); tw.rotation.x = Math.PI / 2;
    add(scene, B(0.19, 0.01, 0.19), dark, x, 0.795, -2.35);
    return { cone };
  };
  const sL = spk(-1.0), sR = spk(1.7);
  const side = new THREE.Group(); side.position.set(-2.7, 0, -1.25); music.add(side);
  add(side, B(0.5, 0.55, 0.62), S('#2a2018', 0.7), 0, 0.275, 0);
  add(side, B(0.44, 0.07, 0.34), S('#15151d', 0.4), 0, 0.585, 0);
  const vinyl = add(side, new THREE.CylinderGeometry(0.15, 0.15, 0.01, 40), S('#050508', 0.3), 0, 0.625, 0);
  add(side, new THREE.CylinderGeometry(0.045, 0.045, 0.012, 20), S('#e5561b', 0.5), 0, 0.63, 0);
  add(side, B(0.012, 0.012, 0.18), S('#cfcfcf', 0.3, 0.8), 0.17, 0.64, -0.05);
  hot(music, 'musique');
  const musicApi = { pulse: () => 0, playing: () => false };

  // fauteuil gamer
  const chair = new THREE.Group(); chair.position.set(2.3, 0, -1.1); chair.rotation.y = -0.9; scene.add(chair);
  const red = S('#c9382a', 0.6), blk = S('#14141b', 0.7);
  add(chair, new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8), dark, 0, 0.3, 0);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const leg = add(chair, B(0.28, 0.025, 0.04), dark, Math.cos(a) * 0.14, 0.05, Math.sin(a) * 0.14); leg.rotation.y = -a; add(chair, new THREE.SphereGeometry(0.025, 8, 8), dark, Math.cos(a) * 0.28, 0.025, Math.sin(a) * 0.28); }
  add(chair, B(0.52, 0.1, 0.5), blk, 0, 0.48, 0); add(chair, B(0.06, 0.1, 0.5), red, -0.28, 0.5, 0); add(chair, B(0.06, 0.1, 0.5), red, 0.28, 0.5, 0);
  const back = add(chair, B(0.5, 0.78, 0.1), blk, 0, 0.95, 0.24); back.rotation.x = -0.12;
  add(chair, B(0.08, 0.7, 0.11), red, -0.22, 0.95, 0.245).rotation.x = -0.12; add(chair, B(0.08, 0.7, 0.11), red, 0.22, 0.95, 0.245).rotation.x = -0.12;
  add(chair, B(0.28, 0.16, 0.08), red, 0, 1.45, 0.28);

  // étagère de mangas et figurines
  const manga = new THREE.Group(); scene.add(manga);
  const shelfM = S('#2a2018', 0.7);
  for (const y of [1.2, 1.72]) add(manga, B(0.3, 0.04, 2.0), shelfM, -3.08, y, -1.0);
  const cols = ['#c9382a', '#2e5b86', '#f0b400', '#3a7a58', '#f3efe4', '#7d2c3b', '#e5561b', '#263f63', '#c9382a', '#3a7a58', '#f0b400', '#7a4ac9', '#2e5b86', '#e5561b', '#f3efe4', '#c9382a', '#3a7a58'];
  cols.forEach((c, i) => { const h = 0.2 + ((i * 29) % 5) * 0.012; add(manga, B(0.12, h, 0.036), S(c, 0.8), -3.08, 1.74 + h / 2, -1.88 + i * 0.045); });
  for (let i = 0; i < 12; i++) { const h = 0.2 + ((i * 17) % 4) * 0.012; add(manga, B(0.12, h, 0.036), S(cols[(i * 5) % cols.length], 0.8), -3.08, 1.22 + h / 2, -1.88 + i * 0.045); }
  // figurines
  [[-0.9, '#e5561b'], [-0.6, '#7c5cff'], [-0.3, '#2fd0c8']].forEach(([z, c], i) => {
    const f = new THREE.Group(); f.position.set(-3.08, 1.74, z + 0.05); manga.add(f);
    add(f, new THREE.CylinderGeometry(0.05, 0.06, 0.012, 16), dark, 0, 0.006, 0);
    add(f, new THREE.CylinderGeometry(0.03, 0.04, 0.11, 10), S(c, 0.6), 0, 0.07, 0);
    add(f, new THREE.SphereGeometry(0.035, 12, 12), S('#f1d3b8', 0.7), 0, 0.15, 0);
    add(f, new THREE.ConeGeometry(0.04, 0.07, 8), S(i === 1 ? '#f3efe4' : '#16150f', 0.7), 0, 0.19, 0);
  });
  hot(manga, 'manga');

  // voitures miniatures + affiche
  const cars = new THREE.Group(); scene.add(cars);
  const miniCar = (c, z) => {
    const g = new THREE.Group(); g.position.set(-3.05, 1.24, z); g.rotation.y = Math.PI / 2 + (z % 0.3); cars.add(g);
    add(g, B(0.2, 0.035, 0.09), S(c, 0.35, 0.4), 0, 0.03, 0); add(g, B(0.11, 0.035, 0.08), S(c, 0.35, 0.4), -0.01, 0.065, 0);
    add(g, B(0.1, 0.02, 0.075), new THREE.MeshStandardMaterial({ color: '#0a0a14', roughness: 0.1 }), -0.01, 0.07, 0);
    for (const [wx, wz] of [[0.065, 0.045], [0.065, -0.045], [-0.065, 0.045], [-0.065, -0.045]]) { const w = add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.02, 12), S('#0a0a0a', 0.9), wx, 0.02, wz); w.rotation.x = Math.PI / 2; }
    add(g, B(0.01, 0.012, 0.05), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff4c0', emissiveIntensity: 2 }), 0.1, 0.035, 0);
  };
  miniCar('#e5561b', -1.65); miniCar('#2e5b86', -1.3); miniCar('#f0b400', -0.95); miniCar('#c9382a', -0.6);
  { const [c, g] = cv(480, 320);
    const sky = g.createLinearGradient(0, 0, 0, 320); sky.addColorStop(0, '#2a1048'); sky.addColorStop(0.55, '#ff5b14'); sky.addColorStop(1, '#f0b400');
    g.fillStyle = sky; g.fillRect(0, 0, 480, 320);
    g.fillStyle = '#ffe9b0'; g.beginPath(); g.arc(340, 150, 62, 0, 7); g.fill();
    g.fillStyle = '#16102a'; g.fillRect(0, 232, 480, 88);
    for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(20 + i * 8, 160 + i * 5, 90 - i * 4, 2); }
    g.fillStyle = '#0b0b12'; g.beginPath(); g.moveTo(110, 236); g.bezierCurveTo(120, 205, 170, 196, 205, 188); g.bezierCurveTo(235, 160, 285, 160, 310, 188); g.bezierCurveTo(350, 192, 392, 205, 396, 236); g.closePath(); g.fill();
    g.fillStyle = '#16102a'; g.beginPath(); g.arc(165, 238, 24, 0, 7); g.arc(350, 238, 24, 0, 7); g.fill(); g.fillStyle = '#0b0b12'; g.beginPath(); g.arc(165, 238, 16, 0, 7); g.arc(350, 238, 16, 0, 7); g.fill();
    g.fillStyle = '#f3efe4'; g.font = '700 38px "Barlow Condensed", sans-serif'; g.textAlign = 'left'; g.fillText('NIGHT DRIVE', 24, 292);
    const poster = add(cars, new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.8, emissive: '#ffffff', emissiveMap: tex(c), emissiveIntensity: 0.25 }), -3.19, 1.7, 0.5);
    poster.rotation.y = Math.PI / 2;
    add(cars, B(0.03, 0.86, 1.26), S('#0d0d14'), -3.205, 1.7, 0.5);
  }
  hot(cars, 'voitures');

  // cadres photo (voyages)
  const trips = new THREE.Group(); scene.add(trips);
  const loader = new THREE.TextureLoader();
  const frames = [
    { p: 0, z: -1.5, y: 1.55, hh: 0.9 }, { p: 1, z: -0.3, y: 1.45, hh: 0.62 }, { p: 2, z: 0.85, y: 1.6, hh: 0.95 },
  ];
  frames.forEach((f) => {
    const ph = PHOTOS[f.p], w = f.hh * (ph.w / ph.h);
    const g = new THREE.Group(); g.position.set(3.19, f.y, f.z); g.rotation.y = -Math.PI / 2; trips.add(g);
    add(g, B(w + 0.1, f.hh + 0.1, 0.03), S('#f3efe4', 0.6), 0, 0, -0.01);
    const t = loader.load(ph.src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const pm = add(g, new THREE.PlaneGeometry(w, f.hh), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, emissive: '#fff', emissiveMap: t, emissiveIntensity: 0.18 }), 0, 0, 0.008);
    pm.userData.photo = f.p;
  });
  // valise
  { const s = new THREE.Group(); s.position.set(2.6, 0, 1.7); s.rotation.y = -0.5; trips.add(s);
    add(s, B(0.5, 0.7, 0.24), S('#2e5b86', 0.45, 0.2), 0, 0.37, 0); add(s, B(0.5, 0.02, 0.26), S('#16150f'), 0, 0.37, 0);
    add(s, B(0.2, 0.05, 0.03), S('#16150f'), 0, 0.74, 0); for (const x of [-0.18, 0.18]) add(s, new THREE.CylinderGeometry(0.03, 0.03, 0.03, 10), S('#16150f'), x, 0.015, 0.06).rotation.x = Math.PI / 2; }
  hot(trips, 'voyages');

  // ---------- lumières de la chambre
  scene.add(new THREE.HemisphereLight('#8a8ad0', '#3a2440', 1.9));
  const moonL = new THREE.DirectionalLight('#9ab0ff', 1.3); moonL.position.set(-4, 4, -3); scene.add(moonL);
  const L = (c, i, d, x, y, z) => { const l = new THREE.PointLight(c, i, d); l.position.set(x, y, z); scene.add(l); return l; };
  L('#00e5ff', 3.2, 5, 0.3, 1.5, -1.6);
  const pink = L('#ff2fa8', 3.5, 5, -2.4, 1.2, -0.4);
  L('#ffb878', 8, 10, 0.2, 2.6, 0.2);

  // ---------- écrans animés
  // Écran de code (écriture automatique, redessiné ~15 fois par seconde) ; l'écran de jeu, lui, est dessiné une seule fois
  const lines = [
    [['const ', '#c792ea'], ['yann', '#82aaff'], [' = {', '#d6deeb']],
    [['  role', '#7fdbca'], [': ', '#d6deeb'], ["'développeur fullstack'", '#ecc48d'], [',', '#d6deeb']],
    [['  ville', '#7fdbca'], [': ', '#d6deeb'], ["'Abidjan'", '#ecc48d'], [',', '#d6deeb']],
    [['  stack', '#7fdbca'], [': [', '#d6deeb'], ["'React'", '#ecc48d'], [', ', '#d6deeb'], ["'Node.js'", '#ecc48d'], [',', '#d6deeb']],
    [['    ', '#d6deeb'], ["'PostgreSQL'", '#ecc48d'], [', ', '#d6deeb'], ["'Redis'", '#ecc48d'], [', ', '#d6deeb'], ["'Docker'", '#ecc48d'], [']', '#d6deeb'], [',', '#d6deeb']],
    [['  gamer', '#7fdbca'], [': ', '#d6deeb'], ['true', '#ff5874'], [',', '#d6deeb']],
    [['};', '#d6deeb']],
    [['// prêt à coder avec toi', '#637777']],
  ];
  const total = lines.reduce((n, l) => n + l.reduce((m, sg) => m + sg[0].length, 0), 0);
  function drawCode(t) {
    const g = code.g; g.fillStyle = '#011627'; g.fillRect(0, 0, SW, SH);
    g.fillStyle = '#0b2942'; g.fillRect(0, 0, SW, 30); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 150, 30); g.fillStyle = '#011627'; g.font = '500 14px "IBM Plex Mono", monospace'; g.fillText('yann.js', 14, 20);
    g.fillStyle = '#5f7e97'; g.fillText('portfolio.js', 166, 20);
    g.font = '500 19px "IBM Plex Mono", monospace';
    let remaining = Math.floor((t * 14) % (total + 40)), y = 62, done = false;
    lines.forEach((l, i) => {
      if (done) return;
      let x = 40; g.fillStyle = '#4b6479'; g.fillText(String(i + 1), 12, y);
      for (const [seg, c] of l) {
        const part = seg.slice(0, Math.max(0, remaining));
        g.fillStyle = c; g.fillText(part, x, y); x += g.measureText(part).width; remaining -= seg.length;
        if (remaining <= 0) { if (Math.floor(t * 2) % 2) { g.fillStyle = '#ffffff'; g.fillRect(x + 1, y - 16, 10, 22); } done = true; break; }
      }
      y += 30;
    });
    g.fillStyle = '#0b2942'; g.fillRect(0, SH - 24, SW, 24); g.fillStyle = '#7fdbca'; g.font = '500 13px "IBM Plex Mono", monospace'; g.fillText('main ●  JavaScript  UTF-8', 12, SH - 8);
    code.t.needsUpdate = true;
  }
  function drawGame(t) {
    const g = game.g, hz = 150;
    const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#1a0b3a'); sky.addColorStop(1, '#ff5b14'); g.fillStyle = sky; g.fillRect(0, 0, SW, hz);
    g.fillStyle = '#ffd27a'; g.beginPath(); g.arc(320, hz - 10, 50, Math.PI, 0); g.fill();
    g.fillStyle = '#1d0f33'; g.beginPath(); g.moveTo(0, hz); for (let x = 0; x <= SW; x += 40) g.lineTo(x, hz - 20 - ((x * 13) % 40)); g.lineTo(SW, hz); g.fill();
    for (let y = hz; y < SH; y += 3) {
      const k = (y - hz) / (SH - hz), z = 1 / (k + 0.04), ph = ((z * 0.5 + t * 6) % 2) < 1;
      g.fillStyle = ph ? '#13131c' : '#1b1b28'; g.fillRect(0, y, SW, 3);
      const half = 40 + k * 300; g.fillStyle = ph ? '#262633' : '#2e2e3d'; g.fillRect(320 - half, y, half * 2, 3);
      g.fillStyle = ph ? '#e5561b' : '#f3efe4'; g.fillRect(320 - half, y, 6 + k * 10, 3); g.fillRect(320 + half - (6 + k * 10), y, 6 + k * 10, 3);
      if (ph) { g.fillStyle = '#f0b400'; g.fillRect(318, y, 4 + k * 6, 3); }
    }
    const cx = 320;
    g.fillStyle = '#c9382a'; g.fillRect(cx - 46, 290, 92, 30); g.fillStyle = '#16150f'; g.fillRect(cx - 34, 272, 68, 22); g.fillStyle = '#ff2f2f'; g.fillRect(cx - 44, 300, 18, 8); g.fillRect(cx + 26, 300, 18, 8); g.fillStyle = '#0a0a0a'; g.fillRect(cx - 52, 312, 18, 14); g.fillRect(cx + 34, 312, 18, 14);
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(14, 12, 150, 56); g.fillStyle = '#f3efe4'; g.font = '700 34px "Barlow Condensed", sans-serif'; g.fillText('212 KM/H', 24, 52);
    g.font = '500 13px "IBM Plex Mono", monospace'; g.fillStyle = '#f0b400'; g.fillText('LAP 2/3  P1', 24, 28);
    game.t.needsUpdate = true;
  }
  drawCode(0); drawGame(0.8);
  let frame = 0;

  function update(dt, t, extra = {}) {
    if (++frame % 4 === 0) drawCode(t);
    yanko.forEach((m, i) => m.color.setHSL((t * 0.18 + i * 0.16) % 1, 1, 0.62));
    const h = (t * 0.12) % 1;
    rgbMats.forEach((m, i) => m.emissive.setHSL((h + i * 0.13) % 1, 1, 0.55));
    pink.intensity = 3.2 + Math.sin(t * 2) * 0.6;
    vinyl.rotation.y -= dt * (extra.music ? 3.5 : 0.4);
    const pulse = extra.pulse || 0;
    for (const s of [sL, sR]) s.cone.scale.setScalar(1 + pulse * 0.4);
    animated.forEach((f) => f(dt, t));
    for (const hm of hotMats) {
      const target = extra.hover === hm.id ? 1 : 0;
      hm.amt = (hm.amt || 0) + (target - (hm.amt || 0)) * 0.2;
      if (hm.mat.emissive && !hm.mat.isMeshBasicMaterial) { hm.mat.emissive.set('#ff8a3a'); hm.mat.emissiveIntensity = hm.amt * 0.18; }
      else hm.mat.color.copy(hm.base).multiplyScalar(1 + hm.amt * 0.45);
    }
  }

  return { scene, pickables, update, photoMeshes: trips.children.flatMap((g) => g.children.filter((m) => m.userData.photo !== undefined)) };
}
