/* ============================================================
   NUTRICENSE — Peran SPPG (dapur penyedia)
   Dashboard, Menu, Bahan, Nutrisi, Pemeriksaan, Laporan,
   Riwayat Produksi, Pengiriman, Stok Bahan, dan Profil.
   ============================================================ */

'use strict';

import { icon } from '../icons.js';
import { blobField, sparkField } from '../decor.js';
import {
  appBar, card, page, listRow, badge, statusBadge, macroChips, fsiCard,
  statRow, segmented, searchBar, selectField, btn, iconBtn, sectionHead,
  linkMore, foodThumb, esc, toast, meter, sparkline, donut, legend, emptyState,
} from '../ui.js';
import {
  MENU_HARI_INI, PEMERIKSAAN_HARI_INI, BAHAN, PRODUKSI, PENGIRIMAN,
  PROFIL_SPPG, session, fmtNum, fsiTone,
} from '../store.js';
import { setChrome } from './shell.js';
import { wireFilter } from './sekolah.js';

/* ─────────────── 1. Dashboard SPPG ─────────────── */
export function home() {
  const m = MENU_HARI_INI;
  const p = PEMERIKSAAN_HARI_INI;
  return {
    title: 'Dashboard SPPG',
    html: page(`
${appBar({
  title: session.org || PROFIL_SPPG.nama, sub: '8 Agustus 2026', center: false,
  right: iconBtn('bell', { go: '/sppg/notifikasi', label: 'Notifikasi', badge: 1 }),
})}

<div class="col-a">
${card(`
  <div class="ribbon-head">
    <span class="eyebrow on-accent">Ringkasan Hari Ini</span>
    <span class="mono on-accent" style="font-size:.72rem">8 Agu 2026</span>
  </div>
  <div class="ribbon-stats">
    <div><b>${fmtNum(1250)}</b><span>Porsi Diproduksi</span></div>
    <div><b>${p.fsi}<i>/100</i></b><span>Food Safety Index</span></div>
    <div><b>AMAN</b><span>Status</span></div>
  </div>
  <span class="ribbon-art">${blobField({ opacity: .5 })}</span>
`, { cls: 'card-accent ribbon' })}

${sectionHead('Menu Hari Ini', linkMore('Lihat Detail', '/sppg/menu'))}
${card(`
  <div class="menu-head">
    <span class="menu-thumb">${foodThumb('g', 76)}</span>
    <div>
      <h3 class="h3">${esc(m.judul)}</h3>
      <p class="muted" style="font-size:.8rem">${m.items.map((i) => esc(i.nama)).join(', ')}</p>
    </div>
  </div>
`)}

${sectionHead('Informasi Nutrisi (per porsi)')}
${card(macroChips(m.gizi))}
</div>

<div class="col-b">
${sectionHead('Pemeriksaan Terakhir', linkMore('Detail', '/sppg/pemeriksaan'))}
${card(`
  ${fsiCard(p.fsi, { sub: 'Rata-rata 7 hari terakhir' })}
  <div class="mt-4">${sparkline(p.tren, { labels: p.trenLabel, tone: 'ok' })}</div>
`)}

${sectionHead('Pintasan')}
${card([
  { t: 'Kelola Menu', s: 'Susun menu harian & rencana', g: '/sppg/menu', ic: 'utensils' },
  { t: 'Stok Bahan', s: '7 bahan terpantau', g: '/sppg/stok', ic: 'package' },
  { t: 'Pengiriman', s: `${PENGIRIMAN.ringkas.terkirim} dari ${PENGIRIMAN.ringkas.total} sekolah`, g: '/sppg/pengiriman', ic: 'truck' },
  { t: 'Riwayat Produksi', s: 'Catatan produksi harian', g: '/sppg/produksi', ic: 'clipboard' },
].map((x) => listRow({
  title: x.t, sub: x.s, go: x.g,
  lead: `<span class="row-ic">${icon(x.ic, { size: 18 })}</span>`,
})).join(''), { pad: false })}
</div>
`, { cls: 'is-split' }),
    mount() { setChrome('sppg', 'home'); },
  };
}

/* ─────────────── 2. Menu ─────────────── */
export function menu() {
  const m = MENU_HARI_INI;
  return {
    title: 'Menu',
    html: page(`
${appBar({ title: 'Menu', back: true })}
${segmented(['Menu Hari Ini', 'Rencana Menu', 'Riwayat Menu'], 0, 'menu')}
<div class="date-strip mt-4">${icon('calendar', { size: 17 })}<span>8 Agustus 2026</span>${icon('chevronDown', { size: 16 })}</div>

<div id="menu-body" class="mt-3">
  ${card(m.items.map((it) => listRow({
    title: it.nama, sub: `Kalori ${it.kal} kkal · ${esc(it.ket)}`,
    lead: foodThumb(it.tone, 46), go: '/sppg/nutrisi',
  })).join(''), { pad: false })}
  <div class="mt-4">${btn('Tambah Menu', { act: 'tambah', variant: 'primary', wide: true, ic: 'plus' })}</div>
</div>
`),
    mount(root) {
      setChrome('sppg', 'menu');
      const body = root.querySelector('#menu-body');
      const asli = body.innerHTML;   /* simpan agar tab "Hari Ini" bisa dipulihkan */
      root.querySelectorAll('[data-seg="menu"] .seg').forEach((b) => b.addEventListener('click', () => {
        root.querySelectorAll('[data-seg="menu"] .seg').forEach((x) => x.classList.remove('is-on'));
        b.classList.add('is-on');
        body.innerHTML = b.dataset.segIdx === '0' ? asli : emptyState(
          b.dataset.segIdx === '1' ? 'Rencana menu belum disusun' : 'Riwayat menu kosong',
          'Data akan muncul setelah menu berikutnya dijadwalkan.', 'calendar');
        import('../icons.js').then((mod) => mod.hydrateIcons(body));
      }));
      root.querySelector('[data-act="tambah"]')?.addEventListener('click', () =>
        toast('Tambah menu', 'Penyusunan menu baru belum aktif pada demo.', 'info'));
    },
  };
}

/* ─────────────── 3. Bahan ─────────────── */
export function bahan() {
  return {
    title: 'Bahan',
    html: page(`
${appBar({ title: 'Bahan', back: true })}
${searchBar('Cari bahan makanan…', { target: '#list-bahan' })}
<div class="mt-3">${selectField('', ['Semua Kategori', 'Pokok', 'Protein', 'Sayur', 'Buah', 'Bumbu'])}</div>
${sectionHead('Daftar Bahan')}
<div id="list-bahan">
  ${card(BAHAN.map((b) => listRow({
    title: b.nama, sub: `Stok: ${b.stok} ${b.unit}`,
    lead: foodThumb(b.kat === 'Protein' ? 'pro' : b.kat === 'Buah' ? 'kal' : 'g', 44),
    go: '/sppg/stok',
  })).join(''), { pad: false })}
</div>
<div class="mt-4">${btn('Tambah Bahan', { act: 'tambah', variant: 'primary', wide: true, ic: 'plus' })}</div>
`),
    mount(root) {
      setChrome('sppg', 'bahan');
      wireFilter(root, '#list-bahan .row');
      root.querySelector('[data-act="tambah"]')?.addEventListener('click', () =>
        toast('Tambah bahan', 'Formulir bahan baru belum aktif pada demo.', 'info'));
    },
  };
}

/* ─────────────── 4. Nutrisi ─────────────── */
export function nutrisi() {
  const m = MENU_HARI_INI;
  return {
    title: 'Nutrisi',
    html: page(`
${appBar({ title: 'Nutrisi', back: true, sub: '8 Agustus 2026' })}
${sectionHead('Ringkasan Nutrisi (per porsi)')}
${card(macroChips(m.gizi))}
${sectionHead('Detail Nutrisi')}
${card(m.detail.map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join(''))}
${sectionHead('Komposisi Energi')}
${card(`
  <div class="split-chart">
    ${donut([
      { label: 'Karbohidrat', value: m.gizi.karbo, tone: 'macro-krb-ink' },
      { label: 'Protein', value: m.gizi.protein, tone: 'macro-pro-ink' },
      { label: 'Lemak', value: m.gizi.lemak, tone: 'macro-lem-ink' },
    ], { center: `<b>${m.gizi.kal}</b>kkal` })}
    ${legend([
      { label: 'Karbohidrat', value: m.gizi.karbo, tone: 'macro-krb-ink', suffix: ' g' },
      { label: 'Protein', value: m.gizi.protein, tone: 'macro-pro-ink', suffix: ' g' },
      { label: 'Lemak', value: m.gizi.lemak, tone: 'macro-lem-ink', suffix: ' g' },
    ])}
  </div>
`)}
`),
    mount() { setChrome('sppg', 'menu'); },
  };
}

/* ─────────────── 5. Pemeriksaan ─────────────── */
export function pemeriksaan() {
  const p = PEMERIKSAAN_HARI_INI;
  return {
    title: 'Pemeriksaan',
    html: page(`
${appBar({ title: 'Pemeriksaan', back: true })}
${segmented(['Hari Ini', 'Riwayat'], 0, 'per')}
<div class="mt-4">${fsiCard(p.fsi, { status: p.status })}</div>
${sectionHead('Hasil Pemeriksaan')}
${card(p.baris.map((b) => `
  <div class="kv"><span>${icon(b.ic, { size: 15 })} ${esc(b.label)}</span>
    <b>${esc(b.nilai)} ${badge('Aman', 'ok')}</b></div>`).join(''))}
${sectionHead('Tren 7 Hari')}
${card(sparkline(p.tren, { labels: p.trenLabel, tone: 'ok' }))}
<div class="mt-4">${btn('Lihat Detail Pemeriksaan', { go: '/sppg/produksi', variant: 'primary', wide: true })}</div>
`),
    mount(root) {
      setChrome('sppg', 'periksa');
      root.querySelectorAll('[data-seg="per"] .seg').forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.segIdx === '1') location.hash = '#/sppg/produksi';
      }));
    },
  };
}

/* ─────────────── 6. Laporan ─────────────── */
export function laporan() {
  return {
    title: 'Laporan',
    html: page(`
${appBar({ title: 'Laporan', back: true })}
${segmented(['Hari Ini', 'Mingguan', 'Bulanan'], 0, 'lap')}
<div class="date-strip mt-4">${icon('calendar', { size: 17 })}<span>8 Agustus 2026</span></div>
${sectionHead('Ringkasan Laporan')}
${card([
  ['package', 'Porsi Diproduksi', fmtNum(1250)],
  ['activity', 'Rata-rata Kalori', '650 kkal'],
  ['shield', 'Rata-rata FSI', '92/100'],
  ['checkCircle', 'Tingkat Kesesuaian Menu', '98%'],
].map(([ic, k, v]) => `
  <div class="kv"><span>${icon(ic, { size: 16 })} ${esc(k)}</span><b>${esc(v)}</b></div>`).join(''))}
<div class="mt-4">${btn('Unduh Laporan', { act: 'unduh', variant: 'primary', wide: true, ic: 'download' })}</div>
`),
    mount(root) {
      setChrome('sppg', 'laporan');
      root.querySelector('[data-act="unduh"]')?.addEventListener('click', () => exportCSV());
    },
  };
}

function exportCSV() {
  const rows = [
    ['Tanggal', 'Menu', 'Porsi', 'FSI', 'Status'],
    ...PRODUKSI.map((p) => [p.tgl, p.menu, p.porsi, p.fsi, p.status]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = `nutricense-laporan-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast('Laporan diunduh', `${PRODUKSI.length} baris produksi diekspor sebagai CSV.`, 'ok');
}

/* ─────────────── 7. Riwayat Produksi ─────────────── */
export function produksi() {
  return {
    title: 'Riwayat Produksi',
    html: page(`
${appBar({ title: 'Riwayat Produksi', back: true })}
${searchBar('Cari riwayat…', { filter: true, target: '#list-prod' })}
<div class="mt-4" id="list-prod">
  ${card(PRODUKSI.map((p) => listRow({
    title: p.tgl,
    sub: `Menu: ${esc(p.menu)}<br>Porsi: ${fmtNum(p.porsi)} · FSI: ${p.fsi}/100`,
    lead: `<span class="row-ic">${icon('clipboard', { size: 18 })}</span>`,
    trail: statusBadge(p.status),
  })).join(''), { pad: false })}
</div>
`),
    mount(root) { setChrome('sppg', 'periksa'); wireFilter(root, '#list-prod .row'); },
  };
}

/* ─────────────── 8. Pengiriman ─────────────── */
export function pengiriman() {
  const r = PENGIRIMAN.ringkas;
  return {
    title: 'Pengiriman',
    html: page(`
${appBar({ title: 'Pengiriman', back: true })}
${searchBar('Cari sekolah…', { target: '#list-kirim' })}
${sectionHead('Pengiriman Hari Ini')}
${card(`
  <div class="split-chart">
    ${donut([
      { label: 'Terkirim', value: r.terkirim, tone: 'ok' },
      { label: 'Dalam Proses', value: r.proses, tone: 'warn' },
      { label: 'Belum Terkirim', value: Math.max(r.belum, 0.0001), tone: 'bad' },
    ], { center: `<b>${r.total}</b>sekolah` })}
    ${legend([
      { label: 'Terkirim', value: r.terkirim, tone: 'ok' },
      { label: 'Dalam Proses', value: r.proses, tone: 'warn' },
      { label: 'Belum Terkirim', value: r.belum, tone: 'bad' },
    ])}
  </div>
`)}
${sectionHead('Daftar Sekolah')}
<div id="list-kirim">
  ${card(PENGIRIMAN.sekolah.map((s) => listRow({
    title: s.nama, sub: `${fmtNum(s.porsi)} porsi`,
    lead: `<span class="row-ic">${icon('school', { size: 18 })}</span>`,
    trail: statusBadge(s.status),
  })).join(''), { pad: false })}
</div>
`),
    mount(root) { setChrome('sppg', 'home'); wireFilter(root, '#list-kirim .row'); },
  };
}

/* ─────────────── 9. Stok Bahan ─────────────── */
export function stok() {
  return {
    title: 'Stok Bahan',
    html: page(`
${appBar({ title: 'Stok Bahan', back: true, sub: 'Update: 8 Agustus 2026 · 08:00' })}
${card(BAHAN.map((b) => `
  <div class="stok-row">
    <div class="stok-top">
      <span class="stok-name">${esc(b.nama)}</span>
      <span class="stok-val">${b.stok} ${esc(b.unit)}</span>
      ${statusBadge(b.status)}
    </div>
    ${meter(b.pct, b.pct < 35 ? 'warn' : 'ok')}
  </div>`).join(''))}
`),
    mount() { setChrome('sppg', 'bahan'); },
  };
}

/* ─────────────── 10. Profil SPPG ─────────────── */
export function profil() {
  const p = PROFIL_SPPG;
  return {
    title: 'Profil SPPG',
    html: page(`
${appBar({ title: 'Profil SPPG', back: true, right: iconBtn('settings', { go: '/pengaturan', label: 'Pengaturan' }) })}
<div class="profile-head">
  <span class="profile-av">${icon('utensils', { size: 30, draw: true })}${sparkField(3)}</span>
  <b>${esc(p.nama)}</b>
  <span class="muted">ID SPPG: ${esc(p.id)} · Koordinator: ${esc(p.koordinator)}</span>
</div>
${sectionHead('Informasi SPPG')}
${card(`
  <div class="kv"><span>${icon('mapPin', { size: 15 })} Alamat</span><b>${esc(p.alamat)}</b></div>
  <div class="kv"><span>${icon('idCard', { size: 15 })} No. Telepon</span><b>${esc(p.telepon)}</b></div>
  <div class="kv"><span>${icon('fileText', { size: 15 })} Email</span><b>${esc(p.email)}</b></div>
  <div class="kv"><span>${icon('school', { size: 15 })} Sekolah Dilayani</span><b>${p.sekolah} Sekolah</b></div>
  <div class="kv"><span>${icon('package', { size: 15 })} Kapasitas Produksi</span><b>${esc(p.kapasitas)}</b></div>
`)}
<div class="mt-5">${btn('Keluar Akun', { act: 'logout', variant: 'danger', wide: true, ic: 'logout' })}</div>
`),
    mount() { setChrome('sppg', 'laporan'); },
  };
}

/* ─────────────── 11. Notifikasi SPPG ─────────────── */
export function notifikasi() {
  const items = [
    { tone: 'warn', judul: 'Stok Gula Pasir menipis', isi: 'Tersisa 5 kg — segera lakukan pengadaan.', waktu: '20 menit lalu' },
    { tone: 'ok',   judul: 'Pengiriman selesai',      isi: '12 dari 15 sekolah telah menerima MBG.', waktu: '1 jam lalu' },
  ];
  return {
    title: 'Notifikasi',
    html: page(`
${appBar({ title: 'Notifikasi', back: true })}
${card(items.map((n) => listRow({
  title: n.judul, sub: `${esc(n.isi)}<br><i class="muted">${esc(n.waktu)}</i>`,
  lead: `<span class="row-ic tone-${n.tone}">${icon(n.tone === 'ok' ? 'checkCircle' : 'alertCircle', { size: 18 })}</span>`,
  trail: '<span></span>',
})).join(''), { pad: false })}
`),
    mount() { setChrome('sppg', 'home'); },
  };
}
