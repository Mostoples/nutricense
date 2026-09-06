/* ============================================================
   NUTRICENSE — Mode tampilan + lapisan efek
   Dipakai bersama oleh landing page (site.js) dan aplikasi
   (main.js) supaya keduanya punya mode dan efek yang sama.

   Empat mode disimpan pada <html data-theme> dengan kunci
   localStorage 'nutricense-theme' — kunci yang sama dengan
   skrip anti-kedip di <head>, jadi tidak ada flash saat muat.
   ============================================================ */

'use strict';

import { icon } from './icons.js';

const KEY = 'nutricense-theme';

export const MODES = [
  { id: 'light', label: 'Terang',      ic: 'sun',     desc: 'Putih bersih, kontras tinggi' },
  { id: 'dark',  label: 'Gelap',       ic: 'moon',    desc: 'Hemat mata di ruang redup' },
  { id: 'neu',   label: 'Neumorphism', ic: 'grid',    desc: 'Permukaan lembut, tanpa garis' },
  { id: 'aura',  label: 'Aura',        ic: 'sparkle', desc: 'Kabut warna dan tepi berpendar' },
];

const IDS = MODES.map((m) => m.id);

export function getMode() {
  const t = document.documentElement.getAttribute('data-theme');
  return IDS.includes(t) ? t : 'light';
}

export function setMode(id) {
  const next = IDS.includes(id) ? id : 'light';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem(KEY, next); } catch (e) { /* mode privat */ }
  document.dispatchEvent(new CustomEvent('nc:mode', { detail: next }));
  syncPickers();
  return next;
}

export function cycleMode() {
  return setMode(IDS[(IDS.indexOf(getMode()) + 1) % IDS.length]);
}

/* ─────────────── Pemilih mode ─────────────── */

/** Deretan tombol mode. Dipakai di Pengaturan dan pada nav landing. */
export function modePicker({ compact = false } = {}) {
  return `<div class="mode-picker ${compact ? 'is-compact' : ''}" role="radiogroup" aria-label="Mode tampilan">
    ${MODES.map((m) => `
      <button type="button" class="mode-opt" role="radio" data-mode="${m.id}"
              aria-checked="false" title="${m.label}">
        <span class="mode-opt-ic">${icon(m.ic, { size: compact ? 17 : 19 })}</span>
        ${compact ? '' : `<span class="mode-opt-txt"><b>${m.label}</b><i>${m.desc}</i></span>`}
        <span class="mode-swatch mode-swatch-${m.id}" aria-hidden="true"></span>
      </button>`).join('')}
  </div>`;
}

function syncPickers() {
  const cur = getMode();
  document.querySelectorAll('.mode-opt').forEach((b) => {
    const on = b.dataset.mode === cur;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-checked', String(on));
  });
  document.querySelectorAll('[data-act="theme"] svg').forEach((s) => {
    const m = MODES.find((x) => x.id === cur) || MODES[0];
    s.outerHTML = icon(m.ic, { size: 22 });
  });
}

/** Pasang delegasi klik sekali; aman dipanggil berkali-kali. */
let wired = false;
export function wireModes() {
  if (!wired) {
    wired = true;
    document.addEventListener('click', (e) => {
      const opt = e.target.closest('.mode-opt');
      if (opt) { setMode(opt.dataset.mode); return; }
      if (e.target.closest('[data-act="theme"]')) cycleMode();
    });
  }
  syncPickers();
}

/* ─────────────── Lapisan efek ─────────────── */

/**
 * Tempel lapisan efek ke <body>: kabut aurora, kisi, garis pindai,
 * dan derau. Hanya sekali; aman dipanggil ulang.
 */
export function mountFx() {
  if (document.querySelector('.fx-layer')) return;
  const layer = document.createElement('div');
  layer.className = 'fx-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML =
    '<div class="fx-aurora"><i></i><i></i><i></i></div>' +
    '<div class="fx-grid"></div>' +
    '<div class="fx-scan"></div>' +
    '<div class="fx-grain"></div>';
  document.body.prepend(layer);
}

/**
 * Beri kartu efek kilau + sorot mengikuti kursor.
 * Pointer dilacak lewat satu listener di dokumen, bukan satu per
 * kartu — dengan puluhan kartu per halaman itu jauh lebih murah.
 */
const SPOT_SEL = '.card, .prob, .role, .flow li, .stat, .shot, .feat, .mode, .demo-note';
let spotWired = false;

export function wireCardFx(root = document) {
  root.querySelectorAll(SPOT_SEL).forEach((el) => {
    el.classList.add('has-spot');
    if (el.matches('.card, .prob, .role, .shot, .demo-note')) el.classList.add('has-shine');
  });

  if (spotWired) return;
  spotWired = true;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover)').matches) return;   /* sentuh: lewati */

  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest(SPOT_SEL);
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
}

/** Panggilan tunggal yang biasa dipakai halaman. */
export function initFx({ cards = true } = {}) {
  mountFx();
  wireModes();
  if (cards) wireCardFx(document);
}
