/* ============================================================
   NUTRICENSE — Bootstrap aplikasi
   Mendaftarkan seluruh rute, memasang perilaku global (tema,
   logout, bayangan app bar), lalu menjalankan router.
   ============================================================ */

'use strict';

import { route, setOutlet, startRouter, go } from './router.js';
import { hydrateIcons } from './icons.js';
import { toast } from './ui.js';
import { loadSession, session, clearSession } from './store.js';
import { initFx, wireCardFx, cycleMode, getMode } from './fx.js';
import { scatterDeco } from './decor.js';
import { setChrome } from './views/shell.js';
import { AuthService } from './firebase-config.js';

import * as auth from './views/auth.js';
import * as sekolah from './views/sekolah.js';
import * as sppg from './views/sppg.js';
import * as pem from './views/pemerintah.js';
import * as murid from './views/murid.js';
import * as shared from './views/shared.js';

/* ─────────────── Mode tampilan ───────────────
   Empat mode (light/dark/neu/aura) dikelola js/fx.js; di sini
   hanya disediakan pembungkus agar pemanggil lama tetap jalan. */
export function toggleTheme() { return cycleMode(); }

/* ─────────────── Penjaga peran ─────────────── */
/** Bungkus view agar hanya bisa dibuka oleh peran yang benar. */
function guard(role, view) {
  return (ctx) => {
    if (session.role !== role) {
      /* Belum masuk sebagai peran ini → arahkan ke pemilihan mode */
      queueMicrotask(() => go('/pilih-mode'));
      return { html: '<div class="pad-page"><p class="muted">Mengalihkan…</p></div>' };
    }
    return view(ctx);
  };
}

/* ─────────────── Rute ─────────────── */
function registerRoutes() {
  /* Awal & autentikasi */
  route('/', auth.splash);
  route('/pilih-mode', auth.pilihMode);
  route('/login/:role', auth.login);

  /* Sekolah / Guru */
  route('/sekolah',                guard('sekolah', sekolah.home));
  route('/sekolah/scan',           guard('sekolah', sekolah.scan));
  route('/sekolah/hasil',          guard('sekolah', sekolah.hasil));
  route('/sekolah/hasil/detail',   guard('sekolah', sekolah.hasilDetail));
  route('/sekolah/hasil/foto',     guard('sekolah', sekolah.hasilFoto));
  route('/sekolah/lapor',          guard('sekolah', sekolah.lapor));
  route('/sekolah/riwayat',        guard('sekolah', sekolah.riwayat));
  route('/sekolah/riwayat/:i',     guard('sekolah', sekolah.riwayatDetail));
  route('/sekolah/laporan',        guard('sekolah', sekolah.laporan));
  route('/sekolah/profil',         guard('sekolah', sekolah.profil));
  route('/sekolah/notifikasi',     guard('sekolah', sekolah.notifikasi));

  /* SPPG */
  route('/sppg',              guard('sppg', sppg.home));
  route('/sppg/menu',         guard('sppg', sppg.menu));
  route('/sppg/bahan',        guard('sppg', sppg.bahan));
  route('/sppg/nutrisi',      guard('sppg', sppg.nutrisi));
  route('/sppg/pemeriksaan',  guard('sppg', sppg.pemeriksaan));
  route('/sppg/laporan',      guard('sppg', sppg.laporan));
  route('/sppg/produksi',     guard('sppg', sppg.produksi));
  route('/sppg/pengiriman',   guard('sppg', sppg.pengiriman));
  route('/sppg/stok',         guard('sppg', sppg.stok));
  route('/sppg/profil',       guard('sppg', sppg.profil));
  route('/sppg/notifikasi',   guard('sppg', sppg.notifikasi));

  /* Pemerintah */
  route('/pemerintah',             guard('pemerintah', pem.home));
  route('/pemerintah/peta',        guard('pemerintah', pem.peta));
  route('/pemerintah/sppg',        guard('pemerintah', pem.daftarSppg));
  route('/pemerintah/sppg/:id',    guard('pemerintah', pem.detailSppg));
  route('/pemerintah/menu',        guard('pemerintah', pem.menuSppg));
  route('/pemerintah/pemeriksaan', guard('pemerintah', pem.pemeriksaanSppg));
  route('/pemerintah/riwayat',     guard('pemerintah', pem.riwayat));
  route('/pemerintah/sekolah',     guard('pemerintah', pem.sekolah));
  route('/pemerintah/analitik',    guard('pemerintah', pem.analitik));
  route('/pemerintah/laporan',     guard('pemerintah', pem.laporan));
  route('/pemerintah/notifikasi',  guard('pemerintah', pem.notifikasi));
  route('/pemerintah/pengguna',    guard('pemerintah', pem.pengguna));

  /* Murid */
  route('/murid',         guard('murid', murid.home));
  route('/murid/menu',    guard('murid', murid.menu));
  route('/murid/edukasi', guard('murid', murid.edukasi));
  route('/murid/riwayat', guard('murid', murid.riwayat));
  route('/murid/profil',  guard('murid', murid.profil));

  /* Bersama */
  route('/pengaturan', shared.pengaturan);
  route('/bantuan',    shared.bantuan);
  route('/perangkat',  shared.perangkat);
}

/* ─────────────── Perilaku global ─────────────── */
function wireGlobals() {
  /* Tema & keluar — dipicu dari mana pun lewat [data-act] */
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;

    /* [data-act="theme"] ditangani fx.js — jangan diulang di sini,
       dua handler membuat mode melompat dua langkah sekali klik. */

    if (el.dataset.act === 'logout') {
      if (!confirm('Keluar dari akun Nutricense?')) return;
      const res = await AuthService.logout();
      if (res.error) { toast('Gagal keluar', res.error, 'bad'); return; }
      clearSession();
      setChrome(null);
      toast('Berhasil keluar', 'Sampai jumpa lagi.', 'ok', 2400);
      go('/pilih-mode');
    }
  });

  /* Bayangan app bar muncul setelah digulir */
  const scroll = document.getElementById('scroll');
  scroll?.addEventListener('scroll', () => {
    scroll.classList.toggle('is-scrolled', scroll.scrollTop > 4);
  }, { passive: true });

  /* Tombol Esc menutup sheet yang terbuka */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelector('.sheet-wrap [data-close]')?.click();
  });
}

/* ─────────────── Efek per layar ───────────────
   Router mengumumkan 'nc:rendered' setiap kali outlet diisi ulang,
   jadi kartu baru ikut mendapat dekorasi dan efek kursor. */
function wireScreenFx() {
  const decorate = (root) => {
    wireCardFx(root);
    /* Hanya kartu teratas yang dihias — menghias semuanya membuat
       halaman panjang terasa ramai dan mengalihkan dari isinya. */
    scatterDeco(Array.from(root.querySelectorAll('.card')).slice(0, 3),
                { size: 124, positions: ['tr', 'br'] });
    scatterDeco(root.querySelectorAll('.mode'), { size: 120, positions: ['br'] });
  };
  document.addEventListener('nc:rendered', (e) => decorate(e.detail || document));
  decorate(document);
}

/* ─────────────── Jalankan ─────────────── */
function boot() {
  /* Tema tersimpan sudah diterapkan oleh skrip inline di <head>;
     di sini cukup pastikan atribut ada agar konsisten. */
  if (!document.documentElement.hasAttribute('data-theme')) {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  loadSession();
  setOutlet(document.getElementById('outlet'));
  registerRoutes();
  wireGlobals();

  /* Layar awal tanpa navigasi */
  if (!location.hash || location.hash === '#/') setChrome(null);

  initFx({ cards: false });        /* lapisan efek + delegasi mode */
  wireScreenFx();

  startRouter();
  hydrateIcons(document);

  /* Sinkronkan sesi Firebase dengan sesi lokal */
  AuthService.onAuthChange((user) => {
    session.user = user || null;
    if (!user && session.role) {
      /* Sesi Firebase habis tetapi peran masih tersimpan → biarkan
         pengguna melanjutkan demo, cukup catat di konsol. */
      console.info('[Nutricense] Sesi Firebase tidak aktif; melanjutkan mode lokal.');
    }
  });

  console.log('[Nutricense] Aplikasi siap.');
}

document.addEventListener('DOMContentLoaded', boot);
