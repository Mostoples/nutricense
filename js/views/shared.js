/* ============================================================
   NUTRICENSE — Layar bersama lintas peran
   Pengaturan, Bantuan, dan pratinjau perangkat NC-BOX-09X.
   ============================================================ */

'use strict';

import { icon } from '../icons.js';
import { sparkField } from '../decor.js';
import {
  appBar, card, page, listRow, btn, sectionHead, esc, toast, badge,
} from '../ui.js';
import { session } from '../store.js';
import { modePicker } from '../fx.js';
import { setChrome } from './shell.js';
import { mountProduct } from '../nc3d.js';

const backNav = () => {
  const r = session.role;
  return r ? NAV_HOME[r] : '/';
};
const NAV_HOME = {
  sekolah: 'profil', sppg: 'laporan', pemerintah: 'pengguna', murid: 'profil',
};

/* ─────────────── Pengaturan ─────────────── */
export function pengaturan() {
  const isGov = session.role === 'pemerintah';
  return {
    title: 'Pengaturan',
    html: page(`
${appBar({ title: 'Pengaturan', back: true })}

${sectionHead('Mode Tampilan')}
${card(modePicker())}

${sectionHead('Lainnya')}
${card(`
  <div class="switch-row">
    <span>${icon('bell', { size: 17 })} Notifikasi</span>
    <button class="switch is-on" data-act="notif" role="switch" aria-checked="true"><i></i></button>
  </div>
`)}

${sectionHead('Akun')}
${card([
  { t: 'Ubah Kata Sandi', ic: 'lock' },
  { t: 'Bahasa', ic: 'fileText', trail: 'Bahasa Indonesia' },
].map((x) => listRow({
  title: x.t, lead: `<span class="row-ic">${icon(x.ic, { size: 18 })}</span>`,
  trail: x.trail ? `<span class="muted">${esc(x.trail)}</span>` : undefined,
  go: '/pengaturan',
})).join(''), { pad: false })}

${isGov ? `
${sectionHead('Konfigurasi Sistem')}
${card([
  { t: 'Batasan Nilai FSI', s: 'Atur ambang aman / perlu perhatian', ic: 'shield' },
  { t: 'Kriteria Kesesuaian Menu', s: 'Atur toleransi ketidaksesuaian', ic: 'checkCircle' },
  { t: 'Backup & Sinkronisasi Data', s: 'Terakhir: 8 Agustus 2026', ic: 'refresh' },
].map((x) => listRow({
  title: x.t, sub: x.s, lead: `<span class="row-ic">${icon(x.ic, { size: 18 })}</span>`, go: '/pengaturan',
})).join(''), { pad: false })}` : ''}

${sectionHead('Perangkat')}
${card(listRow({
  title: 'Pratinjau NC-BOX-09X', sub: 'Lihat model 3D perangkat',
  lead: `<span class="row-ic">${icon('cpu', { size: 18 })}</span>`, go: '/perangkat',
}), { pad: false })}

${sectionHead('Tentang')}
${card([
  { t: 'Tentang Nutricense', ic: 'sparkle', go: '/bantuan' },
  { t: 'Bantuan & Panduan', ic: 'help', go: '/bantuan' },
  { t: 'Kebijakan Privasi', ic: 'fileText', go: '/bantuan' },
].map((x) => listRow({
  title: x.t, lead: `<span class="row-ic">${icon(x.ic, { size: 18 })}</span>`, go: x.go,
})).join(''), { pad: false })}

<p class="version">Versi Aplikasi 1.0.0</p>
<div class="mt-4">${btn('Keluar', { act: 'logout', variant: 'danger', wide: true, ic: 'logout' })}</div>
`),
    mount(root) {
      if (session.role) setChrome(session.role, backNav());
      root.querySelector('[data-act="notif"]')?.addEventListener('click', (e) => {
        const on = e.currentTarget.classList.toggle('is-on');
        e.currentTarget.setAttribute('aria-checked', String(on));
        toast('Notifikasi', on ? 'Notifikasi dinyalakan.' : 'Notifikasi dimatikan.', 'info', 2000);
      });
      /* Pemilih mode menandai pilihannya sendiri lewat fx.js;
         tidak ada yang perlu disinkronkan di sini. */
    },
  };
}

/* ─────────────── Bantuan ─────────────── */
export function bantuan() {
  const faq = [
    ['Apa itu Food Safety Index?', 'Nilai 0–100 yang meringkas suhu, pH, kelembapan, gas pembusukan, dan kondisi fisik makanan menjadi satu angka keputusan.'],
    ['Bagaimana cara memindai MBG?', 'Buka menu Scan, arahkan kamera ke nampan atau kode QR kemasan, lalu tekan tombol rana.'],
    ['Apa yang harus dilakukan bila menu tidak sesuai?', 'Tekan Buat Laporan pada layar hasil, pilih jenis masalah, dan kirim ke SPPG terkait.'],
    ['Apakah data tersimpan bila koneksi putus?', 'NC-BOX-09X menyimpan data secara lokal dan menyinkronkannya kembali begitu koneksi pulih.'],
  ];
  return {
    title: 'Bantuan',
    html: page(`
${appBar({ title: 'Bantuan & Panduan', back: true })}
${sectionHead('Pertanyaan Umum')}
${card(faq.map(([q, a], i) => `
  <details class="faq" ${i === 0 ? 'open' : ''}>
    <summary>${esc(q)}${icon('chevronDown', { size: 17 })}</summary>
    <p>${esc(a)}</p>
  </details>`).join(''), { pad: false })}
${sectionHead('Hubungi Dukungan')}
${card(listRow({
  title: 'dukungan@nutricense.id', sub: 'Balasan dalam 1×24 jam kerja',
  lead: `<span class="row-ic">${icon('send', { size: 18 })}</span>`,
}), { pad: false })}
`),
    mount() { if (session.role) setChrome(session.role, backNav()); },
  };
}

/* ─────────────── Pratinjau perangkat 3D ─────────────── */
export function perangkat() {
  const spek = [
    ['Mikrokontroler', 'ESP32'], ['Kamera', 'ESP32-CAM (OV2640)'],
    ['Sensor Suhu', 'MLX90614 (non-contact)'], ['Sensor Gas', 'MQ-135'],
    ['Load Cell', 'HX711 · 5 kg'], ['Display', 'Touchscreen 4,3 inci'],
    ['UV-C LED', '265 nm'], ['Komunikasi', 'WiFi (IoT)'], ['Catu Daya', '12V 3A'],
  ];
  return {
    title: 'NC-BOX-09X',
    html: page(`
${appBar({ title: 'NC-BOX-09X', back: true, sub: 'Smart Nutrition Verification System' })}

<div class="device-stage">
  <canvas id="dev-3d"></canvas>
  <span class="device-hint">${icon('refresh', { size: 14 })} Seret untuk memutar</span>
</div>

<div class="btn-row mt-4">
  ${btn('Simulasi Pindai', { act: 'scan', variant: 'primary', ic: 'scan' })}
  ${btn('Hentikan', { act: 'stop', variant: 'ghost' })}
</div>

${sectionHead('Spesifikasi')}
${card(spek.map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join(''))}

${sectionHead('Alur Kerja')}
${card([
  'Letakkan ompreng pada nampan',
  'Pintu tertutup, pemindaian dimulai',
  'Kamera AI mengenali menu',
  'Sensor membaca suhu, pH, gas, berat',
  'AI menghitung nutrisi & kesesuaian',
  'Hasil ditampilkan pada layar',
].map((t, i) => `<div class="step"><b>${i + 1}</b><span>${esc(t)}</span></div>`).join(''))}
`),
    mount(root) {
      if (session.role) setChrome(session.role, backNav());
      let box = null;
      mountProduct(root.querySelector('#dev-3d')).then((b) => {
        box = b;
        if (!b) {
          root.querySelector('.device-stage')?.classList.add('is-fallback');
          toast('Pratinjau 3D', 'Perangkat ini tidak mendukung WebGL.', 'warn');
        }
      });
      root.querySelector('[data-act="scan"]')?.addEventListener('click', () => {
        box?.setScanning(true); box?.setStatus('safe');
        toast('Simulasi berjalan', 'Berkas pemindai menyapu ruang nampan.', 'ok', 2400);
      });
      root.querySelector('[data-act="stop"]')?.addEventListener('click', () => box?.setScanning(false));

      /* Model ikut berganti warna saat tema diubah */
      const obs = new MutationObserver(() =>
        box?.setTheme(document.documentElement.getAttribute('data-theme') || 'light'));
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

      return () => { obs.disconnect(); box?.destroy(); };
    },
  };
}
