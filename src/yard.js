import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { sideTexture, endTexture, groundTexture, ribTexture, barrierTexture, hash } from './textures.js';
import { isoCode } from './iso.js';

// dimensions d'un conteneur ISO (mètres)
const W = 2.44, H = 2.59, L20 = 6.1, L40 = 12.2, GAP = 0.36;
const CRANE_H = 15, RAIL_Z0 = -17, RAIL_Z1 = 23, LIFT = 3.4, QUAY_Z = -24;
const FILLERS = ['#8a3b2a', '#2e5b86', '#3a7a58', '#b9812a', '#6f7c84', '#7d2c3b', '#caa23a', '#4b6d8c', '#a35a2a', '#556b5e', '#c9c4b6'];

export const ZONES = {
  stack: { center: [-27, 0, 3], dist: 40 },
  parcours: { center: [-4, 0, -4], dist: 26 },
  projets: { center: [22, 0, 2], dist: 34 },
  formation: { center: [-4, 0, 10.5], dist: 28 },
  gate: { center: [21, 0, 15.5], dist: 20 },
  bureau: { center: [37, 2, 17], dist: 17 },
};
const OVERVIEW = { target: [-3, 0, 4], offset: [12, 44, 78] };

export function createYard({ canvas, items, tagEls, reduced, onHover, onSelect, onDesk, onDeskTab }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  const small = () => innerWidth < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio, small() ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const haze = new THREE.Color('#dcd5c3');
  scene.background = haze;
  scene.fog = new THREE.Fog(haze, 95, 250);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 600);
  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, {
    enableDamping: true, dampingFactor: 0.07, rotateSpeed: 0.6, zoomSpeed: 0.8,
    minDistance: 7, maxDistance: 95, minPolarAngle: 0.15, maxPolarAngle: 1.38, screenSpacePanning: false,
  });
  // départ : vue lointaine, avant l'entrée dans le terminal
  camera.position.set(-3 + 30, 90, 4 + 120);
  controls.target.set(...OVERVIEW.target);

  // ---------- lumière
  scene.add(new THREE.HemisphereLight('#fff3dd', '#8a8f94', 1.15));
  const sun = new THREE.DirectionalLight('#fff0d2', 2.8);
  sun.position.set(38, 60, 30);
  sun.castShadow = true;
  const sh = sun.shadow;
  sh.mapSize.set(small() ? 1024 : 2048, small() ? 1024 : 2048);
  Object.assign(sh.camera, { left: -62, right: 62, top: 50, bottom: -50, near: 5, far: 160 });
  sh.bias = -0.0004; sh.normalBias = 0.06;
  scene.add(sun);

  // ---------- sol, quai, eau
  const gtex = groundTexture();
  gtex.repeat.set(10, 5);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 78), new THREE.MeshStandardMaterial({ map: gtex, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, 15);
  ground.receiveShadow = true;
  scene.add(ground);

  const water = new THREE.Mesh(new THREE.PlaneGeometry(600, 160), new THREE.MeshStandardMaterial({ color: '#5a7f88', roughness: 0.3, metalness: 0.15 }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.7, QUAY_Z - 80);
  scene.add(water);
  const quay = new THREE.Mesh(new THREE.BoxGeometry(160, 1.4, 1.2), new THREE.MeshStandardMaterial({ color: '#8d887b', roughness: 1 }));
  quay.position.set(0, -0.7, QUAY_Z - 0.4);
  scene.add(quay);
  const bollardM = new THREE.MeshStandardMaterial({ color: '#2b2b27' });
  for (let x = -70; x <= 70; x += 14) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.8, 12), bollardM);
    b.position.set(x, 0.4, QUAY_Z + 0.4); b.castShadow = true; scene.add(b);
  }

  const lineM = new THREE.MeshStandardMaterial({ color: '#f0b400', roughness: 0.9 });
  const outline = (cx, cz, w, d) => {
    const t = 0.18;
    [[0, -d / 2, w, t], [0, d / 2, w, t], [-w / 2, 0, t, d], [w / 2, 0, t, d]].forEach(([ox, oz, sw, sd]) => {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(sw, sd), lineM);
      p.rotation.x = -Math.PI / 2; p.position.set(cx + ox, 0.02, cz + oz); p.receiveShadow = true; scene.add(p);
    });
  };
  outline(-27, 3, 15.6, 20.6);
  outline(-4, -4, 16, 8);
  outline(22, 2.4, 14, 11.4);
  outline(-4, 10.5, 20, 4.4);
  outline(21, 15.5, 8, 4.4);
  outline(37, 18, 10, 8);

  // ---------- conteneurs
  const sideCache = new Map(), endCache = new Map();
  const pickables = [];
  const byId = {};
  const isLight = (hex) => { const c = new THREE.Color(hex); return c.r * 0.3 + c.g * 0.59 + c.b * 0.11 > 0.62; };
  const mulberry = (() => { let s = 99; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();

  function container({ x, level, z, rot = 0, item = null, color }) {
    const size = item?.size === 40 ? 40 : 20;
    const L = size === 40 ? L40 : L20;
    const col = item ? item.color : color;
    const ink = item?.ink || (isLight(col) ? '#16150f' : '#f3efe4');
    const seed = item ? hash(item.id) : hash(col + size);
    const iso = isoCode('YCT', seed);
    const sizeCode = size === 40 ? '42G1' : '22G1';

    let side, endDoor, endBlank;
    if (item) {
      side = sideTexture({ color: col, ink, label: item.title, code: iso.text, sizeCode, w: size === 40 ? 1024 : 768, h: size === 40 ? 230 : 330, ribStep: size === 40 ? 8 : 10, office: item.office, seed });
      endDoor = endTexture({ color: col, ink, code: iso.text, door: true, seed });
      endBlank = endTexture({ color: col, ink, code: '', door: false, seed: seed + 1 });
    } else {
      const k = col + size;
      if (!sideCache.has(k)) {
        sideCache.set(k, sideTexture({ color: col, ink, label: '', code: iso.text, sizeCode, w: size === 40 ? 1024 : 768, h: size === 40 ? 230 : 330, seed }));
        endCache.set(k, [endTexture({ color: col, ink, code: iso.text, door: true, seed }), endTexture({ color: col, ink, door: false, seed: seed + 1 })]);
      }
      side = sideCache.get(k); [endDoor, endBlank] = endCache.get(k);
    }
    const m = (map) => new THREE.MeshStandardMaterial({ map, roughness: 0.62, metalness: 0.12 });
    const plain = new THREE.MeshStandardMaterial({ color: new THREE.Color(col).multiplyScalar(0.7), roughness: 0.8 });
    const mats = [m(endBlank), m(endDoor), plain, plain.clone(), m(side), m(side)];
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(L, H, W), mats);
    const y = (level - 0.5) * H;
    mesh.position.set(x, y, z);
    mesh.rotation.y = rot;
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData = { baseY: y, baseX: x, baseZ: z, rot, size, hover: 0, mats, item };
    scene.add(mesh);
    if (item) { item.mesh = mesh; item.iso = iso.text; item.sizeCode = sizeCode; byId[item.id] = item; pickables.push(mesh); }
    return mesh;
  }
  const filler = () => FILLERS[Math.floor(mulberry() * FILLERS.length)];
  const stackAt = (item, x, z, level, rot = 0) => {
    for (let l = 1; l < level; l++) container({ x, z, level: l, rot, color: filler() });
    container({ x, z, level, rot, item });
  };

  const zoneItems = (k) => items.filter((i) => i.zone === k);
  // A : 5 colonnes x 3 rangées, étagées vers le fond pour que tout soit visible
  zoneItems('stack').forEach((it, i) => {
    const col = i % 5, row = Math.floor(i / 5);
    stackAt(it, -27 + (col - 2) * (W + GAP), 3 + (row - 1) * (L20 + GAP), 3 - row, Math.PI / 2);
  });
  // B : un étage de plus à chaque étape de carrière
  const heights = [1, 1, 2, 2, 3];
  zoneItems('parcours').forEach((it, i) => stackAt(it, -4 + (i - 2) * (W + GAP), -4, heights[i], Math.PI / 2));
  // C : 40 pieds
  zoneItems('projets').forEach((it, i) => stackAt(it, 22 + (i % 2 ? 0.8 : -0.8), 2.4 + (i - 1) * (W + GAP + 0.1), 1, 0));
  // D : formation
  zoneItems('formation').forEach((it, i) => stackAt(it, -4 + (i - 1) * (L20 + GAP), 10.5, 1, 0));
  // Gate : conteneur-bureau
  zoneItems('gate').forEach((it) => stackAt(it, 21, 15.5, 1, 0));

  // barrière de poste de garde
  const barrier = new THREE.Group();
  const btex = barrierTexture(); btex.repeat.set(3, 1);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(6, 0.22, 0.22), new THREE.MeshStandardMaterial({ map: btex }));
  arm.position.set(3, 0, 0); arm.castShadow = true;
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.6), new THREE.MeshStandardMaterial({ color: '#f0b400' }));
  post.position.y = 0.8; post.castShadow = true;
  const pivot = new THREE.Group(); pivot.position.y = 1.35; pivot.add(arm); pivot.rotation.z = 0.0;
  barrier.add(post, pivot); barrier.position.set(11.8, 0, 19.5);
  scene.add(barrier);

  // ---------- décor : cours voisines et navire (instances)
  const ribTex = ribTexture();
  const instanced = (list, geo) => {
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ map: ribTex, roughness: 0.7 }), list.length);
    const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), c = new THREE.Color();
    list.forEach((o, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), o.rot || 0);
      mt.compose(new THREE.Vector3(o.x, o.y, o.z), q, s);
      mesh.setMatrixAt(i, mt);
      mesh.setColorAt(i, c.set(o.color));
    });
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
  };
  const decor = [];
  const block = (x0, z0, cols, rows, dx, dz, rot) => {
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const hgt = 1 + Math.floor(mulberry() * 3);
      for (let l = 1; l <= hgt; l++) decor.push({ x: x0 + c * dx, z: z0 + r * dz, y: (l - 0.5) * H, rot, color: filler() });
    }
  };
  block(-46, -7, 3, 4, W + GAP, L20 + GAP, Math.PI / 2);
  block(33, -9, 4, 4, W + GAP, L20 + GAP, Math.PI / 2);
  block(-44, 22, 6, 1, L20 + GAP, 0, 0);
  instanced(decor, new THREE.BoxGeometry(L20, H, W));

  // navire à quai
  const ship = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(96, 8, 18), new THREE.MeshStandardMaterial({ color: '#25333b', roughness: 0.8 }));
  hull.position.y = 1;
  const keel = new THREE.Mesh(new THREE.BoxGeometry(96.4, 3, 18.4), new THREE.MeshStandardMaterial({ color: '#8a2f25', roughness: 0.8 }));
  keel.position.y = -2.4;
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(10, 18, 15), new THREE.MeshStandardMaterial({ color: '#e7e3d8', roughness: 0.8 }));
  bridge.position.set(-36, 14, 0);
  const funnel = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 5), new THREE.MeshStandardMaterial({ color: '#d6361b' }));
  funnel.position.set(-36, 26, 0);
  [hull, keel, bridge, funnel].forEach((m) => { m.castShadow = true; ship.add(m); });
  ship.position.set(14, 0, QUAY_Z - 14);
  scene.add(ship);
  const deck = [];
  for (let c = 0; c < 12; c++) for (let r = 0; r < 3; r++) {
    const hgt = 1 + Math.floor(mulberry() * 4);
    for (let l = 1; l <= hgt; l++) deck.push({ x: 14 - 28 + c * (L20 + 0.3), z: QUAY_Z - 14 + (r - 1) * (W + 0.25), y: 5 + (l - 0.5) * H, color: filler() });
  }
  instanced(deck, new THREE.BoxGeometry(L20, H, W));

  // mâts d'éclairage
  const poleM = new THREE.MeshStandardMaterial({ color: '#4a4a44', roughness: 0.7 });
  const lampM = new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#fff0b0', emissiveIntensity: 1.6 });
  [-52, -30, -8, 14, 36, 56].forEach((x) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 26, 8), poleM);
    p.position.set(x, 13, -20.5); p.castShadow = true; scene.add(p);
    const l = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.4, 1.4), lampM);
    l.position.set(x, 26.2, -20.2); scene.add(l);
  });


  // ---------- bureau (cabine avec poste de travail)
  const OX = 37, OZ = 18;
  const office = new THREE.Group(); office.position.set(OX, 0, OZ); scene.add(office);
  const sm = (c, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const BX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const put = (geo, mat, x, y, z, cast = true) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; office.add(o); return o; };
  put(BX(8, 0.2, 6), sm('#8d887b', 1), 0, 0.1, 0);
  put(BX(7.8, 0.04, 5.8), sm('#5a4a3a', 1), 0, 0.22, 0, false);
  put(BX(8, 3.8, 0.2), sm('#2b2622', 0.9), 0, 2.1, -2.9);
  put(BX(0.2, 3.8, 6), sm('#d9d5c8', 0.7, 0.2), -3.9, 2.1, 0);
  put(BX(0.2, 3.8, 6), sm('#d9d5c8', 0.7, 0.2), 3.9, 2.1, 0);
  put(BX(8.4, 0.25, 6.4), sm('#e5561b', 0.6, 0.2), 0, 4.1, 0.1);
  put(BX(7.6, 0.07, 0.07), new THREE.MeshStandardMaterial({ color: '#ff8a3a', emissive: '#ff7a2a', emissiveIntensity: 2.2 }), 0, 3.85, -2.78, false);

  // enseigne sur le toit
  const signC = document.createElement('canvas'); signC.width = 640; signC.height = 160;
  { const g = signC.getContext('2d');
    g.fillStyle = '#f0b400'; g.fillRect(0, 0, 640, 160);
    g.fillStyle = '#16150f'; for (let i = -160; i < 640; i += 48) { g.beginPath(); g.moveTo(i, 160); g.lineTo(i + 24, 160); g.lineTo(i + 64, 0); g.lineTo(i + 40, 0); g.fill(); }
    g.fillStyle = '#16150f'; g.fillRect(70, 26, 500, 108);
    g.fillStyle = '#f3efe4'; g.font = '700 92px "Barlow Condensed", sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText('MON BUREAU', 320, 84); }
  const signTex = new THREE.CanvasTexture(signC); signTex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.25), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.7 }));
  sign.position.set(0, 5.2, 0.4); office.add(sign);
  for (const px of [-2, 2]) put(BX(0.12, 1, 0.12), sm('#2b2b27'), px, 4.7, 0.35, false);

  // bureau, écran, clavier, souris
  const wood = sm('#a9825a', 0.7);
  put(BX(4.6, 0.1, 1.5), wood, 0, 1.1, -2.0);
  for (const [lx, lz] of [[-2.2, -2.6], [2.2, -2.6], [-2.2, -1.4], [2.2, -1.4]]) put(BX(0.1, 1.05, 0.1), sm('#2b2b27', 0.6, 0.4), lx, 0.62, lz);
  put(BX(0.7, 0.04, 0.45), sm('#1d1d1a', 0.5, 0.4), 0, 1.17, -2.2);
  put(BX(0.1, 0.5, 0.1), sm('#1d1d1a', 0.5, 0.4), 0, 1.4, -2.3);
  put(BX(2.3, 1.3, 0.08), sm('#16150f', 0.4, 0.3), 0, 2.2, -2.3);
  const SW = 768, SH = 480;
  const sc = document.createElement('canvas'); sc.width = SW; sc.height = SH;
  const sg = sc.getContext('2d');
  const screenTex = new THREE.CanvasTexture(sc); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 8;
  const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.14, 1.14), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  screenMesh.position.set(0, 2.2, -2.255); office.add(screenMesh);
  put(BX(1.4, 0.05, 0.45), sm('#2b2b27', 0.5, 0.3), -0.1, 1.17, -1.5);
  put(BX(0.95, 0.02, 0.75), sm('#e5561b', 0.9), 1.3, 1.16, -1.55, false);
  const mouse = put(BX(0.2, 0.07, 0.32), sm('#f3efe4', 0.4), 1.3, 1.21, -1.55);
  // casque
  put(new THREE.CylinderGeometry(0.15, 0.2, 0.05, 16), sm('#2b2b27'), -1.8, 1.17, -1.6);
  put(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), sm('#2b2b27'), -1.8, 1.45, -1.6);
  const band = put(new THREE.TorusGeometry(0.26, 0.04, 8, 20, Math.PI), sm('#16150f', 0.5), -1.8, 1.72, -1.6); band.castShadow = true;
  for (const sx of [-0.26, 0.26]) put(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 16), sm('#e5561b', 0.5), -1.8 + sx, 1.72, -1.6).rotation.z = Math.PI / 2;
  // manette
  put(BX(0.52, 0.08, 0.3), sm('#3b3b36', 0.5), -0.95, 1.19, -1.0);
  for (const gx of [-0.15, 0.15]) put(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 12), sm('#16150f'), -0.95 + gx, 1.25, -1.0);
  put(BX(0.2, 0.08, 0.08), sm('#16150f'), -1.08, 1.255, -0.99, false);
  // enceintes
  for (const ex of [-1.55, 1.55]) {
    put(BX(0.5, 0.9, 0.5), sm('#1d1d1a', 0.7), ex, 1.6, -2.3);
    const w = put(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 20), sm('#3b3b36', 0.5), ex, 1.5, -2.04, false); w.rotation.x = Math.PI / 2;
    const t = put(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 12), sm('#3b3b36', 0.5), ex, 1.85, -2.04, false); t.rotation.x = Math.PI / 2;
  }
  // piles de mangas et tasse
  [['#c9382a', 0], ['#2e5b86', 0.07], ['#f0b400', 0.14]].forEach(([c, dy], i) => {
    const b = put(BX(0.55, 0.07, 0.4), sm(c, 0.8), 1.95, 1.19 + dy, -2.2); b.rotation.y = (i - 1) * 0.18;
  });
  put(new THREE.CylinderGeometry(0.11, 0.1, 0.2, 14), sm('#f3efe4', 0.5), 1.0, 1.25, -1.0);
  // étagère de mangas au mur
  put(BX(2.4, 0.06, 0.4), wood, 2.4, 3.0, -2.62);
  ['#c9382a', '#2e5b86', '#f0b400', '#3a7a58', '#f3efe4', '#7d2c3b', '#e5561b', '#263f63', '#c9382a', '#3a7a58'].forEach((c, i) => {
    const h = 0.55 + ((i * 37) % 5) * 0.04;
    put(BX(0.16, h, 0.3), sm(c, 0.8), 1.4 + i * 0.2, 3.03 + h / 2, -2.62, false);
  });
  // affiches
  const posterTex = (bg, fg, label) => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 360; const g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, 256, 360);
    g.fillStyle = fg; for (let y = 0; y < 360; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < 256; x += 12) { const r = 1 + 4.5 * Math.max(0, Math.sin((y / 360) * Math.PI)) * (0.5 + 0.5 * Math.cos(x / 40)); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.fillStyle = '#16150f'; g.fillRect(20, 268, 216, 72);
    g.fillStyle = '#f3efe4'; g.font = '700 54px "Barlow Condensed", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 128, 306);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const poster = (map, x) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.83), new THREE.MeshStandardMaterial({ map, roughness: 0.9 })); m.position.set(x, 2.5, -2.78); office.add(m); };
  poster(posterTex('#f0b400', '#16150f', 'MANGA'), -2.8);
  poster(posterTex('#e5561b', '#16150f', 'PLAYER 1'), -1.4);
  // fauteuil
  put(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16), sm('#16150f', 0.5, 0.4), -1.4, 0.28, -0.6);
  put(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8), sm('#16150f', 0.5, 0.4), -1.4, 0.55, -0.6);
  put(BX(1, 0.14, 1), sm('#1d1d1a', 0.8), -1.4, 0.9, -0.6);
  put(BX(1, 1.2, 0.14), sm('#1d1d1a', 0.8), -1.4, 1.55, -0.05);
  put(BX(0.5, 0.5, 0.16), sm('#e5561b', 0.8), -1.4, 1.8, -0.05, false);
  // lumières de la pièce
  const warm = new THREE.PointLight('#ffb070', 11, 9); warm.position.set(0, 2.5, 0.8); office.add(warm);
  const glow = new THREE.PointLight('#9fd6ff', 7, 6); glow.position.set(0, 2.1, -1.2); office.add(glow);

  // écran : fond d'écran du terminal + 3 icônes cliquables
  const ICONS = [{ id: 'manga', x: 40, y: 56 }, { id: 'jeux', x: 40, y: 190 }, { id: 'musique', x: 40, y: 324 }];
  const ICON_W = 130, ICON_H = 118;
  const skyline = [];
  { let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; for (let x = 150; x < SW; x += 30) skyline.push([x, 2 + Math.floor(r() * 4)]); }
  let deskTab = 0, screenCursor = null, screenT = 0;
  const rr = (x, y, w, h, r) => { sg.beginPath(); sg.roundRect(x, y, w, h, r); };
  function drawScreen() {
    const g = sg.createLinearGradient(0, 0, 0, SH);
    g.addColorStop(0, '#26221e'); g.addColorStop(0.6, '#7a3d22'); g.addColorStop(1, '#e5561b');
    sg.fillStyle = g; sg.fillRect(0, 0, SW, SH);
    sg.fillStyle = '#f0b400'; sg.beginPath(); sg.arc(560, 300, 60, 0, 7); sg.fill();
    sg.fillStyle = '#16150f';
    skyline.forEach(([x, n]) => { for (let l = 0; l < n; l++) sg.fillRect(x, SH - 36 - (l + 1) * 22, 26, 20); });
    sg.fillRect(612, 150, 6, SH - 186); sg.fillRect(560, 150, 130, 8); sg.fillRect(640, 158, 3, 70); sg.fillRect(628, 226, 28, 12);
    ICONS.forEach((ic, i) => {
      const on = i === deskTab;
      sg.fillStyle = on ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.18)'; rr(ic.x - 10, ic.y - 8, ICON_W, ICON_H, 6); sg.fill();
      if (on) { sg.strokeStyle = '#ff5b14'; sg.lineWidth = 3; rr(ic.x - 10, ic.y - 8, ICON_W, ICON_H, 6); sg.stroke(); }
      const cx = ic.x + 55, cy = ic.y + 40;
      sg.fillStyle = '#f3efe4'; sg.strokeStyle = '#16150f'; sg.lineWidth = 3;
      if (ic.id === 'manga') { sg.fillRect(cx - 28, cy - 34, 56, 70); sg.fillStyle = '#c9382a'; sg.fillRect(cx - 28, cy - 34, 10, 70); sg.fillStyle = '#16150f'; sg.fillRect(cx - 12, cy - 22, 32, 8); sg.fillRect(cx - 12, cy - 8, 24, 5); }
      if (ic.id === 'jeux') { rr(cx - 38, cy - 18, 76, 40, 18); sg.fill(); sg.stroke(); sg.fillStyle = '#16150f'; sg.fillRect(cx - 26, cy - 3, 16, 5); sg.fillRect(cx - 21, cy - 8, 6, 15); sg.beginPath(); sg.arc(cx + 16, cy - 2, 5, 0, 7); sg.arc(cx + 27, cy + 6, 5, 0, 7); sg.fill(); }
      if (ic.id === 'musique') { sg.lineWidth = 7; sg.strokeStyle = '#f3efe4'; sg.beginPath(); sg.arc(cx, cy + 4, 28, Math.PI, 0); sg.stroke(); sg.fillStyle = '#f3efe4'; rr(cx - 38, cy + 2, 16, 30, 5); sg.fill(); rr(cx + 22, cy + 2, 16, 30, 5); sg.fill(); }
      sg.fillStyle = '#f3efe4'; sg.font = '500 17px "IBM Plex Mono", monospace'; sg.textAlign = 'center'; sg.textBaseline = 'alphabetic';
      sg.fillText(ic.id, ic.x + 55, ic.y + 96);
    });
    // égaliseur
    sg.fillStyle = 'rgba(0,0,0,.45)'; sg.fillRect(SW - 250, 24, 226, 110);
    sg.fillStyle = '#f0b400';
    const amp = deskTab === 2 ? 1 : 0.28;
    for (let i = 0; i < 14; i++) { const h = (0.25 + 0.75 * Math.abs(Math.sin(screenT * 3 + i * 0.7) * Math.cos(screenT * 1.7 + i))) * 78 * amp + 4; sg.fillRect(SW - 238 + i * 15.5, 120 - h, 11, h); }
    // barre des tâches
    sg.fillStyle = '#16150f'; sg.fillRect(0, SH - 36, SW, 36);
    sg.fillStyle = '#ff5b14'; sg.fillRect(8, SH - 30, 24, 24);
    sg.fillStyle = '#f3efe4'; sg.font = '500 16px "IBM Plex Mono", monospace'; sg.textAlign = 'left'; sg.fillText('mon-bureau', 42, SH - 12);
    const d = new Date(); sg.textAlign = 'right'; sg.fillText(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'), SW - 12, SH - 12);
    if (screenCursor) { const { x, y } = screenCursor; sg.fillStyle = '#fff'; sg.strokeStyle = '#16150f'; sg.lineWidth = 2; sg.beginPath(); sg.moveTo(x, y); sg.lineTo(x, y + 22); sg.lineTo(x + 6, y + 17); sg.lineTo(x + 11, y + 27); sg.lineTo(x + 15, y + 25); sg.lineTo(x + 10, y + 16); sg.lineTo(x + 17, y + 16); sg.closePath(); sg.fill(); sg.stroke(); }
    screenTex.needsUpdate = true;
  }
  drawScreen();

  // ---------- portique (RMG) : suit la souris, saisit les conteneurs
  const yellowM = new THREE.MeshStandardMaterial({ color: '#f0b400', roughness: 0.6, metalness: 0.2 });
  const darkM = new THREE.MeshStandardMaterial({ color: '#2b2b27', roughness: 0.7, metalness: 0.3 });
  const crane = new THREE.Group();
  scene.add(crane);
  const box = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.castShadow = true; crane.add(m); return m;
  };
  for (const sx of [-3.6, 3.6]) {
    for (const z of [RAIL_Z0, RAIL_Z1]) {
      box(0.9, CRANE_H, 0.9, yellowM, sx, CRANE_H / 2, z);
      box(1.8, 0.5, 3.2, darkM, sx, 0.25, z);
    }
    box(0.9, 1.4, RAIL_Z1 - RAIL_Z0 + 1, yellowM, sx, CRANE_H, (RAIL_Z0 + RAIL_Z1) / 2);
  }
  for (const z of [RAIL_Z0, RAIL_Z1]) box(8.1, 1, 1, yellowM, 0, CRANE_H + 0.2, z);
  const trolley = new THREE.Group(); crane.add(trolley);
  const tb = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.7, 2.4), darkM); tb.castShadow = true; trolley.add(tb);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), yellowM); cab.position.set(2.2, -1.0, 0); trolley.add(cab);
  const spreader = new THREE.Group(); crane.add(spreader);
  const sp = new THREE.Mesh(new THREE.BoxGeometry(L20, 0.36, W + 0.1), yellowM); sp.castShadow = true; spreader.add(sp);
  for (const [px, pz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const tw = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), darkM); tw.position.set(px * (L20 / 2 - 0.25), -0.3, pz * (W / 2 - 0.1)); spreader.add(tw);
  }
  const ropeM = new THREE.MeshStandardMaterial({ color: '#1d1d1a' });
  const ropes = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([ox, oz]) => {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1, 0.07), ropeM); r.userData = { ox: ox * 1.1, oz: oz * 0.6 }; crane.add(r); return r;
  });

  const st = { gx: 36, tz: 8, sy: 9, rot: 0, sx: 1, mode: 'park', tgx: 36, ttz: 8 };
  let held = null, heldItem = null, selected = null, busy = false, queued = null, deskOpen = false;

  // ---------- caméra
  const V = (a) => new THREE.Vector3(...a);
  function viewFor(center, dist, shift = true) {
    const dir = new THREE.Vector3(0.5, 0.52, 1).normalize();
    const aspect = innerWidth / innerHeight;
    if (aspect < 1) dist *= 1.5;
    const pos = center.clone().addScaledVector(dir, dist);
    const target = center.clone();
    if (shift) {
      const fwd = dir.clone().negate();
      const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
      const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
      const off = small() ? up.multiplyScalar(-dist * 0.2) : right.multiplyScalar(dist * 0.26);
      pos.add(off); target.add(off);
    }
    return { pos, target };
  }
  function flyTo({ pos, target }, dur = 2.2) {
    gsap.killTweensOf(camera.position); gsap.killTweensOf(controls.target);
    controls.enabled = false;
    gsap.to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: dur, ease: 'power3.inOut' });
    gsap.to(controls.target, { x: target.x, y: target.y, z: target.z, duration: dur, ease: 'power3.inOut', onComplete: () => (controls.enabled = true) });
  }
  const overviewView = () => {
    const d = V(OVERVIEW.offset); if (innerWidth / innerHeight < 1) d.multiplyScalar(1.7);
    const t = V(OVERVIEW.target);
    return { pos: t.clone().add(d), target: t };
  };
  const overview = (dur = 2.6) => flyTo(overviewView(), dur);
  // vol en arc : la caméra monte, traverse la map et redescend
  let arcTween = null;
  function flyArc({ pos, target }, dur = 3.6, arc = 14) {
    gsap.killTweensOf(camera.position); gsap.killTweensOf(controls.target); arcTween?.kill();
    controls.enabled = false;
    const p0 = camera.position.clone(), t0 = controls.target.clone(), o = { p: 0 };
    arcTween = gsap.to(o, { p: 1, duration: dur, ease: 'power2.inOut', onUpdate: () => {
      camera.position.lerpVectors(p0, pos, o.p).y += Math.sin(o.p * Math.PI) * arc;
      controls.target.lerpVectors(t0, target, o.p);
    }, onComplete: () => (controls.enabled = true) });
  }
  const flyZone = (key, dur = 2) => {
    const z = ZONES[key]; flyTo(viewFor(V(z.center).add(new THREE.Vector3(0, 1.5, 0)), z.dist, false), dur);
  };
  const flyItem = (item) => {
    const m = item.mesh;
    flyTo(viewFor(new THREE.Vector3(m.position.x, m.userData.baseY + LIFT, m.position.z), m.userData.size === 40 ? 27 : 17), 2.4);
  };

  // ---------- séquences du portique
  const T = (v, d) => ({ duration: Math.max(0.5, d), ease: 'power2.inOut', ...v });
  function grab(item) {
    const m = item.mesh, u = m.userData;
    const top = u.baseY + H / 2;
    const dist = Math.hypot(u.baseX - st.gx, u.baseZ - st.tz);
    const tl = gsap.timeline();
    tl.to(st, T({ sy: Math.max(st.sy, top + LIFT + 0.8) }, 0.7))
      .to(st, T({ gx: u.baseX, tz: u.baseZ, rot: u.rot, sx: u.size === 40 ? 2 : 1 }, dist / 16))
      .to(st, T({ sy: top + 0.23 }, 1))
      .call(() => { held = m; heldItem = item; })
      .to(st, T({ sy: top + 0.23 + LIFT }, 1.1));
    return tl;
  }
  function release() {
    const m = held, u = m.userData;
    const tl = gsap.timeline();
    tl.to(st, T({ sy: u.baseY + H / 2 + 0.23 }, 1.1))
      .call(() => { m.position.set(u.baseX, u.baseY, u.baseZ); held = null; heldItem = null; })
      .to(st, T({ sy: 9 }, 0.9));
    return tl;
  }
  function run(fn) { if (busy) queued = fn; else fn(); }
  function sequence(build) {
    busy = true; st.mode = 'busy';
    const tl = gsap.timeline({ onComplete: () => { busy = false; if (!selected) { st.mode = 'follow'; st.tgx = st.gx; st.ttz = st.tz; } if (queued) { const q = queued; queued = null; q(); } } });
    build(tl);
  }
  function select(id) {
    run(() => {
      const item = byId[id]; if (!item || item === selected) return;
      const prev = held;
      if (deskOpen) { deskOpen = false; onDesk(false); }
      selected = item;
      sequence((tl) => { if (prev) tl.add(release()); tl.add(grab(item)); });
      flyItem(item); onSelect(item);
    });
  }
  function close() {
    run(() => {
      if (!selected) return;
      const zone = selected.zone; selected = null; onSelect(null);
      sequence((tl) => { if (held) tl.add(release()); });
      flyZone(zone, 2);
    });
  }


  // vue de face, à hauteur d'écran, décalée pour laisser la place à la fenêtre
  function deskView() {
    const target = new THREE.Vector3(OX, 2.15, OZ - 2.2);
    const dir = new THREE.Vector3(0.16, 0.2, 1).normalize();
    let dist = innerWidth / innerHeight < 1 ? 15 : 8.6;
    const pos = target.clone().addScaledVector(dir, dist);
    const right = new THREE.Vector3().crossVectors(dir.clone().negate(), camera.up).normalize();
    const off = small() ? new THREE.Vector3(0, -dist * 0.12, 0) : right.multiplyScalar(dist * 0.2);
    return { pos: pos.add(off), target: target.add(off) };
  }
  function openDesk() {
    run(() => {
      if (deskOpen) return;
      if (selected) { selected = null; onSelect(null); sequence((tl) => { if (held) tl.add(release()); }); }
      deskOpen = true; st.tgx = -20; st.ttz = 4;
      onDesk(true);
      flyArc(deskView(), 3.8, 16);
    });
  }
  function closeDesk() {
    if (!deskOpen) return;
    deskOpen = false; screenCursor = null; drawScreen(); onDesk(false);
    flyArc(overviewView(), 3.4, 14);
  }
  function setDeskTab(i) { deskTab = i; drawScreen(); }

  // ---------- pointeur : survol, clic, pilotage de la grue
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  let hovered = null, dirty = false, down = null, dragging = false, lastEvt = null;
  canvas.addEventListener('pointermove', (e) => {
    ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    lastEvt = e; dirty = true;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) dragging = true;
  });
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; dragging = false; canvas.style.cursor = 'grabbing'; });
  addEventListener('pointerup', (e) => {
    if (down && !dragging && e.target === canvas) {
      ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      ray.setFromCamera(ptr, camera);
      const h = ray.intersectObjects(pickables, false)[0];
      if (h) select(h.object.userData.item.id);
      else if (deskOpen) {
        const sh = ray.intersectObject(screenMesh, false)[0];
        if (sh) {
          const cx = sh.uv.x * SW, cy = (1 - sh.uv.y) * SH;
          const i = ICONS.findIndex((ic) => cx >= ic.x - 10 && cx <= ic.x - 10 + ICON_W && cy >= ic.y - 8 && cy <= ic.y - 8 + ICON_H);
          if (i >= 0) { setDeskTab(i); onDeskTab(i); }
        }
      }
    }
    down = null; dragging = false; canvas.style.cursor = hovered ? 'pointer' : 'grab';
  });
  canvas.addEventListener('pointerleave', () => { hovered = null; dirty = false; onHover(null, 0, 0); });
  canvas.style.cursor = 'grab';

  // ---------- étiquettes de zone
  const tagList = Object.entries(tagEls).map(([key, el]) => ({ key, el, p: V(ZONES[key].center).add(new THREE.Vector3(0, key === 'stack' ? 12 : key === 'bureau' ? 6.5 : 9, 0)) }));
  const tmp = new THREE.Vector3();

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  // ---------- boucle
  let last = performance.now(), deskFrame = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const k = 1 - Math.exp(-dt * 3.2);

    if (dirty && !dragging && lastEvt) {
      dirty = false;
      ray.setFromCamera(ptr, camera);
      if (!deskOpen && st.mode === 'follow' && ray.ray.intersectPlane(plane, hit)) {
        st.tgx = THREE.MathUtils.clamp(hit.x, -44, 44);
        st.ttz = THREE.MathUtils.clamp(hit.z, RAIL_Z0 + 2, RAIL_Z1 - 2);
      }
      const h = lastEvt.pointerType === 'mouse' || lastEvt.pointerType === 'pen' ? ray.intersectObjects(pickables, false)[0] : null;
      const m = h ? h.object : null;
      if (m !== hovered) {
        hovered = m;
        canvas.style.cursor = m ? 'pointer' : 'grab';
      }
      onHover(hovered ? hovered.userData.item : null, lastEvt.clientX, lastEvt.clientY);
      if (deskOpen) {
        const sh = ray.intersectObject(screenMesh, false)[0];
        screenCursor = sh ? { x: sh.uv.x * SW, y: (1 - sh.uv.y) * SH } : null;
        if (sh && ICONS.some((ic) => sh.uv.x * SW >= ic.x - 10 && sh.uv.x * SW <= ic.x + ICON_W - 10 && (1 - sh.uv.y) * SH >= ic.y - 8 && (1 - sh.uv.y) * SH <= ic.y - 8 + ICON_H)) canvas.style.cursor = 'pointer';
      }
    }

    if (st.mode === 'follow') {
      st.gx += (st.tgx - st.gx) * k; st.tz += (st.ttz - st.tz) * k;
      st.sy += (9 - st.sy) * k; st.rot += (0 - st.rot) * k; st.sx += (1 - st.sx) * k;
    }
    crane.position.x = st.gx;
    trolley.position.set(0, CRANE_H - 0.9, st.tz);
    spreader.position.set(0, st.sy, st.tz); spreader.rotation.y = st.rot; spreader.scale.x = st.sx;
    const topY = CRANE_H - 1.25, botY = st.sy + 0.18;
    for (const r of ropes) { r.position.set(r.userData.ox, (topY + botY) / 2, st.tz + r.userData.oz); r.scale.y = Math.max(0.01, topY - botY); }
    if (held) held.position.set(st.gx, st.sy - 0.23 - H / 2, st.tz);

    for (const m of pickables) {
      const t = m === hovered || m === held ? 0.32 : 0;
      m.userData.hover += (t - m.userData.hover) * 0.22;
      for (const mat of m.userData.mats) { mat.emissive.set('#ff5b14'); mat.emissiveIntensity = m.userData.hover; }
    }

    if (deskOpen) {
      screenT += dt; deskFrame++;
      const tx = screenCursor ? (screenCursor.x / SW - 0.5) * 0.7 : 0, tz = screenCursor ? (screenCursor.y / SH - 0.5) * 0.4 : 0;
      mouse.position.x += (1.3 + tx - mouse.position.x) * 0.25; mouse.position.z += (-1.55 + tz - mouse.position.z) * 0.25;
      if (deskFrame % 3 === 0) drawScreen();
    }
    controls.update();
    const t = controls.target;
    t.x = THREE.MathUtils.clamp(t.x, -46, 46); t.y = THREE.MathUtils.clamp(t.y, 0, 14); t.z = THREE.MathUtils.clamp(t.z, -22, 34);

    const show = !selected && !deskOpen && st.mode !== 'park';
    for (const g of tagList) {
      tmp.copy(g.p).project(camera);
      const vis = show && tmp.z < 1 && Math.abs(tmp.x) < 1.1;
      g.el.style.opacity = vis ? 1 : 0;
      g.el.style.pointerEvents = vis ? 'auto' : 'none';
      g.el.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * innerWidth).toFixed(1)}px, ${((-tmp.y * 0.5 + 0.5) * innerHeight).toFixed(1)}px) translate(-50%, -50%)`;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    select, close, overview, flyZone, openDesk, closeDesk, setDeskTab,
    get deskOpen() { return deskOpen; },
    enter() { st.mode = 'follow'; overview(3); },
    get selected() { return selected; },
  };
}
