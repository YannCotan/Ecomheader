import * as THREE from 'three';

// Scène 3D de fond : champ de particules + noyau icosaédrique filaire.
// Réagit à la souris et au scroll. Retourne null si WebGL est indisponible.
export function initScene(canvas, { reduced = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  const mobile = window.matchMedia('(max-width: 760px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07070b, 0.045);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 8;

  // --- particules (shader maison)
  const COUNT = mobile ? 1800 : 5000;
  const pos = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const r = 4 + Math.random() * 14;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(p) * Math.cos(t);
    pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t) * 0.7;
    pos[i * 3 + 2] = r * Math.cos(p);
    seed[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPx: { value: renderer.getPixelRatio() },
      uA: { value: new THREE.Color('#7c5cff') },
      uB: { value: new THREE.Color('#22d3ee') },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime; uniform float uPx;
      varying float vMix; varying float vAlpha;
      void main() {
        vec3 p = position;
        float a = uTime * (0.05 + aSeed * 0.08);
        float c = cos(a), s = sin(a);
        p.xz = mat2(c, -s, s, c) * p.xz;
        p.y += sin(uTime * 0.6 + aSeed * 40.0) * 0.15;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.2 + aSeed * 2.6) * uPx * (12.0 / -mv.z);
        vMix = aSeed;
        vAlpha = 0.35 + aSeed * 0.5;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uA; uniform vec3 uB;
      varying float vMix; varying float vAlpha;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float f = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(mix(uA, uB, vMix), f * vAlpha);
      }`,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // --- noyau filaire
  const core = new THREE.Group();
  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.7, 2),
    new THREE.MeshBasicMaterial({ color: 0x7c5cff, wireframe: true, transparent: true, opacity: 0.35 })
  );
  const inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.0, 1),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.5 })
  );
  core.add(wire, inner);
  core.position.x = mobile ? 0 : 2.6;
  scene.add(core);

  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const onMove = (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  };
  addEventListener('pointermove', onMove, { passive: true });

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  const state = { scroll: 0 }; // 0 → 1, piloté par GSAP
  let last = performance.now();
  let elapsed = 0;
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { last = performance.now(); loop(); }
  });

  function loop() {
    if (!running) return;
    const now = performance.now();
    elapsed += (now - last) / 1000;
    last = now;
    const t = elapsed;
    pMat.uniforms.uTime.value = reduced ? 0 : t;
    mouse.sx += (mouse.x - mouse.sx) * 0.05;
    mouse.sy += (mouse.y - mouse.sy) * 0.05;

    const spin = reduced ? 0 : t;
    wire.rotation.set(spin * 0.15 + mouse.sy * 0.4, spin * 0.2 + mouse.sx * 0.5, 0);
    inner.rotation.set(-spin * 0.25, spin * 0.3, 0);
    const pulse = 1 + Math.sin(spin * 1.2) * 0.03;
    core.scale.setScalar(pulse * (1 - state.scroll * 0.35));

    // le scroll déplace la caméra et fait glisser le noyau
    camera.position.x = mouse.sx * 0.6;
    camera.position.y = -mouse.sy * 0.4 - state.scroll * 3;
    camera.position.z = 8 - state.scroll * 3;
    camera.lookAt(0, -state.scroll * 3, 0);
    core.position.y = -state.scroll * 4;
    core.position.x = (mobile ? 0 : 2.6) * (1 - state.scroll * 1.6);
    points.rotation.y = state.scroll * 1.6;

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();

  return { state };
}
