/* ============================================================
   NutriCense Landing — interaksi halaman + Three.js hero scene
   Scene: "Inti Kaca" — kotak kaca NC-BOX-09X, inti indeks
   keamanan yang berdenyut, 3 cincin sensor mengorbit,
   sapuan pemindai, dan partikel ambien.
   ============================================================ */

'use strict';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ───────────────────────── Interaksi halaman ───────────────────────── */

// Navbar → kaca setelah discroll
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Menu mobile
const burger = $('#nav-burger');
const navLinks = $('#nav-links');
burger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
});
navLinks.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
        navLinks.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
    }
});

// Reveal saat masuk viewport
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
        if (en.isIntersecting) {
            en.target.classList.add('in-view');
            revealObserver.unobserve(en.target);
        }
    });
}, { threshold: 0.15 });
$$('.reveal').forEach((el) => revealObserver.observe(el));

// Count-up statistik (sekali saja)
const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
        if (!en.isIntersecting) return;
        countObserver.unobserve(en.target);
        const target = Number(en.target.dataset.count);
        if (reducedMotion || !Number.isFinite(target)) {
            en.target.textContent = String(target);
            return;
        }
        const t0 = performance.now();
        const tick = (now) => {
            const p = Math.min(1, (now - t0) / 800);
            en.target.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
}, { threshold: 0.6 });
$$('[data-count]').forEach((el) => countObserver.observe(el));

// FAQ accordion (neumorphic: extruded → inset saat terbuka)
$$('.faq-item').forEach((item) => {
    const q = $('.faq-q', item);
    q.addEventListener('click', () => {
        const open = item.classList.toggle('open');
        q.setAttribute('aria-expanded', String(open));
    });
});

// Chip telemetri: random-walk kecil agar terasa hidup
const chipTemp = $('#chip-temp');
const chipPh = $('#chip-ph');
const chipTvoc = $('#chip-tvoc');
if (!reducedMotion && chipTemp) {
    let t = 72.4, ph = 6.1, tvoc = 118;
    setInterval(() => {
        t = Math.min(78, Math.max(68, t + (Math.random() - 0.5) * 0.6));
        ph = Math.min(6.8, Math.max(5.6, ph + (Math.random() - 0.5) * 0.08));
        tvoc = Math.round(Math.min(160, Math.max(90, tvoc + (Math.random() - 0.5) * 8)));
        chipTemp.textContent = t.toFixed(1);
        chipPh.textContent = ph.toFixed(1);
        chipTvoc.textContent = String(tvoc);
    }, 3000);
}

// Tahun footer
$('#year').textContent = String(new Date().getFullYear());

/* ───────────────────────── Three.js hero scene ───────────────────────── */

const sceneWrap = $('#scene-wrap');
const canvas = $('#scene-canvas');

const THEMES = {
    light: { exposure: 1.15, ringOpacity: 0.45, dustOpacity: 0.3, shell: 0xcff3e8, accent: 0x0e8a6d, emissive: 0x35c39a, hemiSky: 0xdff5ec, hemiGround: 0x16211c },
    dark:  { exposure: 1.0,  ringOpacity: 0.7,  dustOpacity: 0.5, shell: 0x9adfc8, accent: 0x35c39a, emissive: 0x56d1ae, hemiSky: 0x2a4038, hemiGround: 0x060b09 },
};

function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function sceneFailed() {
    if (sceneWrap) sceneWrap.classList.add('scene-failed');
}

(async () => {
    if (!sceneWrap || !canvas) return;
    let THREE, RoundedBoxGeometry, RoomEnvironment;
    try {
        THREE = await import('three');
        ({ RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js'));
        ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
    } catch (err) {
        sceneFailed();
        return;
    }

    try {
        const isCoarse = window.matchMedia('(pointer: coarse)').matches;
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCoarse ? 1.5 : 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;

        canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            sceneFailed();
        });

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
        camera.position.set(0, 0.4, 5.2);
        camera.lookAt(0, 0, 0);

        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        pmrem.dispose();

        scene.add(new THREE.HemisphereLight(0xdff5ec, 0x16211c, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(2.5, 4, 2);
        scene.add(dirLight);

        const group = new THREE.Group();
        scene.add(group);

        // Cangkang kaca (tanpa transmission — envMap + clearcoat sudah cukup "kaca" dan jauh lebih ringan)
        const shellMat = new THREE.MeshPhysicalMaterial({
            color: THEMES.light.shell,
            metalness: 0.05,
            roughness: 0.1,
            transparent: true,
            opacity: 0.3,
            clearcoat: 1,
            clearcoatRoughness: 0.15,
            envMapIntensity: 1.3,
        });
        const shell = new THREE.Mesh(new RoundedBoxGeometry(1.55, 1.15, 1.55, 4, 0.18), shellMat);
        group.add(shell);

        // Inti indeks keamanan yang berdenyut
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x0e8a6d,
            emissive: THEMES.light.emissive,
            emissiveIntensity: 0.5,
            flatShading: true,
            roughness: 0.35,
        });
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 1), coreMat);
        group.add(core);

        // Cincin lensa di sisi depan + aperture gelap
        const lensMat = new THREE.MeshBasicMaterial({ color: THEMES.light.accent });
        const lens = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 12, 48), lensMat);
        lens.position.z = 0.79;
        group.add(lens);
        const aperture = new THREE.Mesh(
            new THREE.CircleGeometry(0.16, 32),
            new THREE.MeshBasicMaterial({ color: 0x06231c })
        );
        aperture.position.z = 0.785;
        group.add(aperture);

        // 3 cincin sensor + manik yang mengorbit (suhu / pH / gas)
        const ringDefs = [
            { radius: 1.0,  tilt: [0.45, 0, 0.2],   speed: 0.5 },
            { radius: 1.15, tilt: [-0.32, 0, -0.5], speed: -0.38 },
            { radius: 1.3,  tilt: [1.1, 0, 0.9],    speed: 0.28 },
        ];
        const ringMats = [];
        const beadMats = [];
        const spinners = [];
        ringDefs.forEach((def) => {
            const pivot = new THREE.Object3D();
            pivot.rotation.set(def.tilt[0], def.tilt[1], def.tilt[2]);
            const ringMat = new THREE.MeshBasicMaterial({
                color: THEMES.light.accent,
                transparent: true,
                opacity: THEMES.light.ringOpacity,
            });
            ringMats.push(ringMat);
            pivot.add(new THREE.Mesh(new THREE.TorusGeometry(def.radius, 0.008, 8, 128), ringMat));

            const spinner = new THREE.Object3D();
            const beadMat = new THREE.MeshBasicMaterial({ color: THEMES.light.emissive });
            beadMats.push(beadMat);
            const bead = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), beadMat);
            bead.position.x = def.radius;
            spinner.add(bead);
            pivot.add(spinner);
            spinners.push({ obj: spinner, speed: def.speed });

            group.add(pivot);
        });

        // Sapuan pemindai (additive)
        const beamMat = new THREE.MeshBasicMaterial({
            color: THEMES.light.emissive,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const beam = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.05), beamMat);
        group.add(beam);

        // Partikel ambien (sprite radial dari canvas offscreen — tanpa aset eksternal)
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = spriteCanvas.height = 64;
        const sctx = spriteCanvas.getContext('2d');
        const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.4, 'rgba(255,255,255,0.4)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, 64, 64);
        const sprite = new THREE.CanvasTexture(spriteCanvas);

        const DUST_COUNT = isCoarse ? 350 : 650;
        const dustPos = new Float32Array(DUST_COUNT * 3);
        for (let i = 0; i < DUST_COUNT; i++) {
            const r = 2.2 + Math.random() * 2.6;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            dustPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            dustPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
            dustPos[i * 3 + 2] = r * Math.cos(phi);
        }
        const dustGeo = new THREE.BufferGeometry();
        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
        const dustMat = new THREE.PointsMaterial({
            size: 0.04,
            map: sprite,
            transparent: true,
            opacity: THEMES.light.dustOpacity,
            depthWrite: false,
            sizeAttenuation: true,
            color: 0xaad9c9,
        });
        const dust = new THREE.Points(dustGeo, dustMat);
        scene.add(dust);

        // ── Tema ──
        const hemi = scene.children.find((c) => c.isHemisphereLight);
        function applySceneTheme() {
            const t = THEMES[currentTheme()];
            renderer.toneMappingExposure = t.exposure;
            shellMat.color.setHex(t.shell);
            coreMat.emissive.setHex(t.emissive);
            lensMat.color.setHex(t.accent);
            beamMat.color.setHex(t.emissive);
            dustMat.opacity = t.dustOpacity;
            ringMats.forEach((m) => { m.color.setHex(t.accent); m.opacity = t.ringOpacity; });
            beadMats.forEach((m) => m.color.setHex(t.emissive));
            if (hemi) { hemi.color.setHex(t.hemiSky); hemi.groundColor.setHex(t.hemiGround); }
        }
        applySceneTheme();

        // ── Ukuran ──
        function resize() {
            const w = sceneWrap.clientWidth;
            const h = sceneWrap.clientHeight;
            if (!w || !h) return;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
        resize();
        new ResizeObserver(resize).observe(sceneWrap);

        // ── Parallax pointer (hanya pointer halus/desktop) ──
        let px = 0, py = 0, targetPx = 0, targetPy = 0;
        if (window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
            window.addEventListener('pointermove', (e) => {
                targetPx = (e.clientX / window.innerWidth - 0.5) * 2;
                targetPy = (e.clientY / window.innerHeight - 0.5) * 2;
            }, { passive: true });
        }

        // ── Loop animasi + jeda saat tersembunyi/di luar layar ──
        const clock = new THREE.Clock();
        let baseYaw = 0;
        let inView = true;
        let scanT = 0; // fase sapuan; siklus 4 detik

        function animate() {
            const dt = Math.min(clock.getDelta(), 0.05);
            const t = clock.elapsedTime;

            baseYaw += dt * 0.15;
            px += (targetPx - px) * 0.05;
            py += (targetPy - py) * 0.05;
            group.rotation.y = baseYaw + px * 0.12;
            group.rotation.x = py * 0.08;
            group.position.y = Math.sin(t * 0.8) * 0.05;

            core.rotation.y += dt * 0.4;
            coreMat.emissiveIntensity = 0.45 + 0.25 * (Math.sin(t * 2.1) * 0.5 + 0.5);

            spinners.forEach((s) => { s.obj.rotation.z += dt * s.speed; });

            // Sapuan pemindai: 1.2 dtk sapuan tiap siklus 4 dtk
            scanT = (scanT + dt) % 4;
            if (scanT < 1.2) {
                const p = scanT / 1.2;
                beam.position.y = -0.7 + p * 1.4;
                beamMat.opacity = 0.5 * Math.sin(p * Math.PI);
            } else {
                beamMat.opacity = 0;
            }

            dust.rotation.y += dt * 0.02;

            renderer.render(scene, camera);
        }

        function updateLoop() {
            const running = inView && !document.hidden && !reducedMotion;
            renderer.setAnimationLoop(running ? animate : null);
        }

        new IntersectionObserver((entries) => {
            inView = entries[0].isIntersecting;
            updateLoop();
        }, { threshold: 0 }).observe(sceneWrap);

        document.addEventListener('visibilitychange', updateLoop);

        if (reducedMotion) {
            // Satu frame statis pada sudut yang menarik
            group.rotation.y = 0.35;
            coreMat.emissiveIntensity = 0.6;
            renderer.render(scene, camera);
        } else {
            updateLoop();
        }

        // Ikuti pergantian tema dari js/theme.js
        new MutationObserver(() => {
            applySceneTheme();
            if (reducedMotion || !inView || document.hidden) renderer.render(scene, camera);
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    } catch (err) {
        sceneFailed();
    }
})();
