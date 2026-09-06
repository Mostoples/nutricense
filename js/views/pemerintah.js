/* ============================================================
   NUTRICENSE — Peran Pemerintah (pengawas nasional)
   Aksen berubah ungu lewat [data-role="pemerintah"].
   Peta sebaran digambar sebagai SVG orisinal — tanpa tile
   peta eksternal, sehingga tetap ringan dan ikut tema.
   ============================================================ */

'use strict';

import { icon } from '../icons.js';
import { blobField, sparkField } from '../decor.js';
import {
  appBar, card, page, listRow, badge, statusBadge, fsiCard, statRow,
  segmented, searchBar, selectField, btn, iconBtn, sectionHead, linkMore,
  esc, toast, sparkline, donut, legend, meter, emptyState,
} from '../ui.js';
import {
  NASIONAL, DAFTAR_SPPG, SEKOLAH_TERLAYANI, NOTIFIKASI, PENGGUNA,
  MENU_HARI_INI, PEMERIKSAAN_HARI_INI, fmtNum, fsiTone, statusTone,
} from '../store.js';
import { setChrome } from './shell.js';
import { wireFilter } from './sekolah.js';

/* ─────────────── 1. Dashboard Nasional ─────────────── */
export function home() {
  const n = NASIONAL;
  return {
    title: 'Dashboard Nasional',
    html: page(`
${appBar({
  title: 'Dashboard Nasional', sub: '8 Agustus 2026', center: false,
  right: iconBtn('bell', { go: '/pemerintah/notifikasi', label: 'Notifikasi', badge: NOTIFIKASI.length }),
})}

<div class="col-a">
${card(`
  <span class="eyebrow on-accent">Ringkasan Nasional</span>
  <div class="ribbon-stats mt-3">
    <div><b>${fmtNum(n.totalSppg)}</b><span>Total SPPG</span></div>
    <div><b>${fmtNum(n.sekolah)}</b><span>Sekolah Terlayani</span></div>
    <div><b>${fmtNum(n.porsi)}</b><span>Porsi Hari Ini</span></div>
  </div>
  <span class="ribbon-art">${blobField({ opacity: .45 })}</span>
`, { cls: 'card-accent ribbon' })}

${sectionHead('Status SPPG')}
${statRow([
  { value: n.status.aman, label: 'Aman', ic: 'checkCircle', tone: 'ok' },
  { value: n.status.perhatian, label: 'Perlu Perhatian', ic: 'alertCircle', tone: 'warn' },
  { value: n.status.bermasalah, label: 'Bermasalah', ic: 'xCircle', tone: 'bad' },
])}

${sectionHead('Monitoring Hari Ini')}
${statRow([
  { value: n.kesesuaian + '%', label: 'Tingkat Kesesuaian Menu', ic: 'checkCircle' },
  { value: n.fsiRata + '/100', label: 'Rata-rata FSI Nasional', ic: 'shield' },
  { value: n.kalRata, label: 'Rata-rata Kalori per Porsi', ic: 'activity' },
])}
</div>

<div class="col-b">
${sectionHead('Grafik Food Safety Index', linkMore('Analitik', '/pemerintah/analitik'))}
${card(sparkline(n.tren, { labels: n.trenLabel }))}

${sectionHead('Peta Sebaran', linkMore('Buka Peta', '/pemerintah/peta'))}
${card(mapSvg({ compact: true }), { pad: false })}

${sectionHead('Peringatan Terbaru', linkMore('Semua', '/pemerintah/notifikasi'))}
${card(NOTIFIKASI.slice(0, 3).map((x) => listRow({
  title: x.judul, sub: `${esc(x.isi)}<br><i class="muted">${esc(x.waktu)}</i>`,
  lead: `<span class="row-ic tone-${x.tone}">${icon(x.tone === 'bad' ? 'xCircle' : x.tone === 'warn' ? 'alertCircle' : 'bell', { size: 18 })}</span>`,
  trail: '<span></span>',
})).join(''), { pad: false })}
</div>
`, { cls: 'is-split' }),
    mount() { setChrome('pemerintah', 'home'); },
  };
}

/* ─────────────── Peta SVG orisinal ─────────────── */
const PINS = [
  { x: 30, y: 46, tone: 'ok',   nama: 'SPPG Sukoharjo 01' },
  { x: 44, y: 38, tone: 'ok',   nama: 'SPPG Surakarta 01' },
  { x: 57, y: 52, tone: 'warn', nama: 'SPPG Sukoharjo 02' },
  { x: 68, y: 34, tone: 'ok',   nama: 'SPPG Boyolali 01' },
  { x: 22, y: 66, tone: 'bad',  nama: 'SPPG Karanganyar 01' },
  { x: 78, y: 62, tone: 'ok',   nama: 'SPPG Klaten 01' },
  { x: 50, y: 72, tone: 'warn', nama: 'SPPG Wonogiri 01' },
];

function mapSvg({ compact = false } = {}) {
  return `
<div class="map ${compact ? 'is-compact' : ''}">
  <svg viewBox="0 0 100 88" class="map-svg" role="img" aria-label="Peta sebaran SPPG">
    <rect width="100" height="88" fill="var(--info-soft)"/>
    <path d="M-4 58c14-6 22 2 34-2s20-14 34-12 26 10 40 6v40H-4z" fill="var(--accent-faint)"/>
    <path d="M8 20c12-7 26-4 36 2s24 6 34-2 20-6 26-2" fill="none"
          stroke="var(--line-2)" stroke-width=".6" stroke-dasharray="2 2"/>
    <path d="M12 34c16 4 26-6 42-4s24 12 40 8" fill="none"
          stroke="var(--line-2)" stroke-width=".6" stroke-dasharray="2 2"/>
    <g class="map-land" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width=".5">
      <path d="M6 30c10-8 24-9 36-4s22 3 32-2 20 0 24 6-2 16-12 20-18 2-28 6-22 10-34 6S2 46 6 30z"/>
    </g>
    ${PINS.map((p, i) => `
      <g class="map-pin" style="animation-delay:${i * 90}ms" transform="translate(${p.x} ${p.y})">
        <circle r="4.2" fill="var(--${p.tone})" opacity=".2" class="map-halo"/>
        <circle r="2.1" fill="var(--${p.tone})" stroke="var(--surface)" stroke-width=".7"/>
        <title>${esc(p.nama)}</title>
      </g>`).join('')}
  </svg>
  <ul class="map-legend">
    <li><i style="background:var(--ok)"></i>Aman</li>
    <li><i style="background:var(--warn)"></i>Perlu Perhatian</li>
    <li><i style="background:var(--bad)"></i>Bermasalah</li>
  </ul>
</div>`;
}

/* ─────────────── 2. Peta Sebaran ─────────────── */
export function peta() {
  return {
    title: 'Peta Sebaran SPPG',
    html: page(`
${appBar({ title: 'Peta Sebaran SPPG', back: true })}
${searchBar('Cari wilayah / SPPG…', { filter: true })}
<div class="mt-4">${card(mapSvg(), { pad: false })}</div>
${sectionHead('SPPG pada Peta')}
${card(DAFTAR_SPPG.map((s) => listRow({
  title: s.nama, sub: `${esc(s.wil)} · FSI ${s.fsi}/100 · ${s.sekolah} sekolah`,
  lead: `<span class="row-ic tone-${statusTone(s.status)}">${icon('mapPin', { size: 18 })}</span>`,
  trail: statusBadge(s.status), go: '/pemerintah/sppg/' + s.id,
})).join(''), { pad: false })}
`),
    mount() { setChrome('pemerintah', 'sppg'); },
  };
}

/* ─────────────── 3. Daftar SPPG ─────────────── */
export function daftarSppg() {
  return {
    title: 'Daftar SPPG',
    html: page(`
${appBar({ title: 'Daftar SPPG', back: true })}
${searchBar('Cari SPPG…', { target: '#list-sppg' })}
<div class="mt-3">${selectField('', ['Semua Status', 'Aman', 'Perlu Perhatian', 'Bermasalah'])}</div>
<div class="mt-4" id="list-sppg">
  ${card(DAFTAR_SPPG.map((s) => listRow({
    title: s.nama,
    sub: `${esc(s.wil)}<br>FSI: ${s.fsi}/100 · ${s.sekolah} Sekolah`,
    lead: `<span class="row-ic tone-${statusTone(s.status)}">${icon('building', { size: 18 })}</span>`,
    trail: statusBadge(s.status),
    go: '/pemerintah/sppg/' + s.id,
  })).join(''), { pad: false })}
</div>
`),
    mount(root) { setChrome('pemerintah', 'sppg'); wireFilter(root, '#list-sppg .row'); },
  };
}

/* ─────────────── 4. Detail SPPG ─────────────── */
export function detailSppg({ params }) {
  const s = DAFTAR_SPPG.find((x) => x.id === params.id) || DAFTAR_SPPG[0];
  return {
    title: s.nama,
    html: page(`
${appBar({ title: 'Detail SPPG', back: true })}
<div class="detail-head">
  <span class="row-ic tone-${statusTone(s.status)}">${icon('building', { size: 20 })}</span>
  <div><b>${esc(s.nama)}</b><span class="muted"> · ID: ${esc(s.id)}</span></div>
  ${statusBadge(s.status)}
</div>
${segmented(['Ringkasan', 'Sekolah', 'Menu', 'Pemeriksaan', 'Riwayat'], 0, 'det')}

<div id="det-body" class="mt-4">
  ${sectionHead('Ringkasan Hari Ini')}
  ${statRow([
    { value: fmtNum(2500), label: 'Porsi Diproduksi', ic: 'package' },
    { value: s.sekolah, label: 'Sekolah Dilayani', ic: 'school' },
    { value: '98%', label: 'Kesesuaian Menu', ic: 'checkCircle' },
  ])}
  ${sectionHead('Rata-rata Nilai')}
  ${statRow([
    { value: s.fsi + '/100', label: 'FSI', ic: 'shield', tone: fsiTone(s.fsi) },
    { value: '650 kkal', label: 'Kalori', ic: 'activity' },
    { value: '28 g', label: 'Protein', ic: 'leaf' },
  ])}
  ${sectionHead('Grafik FSI 7 Hari Terakhir')}
  ${card(sparkline(NASIONAL.tren, { labels: NASIONAL.trenLabel }))}
</div>

<div class="btn-row mt-4">
  ${btn('Menu SPPG', { go: '/pemerintah/menu', variant: 'ghost' })}
  ${btn('Pemeriksaan', { go: '/pemerintah/pemeriksaan', variant: 'primary' })}
</div>
`),
    mount(root) {
      setChrome('pemerintah', 'sppg');
      const body = root.querySelector('#det-body');
      const asli = body.innerHTML;
      const alt = {
        1: () => card(SEKOLAH_TERLAYANI.map((x) => listRow({
              title: x.nama, sub: `Siswa: ${fmtNum(x.siswa)}`,
              lead: `<span class="row-ic">${icon('school', { size: 18 })}</span>`,
              trail: statusBadge(x.status),
            })).join(''), { pad: false }),
        2: () => card(MENU_HARI_INI.items.map((it) => listRow({
              title: it.nama, sub: `Kalori ${it.kal} kkal · ${esc(it.ket)}`,
            })).join(''), { pad: false }),
        3: () => fsiCard(s.fsi, { sub: 'Pemeriksaan hari ini' }),
        4: () => card(NASIONAL.trenLabel.map((d, i) => listRow({
              title: d + ' Agustus 2026', sub: `FSI: ${NASIONAL.tren[i]}/100`,
              trail: badge(NASIONAL.tren[i] >= 85 ? 'Aman' : 'Perlu Perhatian', fsiTone(NASIONAL.tren[i])),
            })).join(''), { pad: false }),
      };
      root.querySelectorAll('[data-seg="det"] .seg').forEach((b) => b.addEventListener('click', () => {
        root.querySelectorAll('[data-seg="det"] .seg').forEach((x) => x.classList.remove('is-on'));
        b.classList.add('is-on');
        const i = Number(b.dataset.segIdx);
        body.innerHTML = i === 0 ? asli : alt[i]();
        import('../icons.js').then((mod) => mod.hydrateIcons(body));
      }));
    },
  };
}

/* ─────────────── 5. Menu SPPG ─────────────── */
export function menuSppg() {
  const m = MENU_HARI_INI;
  return {
    title: 'Menu SPPG',
    html: page(`
${appBar({ title: 'Menu SPPG', back: true })}
<div class="date-strip">${icon('calendar', { size: 17 })}<span>8 Agustus 2026</span>${icon('chevronDown', { size: 16 })}</div>
${segmented(['Menu Hari Ini', 'Rencana Menu', 'Riwayat Menu'], 0, 'msp')}
<div class="mt-4">
${card(m.items.map((it) => listRow({
  title: it.nama, sub: `Kalori ${it.kal} kkal · ${esc(it.ket)}`,
})).join(''), { pad: false })}
</div>
${sectionHead('Total per Porsi')}
${card(`<div class="macro-row">
  <div class="macro macro-kal"><b>${m.gizi.kal}<i>kkal</i></b><span>Kalori</span></div>
  <div class="macro macro-pro"><b>${m.gizi.protein}<i>g</i></b><span>Protein</span></div>
  <div class="macro macro-krb"><b>${m.gizi.karbo}<i>g</i></b><span>Karbohidrat</span></div>
  <div class="macro macro-lem"><b>${m.gizi.lemak}<i>g</i></b><span>Lemak</span></div>
</div>`)}
`),
    mount() { setChrome('pemerintah', 'sppg'); },
  };
}

/* ─────────────── 6. Pemeriksaan SPPG ─────────────── */
export function pemeriksaanSppg() {
  const p = PEMERIKSAAN_HARI_INI;
  return {
    title: 'Pemeriksaan SPPG',
    html: page(`
${appBar({ title: 'Pemeriksaan SPPG', back: true })}
${segmented(['Hari Ini', 'Riwayat'], 0, 'psp')}
<div class="mt-4">${fsiCard(p.fsi, { status: 'Aman' })}</div>
${sectionHead('Hasil Pemeriksaan')}
${card(p.baris.map((b) => `
  <div class="kv"><span>${icon(b.ic, { size: 15 })} ${esc(b.label)}</span>
    <b>${esc(b.nilai)} ${badge('Aman', 'ok')}</b></div>`).join(''))}
<div class="mt-4">${btn('Lihat Detail Pemeriksaan', { go: '/pemerintah/riwayat', variant: 'primary', wide: true })}</div>
`),
    mount() { setChrome('pemerintah', 'sppg'); },
  };
}

/* ─────────────── 7. Riwayat Pemeriksaan ─────────────── */
export function riwayat() {
  const data = [
    { tgl: '8 Agustus 2026', sppg: 'SPPG Sukoharjo 01',   fsi: 92, status: 'Aman' },
    { tgl: '7 Agustus 2026', sppg: 'SPPG Sukoharjo 02',   fsi: 88, status: 'Perlu Perhatian' },
    { tgl: '6 Agustus 2026', sppg: 'SPPG Surakarta 01',   fsi: 95, status: 'Aman' },
    { tgl: '5 Agustus 2026', sppg: 'SPPG Boyolali 01',    fsi: 90, status: 'Aman' },
    { tgl: '4 Agustus 2026', sppg: 'SPPG Karanganyar 01', fsi: 76, status: 'Bermasalah' },
  ];
  return {
    title: 'Riwayat Pemeriksaan',
    html: page(`
${appBar({ title: 'Riwayat Pemeriksaan', back: true })}
${searchBar('Cari riwayat…', { filter: true, target: '#list-riw' })}
<div class="mt-4" id="list-riw">
  ${card(data.map((d) => listRow({
    title: d.tgl, sub: `${esc(d.sppg)}<br>FSI: ${d.fsi}/100`,
    lead: `<span class="row-ic tone-${statusTone(d.status)}">${icon('clipboard', { size: 18 })}</span>`,
    trail: statusBadge(d.status),
  })).join(''), { pad: false })}
</div>
`),
    mount(root) { setChrome('pemerintah', 'sppg'); wireFilter(root, '#list-riw .row'); },
  };
}

/* ─────────────── 8. Sekolah Terlayani ─────────────── */
export function sekolah() {
  const total = SEKOLAH_TERLAYANI.reduce((s, x) => s + x.siswa, 0);
  return {
    title: 'Sekolah Terlayani',
    html: page(`
${appBar({ title: 'Sekolah Terlayani', back: true, sub: 'SPPG Sukoharjo 01' })}
${statRow([
  { value: SEKOLAH_TERLAYANI.length, label: 'Total Sekolah', ic: 'school' },
  { value: fmtNum(total), label: 'Total Siswa', ic: 'users' },
])}
${searchBar('Cari sekolah…', { target: '#list-sek' })}
<div class="mt-4" id="list-sek">
  ${card(SEKOLAH_TERLAYANI.map((x) => listRow({
    title: x.nama, sub: `Siswa: ${fmtNum(x.siswa)}`,
    lead: `<span class="row-ic">${icon('school', { size: 18 })}</span>`,
    trail: statusBadge(x.status),
  })).join(''), { pad: false })}
</div>
`),
    mount(root) { setChrome('pemerintah', 'sekolah'); wireFilter(root, '#list-sek .row'); },
  };
}

/* ─────────────── 9. Analitik & Grafik ─────────────── */
export function analitik() {
  const n = NASIONAL;
  return {
    title: 'Analitik & Grafik',
    html: page(`
${appBar({ title: 'Analitik & Grafik', back: true })}
<div class="mt-2">${selectField('', ['7 Hari Terakhir', '30 Hari Terakhir', 'Tahun Berjalan'])}</div>

<div class="col-a">
${sectionHead('Tren Food Safety Index')}
${card(sparkline(n.tren, { labels: n.trenLabel, w: 320, h: 90 }))}

${sectionHead('Kesesuaian Menu per Wilayah')}
${card(DAFTAR_SPPG.map((s) => `
  <div class="stok-row">
    <div class="stok-top"><span class="stok-name">${esc(s.nama)}</span><span class="stok-val">${s.fsi}/100</span></div>
    ${meter(s.fsi, fsiTone(s.fsi))}
  </div>`).join(''))}
</div>

<div class="col-b">
${sectionHead('Distribusi Status SPPG')}
${card(`
  <div class="split-chart">
    ${donut([
      { label: 'Aman', value: n.status.aman, tone: 'ok' },
      { label: 'Perlu Perhatian', value: n.status.perhatian, tone: 'warn' },
      { label: 'Bermasalah', value: n.status.bermasalah, tone: 'bad' },
    ], { center: `<b>${n.totalSppg}</b>SPPG` })}
    ${legend([
      { label: 'Aman', value: n.status.aman, tone: 'ok', suffix: ' (89,6%)' },
      { label: 'Perlu Perhatian', value: n.status.perhatian, tone: 'warn', suffix: ' (8,0%)' },
      { label: 'Bermasalah', value: n.status.bermasalah, tone: 'bad', suffix: ' (2,4%)' },
    ])}
  </div>
`)}
</div>
`, { cls: 'is-split' }),
    mount() { setChrome('pemerintah', 'laporan'); },
  };
}

/* ─────────────── 10. Laporan ─────────────── */
export function laporan() {
  const n = NASIONAL;
  return {
    title: 'Laporan',
    html: page(`
${appBar({ title: 'Laporan', back: true })}
${segmented(['Ringkasan', 'Kepatuhan Menu', 'Food Safety'], 0, 'lp')}
<div class="date-strip mt-4">${icon('calendar', { size: 17 })}<span>1 – 8 Agustus 2026</span></div>
${sectionHead('Ringkasan Laporan')}
${card([
  ['package', 'Total Porsi Diproduksi', fmtNum(n.porsi)],
  ['activity', 'Rata-rata Kalori', '650 kkal'],
  ['shield', 'Rata-rata FSI', '92/100'],
  ['checkCircle', 'Tingkat Kesesuaian Menu', '96%'],
  ['checkCircle', 'SPPG Aman', `${n.status.aman} (89,6%)`],
  ['alertCircle', 'SPPG Perlu Perhatian', `${n.status.perhatian} (8,0%)`],
  ['xCircle', 'SPPG Bermasalah', `${n.status.bermasalah} (2,4%)`],
].map(([ic, k, v]) => `<div class="kv"><span>${icon(ic, { size: 16 })} ${esc(k)}</span><b>${esc(v)}</b></div>`).join(''))}
<div class="mt-4">${btn('Unduh Laporan (CSV)', { act: 'unduh', variant: 'primary', wide: true, ic: 'download' })}</div>
`),
    mount(root) {
      setChrome('pemerintah', 'laporan');
      root.querySelector('[data-act="unduh"]')?.addEventListener('click', () => {
        const rows = [['ID', 'Nama SPPG', 'Wilayah', 'FSI', 'Sekolah', 'Status'],
          ...DAFTAR_SPPG.map((s) => [s.id, s.nama, s.wil, s.fsi, s.sekolah, s.status])];
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url; a.download = `nutricense-nasional-${Date.now()}.csv`; a.click();
        URL.revokeObjectURL(url);
        toast('Laporan diunduh', `${DAFTAR_SPPG.length} SPPG diekspor sebagai CSV.`, 'ok');
      });
    },
  };
}

/* ─────────────── 11. Notifikasi ─────────────── */
export function notifikasi() {
  return {
    title: 'Notifikasi',
    html: page(`
${appBar({ title: 'Notifikasi / Peringatan', back: true,
  right: `<button class="link" data-act="baca">Tandai semua</button>` })}
${segmented(['Semua', 'Peringatan'], 1, 'ntf')}
<div class="mt-4">
${card(NOTIFIKASI.map((x) => listRow({
  title: x.judul, sub: `${esc(x.isi)}<br><i class="muted">${esc(x.waktu)}</i>`,
  lead: `<span class="row-ic tone-${x.tone}">${icon(x.tone === 'bad' ? 'xCircle' : x.tone === 'warn' ? 'alertCircle' : 'bell', { size: 18 })}</span>`,
  trail: '<span></span>',
})).join(''), { pad: false })}
</div>
`),
    mount(root) {
      setChrome('pemerintah', 'home');
      root.querySelector('[data-act="baca"]')?.addEventListener('click', () =>
        toast('Ditandai', 'Semua peringatan ditandai sudah dibaca.', 'ok'));
    },
  };
}

/* ─────────────── 12. Pengguna & Akses ─────────────── */
export function pengguna() {
  return {
    title: 'Pengguna & Akses',
    html: page(`
${appBar({ title: 'Pengguna & Akses', back: true,
  right: iconBtn('plus', { act: 'tambah', label: 'Tambah pengguna' }) })}
${searchBar('Cari pengguna…', { target: '#list-usr' })}
<div class="mt-4" id="list-usr">
  ${card(PENGGUNA.map((u) => listRow({
    title: u.nama, sub: esc(u.email),
    lead: `<span class="row-ic">${icon('user', { size: 18 })}</span>`,
    trail: badge(u.peran, u.peran === 'Super Admin' ? 'info' : 'ok'),
  })).join(''), { pad: false })}
</div>
`),
    mount(root) {
      setChrome('pemerintah', 'pengguna');
      wireFilter(root, '#list-usr .row');
      root.querySelector('[data-act="tambah"]')?.addEventListener('click', () =>
        toast('Tambah pengguna', 'Penambahan akun dilakukan oleh Super Admin.', 'info'));
    },
  };
}
