/* ============================================================
   NUTRICENSE — Model produk 3D "NC-BOX-09X" (Three.js)
   Bentuknya disamakan dengan model Blender: SLAB putih tipis
   yang menjorok ke depan + GANTRY gelap (menara kanan dan
   kanopi) yang duduk mundur di atasnya. Fillet dibuat besar
   supaya terbaca lembut, bukan kubistis.

   Geometri prosedural, bukan aset impor — ringan, tajam di
   kerapatan layar berapa pun, dan ikut berubah saat tema
   terang/gelap diganti.

   Satuan: 1 unit = 10 cm. Perangkat 4.5 x 3.2 x 4.2.
   Depan menghadap +Z.
   ============================================================ */

'use strict';

/* ── Dimensi (sejajar dengan blender/nc_box.py) ── */
const W = 4.5, D = 3.2, H = 4.2;
const PLINTH_H = 0.14;
const BASE_H = 0.72;
const BASE_TOP = PLINTH_H + BASE_H;        // 0.86
const CANOPY_H = 0.72;
const CANOPY_BOT = H - CANOPY_H;           // 3.48
const UPPER_D = 2.55;
const UPPER_Z1 = D / 2;                    // 1.6  (muka depan gantry ada di +Z)
const UPPER_Z0 = UPPER_Z1 - UPPER_D;       // -0.95
const UPPER_CZ = (UPPER_Z0 + UPPER_Z1) / 2;
const LEFT_T = 0.58;
const TOWER_W = 1.20;
const OPEN_X0 = -W / 2 + LEFT_T;           // -1.67
const OPEN_X1 = W / 2 - TOWER_W;           //  1.05
const TRAY_CX = (OPEN_X0 + OPEN_X1) / 2;   // -0.31
const TOWER_CX = W / 2 - TOWER_W / 2;      //  1.65

/* Satu entri per mode tampilan. Tanpa entri untuk neu/aura, model
   akan memakai pencahayaan mode terang di atas latar gelap dan
   terlihat salah tempat. */
const PALETTE = {
  light: { key: 0xffffff, rim: 0xbfe4ff, glow: 0x2f9e5f, led: 0x2f7dff, screen: 0x040a20 },
  dark:  { key: 0xdfeeff, rim: 0x4ade80, glow: 0x4ade80, led: 0x4f95ff, screen: 0x030716 },
  neu:   { key: 0xf7fcf9, rim: 0xc2cec7, glow: 0x2f9e5f, led: 0x5b8fd6, screen: 0x0a1424 },
  aura:  { key: 0xd8f5e6, rim: 0x22d3ee, glow: 0x4ade80, led: 0x38bdf8, screen: 0x02060f },
};

/**
 * Pasang scene produk pada sebuah <canvas>.
 * @returns {{setTheme,setScanning,setStatus,destroy}|null} null bila WebGL tidak ada.
 */
export async function mountProduct(canvas, opts = {}) {
  if (!canvas) return null;

  let THREE, RoundedBoxGeometry, RoomEnvironment;
  try {
    THREE = await import('three');
    ({ RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js'));
    ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
  } catch (err) {
    console.warn('[nc3d] three.js gagal dimuat:', err);
    return null;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (err) {
    console.warn('[nc3d] WebGL tidak tersedia:', err);
    return null;
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let theme = opts.theme || document.documentElement.getAttribute('data-theme') || 'light';
  let P = PALETTE[theme] || PALETTE.light;

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(-7.2, 5.0, 10.5);
  camera.lookAt(0, H * 0.44, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x30403a, 0.5));
  const key = new THREE.DirectionalLight(P.key, 1.6);
  key.position.set(-6, 9, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(P.rim, 0.9);
  rim.position.set(6, 4, -6);
  scene.add(rim);

  /* ── Material ── */
  const matWhite = new THREE.MeshPhysicalMaterial({
    color: 0xf4f7f5, roughness: 0.26, metalness: 0.0, clearcoat: 0.9, clearcoatRoughness: 0.07,
  });
  const matDark = new THREE.MeshPhysicalMaterial({
    color: 0x0b0d0f, roughness: 0.30, metalness: 0.05, clearcoat: 0.45, clearcoatRoughness: 0.12,
  });
  const matDarkMatte = new THREE.MeshStandardMaterial({ color: 0x121517, roughness: 0.65 });
  const matSteel = new THREE.MeshPhysicalMaterial({ color: 0xcfd8dc, roughness: 0.22, metalness: 1.0 });
  const matSteelDark = new THREE.MeshPhysicalMaterial({ color: 0x8d979c, roughness: 0.36, metalness: 0.9 });
  const matWhiteSoft = new THREE.MeshStandardMaterial({ color: 0xe8ede9, roughness: 0.45 });
  const matLens = new THREE.MeshPhysicalMaterial({ color: 0x0a1a22, roughness: 0.05, metalness: 0.4, clearcoat: 1 });
  const matLed = new THREE.MeshBasicMaterial({ color: P.led, transparent: true, opacity: 0.95 });
  const matScreen = new THREE.MeshBasicMaterial({ color: P.screen });
  const matUiGreen = new THREE.MeshBasicMaterial({ color: 0x1fbf5c });
  const matUiWhite = new THREE.MeshBasicMaterial({ color: 0xdce6f2 });
  const matUiDim = new THREE.MeshBasicMaterial({ color: 0x2a3a6a });

  const root = new THREE.Group();
  scene.add(root);

  /** Kotak dengan fillet besar — inti bahasa bentuk produk ini. */
  const soft = (w, h, d, r, mat, x, y, z, seg = 5) => {
    const rr = Math.min(r, Math.min(w, h, d) * 0.49);
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, rr), mat);
    m.position.set(x, y, z);
    root.add(m);
    return m;
  };

  /* ── Plinth + slab alas ── */
  soft(W - 0.75, PLINTH_H, D - 0.75, 0.05, matDarkMatte, 0, PLINTH_H / 2, 0);
  soft(W, BASE_H, D, 0.26, matWhite, 0, PLINTH_H + BASE_H / 2, 0, 6);

  /* ── Gantry: dinding kiri putih, menara kanan gelap, kanopi gelap ── */
  const OVERLAP = 0.24;
  const upperH = CANOPY_BOT - BASE_TOP + OVERLAP;
  const upperY = (BASE_TOP + CANOPY_BOT + OVERLAP) / 2;

  soft(LEFT_T, upperH, UPPER_D, 0.20, matWhite, -W / 2 + LEFT_T / 2, upperY, UPPER_CZ, 6);
  soft(W - LEFT_T - TOWER_W + 0.2, upperH, 0.30, 0.12, matWhite, TRAY_CX, upperY, UPPER_Z0 + 0.15, 5);
  soft(TOWER_W, upperH, UPPER_D, 0.24, matDark, TOWER_CX, upperY, UPPER_CZ, 6);
  soft(W, CANOPY_H, UPPER_D, 0.26, matDark, 0, CANOPY_BOT + CANOPY_H / 2, UPPER_CZ, 6);
  soft(W - LEFT_T - TOWER_W + 0.3, 0.04, UPPER_D - 0.2, 0.015, matWhiteSoft,
       TRAY_CX, CANOPY_BOT - 0.02, UPPER_CZ, 3);

  /* Bibir logam tipis di tepi depan kanopi */
  soft(W - 0.2, 0.05, 0.04, 0.012, matSteelDark, 0, CANOPY_BOT + 0.06, UPPER_Z1 - UPPER_D + 0.015, 3);

  /* ── Kamera + LED biru ── */
  const camY = CANOPY_BOT;
  soft(0.86, 0.24, 0.62, 0.08, matDark, TRAY_CX, camY - 0.11, UPPER_CZ + 0.12, 4);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.14, 28), matSteelDark);
  barrel.position.set(TRAY_CX, camY - 0.28, UPPER_CZ + 0.12);
  root.add(barrel);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.04, 28), matLens);
  lens.position.set(TRAY_CX, camY - 0.36, UPPER_CZ + 0.12);
  root.add(lens);

  const ledFront = soft(2.55, 0.06, 0.13, 0.025, matLed, TRAY_CX, camY - 0.18, UPPER_Z0 + UPPER_D - 0.16, 3);
  const ledBack = soft(2.55, 0.06, 0.13, 0.025, matLed.clone(), TRAY_CX, camY - 0.18, UPPER_Z0 + 0.30, 3);
  const chamberLight = new THREE.PointLight(P.led, 3.2, 9, 2);
  chamberLight.position.set(TRAY_CX, camY - 0.5, UPPER_CZ + 0.4);
  root.add(chamberLight);

  /* Pod sensor pada dinding dalam menara */
  [1.50, 1.00].forEach((dy, i) => {
    soft(0.20, 0.40, 0.40, 0.06, matDarkMatte, OPEN_X1 - 0.10, BASE_TOP + dy, UPPER_CZ + 0.30, 4);
    const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 20), matLens);
    eye.rotation.z = Math.PI / 2;
    eye.position.set(OPEN_X1 - 0.21, BASE_TOP + dy, UPPER_CZ + 0.30);
    root.add(eye);
  });

  /* ── Layar navy + tombol 2 x 2 ── */
  const screenGroup = new THREE.Group();
  const fz = UPPER_Z0 + UPPER_D;                 // muka depan gantry
  screenGroup.position.set(TOWER_CX, BASE_TOP + 1.80, fz + 0.01);
  root.add(screenGroup);

  const SW = 0.96, SH = 1.50;
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(SW + 0.10, SH + 0.10, 0.06, 4, 0.04), matDark);
  bezel.position.z = -0.02;
  screenGroup.add(bezel);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), matScreen);
  glass.position.z = 0.02;
  screenGroup.add(glass);

  const ui = (w, h, x, y, mat) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, 0.03);
    screenGroup.add(m);
    return m;
  };
  ui(SW, 0.13, 0, SH / 2 - 0.10, matUiDim);                 // bilah judul
  const verdict = ui(0.62, 0.20, 0, SH / 2 - 0.36, matUiGreen);   // "AMAN"
  ui(0.40, 0.07, 0, SH / 2 - 0.54, matUiGreen);
  const rows = [];
  for (let i = 0; i < 6; i++) {
    const w = 0.62 - i * 0.045;
    rows.push(ui(w, 0.048, -SW / 2 + 0.07 + w / 2, SH / 2 - 0.72 - i * 0.125, matUiWhite));
    rows.push(ui(0.20, 0.048, SW / 2 - 0.17, SH / 2 - 0.72 - i * 0.125, matUiWhite));
  }
  const okBar = ui(SW - 0.16, 0.10, 0, -SH / 2 + 0.13, matUiGreen);

  const BTN = [[-0.26, 0.15, 0x1fa84f], [0.26, 0.15, 0x9aa3a7],
               [-0.26, -0.11, 0xd99413], [0.26, -0.11, 0xc4382f]];
  BTN.forEach(([bx, by, col]) => {
    const b = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.11, 0.07, 3, 0.025),
                             new THREE.MeshBasicMaterial({ color: col }));
    b.position.set(TOWER_CX + bx, BASE_TOP + 0.66 + by, fz + 0.03);
    root.add(b);
  });

  /* ── Wordmark: heksagon + balok teks pada kanopi ── */
  const brandY = CANOPY_BOT + CANOPY_H / 2;
  const hexGeo = new THREE.TorusGeometry(0.115, 0.022, 6, 6);
  const hex = new THREE.Mesh(hexGeo, new THREE.MeshBasicMaterial({ color: 0xe8ecee }));
  hex.rotation.z = Math.PI / 6;
  hex.position.set(TRAY_CX, brandY + 0.15, fz + 0.005);
  root.add(hex);
  const word = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.085),
                              new THREE.MeshBasicMaterial({ color: 0xdfe4e6 }));
  word.position.set(TRAY_CX, brandY - 0.13, fz + 0.005);
  root.add(word);

  /* ── Nampan 4 sekat + isi ringkas ── */
  const trayZ = 0.36, trayY = BASE_TOP + 0.16;
  soft(2.68, 0.20, 1.88, 0.08, matSteel, TRAY_CX, trayY, trayZ, 5);
  const wells = [[-0.68, 0.0, 1.02, 1.50], [0.66, 0.52, 1.02, 0.42],
                 [0.66, 0.0, 1.02, 0.42], [0.66, -0.52, 1.02, 0.42]];
  wells.forEach(([dx, dz, w, d]) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, 0.12, d, 4, 0.05), matSteelDark);
    m.position.set(TRAY_CX + dx, trayY + 0.06, trayZ + dz);
    root.add(m);
  });

  const rice = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 14),
                              new THREE.MeshStandardMaterial({ color: 0xd8d4c4, roughness: 0.5 }));
  rice.scale.set(1.3, 0.42, 1.85);
  rice.position.set(TRAY_CX - 0.68, trayY + 0.14, trayZ);
  root.add(rice);

  const matChicken = new THREE.MeshStandardMaterial({ color: 0x7a3a16, roughness: 0.36 });
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.13, 0.18, 3, 0.05), matChicken);
    c.position.set(TRAY_CX + 0.66 + (i % 2) * 0.2 - 0.1, trayY + 0.15, trayZ + 0.52 + (i > 1 ? 0.12 : -0.1));
    c.rotation.y = i * 0.5;
    root.add(c);
  }
  const matVeg = new THREE.MeshStandardMaterial({ color: 0x2f6b1e, roughness: 0.34 });
  for (let i = 0; i < 9; i++) {
    const a = i * 1.2;
    const v = new THREE.Mesh(new THREE.IcosahedronGeometry(0.10 + (i % 3) * 0.02, 1), matVeg);
    v.position.set(TRAY_CX + 0.66 + Math.cos(a) * 0.3, trayY + 0.15, trayZ - 0.52 + Math.sin(a) * 0.14);
    root.add(v);
  }

  /* Kaki karet */
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.09, 18), matDarkMatte);
    f.position.set(sx * (W / 2 - 0.5), 0.045, sz * (D / 2 - 0.5));
    root.add(f);
  });

  /* ── Berkas pemindai ── */
  const beam = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.85),
    new THREE.MeshBasicMaterial({ color: P.glow, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
  );
  beam.rotation.x = -Math.PI / 2;
  beam.position.set(TRAY_CX, 2.4, trayZ);
  root.add(beam);

  /* ── Cincin indeks yang mengorbit ── */
  const ringGroup = new THREE.Group();
  ringGroup.position.y = H * 0.42;
  root.add(ringGroup);
  const rings = [
    { r: 3.6, tilt: 0.48, speed: 0.22, op: 0.42 },
    { r: 4.3, tilt: -0.30, speed: -0.15, op: 0.26 },
  ].map((d) => {
    const pivot = new THREE.Object3D();
    pivot.rotation.x = Math.PI / 2 + d.tilt;
    const torus = new THREE.Mesh(new THREE.TorusGeometry(d.r, 0.012, 8, 150),
      new THREE.MeshBasicMaterial({ color: P.glow, transparent: true, opacity: d.op }));
    pivot.add(torus);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12),
      new THREE.MeshBasicMaterial({ color: P.glow }));
    bead.position.x = d.r;
    const spinner = new THREE.Object3D();
    spinner.add(bead);
    pivot.add(spinner);
    ringGroup.add(pivot);
    return { spinner, speed: d.speed, torus, bead };
  });

  /* ── Interaksi ── */
  let targetYaw = 0.30, yaw = 0.30, targetPitch = 0, pitch = 0;
  let dragging = false, lastX = 0, lastY = 0, idle = 0;

  const px = (e) => (e.touches ? e.touches[0].clientX : e.clientX);
  const py = (e) => (e.touches ? e.touches[0].clientY : e.clientY);
  const onDown = (e) => { dragging = true; idle = 0; lastX = px(e); lastY = py(e); canvas.style.cursor = 'grabbing'; };
  const onMove = (e) => {
    if (!dragging) return;
    targetYaw += (px(e) - lastX) * 0.008;
    targetPitch = Math.max(-0.30, Math.min(0.40, targetPitch + (py(e) - lastY) * 0.004));
    lastX = px(e); lastY = py(e);
  };
  const onUp = () => { dragging = false; canvas.style.cursor = 'grab'; };

  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onUp);

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let visible = true;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0.05 });
  io.observe(canvas);

  const clock = new THREE.Clock();
  let raf = 0, scanPhase = 0, scanning = false;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (!dragging) { idle += dt; if (!reduced && idle > 1.2) targetYaw += dt * 0.16; }
    yaw += (targetYaw - yaw) * 0.08;
    pitch += (targetPitch - pitch) * 0.08;
    root.rotation.y = yaw;
    root.rotation.x = pitch;
    if (!reduced) root.position.y = Math.sin(t * 0.9) * 0.04;

    rings.forEach((r) => { r.spinner.rotation.z += r.speed * dt; });

    const pulse = 0.72 + Math.sin(t * 2.1) * 0.24;
    matLed.opacity = pulse;
    ledBack.material.opacity = pulse;
    chamberLight.intensity = 2.0 + pulse * 1.6;
    rows.forEach((bar, i) => {
      bar.scale.x = 0.94 + 0.06 * Math.abs(Math.sin(t * 1.4 - i * 0.4));
    });
    verdict.scale.setScalar(0.98 + 0.02 * Math.sin(t * 2.4));

    if (scanning) {
      scanPhase += dt * 1.5;
      const p = (Math.sin(scanPhase) + 1) / 2;
      beam.position.y = BASE_TOP + 0.35 + p * 2.1;
      beam.material.opacity = 0.30 - p * 0.14;
    } else {
      beam.position.y += (2.4 - beam.position.y) * 0.05;
      beam.material.opacity += (0.13 - beam.material.opacity) * 0.05;
    }

    renderer.render(scene, camera);
  }
  frame();

  const applyTheme = (next) => {
    theme = next; P = PALETTE[next] || PALETTE.light;
    const glow = new THREE.Color(P.glow);
    matLed.color.set(P.led);
    ledBack.material.color.set(P.led);
    chamberLight.color.set(P.led);
    matScreen.color.set(P.screen);
    beam.material.color.set(glow);
    key.color.set(P.key);
    rim.color.set(P.rim);
    rings.forEach((r) => { r.torus.material.color.set(glow); r.bead.material.color.set(glow); });
  };

  return {
    setTheme: applyTheme,
    setScanning(on) { scanning = !!on; if (on) scanPhase = -Math.PI / 2; },
    setStatus(kind) {
      const map = { safe: 0x1fbf5c, warn: 0xd99413, bad: 0xc4382f };
      const c = new THREE.Color(map[kind] || 0x1fbf5c);
      verdict.material.color.set(c);
      okBar.material.color.set(c);
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('touchstart', onDown);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) [].concat(o.material).forEach((m) => m.dispose());
      });
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
