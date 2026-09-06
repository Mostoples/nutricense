/* ============================================================
   NUTRICENSE — Router + mesin transisi halaman
   Rute berbasis hash: #/sppg/menu, #/sekolah/scan, dst.
   Transisi memakai View Transitions API bila tersedia; jika
   tidak, jatuh ke animasi CSS geser-dan-pudar yang setara.
   Arah animasi ditentukan dari kedalaman tumpukan navigasi,
   sehingga "kembali" bergeser berlawanan dengan "maju".
   ============================================================ */

'use strict';

import { hydrateIcons } from './icons.js';

const routes = new Map();
const stack = [];              /* jejak kedalaman untuk menentukan arah */
let outlet = null;
let current = null;            /* { path, view, cleanup } */
let navigating = false;

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Daftarkan sebuah layar. render(ctx) → string HTML | {html, mount, title} */
export function route(path, render) { routes.set(path, render); }

export function setOutlet(node) { outlet = node; }

/** Ubah lokasi. replace=true tidak menambah entri history. */
export function go(path, { replace = false } = {}) {
  const target = path.startsWith('#') ? path : '#' + path;
  if (location.hash === target) return;
  if (replace) history.replaceState({}, '', target);
  else location.hash = target;
}

export function back() {
  if (stack.length > 1) history.back();
  else go('/');
}

/* Cocokkan "#/sppg/detail/3" dengan pola "/sppg/detail/:id" */
function match(hash) {
  const path = (hash || '#/').replace(/^#/, '') || '/';
  const segs = path.split('/').filter(Boolean);
  for (const [pattern, render] of routes) {
    const psegs = pattern.split('/').filter(Boolean);
    if (psegs.length !== segs.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < psegs.length; i++) {
      if (psegs[i].startsWith(':')) params[psegs[i].slice(1)] = decodeURIComponent(segs[i]);
      else if (psegs[i] !== segs[i]) { ok = false; break; }
    }
    if (ok) return { render, params, path };
  }
  return null;
}

/** Arah: 1 = maju (layar baru lebih dalam), -1 = mundur. */
function direction(path) {
  const depth = path.split('/').filter(Boolean).length;
  const prev = stack[stack.length - 1];
  if (!prev) { stack.push({ path, depth }); return 0; }
  if (prev.path === path) return 0;

  const idx = stack.findIndex((s) => s.path === path);
  if (idx !== -1) { stack.length = idx + 1; return -1; }   /* kembali ke layar yang pernah dibuka */
  stack.push({ path, depth });
  return depth < prev.depth ? -1 : 1;
}

async function paint(hit) {
  const dir = direction(hit.path);

  /* Bongkar layar sebelumnya */
  if (current && typeof current.cleanup === 'function') {
    try { current.cleanup(); } catch (e) { console.warn('[router] cleanup gagal:', e); }
  }

  const out = await hit.render({ params: hit.params, path: hit.path });
  const html = typeof out === 'string' ? out : out.html;
  const mount = typeof out === 'string' ? null : out.mount;
  const title = typeof out === 'string' ? null : out.title;

  const swap = () => {
    outlet.innerHTML = html;
    hydrateIcons(outlet);
    /* Beri tahu pemasang efek bahwa ada DOM baru untuk dihias */
    document.dispatchEvent(new CustomEvent('nc:rendered', { detail: outlet }));
    outlet.scrollTop = 0;
    document.querySelector('.app-scroll')?.scrollTo({ top: 0 });
    if (title) document.title = title + ' · Nutricense';
    current = { path: hit.path, cleanup: mount ? mount(outlet) : null };
  };

  if (reduced()) { swap(); return; }

  /* Arah dipasang pada <html>: pseudo-element ::view-transition
     hanya ada pada elemen root, bukan pada outlet. */
  document.documentElement.dataset.dir = dir >= 0 ? 'fwd' : 'back';

  /* Jalur cepat: View Transitions API.
     Objek transisi mengekspos tiga promise (ready, updateCallbackDone,
     finished). Menangkap `finished` saja menyisakan dua rejection tak
     tertangani — muncul di konsol sebagai "Transition was aborted
     because of invalid state" saat dua navigasi bertumpuk. */
  if (document.startViewTransition) {
    const vt = document.startViewTransition(swap);
    vt.ready.catch(() => {});
    vt.updateCallbackDone.catch(() => {});
    await vt.finished.catch(() => {});
    return;
  }

  /* Fallback: keluar lalu masuk */
  outlet.classList.add(dir >= 0 ? 'vt-out-fwd' : 'vt-out-back');
  await wait(140);
  outlet.classList.remove('vt-out-fwd', 'vt-out-back');
  swap();
  outlet.classList.add(dir >= 0 ? 'vt-in-fwd' : 'vt-in-back');
  await wait(280);
  outlet.classList.remove('vt-in-fwd', 'vt-in-back');
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function resolve() {
  if (navigating) return;
  const hit = match(location.hash);
  if (!hit) { go('/', { replace: true }); return; }
  navigating = true;
  try { await paint(hit); }
  catch (err) {
    console.error('[router] gagal merender', hit.path, err);
    outlet.innerHTML = errorScreen(err);
  }
  finally { navigating = false; }
}

function errorScreen(err) {
  return `<div class="pad-page"><div class="card card-pad">
    <h2 class="h3">Layar gagal dimuat</h2>
    <p class="muted">${String(err && err.message || err)}</p>
    <a class="btn btn-primary mt-4" href="#/">Kembali ke awal</a>
  </div></div>`;
}

export function startRouter() {
  window.addEventListener('hashchange', resolve);
  resolve();
}

/* Delegasi: setiap [data-go] menavigasi tanpa perlu listener sendiri */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-go]');
  if (!el) return;
  e.preventDefault();
  if (el.dataset.go === 'back') back();
  else go(el.dataset.go);
});
