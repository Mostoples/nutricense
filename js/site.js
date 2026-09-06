/* ============================================================
   NUTRICENSE — Skrip halaman company profile
   Menangani: hidrasi ikon, dekorasi SVG, reveal saat digulir,
   penghitung angka, navigasi, tema, model 3D produk, dan
   kartu tim (dengan cadangan inisial bila foto belum ada).
   ============================================================ */

'use strict';

import { hydrateIcons, icon } from './icons.js';
import { blobField, plateContour, sparkField, logoMark, scatterDeco } from './decor.js';
import { initFx, modePicker } from './fx.js';
import { mountProduct } from './nc3d.js';

/* ────────────────────────────────────────────────────────────
   DATA TIM — sunting bagian ini saja untuk mengganti anggota.
   `foto` menunjuk ke berkas di assets/img/. Bila berkas belum
   ada, kartu otomatis menampilkan inisial, bukan gambar rusak.
   ──────────────────────────────────────────────────────────── */
const TEAM = [
  { nama: 'Anggota 1', peran: 'Ketua Tim · Riset & Produk',      foto: 'assets/img/team-1.jpg' },
  { nama: 'Anggota 2', peran: 'Perangkat Keras & Sensor',         foto: 'assets/img/team-2.jpg' },
  { nama: 'Anggota 3', peran: 'AI & Visi Komputer',               foto: 'assets/img/team-3.jpg' },
  { nama: 'Anggota 4', peran: 'Analisis Gizi & Food Safety',      foto: 'assets/img/team-4.jpg' },
  { nama: 'Anggota 5', peran: 'Pengembang Aplikasi',              foto: 'assets/img/team-5.jpg' },
  { nama: 'Anggota 6', peran: 'Desain & Dokumentasi',             foto: 'assets/img/team-6.jpg' },
];

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─────────────── Mode tampilan ─────────────── */
function initModes() {
  /* Pemilih ringkas di navbar; tombol ikon tetap ada sebagai
     pintasan siklus untuk layar sempit. Keduanya ditangani fx.js. */
  const host = $('#nav-modes');
  if (host) host.innerHTML = modePicker({ compact: true });
  initFx();                       /* lapisan efek + delegasi klik mode */
}

/* ─────────────── Dekorasi kartu ─────────────── */
function initCardDeco() {
  scatterDeco($$('.prob'), { size: 128, positions: ['tr', 'br'] });
  scatterDeco($$('.role'), { size: 136, positions: ['br', 'tr'] });
  scatterDeco($$('.flow li'), { size: 118, positions: ['tr'] });
  scatterDeco($$('.faq'), { size: 96, positions: ['tr'] });
  scatterDeco($$('.demo-note'), { size: 170, positions: ['br'] });
}

/* ─────────────── Navigasi ─────────────── */
function initNav() {
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 20);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  const burger = $('#burger');
  const links = $('#nav-links');
  burger?.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  links?.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      links.classList.remove('is-open');
      burger?.setAttribute('aria-expanded', 'false');
    }
  });

  /* Sorot tautan sesuai seksi yang sedang terlihat */
  const ids = $$('#nav-links a').map((a) => a.getAttribute('href')).filter((h) => h?.startsWith('#'));
  const sections = ids.map((i) => $(i)).filter(Boolean);
  if (!sections.length) return;
  const spy = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      $$('#nav-links a').forEach((a) =>
        a.classList.toggle('is-on', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));
}

/* ─────────────── Reveal saat digulir ─────────────── */
function initReveal() {
  const items = $$('.reveal');
  if (reduced) { items.forEach((n) => n.classList.add('in')); return; }
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en, i) => {
      if (!en.isIntersecting) return;
      en.target.style.transitionDelay = Math.min(i * 60, 240) + 'ms';
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  items.forEach((n) => io.observe(n));
}

/* ─────────────── Penghitung angka ─────────────── */
function initCounters() {
  const nums = $$('[data-count]');
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      const el = en.target;
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const fmt = (v) => new Intl.NumberFormat('id-ID').format(Math.round(v)) + suffix;
      if (reduced || !Number.isFinite(target)) { el.textContent = fmt(target); return; }
      const t0 = performance.now(), dur = 1400;
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  nums.forEach((n) => io.observe(n));
}

/* ─────────────── Dekorasi SVG ─────────────── */
function initDecor() {
  $$('[data-mark]').forEach((n) => { n.innerHTML = logoMark(Number(n.dataset.mark) || 36); });
  $$('[data-decor="blobs"]').forEach((n) => { n.innerHTML = blobField(); });
  $$('[data-decor="plate"]').forEach((n) => { n.innerHTML = plateContour(360); });
  $$('[data-decor="sparks"]').forEach((n) => { n.innerHTML = sparkField(7); });
}

/* ─────────────── Tim ─────────────── */
function initTeam() {
  const grid = $('#team-grid');
  if (!grid) return;

  const initials = (nama) => nama.split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();

  grid.innerHTML = TEAM.map((m, i) => `
    <article class="member reveal" style="--d:${i * 60}ms">
      <div class="member-photo">
        <img src="${m.foto}" alt="Foto ${m.nama}" loading="lazy">
        <span class="member-initials" aria-hidden="true">${initials(m.nama)}</span>
      </div>
      <h3>${m.nama}</h3>
      <p>${m.peran}</p>
    </article>`).join('');

  /* Foto yang belum tersedia diganti inisial — bukan ikon rusak. */
  grid.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => img.closest('.member-photo')?.classList.add('no-photo'), { once: true });
    if (img.complete && img.naturalWidth === 0) img.closest('.member-photo')?.classList.add('no-photo');
  });

  const hero = $('.team-hero img');
  hero?.addEventListener('error', () => hero.closest('.team-hero')?.classList.add('no-photo'), { once: true });
  if (hero?.complete && hero.naturalWidth === 0) hero.closest('.team-hero')?.classList.add('no-photo');
}

/* ─────────────── Video produk & galeri render ─────────────── */
function initMedia() {
  /* Video: sembunyikan seluruh blok bila berkasnya belum ada. */
  /* Setiap blok .prod-video ditangani sama: video produk dan showreel. */
  $$('.prod-video').forEach((wrap) => {
    const vid = wrap.querySelector('video');
    const cta = wrap.querySelector('.video-cta');
    if (!vid) return;

    /* Hosting me-rewrite path tak dikenal ke index.html, jadi berkas video
       yang belum ada balas 200 berisi HTML — bukan 404. Periksa
       content-type dulu, jangan mengandalkan event error saja. */
    const src = vid.querySelector('source')?.src;
    if (src) {
      fetch(src, { method: 'HEAD' })
        .then((r) => {
          const ct = r.headers.get('content-type') || '';
          if (!r.ok || !ct.startsWith('video/')) wrap.classList.add('no-video');
        })
        .catch(() => wrap.classList.add('no-video'));
    }
    vid.addEventListener('error', () => wrap.classList.add('no-video'), true);

    cta?.addEventListener('click', () => {
      /* Hentikan video lain agar tidak terdengar/terlihat bertumpuk */
      $$('.prod-video video').forEach((o) => { if (o !== vid) o.pause(); });
      wrap.classList.add('is-playing');
      vid.play().catch(() => wrap.classList.remove('is-playing'));
    });
    vid.addEventListener('pause', () => wrap.classList.remove('is-playing'));
    vid.addEventListener('play', () => wrap.classList.add('is-playing'));
  });

  /* Galeri: buang kartu yang gambarnya gagal dimuat; sembunyikan
     seluruh kisi bila belum ada render sama sekali. */
  const gal = $('#gallery');
  if (!gal) return;
  const shots = $$('.shot', gal);
  let dead = 0;
  const check = () => { if (dead >= shots.length) gal.classList.add('no-shots'); };
  shots.forEach((fig) => {
    const img = fig.querySelector('img');
    const fail = () => { fig.remove(); dead++; check(); };
    img.addEventListener('error', fail, { once: true });
    if (img.complete && img.naturalWidth === 0) fail();
  });

  /* Lightbox sederhana */
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.innerHTML = '<img alt=""><button class="lightbox-x" aria-label="Tutup"></button>';
  box.querySelector('.lightbox-x').innerHTML = icon('x', { size: 20 });
  document.body.appendChild(box);
  const shown = box.querySelector('img');
  const close = () => { box.classList.remove('is-on'); shown.src = ''; };
  box.addEventListener('click', (e) => { if (e.target !== shown) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  gal.addEventListener('click', (e) => {
    const img = e.target.closest('.shot img');
    if (!img) return;
    shown.src = img.dataset.full || img.src;
    shown.alt = img.alt;
    box.classList.add('is-on');
  });
}

/* ─────────────── Video latar hero ─────────────── */
function initHeroVideo() {
  const v = $('#hero-bg-video');
  if (!v) return;
  if (reduced) { v.remove(); return; }

  /* Sebagian peramban menolak autoplay walau muted; kalau ditolak,
     poster tetap tampil dan tidak ada yang rusak. */
  v.play().catch(() => {});

  /* Hentikan saat hero keluar layar — video latar tidak perlu
     terus mendekode dan menghabiskan baterai. */
  const hero = $('.hero');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.02 }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) v.pause();
    else if (!reduced) v.play().catch(() => {});
  });
}

/* ─────────────── Model 3D ─────────────── */
async function init3D() {
  const boxes = [];

  const hero = $('#hero-3d');
  if (hero) {
    const b = await mountProduct(hero);
    if (b) { boxes.push(b); b.setScanning(true); }
    else hero.closest('.hero-stage')?.classList.add('no-webgl');
  }

  const prod = $('#prod-3d');
  if (prod) {
    const b = await mountProduct(prod);
    if (b) {
      boxes.push(b);
      $$('.prod-controls [data-prod]').forEach((btn) => btn.addEventListener('click', () => {
        $$('.prod-controls [data-prod]').forEach((x) => x.classList.remove('is-on'));
        btn.classList.add('is-on');
        const k = btn.dataset.prod;
        if (k === 'scan') { b.setScanning(true); b.setStatus('safe'); }
        else { b.setScanning(false); b.setStatus(k); }
      }));
    } else {
      prod.closest('.prod-stage')?.classList.add('no-webgl');
      $('.prod-controls')?.remove();
    }
  }

  /* Warna model mengikuti tema */
  new MutationObserver(() => {
    const t = document.documentElement.getAttribute('data-theme') || 'light';
    boxes.forEach((b) => b.setTheme(t));
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

/* ─────────────── Jalankan ─────────────── */
function boot() {
  initDecor();
  initTeam();
  hydrateIcons(document);
  initModes();
  initCardDeco();
  initNav();
  initMedia();
  initReveal();
  initCounters();
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  initHeroVideo();
  init3D();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
