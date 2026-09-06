/* ============================================================
   NUTRICENSE — Peran Sekolah / Guru
   Dashboard → Scan MBG → Hasil → Detail / Foto / Laporan,
   plus Riwayat, Laporan Saya, Profil, dan Pengaturan.
   ============================================================ */

'use strict';

import { icon } from '../icons.js';
import { scanFrame, sparkField, blobField, trayGlyph } from '../decor.js';
import {
  appBar, card, page, listRow, badge, statusBadge, macroChips, fsiCard,
  statRow, segmented, searchBar, btn, iconBtn, sectionHead, linkMore,
  foodThumb, emptyState, esc, toast, sheet, meter, sparkline,
} from '../ui.js';
import {
  MENU_HARI_INI, PEMERIKSAAN_HARI_INI, RIWAYAT, LAPORAN_SAYA,
  JENIS_MASALAH, PROFIL_SEKOLAH, session, fsiTone, nextSensorSnapshot, computeFSI,
} from '../store.js';
import { setChrome } from './shell.js';
import { go } from '../router.js';
import { mountProduct } from '../nc3d.js';

/* Hasil pindai terakhir dipertahankan antar layar dalam satu sesi. */
let lastScan = null;

/* ─────────────── 1. Dashboard ─────────────── */
export function home() {
  const m = MENU_HARI_INI;
  return {
    title: 'Dashboard Sekolah',
    html: page(`
${appBar({
  title: session.org || PROFIL_SEKOLAH.nama,
  sub: '8 Agustus 2026',
  center: false,
  right: iconBtn('bell', { go: '/sekolah/notifikasi', label: 'Notifikasi', badge: 2 }),
})}

<div class="hero-greet">
  <div>
    <p class="greet-hi">Selamat pagi, ${esc(session.name || 'Guru MBG')} 👋</p>
    <p class="greet-sub">${esc(session.org || PROFIL_SEKOLAH.nama)}</p>
  </div>
  <span class="greet-art">${blobField({ opacity: .9 })}</span>
</div>

${card(`
  <div class="menu-head">
    <div><span class="eyebrow">MBG Hari Ini</span><h3 class="h3">${esc(m.judul)}</h3></div>
    <span class="muted mono" style="font-size:.72rem">${esc(m.batch)}</span>
  </div>
  <p class="muted" style="font-size:.8rem;margin-top:2px">Menu dari ${esc(m.sppg)}</p>
  <ul class="menu-mini mt-3">
    ${m.items.map((it) => `<li>${foodThumb(it.tone, 38)}<span>${esc(it.nama)}</span><b>${it.kal} kkal</b></li>`).join('')}
  </ul>
  <div class="mt-4">${btn('Scan MBG', { go: '/sekolah/scan', variant: 'primary', wide: true, ic: 'scan' })}</div>
`)}

${sectionHead('Ringkasan Hari Ini')}
${statRow([
  { value: 1, label: 'Scan Dilakukan', ic: 'scan', tone: 'g' },
  { value: 1, label: 'Sesuai', ic: 'checkCircle', tone: 'ok' },
  { value: 0, label: 'Tidak Sesuai', ic: 'xCircle', tone: 'g' },
])}

${sectionHead('Riwayat Terakhir', linkMore('Lihat Semua', '/sekolah/riwayat'))}
${card(RIWAYAT.slice(0, 3).map((r, i) => listRow({
  title: r.tgl,
  sub: `FSI: ${r.fsi}/100 · Kesesuaian ${r.sesuai}%`,
  lead: foodThumb(i % 2 ? 'kal' : 'g', 42),
  trail: statusBadge(r.status === 'sesuai' ? 'Sesuai' : 'Tidak Sesuai'),
  go: '/sekolah/riwayat/' + i,
})).join(''), { pad: false })}
`),
    mount() { setChrome('sekolah', 'home'); },
  };
}

/* ─────────────── 2. Scan MBG ─────────────── */
export function scan() {
  return {
    title: 'Scan MBG',
    html: page(`
${appBar({ title: 'Scan MBG', back: true, right: iconBtn('sparkle', { act: 'torch', label: 'Lampu' }) })}
<p class="scan-hint">Arahkan kamera ke makanan atau kode QR pada kemasan</p>

<div class="scan-stage" id="scan-stage">
  <video id="scan-video" playsinline muted autoplay></video>
  <canvas id="scan-3d" class="scan-3d"></canvas>
  <span class="scan-frame">${scanFrame()}</span>
  <span class="scan-note" id="scan-note">Menyiapkan kamera…</span>
</div>

<div class="scan-actions">
  <button class="scan-side ic-host" data-act="galeri">${icon('image', { size: 22 })}<span>Galeri</span></button>
  <button class="shutter ic-host" data-act="ambil" aria-label="Ambil gambar">
    <span class="shutter-ring"></span>${icon('camera', { size: 26 })}
  </button>
  <button class="scan-side ic-host" data-act="qr">${icon('qr', { size: 22 })}<span>QR Code</span></button>
</div>
`, { cls: 'is-scan' }),

    mount(root) {
      setChrome('sekolah', 'scan');

      const video = root.querySelector('#scan-video');
      const note = root.querySelector('#scan-note');
      const canvas3d = root.querySelector('#scan-3d');
      const stage = root.querySelector('#scan-stage');
      let stream = null, box = null, alive = true;

      /* Coba kamera asli; bila ditolak, tidak ada, atau prompt izin tak
         kunjung dijawab, tampilkan model 3D NC-BOX. Batas waktu penting:
         getUserMedia menggantung selamanya selama prompt dibiarkan terbuka,
         dan tanpa batas waktu layar tinggal hitam. */
      const withTimeout = (p, ms) => Promise.race([
        p, new Promise((_, rej) => setTimeout(() => rej(new Error('camera-timeout')), ms)),
      ]);

      (async () => {
        try {
          if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-camera-api');
          stream = await withTimeout(navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }, audio: false,
          }), 2500);
          if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }
          video.srcObject = stream;
          stage.classList.add('has-cam');
          note.textContent = 'Kamera aktif — arahkan ke nampan';
        } catch (err) {
          stage.classList.add('has-3d');
          note.textContent = 'Kamera tidak tersedia — pratinjau NC-BOX-09X';
          box = await mountProduct(canvas3d);
          if (box) box.setScanning(true);
          else note.textContent = 'Pratinjau tidak tersedia di perangkat ini';
        }
      })();

      root.querySelector('[data-act="ambil"]')?.addEventListener('click', () => {
        stage.classList.add('is-flash');
        setTimeout(() => stage.classList.remove('is-flash'), 220);

        /* Bangun hasil dari pembacaan sensor tersimulasi */
        const s = nextSensorSnapshot();
        const fsi = computeFSI(s);
        const sesuai = fsi >= 85 ? 100 : fsi >= 75 ? 90 : 75;
        lastScan = {
          fsi, sesuai, snapshot: s,
          waktu: '10:15 WIB', tanggal: '8 Agustus 2026',
          status: sesuai === 100 ? 'sesuai' : 'tidak',
        };
        toast('Analisis selesai', 'Hasil pemindaian siap ditinjau.', 'ok', 2200);
        setTimeout(() => go('/sekolah/hasil'), 320);
      });

      root.querySelector('[data-act="galeri"]')?.addEventListener('click', () =>
        toast('Galeri', 'Pilih foto dari perangkat belum tersedia di demo.', 'info'));
      root.querySelector('[data-act="qr"]')?.addEventListener('click', () =>
        toast('Pemindaian QR', 'Arahkan kamera ke kode QR pada kemasan.', 'info'));
      root.querySelector('[data-act="torch"]')?.addEventListener('click', () =>
        toast('Lampu', 'Perangkat ini tidak mendukung lampu kamera.', 'info'));

      return () => {
        alive = false;
        if (stream) stream.getTracks().forEach((t) => t.stop());
        if (box) box.destroy();
      };
    },
  };
}

/* ─────────────── 3. Hasil Scan ─────────────── */
export function hasil() {
  const r = lastScan || { fsi: 89, sesuai: 100, status: 'sesuai', snapshot: { suhu: 60, ph: 6.3, hum: 55 } };
  const ok = r.status === 'sesuai';
  const m = MENU_HARI_INI;
  const s = r.snapshot;

  return {
    title: 'Hasil Scan',
    html: page(`
${appBar({ title: 'Hasil Scan', back: true })}

<div class="verdict verdict-${ok ? 'ok' : 'warn'}">
  <span class="verdict-ic">${icon(ok ? 'checkCircle' : 'alertCircle', { size: 30, draw: true })}</span>
  <div>
    <b>MENU ${ok ? 'SESUAI' : 'TIDAK SESUAI'}</b>
    <span>Kesesuaian: ${r.sesuai}%</span>
  </div>
</div>

${card(`
<div class="compare">
  <div class="compare-col">
    <h4>Data dari SPPG</h4>
    <ul>${m.items.map((it) => `<li>${icon('check', { size: 15 })}<span>${esc(it.nama)}</span></li>`).join('')}</ul>
  </div>
  <span class="compare-sep"></span>
  <div class="compare-col">
    <h4>Hasil Scan</h4>
    <ul>${m.items.map((it, i) => {
      const miss = !ok && i === m.items.length - 1;
      return `<li class="${miss ? 'is-miss' : ''}">${icon(miss ? 'xCircle' : 'check', { size: 15 })}
        <span>${esc(it.nama)}${miss ? '<i>(Tidak ditemukan)</i>' : ''}</span></li>`;
    }).join('')}</ul>
  </div>
</div>`)}

${card(`
<div class="fsi-split">
  <div class="fsi-split-a">
    <span class="eyebrow">Food Safety Index</span>
    <p class="fsi-num"><b class="tone-${fsiTone(r.fsi)}">${r.fsi}</b><i>/100</i></p>
    <span class="badge badge-${fsiTone(r.fsi)}">${r.fsi >= 85 ? 'AMAN' : 'PERLU PERHATIAN'}</span>
  </div>
  <ul class="checklist">
    <li>${icon('checkCircle', { size: 15 })}<span>Suhu</span><b>${s.suhu.toFixed(0)}°C</b></li>
    <li>${icon('checkCircle', { size: 15 })}<span>pH</span><b>${s.ph.toFixed(1).replace('.', ',')}</b></li>
    <li>${icon('checkCircle', { size: 15 })}<span>Kelembapan</span><b>${s.hum}%</b></li>
    <li>${icon('checkCircle', { size: 15 })}<span>Kondisi</span><b>${ok ? 'Baik' : 'Cukup'}</b></li>
  </ul>
</div>`)}

<div class="btn-row mt-4">
  ${btn('Lihat Detail', { go: '/sekolah/hasil/detail', variant: 'ghost' })}
  ${ok ? btn('Simpan Hasil', { act: 'simpan', variant: 'primary' })
       : btn('Buat Laporan', { go: '/sekolah/lapor', variant: 'warn' })}
</div>
`),
    mount(root) {
      setChrome('sekolah', 'scan');
      root.querySelector('[data-act="simpan"]')?.addEventListener('click', () => {
        toast('Hasil disimpan', 'Pemeriksaan tercatat pada riwayat sekolah.', 'ok');
        setTimeout(() => go('/sekolah/riwayat'), 700);
      });
    },
  };
}

/* ─────────────── 4. Detail Hasil Scan ─────────────── */
export function hasilDetail() {
  const r = lastScan || { fsi: 89, snapshot: { suhu: 60, ph: 6.3, hum: 55 } };
  const s = r.snapshot;
  const m = MENU_HARI_INI;
  const baris = [
    ['Tanggal', '8 Agustus 2026'], ['Waktu', '10:15 WIB'],
    ['SPPG', m.sppg], ['Menu', m.items.map((i) => i.nama).join(', ')],
    ['Kode Batch', m.batch],
  ];
  return {
    title: 'Detail Hasil Scan',
    html: page(`
${appBar({ title: 'Detail Hasil Scan', back: true })}
${sectionHead('Informasi Umum')}
${card(baris.map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join(''))}
${sectionHead('Hasil Pemeriksaan')}
${card(`
  <div class="kv"><span>Food Safety Index</span><b class="tone-${fsiTone(r.fsi)}">${r.fsi}/100 (Aman)</b></div>
  <div class="kv"><span>Suhu</span><b>${s.suhu.toFixed(0)}°C</b></div>
  <div class="kv"><span>pH</span><b>${s.ph.toFixed(1).replace('.', ',')}</b></div>
  <div class="kv"><span>Kelembapan</span><b>${s.hum}%</b></div>
  <div class="kv"><span>Gas (MQ135)</span><b>Normal</b></div>
  <div class="kv"><span>Kondisi Makanan</span><b>Baik</b></div>
`)}
${sectionHead('Kandungan Gizi per Porsi')}
${card(macroChips(m.gizi))}
<div class="mt-4">${btn('Lihat Foto', { go: '/sekolah/hasil/foto', variant: 'ghost', wide: true, ic: 'image' })}</div>
`),
    mount() { setChrome('sekolah', 'scan'); },
  };
}

/* ─────────────── 5. Foto Hasil Scan ─────────────── */
export function hasilFoto() {
  return {
    title: 'Foto Hasil Scan',
    html: page(`
${appBar({ title: 'Foto Hasil Scan', back: true })}
${card(`<div class="photo-main">${trayGlyph(210)}<span class="photo-tag">${icon('image', { size: 14 })} Nampan MBG · 8 Agu 2026</span></div>`, { pad: false })}
<div class="photo-strip mt-3">
  ${[0, 1, 2].map((i) => `<button class="photo-thumb ${i === 0 ? 'is-on' : ''}">${trayGlyph(70)}</button>`).join('')}
</div>
<div class="mt-4">${btn('Tutup', { go: 'back', variant: 'ghost', wide: true })}</div>
`),
    mount(root) {
      setChrome('sekolah', 'scan');
      root.querySelectorAll('.photo-thumb').forEach((b) => b.addEventListener('click', () => {
        root.querySelectorAll('.photo-thumb').forEach((x) => x.classList.remove('is-on'));
        b.classList.add('is-on');
      }));
    },
  };
}

/* ─────────────── 6. Buat Laporan Masalah ─────────────── */
export function lapor() {
  return {
    title: 'Buat Laporan Masalah',
    html: page(`
${appBar({ title: 'Buat Laporan Masalah', back: true })}
<form id="form-lapor">
  ${sectionHead('Pilih jenis masalah')}
  ${card(JENIS_MASALAH.map((j, i) => `
    <label class="radio-row">
      <input type="radio" name="jenis" value="${esc(j)}" ${i === 0 ? 'checked' : ''}>
      <span class="radio-dot"></span><span>${esc(j)}</span>
    </label>`).join(''), { pad: false })}

  ${sectionHead('Catatan (opsional)')}
  <textarea class="ta" id="catatan" maxlength="200" placeholder="Tuliskan catatan tambahan…"></textarea>
  <p class="counter"><span id="cnt">0</span>/200</p>

  ${sectionHead('Tambah Foto (opsional)')}
  <button type="button" class="photo-drop ic-host" data-act="foto">
    ${icon('camera', { size: 26 })}<span>Ambil atau pilih foto</span>
  </button>

  <div class="mt-5">${btn('Kirim Laporan', { variant: 'primary', wide: true, ic: 'send', type: 'submit' })}</div>
</form>
`),
    mount(root) {
      setChrome('sekolah', 'laporan');
      const ta = root.querySelector('#catatan');
      const cnt = root.querySelector('#cnt');
      ta.addEventListener('input', () => { cnt.textContent = ta.value.length; });
      root.querySelector('[data-act="foto"]')?.addEventListener('click', () =>
        toast('Lampiran foto', 'Unggahan foto belum aktif pada demo ini.', 'info'));
      root.querySelector('#form-lapor').addEventListener('submit', (e) => {
        e.preventDefault();
        const jenis = root.querySelector('input[name="jenis"]:checked')?.value;
        toast('Laporan terkirim', `“${jenis}” diteruskan ke ${MENU_HARI_INI.sppg}.`, 'ok', 4200);
        setTimeout(() => go('/sekolah/laporan'), 800);
      });
    },
  };
}

/* ─────────────── 7. Riwayat Pemeriksaan ─────────────── */
export function riwayat() {
  return {
    title: 'Riwayat Pemeriksaan',
    html: page(`
${appBar({ title: 'Riwayat Pemeriksaan', back: true })}
${searchBar('Cari riwayat…', { filter: true, target: '#list-riwayat' })}
<div class="mt-4" id="list-riwayat">
  ${card(RIWAYAT.map((r, i) => listRow({
    title: r.tgl,
    sub: `${esc(r.sppg)} · Kesesuaian ${r.sesuai}% · FSI ${r.fsi}/100`,
    lead: foodThumb(i % 2 ? 'kal' : 'g', 44),
    trail: statusBadge(r.status === 'sesuai' ? 'Sesuai' : 'Tidak Sesuai'),
    go: '/sekolah/riwayat/' + i,
  })).join(''), { pad: false })}
</div>
`),
    mount(root) {
      setChrome('sekolah', 'riwayat');
      wireFilter(root, '#list-riwayat .row');
    },
  };
}

/* ─────────────── 8. Detail Riwayat ─────────────── */
export function riwayatDetail({ params }) {
  const r = RIWAYAT[Number(params.i)] || RIWAYAT[0];
  const m = MENU_HARI_INI;
  return {
    title: 'Detail Riwayat',
    html: page(`
${appBar({ title: 'Detail Riwayat', back: true })}
<div class="detail-head">
  <div><b>${esc(r.tgl)}</b><span class="muted"> · 10:15 WIB</span></div>
  ${statusBadge(r.status === 'sesuai' ? 'Sesuai' : 'Tidak Sesuai')}
</div>
<p class="muted" style="font-size:.82rem">${esc(r.sppg)}</p>

${sectionHead('Menu')}
${card(m.items.map((it) => listRow({
  title: it.nama, sub: it.ket, lead: foodThumb(it.tone, 40), trail: `<b>${it.kal} kkal</b>`,
})).join(''), { pad: false })}

${card(`<div class="kv"><span>Kesesuaian</span><b class="tone-${r.sesuai === 100 ? 'ok' : 'warn'}">${r.sesuai}%</b></div>`)}

${sectionHead('Food Safety Index')}
${fsiCard(r.fsi, { sub: 'Data dari hasil pemeriksaan sekolah' })}
${card(PEMERIKSAAN_HARI_INI.baris.map((b) => `
  <div class="kv"><span>${icon(b.ic, { size: 15 })} ${esc(b.label)}</span><b>${esc(b.nilai)}</b></div>`).join(''))}

<div class="btn-row mt-4">
  ${btn('Lihat Foto', { go: '/sekolah/hasil/foto', variant: 'ghost', ic: 'image' })}
  ${btn('Laporkan Masalah', { go: '/sekolah/lapor', variant: 'danger' })}
</div>
`),
    mount() { setChrome('sekolah', 'riwayat'); },
  };
}

/* ─────────────── 9. Laporan Saya ─────────────── */
export function laporan() {
  const render = (filter) => {
    const rows = LAPORAN_SAYA.filter((l) => !filter || l.status === filter);
    if (!rows.length) return emptyState('Belum ada laporan', 'Laporan yang Anda kirim akan muncul di sini.', 'fileText');
    return card(rows.map((l) => listRow({
      title: l.judul,
      sub: `${esc(l.tgl)}<br>${esc(l.sppg)}`,
      lead: `<span class="row-ic">${icon('fileText', { size: 18 })}</span>`,
      trail: statusBadge(l.status),
    })).join(''), { pad: false });
  };

  return {
    title: 'Laporan Saya',
    html: page(`
${appBar({ title: 'Laporan Saya', back: true, right: iconBtn('plus', { go: '/sekolah/lapor', label: 'Buat laporan' }) })}
${segmented(['Terkirim', 'Selesai'], 0, 'lap')}
<div class="mt-4" id="lap-body">${render(null)}</div>
`),
    mount(root) {
      setChrome('sekolah', 'laporan');
      const body = root.querySelector('#lap-body');
      root.querySelectorAll('[data-seg="lap"] .seg').forEach((b) => b.addEventListener('click', () => {
        root.querySelectorAll('[data-seg="lap"] .seg').forEach((x) => {
          x.classList.remove('is-on'); x.setAttribute('aria-selected', 'false');
        });
        b.classList.add('is-on'); b.setAttribute('aria-selected', 'true');
        body.innerHTML = render(b.dataset.segIdx === '1' ? 'Selesai' : null);
        import('../icons.js').then((mod) => mod.hydrateIcons(body));
      }));
    },
  };
}

/* ─────────────── 10. Profil Sekolah ─────────────── */
export function profil() {
  const p = PROFIL_SEKOLAH;
  return {
    title: 'Profil Sekolah',
    html: page(`
${appBar({ title: 'Profil Sekolah', back: true, right: iconBtn('settings', { go: '/sekolah/pengaturan', label: 'Pengaturan' }) })}

<div class="profile-head">
  <span class="profile-av">${icon('school', { size: 30, draw: true })}${sparkField(3)}</span>
  <b>${esc(p.nama)}</b>
  <span class="muted">NPSN: ${esc(p.npsn)}</span>
</div>

${sectionHead('Informasi Sekolah')}
${card(`
  <div class="kv"><span>${icon('mapPin', { size: 15 })} Alamat</span><b>${esc(p.alamat)}</b></div>
  <div class="kv"><span>${icon('fileText', { size: 15 })} Email</span><b>${esc(p.email)}</b></div>
  <div class="kv"><span>${icon('idCard', { size: 15 })} Kontak</span><b>${esc(p.kontak)}</b></div>
`)}

${sectionHead('Pengguna')}
${card(`
  <div class="kv"><span>Nama</span><b>${esc(p.user.nama)}</b></div>
  <div class="kv"><span>Email</span><b>${esc(p.user.email)}</b></div>
  <div class="kv"><span>Peran</span><b>${esc(p.user.peran)}</b></div>
`)}

<div class="mt-5">${btn('Keluar Akun', { act: 'logout', variant: 'danger', wide: true, ic: 'logout' })}</div>
`),
    mount() { setChrome('sekolah', 'profil'); },
  };
}

/* ─────────────── 11. Notifikasi sekolah ─────────────── */
export function notifikasi() {
  const items = [
    { tone: 'ok',   judul: 'Menu hari ini tersedia', isi: 'SPPG Sukoharjo 01 mengirim menu 8 Agustus.', waktu: '08:10' },
    { tone: 'warn', judul: 'Pemeriksaan belum diisi', isi: 'Lakukan scan MBG sebelum pukul 11.00.',      waktu: '09:30' },
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
    mount() { setChrome('sekolah', 'home'); },
  };
}

/* ─────────────── Utilitas: filter daftar dari kolom cari ─────────────── */
export function wireFilter(root, rowSel) {
  const input = root.querySelector('.searchbar input');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    root.querySelectorAll(rowSel).forEach((r) => {
      r.style.display = !q || r.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}
