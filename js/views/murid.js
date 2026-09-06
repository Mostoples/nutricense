/* ============================================================
   NUTRICENSE — Peran Murid
   Tampilan paling ringkas: apa yang dimakan hari ini, apakah
   aman, dan bacaan edukasi gizi.
   ============================================================ */

'use strict';

import { icon } from '../icons.js';
import { blobField, sparkField } from '../decor.js';
import {
  appBar, card, page, listRow, macroChips, fsiCard, statusBadge,
  searchBar, sectionHead, linkMore, foodThumb, btn, iconBtn, esc, emptyState,
} from '../ui.js';
import {
  MENU_HARI_INI, PEMERIKSAAN_HARI_INI, RIWAYAT, ARTIKEL,
  PROFIL_SEKOLAH, session,
} from '../store.js';
import { setChrome } from './shell.js';
import { wireFilter } from './sekolah.js';

/* ─────────────── 1. Dashboard Murid ─────────────── */
export function home() {
  const m = MENU_HARI_INI;
  return {
    title: 'Dashboard Murid',
    html: page(`
${appBar({
  title: 'Halo, Siswa 👋', sub: session.org || PROFIL_SEKOLAH.nama, center: false,
  right: iconBtn('bell', { label: 'Notifikasi' }),
})}

<div class="hero-greet is-slim">
  <div>
    <p class="greet-hi">Menu Hari Ini</p>
    <p class="greet-sub">${esc(m.items.map((i) => i.nama).join(' + '))}</p>
  </div>
  <span class="greet-art">${blobField({ opacity: .9 })}</span>
</div>

${card(`
  <div class="menu-head">
    <span class="menu-thumb">${foodThumb('g', 76)}</span>
    <div>
      <h3 class="h3">${esc(m.judul)}</h3>
      <p class="muted" style="font-size:.82rem">Total ${m.gizi.kal} kkal per porsi</p>
    </div>
  </div>
`)}

${sectionHead('Informasi Gizi')}
${card(macroChips(m.gizi))}

${sectionHead('Food Safety Index')}
${fsiCard(89, { sub: 'Dari hasil pemeriksaan sekolah' })}

${sectionHead('Edukasi Gizi', linkMore('Lihat Semua', '/murid/edukasi'))}
${card(ARTIKEL.slice(0, 3).map((a) => listRow({
  title: a.judul, lead: `<span class="row-ic tone-g">${icon(a.ic, { size: 18 })}</span>`,
  go: '/murid/edukasi',
})).join(''), { pad: false })}
`),
    mount() { setChrome('murid', 'home'); },
  };
}

/* ─────────────── 2. Menu ─────────────── */
export function menu() {
  const m = MENU_HARI_INI;
  return {
    title: 'Menu',
    html: page(`
${appBar({ title: 'Menu Hari Ini', back: true, sub: '8 Agustus 2026' })}
${card(m.items.map((it) => listRow({
  title: it.nama, sub: `Kalori ${it.kal} kkal · ${esc(it.ket)}`,
  lead: foodThumb(it.tone, 46),
})).join(''), { pad: false })}
${sectionHead('Total Gizi per Porsi')}
${card(macroChips(m.gizi))}
${sectionHead('Rincian')}
${card(m.detail.map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join(''))}
`),
    mount() { setChrome('murid', 'menu'); },
  };
}

/* ─────────────── 3. Edukasi ─────────────── */
export function edukasi() {
  return {
    title: 'Edukasi',
    html: page(`
${appBar({ title: 'Edukasi', back: true })}
${searchBar('Cari artikel edukasi…', { target: '#list-edu' })}
${sectionHead('Artikel Populer')}
<div id="list-edu">
  ${card(ARTIKEL.map((a) => listRow({
    title: a.judul,
    lead: `<span class="thumb thumb-${a.tone}" style="--s:46px">${icon(a.ic, { size: 20 })}</span>`,
    go: '/murid/edukasi',
  })).join(''), { pad: false })}
</div>
${sectionHead('Video Edukasi')}
${card(`
  <div class="video-card">
    <span class="video-play">${icon('sparkle', { size: 22 })}</span>
    <div><b>Gizi Seimbang untuk Remaja</b><span class="muted">4 menit · Nutricense</span></div>
  </div>
`)}
`),
    mount(root) { setChrome('murid', 'edukasi'); wireFilter(root, '#list-edu .row'); },
  };
}

/* ─────────────── 4. Riwayat ─────────────── */
export function riwayat() {
  return {
    title: 'Riwayat',
    html: page(`
${appBar({ title: 'Riwayat', back: true })}
${searchBar('Cari riwayat…', { target: '#list-mri' })}
<div class="mt-4" id="list-mri">
  ${card(RIWAYAT.map((r, i) => listRow({
    title: r.tgl, sub: `${esc(r.menu)}<br>${esc(r.sppg)}`,
    lead: foodThumb(i % 2 ? 'kal' : 'g', 44),
    trail: statusBadge(r.status === 'sesuai' ? 'Sesuai' : 'Tidak Sesuai'),
  })).join(''), { pad: false })}
</div>
`),
    mount(root) { setChrome('murid', 'riwayat'); wireFilter(root, '#list-mri .row'); },
  };
}

/* ─────────────── 5. Profil ─────────────── */
export function profil() {
  return {
    title: 'Profil',
    html: page(`
${appBar({ title: 'Profil', back: true, right: iconBtn('settings', { go: '/pengaturan', label: 'Pengaturan' }) })}
<div class="profile-head">
  <span class="profile-av">${icon('user', { size: 30, draw: true })}${sparkField(3)}</span>
  <b>${esc(session.name || 'Siswa')}</b>
  <span class="muted">${esc(session.org || PROFIL_SEKOLAH.nama)}</span>
</div>
${sectionHead('Informasi')}
${card(`
  <div class="kv"><span>NISN</span><b>${esc(session.id || '—')}</b></div>
  <div class="kv"><span>Sekolah</span><b>${esc(PROFIL_SEKOLAH.nama)}</b></div>
  <div class="kv"><span>Peran</span><b>Murid</b></div>
`)}
<div class="mt-5">${btn('Keluar Akun', { act: 'logout', variant: 'danger', wide: true, ic: 'logout' })}</div>
`),
    mount() { setChrome('murid', 'profil'); },
  };
}
