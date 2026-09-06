/* ============================================================
   NUTRICENSE — Pustaka komponen UI
   Fungsi murni yang mengembalikan string HTML, plus beberapa
   helper imperatif (toast, sheet). Semua komponen dipakai
   bersama oleh keempat peran agar tampilan tetap konsisten.
   ============================================================ */

'use strict';

import { icon } from './icons.js';
import { gaugeRing, sparkField, trayGlyph } from './decor.js';
import { fmtNum, fsiTone, statusTone } from './store.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ─────────────── App bar ─────────────── */
export function appBar({ title, back = false, sub = '', right = '', center = true } = {}) {
  return `
<header class="appbar">
  ${back ? `<button class="icon-btn" data-go="back" aria-label="Kembali">${icon('arrowLeft')}</button>`
         : `<span class="appbar-spacer"></span>`}
  <div class="appbar-title ${center ? 'is-center' : ''}">
    <h1>${esc(title)}</h1>
    ${sub ? `<p>${esc(sub)}</p>` : ''}
  </div>
  <div class="appbar-right">${right}</div>
</header>`;
}

export function iconBtn(name, { go = '', act = '', label = '', badge = 0 } = {}) {
  const attrs = [go ? `data-go="${go}"` : '', act ? `data-act="${act}"` : ''].join(' ');
  return `<button class="icon-btn" ${attrs} aria-label="${esc(label || name)}">
    ${icon(name)}${badge ? `<span class="dot-badge">${badge > 9 ? '9+' : badge}</span>` : ''}
  </button>`;
}

/* ─────────────── Kartu ─────────────── */
export function card(inner, { cls = '', pad = true, tag = 'section' } = {}) {
  return `<${tag} class="card ${pad ? 'card-pad' : ''} ${cls}">${inner}</${tag}>`;
}

export function sectionHead(title, right = '') {
  return `<div class="sec-head"><h2 class="sec-title">${esc(title)}</h2>${right}</div>`;
}

export function linkMore(label, go) {
  return `<button class="link-more" data-go="${go}">${esc(label)}${icon('chevron', { size: 15 })}</button>`;
}

/* ─────────────── Baris daftar ─────────────── */
export function listRow({ title, sub = '', lead = '', trail = '', go = '', tone = '' }) {
  const t = trail || icon('chevron', { size: 17, cls: 'row-chev' });
  return `<${go ? 'button' : 'div'} class="row ic-host ${tone ? 'row-' + tone : ''}" ${go ? `data-go="${go}"` : ''}>
    ${lead ? `<span class="row-lead">${lead}</span>` : ''}
    <span class="row-main">
      <span class="row-title">${esc(title)}</span>
      ${sub ? `<span class="row-sub">${sub}</span>` : ''}
    </span>
    <span class="row-trail">${t}</span>
  </${go ? 'button' : 'div'}>`;
}

/* ─────────────── Lencana ─────────────── */
export function badge(text, tone = 'ok') {
  return `<span class="badge badge-${tone}">${esc(text)}</span>`;
}
export function statusBadge(text) { return badge(text, statusTone(text)); }

/* ─────────────── Chip makro (kalori / protein / karbo / lemak) ─────────────── */
export function macroChips(g) {
  const defs = [
    { k: 'kal', v: g.kal,     unit: 'kkal', label: 'Kalori' },
    { k: 'pro', v: g.protein, unit: 'g',    label: 'Protein' },
    { k: 'krb', v: g.karbo,   unit: 'g',    label: 'Karbohidrat' },
    { k: 'lem', v: g.lemak,   unit: 'g',    label: 'Lemak' },
  ];
  return `<div class="macro-row">${defs.map((d) => `
    <div class="macro macro-${d.k}">
      <b>${fmtNum(d.v)}<i>${d.unit}</i></b>
      <span>${d.label}</span>
    </div>`).join('')}</div>`;
}

/* ─────────────── Kartu Food Safety Index ─────────────── */
export function fsiCard(nilai, { status = '', sub = '', big = true } = {}) {
  const tone = fsiTone(nilai);
  const label = status || (tone === 'ok' ? 'AMAN' : tone === 'warn' ? 'PERLU PERHATIAN' : 'BERMASALAH');
  const ic = tone === 'ok' ? 'checkCircle' : tone === 'warn' ? 'alertCircle' : 'xCircle';
  return `
<div class="fsi fsi-${tone} ${big ? 'is-big' : ''}">
  <div class="fsi-copy">
    <span class="fsi-label">Food Safety Index</span>
    <p class="fsi-num"><b>${nilai}</b><i>/100</i></p>
    <span class="fsi-status">${esc(label)}</span>
    ${sub ? `<span class="fsi-sub">${esc(sub)}</span>` : ''}
  </div>
  <div class="fsi-gauge">
    ${gaugeRing(nilai)}
    <span class="fsi-gauge-ic">${icon(ic, { size: 26 })}</span>
  </div>
</div>`;
}

/* ─────────────── Statistik ringkas ─────────────── */
export function statTile({ value, label, ic = '', tone = 'g' }) {
  return `<div class="stat stat-${tone} ic-host">
    ${ic ? `<span class="stat-ic">${icon(ic, { size: 18 })}</span>` : ''}
    <b class="stat-val">${typeof value === 'number' ? fmtNum(value) : esc(value)}</b>
    <span class="stat-lbl">${esc(label)}</span>
  </div>`;
}

export function statRow(items) {
  return `<div class="stat-row">${items.map(statTile).join('')}</div>`;
}

/* ─────────────── Segmented tabs ─────────────── */
export function segmented(items, activeIdx = 0, name = 'seg') {
  return `<div class="segmented" role="tablist" data-seg="${name}">
    ${items.map((it, i) => `<button role="tab" class="seg ${i === activeIdx ? 'is-on' : ''}"
      data-seg-idx="${i}" aria-selected="${i === activeIdx}">${esc(it)}</button>`).join('')}
  </div>`;
}

/* ─────────────── Kolom pencarian & filter ─────────────── */
export function searchBar(ph = 'Cari…', { filter = false, target = '' } = {}) {
  return `<div class="searchbar">
    <span class="searchbar-ic">${icon('search', { size: 18 })}</span>
    <input type="search" placeholder="${esc(ph)}" aria-label="${esc(ph)}"
           ${target ? `data-filter-target="${target}"` : ''}>
    ${filter ? `<button class="icon-btn sm" aria-label="Filter">${icon('filter', { size: 18 })}</button>` : ''}
  </div>`;
}

export function selectField(label, options, { id = '' } = {}) {
  return `<label class="field">
    ${label ? `<span class="field-label">${esc(label)}</span>` : ''}
    <span class="field-box has-chev">
      <select ${id ? `id="${id}"` : ''}>${options.map((o) => `<option>${esc(o)}</option>`).join('')}</select>
      ${icon('chevronDown', { size: 17 })}
    </span>
  </label>`;
}

export function textField(label, { ph = '', type = 'text', hint = '', id = '', ic = '', pw = false } = {}) {
  return `<label class="field">
    ${label ? `<span class="field-label">${esc(label)}</span>` : ''}
    <span class="field-box">
      ${ic ? `<span class="field-ic">${icon(ic, { size: 18 })}</span>` : ''}
      <input type="${type}" placeholder="${esc(ph)}" ${id ? `id="${id}"` : ''}>
      ${pw ? `<button type="button" class="field-eye" data-act="toggle-pw" aria-label="Tampilkan kata sandi">${icon('eye', { size: 18 })}</button>` : ''}
    </span>
    ${hint ? `<span class="field-hint">${esc(hint)}</span>` : ''}
  </label>`;
}

/* ─────────────── Tombol ─────────────── */
export function btn(label, { go = '', act = '', variant = 'primary', ic = '', wide = false, type = 'button' } = {}) {
  const attrs = [go ? `data-go="${go}"` : '', act ? `data-act="${act}"` : ''].join(' ');
  return `<button type="${type}" class="btn btn-${variant} ${wide ? 'is-wide' : ''} ic-host" ${attrs}>
    ${ic ? icon(ic, { size: 18 }) : ''}<span>${esc(label)}</span>
  </button>`;
}

/* ─────────────── Bar progres ─────────────── */
export function meter(pct, tone = 'ok') {
  const p = Math.max(0, Math.min(100, pct));
  return `<span class="meter"><i class="meter-fill meter-${tone}" style="--w:${p}%"></i></span>`;
}

/* ─────────────── Sparkline (garis tren) ─────────────── */
export function sparkline(data, { w = 220, h = 64, labels = null, tone = 'accent' } = {}) {
  if (!data || data.length < 2) return '';
  const min = Math.min(...data), max = Math.max(...data);
  const span = (max - min) || 1;
  const px = (i) => (i / (data.length - 1)) * (w - 12) + 6;
  const py = (v) => h - 10 - ((v - min) / span) * (h - 24);
  const pts = data.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`);
  const line = 'M' + pts.join(' L');
  const area = line + ` L${px(data.length - 1).toFixed(1)},${h} L${px(0).toFixed(1)},${h} Z`;
  const id = 'sp' + Math.random().toString(36).slice(2, 8);
  return `
<div class="spark">
  <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="spark-svg spark-${tone}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="currentColor" stop-opacity=".22"/>
      <stop offset="1" stop-color="currentColor" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${area}" fill="url(#${id})"/>
    <path d="${line}" fill="none" stroke="currentColor" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round" class="spark-line"/>
    ${data.map((v, i) => `<circle cx="${px(i).toFixed(1)}" cy="${py(v).toFixed(1)}" r="2.6"
       fill="currentColor" class="spark-dot" style="animation-delay:${(i * 60)}ms"/>`).join('')}
  </svg>
  ${labels ? `<div class="spark-labels">${labels.map((l) => `<span>${esc(l)}</span>`).join('')}</div>` : ''}
</div>`;
}

/* ─────────────── Donut (distribusi status) ─────────────── */
export function donut(parts, { size = 148, thickness = 18, center = '' } = {}) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const r = 50 - thickness / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  const arcs = parts.map((p, i) => {
    const frac = p.value / total;
    const dash = `${(C * frac).toFixed(2)} ${(C * (1 - frac)).toFixed(2)}`;
    const off = -C * acc;
    acc += frac;
    return `<circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--${p.tone})"
      stroke-width="${thickness}" stroke-dasharray="${dash}" stroke-dashoffset="${off.toFixed(2)}"
      transform="rotate(-90 50 50)" class="donut-arc" style="animation-delay:${i * 120}ms"/>`;
  }).join('');
  return `<div class="donut" style="width:${size}px">
    <svg viewBox="0 0 100 100">${arcs}</svg>
    ${center ? `<div class="donut-center">${center}</div>` : ''}
  </div>`;
}

export function legend(parts) {
  return `<ul class="legend">${parts.map((p) => `
    <li><i style="background:var(--${p.tone})"></i>
      <span>${esc(p.label)}</span>
      <b>${fmtNum(p.value)}${p.suffix || ''}</b></li>`).join('')}</ul>`;
}

/* ─────────────── Bottom nav (mobile) + rail (desktop) ─────────────── */
export function navBar(items, activeId) {
  return `
<nav class="tabbar" aria-label="Navigasi utama">
  ${items.map((it) => `
    <a class="tab ${it.id === activeId ? 'is-active' : ''}" href="#${it.go}" data-tab="${it.id}">
      <span class="tab-ic">${icon(it.ic, { size: 21 })}</span>
      <span class="tab-lbl">${esc(it.label)}</span>
      <span class="tab-pip"></span>
    </a>`).join('')}
</nav>`;
}

export function sideRail(items, activeId, { title = 'Nutricense', sub = '' } = {}) {
  return `
<aside class="rail">
  <div class="rail-brand">
    <span class="rail-mark" data-nc-mark></span>
    <span class="rail-name"><b>${esc(title)}</b>${sub ? `<i>${esc(sub)}</i>` : ''}</span>
  </div>
  <nav class="rail-nav">
    ${items.map((it) => `
      <a class="rail-item ${it.id === activeId ? 'is-active' : ''}" href="#${it.go}">
        <span class="rail-ic">${icon(it.ic, { size: 20 })}</span>
        <span>${esc(it.label)}</span>
      </a>`).join('')}
  </nav>
  <div class="rail-foot">
    <button class="rail-item" data-act="theme">${icon('moon', { size: 20 })}<span>Ganti Tema</span></button>
    <button class="rail-item is-danger" data-act="logout">${icon('logout', { size: 20 })}<span>Keluar</span></button>
  </div>
</aside>`;
}

/* ─────────────── Keadaan kosong ─────────────── */
export function emptyState(title, sub = '', ic = 'sparkle') {
  return `<div class="empty">
    <span class="empty-ic">${icon(ic, { size: 34 })}${sparkField(4)}</span>
    <b>${esc(title)}</b>${sub ? `<p>${esc(sub)}</p>` : ''}
  </div>`;
}

/* ─────────────── Thumbnail makanan (tanpa foto eksternal) ─────────────── */
const THUMB_ICON = { g: 'leaf', pro: 'apple', krb: 'utensils', kal: 'apple', lem: 'beaker' };

export function foodThumb(tone = 'g', size = 52) {
  /* Di bawah 60 px, ilustrasi nampan berubah jadi bubur piksel dan
     terbaca seperti ikon gambar rusak — pakai ikon tunggal yang tebal. */
  const inner = size < 60
    ? icon(THUMB_ICON[tone] || 'leaf', { size: Math.round(size * 0.46), sw: 2 })
    : trayGlyph(Math.round(size * 0.72));
  return `<span class="thumb thumb-${tone}" style="--s:${size}px">${inner}</span>`;
}

/* ─────────────── Toast ─────────────── */
export function toast(title, msg = '', tone = 'ok', ms = 3600) {
  let host = document.getElementById('toasts');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toasts';
    document.body.appendChild(host);
  }
  const ic = tone === 'ok' ? 'checkCircle' : tone === 'warn' ? 'alertCircle' : tone === 'bad' ? 'xCircle' : 'sparkle';
  const el = document.createElement('div');
  el.className = 'toast toast-' + tone;
  el.innerHTML = `<span class="toast-ic">${icon(ic, { size: 20 })}</span>
    <span class="toast-body"><b>${esc(title)}</b>${msg ? `<p>${esc(msg)}</p>` : ''}</span>
    <button class="toast-x" aria-label="Tutup">${icon('x', { size: 15 })}</button>`;
  el.querySelector('.toast-x').onclick = () => dismiss();
  host.appendChild(el);
  const dismiss = () => {
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 320);
  };
  const t = setTimeout(dismiss, ms);
  el.addEventListener('pointerdown', () => clearTimeout(t), { once: true });
  return dismiss;
}

/* ─────────────── Sheet (panel bawah) ─────────────── */
export function sheet(title, bodyHtml, { actions = '' } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `
    <div class="sheet-scrim" data-close></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <span class="sheet-grip"></span>
      <div class="sheet-head"><h3>${esc(title)}</h3>
        <button class="icon-btn sm" data-close aria-label="Tutup">${icon('x', { size: 17 })}</button></div>
      <div class="sheet-body">${bodyHtml}</div>
      ${actions ? `<div class="sheet-actions">${actions}</div>` : ''}
    </div>`;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('is-on'));
  const close = () => {
    wrap.classList.remove('is-on');
    setTimeout(() => wrap.remove(), 300);
  };
  wrap.querySelectorAll('[data-close]').forEach((n) => n.addEventListener('click', close));
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
  });
  return { close, root: wrap };
}

/* ─────────────── Pembungkus halaman ─────────────── */
export function page(inner, { cls = '' } = {}) {
  return `<div class="page ${cls}">${inner}</div>`;
}
