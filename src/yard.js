import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { sideTexture, endTexture, groundTexture, ribTexture, barrierTexture, hash } from './textures.js';
import { isoCode } from './iso.js';
import { createHome, HOME_VIEWS } from './home.js';
import { createLofi } from './audio.js';

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
  bureau: { center: [31, 2, 19], dist: 22 },
};
const HOT_LABEL = { code: 'Coder', jeux: 'Jeux vidéo', manga: 'Manga', musique: 'Musique', voitures: 'Voitures', voyages: 'Voyages' };
const OVERVIEW = { target: [-3, 0, 4], offset: [12, 44, 78] };

export function createYard({ canvas, items, tagEls, reduced, onHover, onSelect, onPortal, onHomeHot, onPhoto }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  const small = () => innerWidth < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio, small() ? 1.25 : 1.5));
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
  sh.mapSize.set(small() ? 1024 : 1536, small() ? 1024 : 1536);
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
  outline(31, 19, 8, 4);

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
      side = sideTexture({ color: col, ink, label: item.title, code: iso.text, sizeCode, w: size === 40 ? 896 : 640, h: size === 40 ? 196 : 275, ribStep: size === 40 ? 7 : 8, office: item.office, seed });
      endDoor = endTexture({ color: col, ink, code: iso.text, door: true, seed });
      const bk = 'b' + col + ink;
      if (!endCache.has(bk)) endCache.set(bk, endTexture({ color: col, ink, code: '', door: false, seed: seed + 1 }));
      endBlank = endCache.get(bk);
    } else {
      const k = col + size;
      if (!sideCache.has(k)) {
        sideCache.set(k, sideTexture({ color: col, ink, label: '', code: iso.text, sizeCode, w: size === 40 ? 896 : 640, h: size === 40 ? 196 : 275, seed }));
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


  const OX = 31, OZ = 19;
  // ---------- portail temporel vers « chez moi »
  const portal = new THREE.Group(); portal.position.set(OX, 0, OZ); scene.add(portal);
  const [swc, swg] = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; return [c, c.getContext('2d')]; })();
  { const bg = swg.createRadialGradient(128, 128, 4, 128, 128, 128); bg.addColorStop(0, '#fff3c0'); bg.addColorStop(0.35, '#7c3a20'); bg.addColorStop(1, '#0b0714'); swg.fillStyle = bg; swg.fillRect(0, 0, 256, 256);
    for (let arm = 0; arm < 6; arm++) for (let i = 0; i < 120; i++) { const r = 4 + i * 1.0, a = arm * (Math.PI / 3) + i * 0.07; swg.fillStyle = arm % 2 ? `rgba(34,211,238,${0.5 - i / 260})` : `rgba(255,91,20,${0.55 - i / 240})`; swg.beginPath(); swg.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 5 - i / 40, 0, 7); swg.fill(); } }
  const swTex = new THREE.CanvasTexture(swc); swTex.colorSpace = THREE.SRGBColorSpace; swTex.center.set(0.5, 0.5);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.3, 48), new THREE.MeshBasicMaterial({ map: swTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  disc.position.y = 3.2; portal.add(disc);
  const ringM = new THREE.MeshStandardMaterial({ color: '#16150f', emissive: '#ff5b14', emissiveIntensity: 1.6, roughness: 0.5 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.22, 12, 48), ringM); ring1.position.y = 3.2; ring1.castShadow = true; portal.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.07, 8, 48), new THREE.MeshStandardMaterial({ color: '#16150f', emissive: '#22d3ee', emissiveIntensity: 2 })); ring2.position.y = 3.2; portal.add(ring2);
  for (const sx of [-1.6, 1.6]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.8), new THREE.MeshStandardMaterial({ color: '#2b2b27', roughness: 0.7 })); leg.position.set(sx, 0.6, 0); leg.castShadow = true; portal.add(leg); }
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.2, 1.4), new THREE.MeshStandardMaterial({ color: '#f0b400', roughness: 0.8 })); plinth.position.y = 0.1; portal.add(plinth);
  const portalHit = disc; portalHit.userData.portal = true;

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
  let held = null, heldItem = null, selected = null, busy = false, queued = null, world = 'yard';

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


  // ---------- monde « chez moi » : chambre de gamer (autre scène, même rendu)
  let home = null; // créée au premier voyage : économise mémoire et temps de chargement
  const lofi = createLofi();
  let homeHover = null, portalHover = false;
  const YARD_CTL = { minDistance: 7, maxDistance: 95, minPolarAngle: 0.15, maxPolarAngle: 1.38, minAzimuthAngle: -Infinity, maxAzimuthAngle: Infinity };
  const HOME_CTL = { minDistance: 0.6, maxDistance: 7, minPolarAngle: 0.45, maxPolarAngle: 1.8, minAzimuthAngle: -1.15, maxAzimuthAngle: 1.15 };
  function setWorld(w) {
    if (w === world) return;
    gsap.killTweensOf(camera.position); gsap.killTweensOf(controls.target); arcTween?.kill();
    if (w === 'home') {
      if (held) { const u = held.userData; held.position.set(u.baseX, u.baseY, u.baseZ); held = null; heldItem = null; }
      if (selected) { selected = null; onSelect(null); }
      home = home || createHome();
      world = 'home';
      Object.assign(controls, HOME_CTL);
      camera.near = 0.05; camera.fov = 50; camera.updateProjectionMatrix();
      camera.position.set(...HOME_VIEWS.home.pos); controls.target.set(...HOME_VIEWS.home.target);
    } else {
      world = 'yard';
      lofi.stop(); homeHover = null;
      Object.assign(controls, YARD_CTL);
      camera.near = 0.5; camera.fov = 38; camera.updateProjectionMatrix();
      const o = overviewView();
      camera.position.copy(o.pos).add(new THREE.Vector3(18, 26, 40)); controls.target.copy(o.target);
      st.mode = 'follow'; st.tgx = st.gx; st.ttz = st.tz;
      overview(2.6);
    }
    controls.enabled = true;
  }
  function focusHome(id) {
    const v = HOME_VIEWS[id]; if (!v) return;
    const pos = V(v.pos), target = V(v.target);
    const fwd = target.clone().sub(pos).normalize(), dist = pos.distanceTo(target);
    const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
    const off = id === 'home' ? new THREE.Vector3() : small() ? new THREE.Vector3(0, -dist * 0.18, 0) : right.multiplyScalar(dist * 0.2);
    flyTo({ pos: pos.add(off), target: target.add(off) }, 1.7);
  }

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
      if (world === 'home') {
        const h = ray.intersectObjects(home.pickables, false)[0];
        if (h) { if (h.object.userData.photo !== undefined) onPhoto(h.object.userData.photo); else onHomeHot(h.object.userData.hot); }
      } else {
        const h = ray.intersectObjects(pickables, false)[0];
        if (h) select(h.object.userData.item.id);
        else if (ray.intersectObject(portalHit, false)[0]) onPortal();
      }
    }
    down = null; dragging = false; canvas.style.cursor = hovered ? 'pointer' : 'grab';
  });
  canvas.addEventListener('pointerleave', () => { hovered = null; homeHover = null; portalHover = false; dirty = false; onHover(null, 0, 0); });
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
  let last = performance.now(), elapsed = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const k = 1 - Math.exp(-dt * 3.2);

    if (dirty && !dragging && lastEvt) {
      dirty = false;
      ray.setFromCamera(ptr, camera);
      if (world === 'yard' && st.mode === 'follow' && ray.ray.intersectPlane(plane, hit)) {
        st.tgx = THREE.MathUtils.clamp(hit.x, -44, 44);
        st.ttz = THREE.MathUtils.clamp(hit.z, RAIL_Z0 + 2, RAIL_Z1 - 2);
      }
      const mouseLike = lastEvt.pointerType === 'mouse' || lastEvt.pointerType === 'pen';
      if (world === 'home') {
        const h = mouseLike ? ray.intersectObjects(home.pickables, false)[0] : null;
        homeHover = h ? h.object.userData.hot : null;
        canvas.style.cursor = h ? 'pointer' : 'grab';
        onHover(h ? { title: HOT_LABEL[homeHover] || '', kind: 'home' } : null, lastEvt.clientX, lastEvt.clientY);
      } else {
        const h = mouseLike ? ray.intersectObjects(pickables, false)[0] : null;
        const m = h ? h.object : null;
        const ph = mouseLike && !m && ray.intersectObject(portalHit, false)[0];
        if (m !== hovered) { hovered = m; }
        portalHover = !!ph;
        canvas.style.cursor = m || ph ? 'pointer' : 'grab';
        onHover(m ? m.userData.item : ph ? { title: 'Chez moi', kind: 'portal' } : null, lastEvt.clientX, lastEvt.clientY);
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

    if (world === 'yard') for (const m of pickables) {
      const t = m === hovered || m === held ? 0.32 : 0, u = m.userData;
      if (u.hover === 0 && t === 0) continue;
      u.hover += (t - u.hover) * 0.22;
      if (u.hover < 0.003 && t === 0) u.hover = 0;
      for (const mat of u.mats) { mat.emissive.set('#ff5b14'); mat.emissiveIntensity = u.hover; }
    }

    elapsed += dt;
    swTex.rotation -= dt * 0.7; ring2.rotation.z += dt * 0.9; ring1.material.emissiveIntensity = 1.4 + Math.sin(elapsed * 3) * 0.4;
    if (world === 'home') home.update(dt, elapsed, { hover: homeHover, music: lofi.playing, pulse: lofi.pulse() });
    controls.update();
    const t = controls.target;
    if (world === 'home') {
      // la caméra reste dans la pièce (3 murs, sol) : jamais derrière un mur
      const c = camera.position;
      c.x = THREE.MathUtils.clamp(c.x, -2.95, 2.95); c.y = THREE.MathUtils.clamp(c.y, 0.25, 2.7); c.z = THREE.MathUtils.clamp(c.z, -2.35, 5);
    }
    if (world === 'home') { t.x = THREE.MathUtils.clamp(t.x, -3.2, 3.2); t.y = THREE.MathUtils.clamp(t.y, 0.3, 2.6); t.z = THREE.MathUtils.clamp(t.z, -2.6, 2.2); }
    else { t.x = THREE.MathUtils.clamp(t.x, -46, 46); t.y = THREE.MathUtils.clamp(t.y, 0, 14); t.z = THREE.MathUtils.clamp(t.z, -22, 34); }

    const show = world === 'yard' && !selected && st.mode !== 'park';
    for (const g of tagList) {
      tmp.copy(g.p).project(camera);
      const vis = show && tmp.z < 1 && Math.abs(tmp.x) < 1.1;
      g.el.style.opacity = vis ? 1 : 0;
      g.el.style.pointerEvents = vis ? 'auto' : 'none';
      g.el.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * innerWidth).toFixed(1)}px, ${((-tmp.y * 0.5 + 0.5) * innerHeight).toFixed(1)}px) translate(-50%, -50%)`;
    }
    renderer.render(world === 'home' ? home.scene : scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    select, close, overview, flyZone, setWorld, focusHome,
    toggleLofi: () => lofi.toggle(),
    get world() { return world; },
    get lofiPlaying() { return lofi.playing; },
    enter() { st.mode = 'follow'; overview(3); },
    get selected() { return selected; },
  };
}
