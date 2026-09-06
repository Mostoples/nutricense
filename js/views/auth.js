/* ============================================================
   NUTRICENSE — Layar awal & autentikasi
   Splash → Pilih Mode Pengguna → Login per peran.
   Autentikasi memakai Firebase: bila kolom diisi alamat email
   dipakai email+password; selain itu masuk sebagai sesi demo
   (anonymous) dengan identitas peran disimpan di sesi lokal.
   ============================================================ */

'use strict';

import { icon, lordIcon, LORD } from '../icons.js';
import { logoMark, blobField, sparkField, plateContour } from '../decor.js';
import { btn, textField, esc, toast } from '../ui.js';
import { ROLES, saveSession, session } from '../store.js';
import { AuthService } from '../firebase-config.js';
import { go } from '../router.js';

/* ─────────────── Splash ─────────────── */
export function splash() {
  return {
    title: 'Nutricense',
    html: `
<div class="splash">
  <div class="splash-bg">${blobField()}</div>
  <div class="splash-plate">${plateContour(320)}</div>
  <div class="splash-core">
    <span class="splash-mark">${logoMark(96)}</span>
    <h1 class="splash-name">Nutri<span>Cense</span></h1>
    <p class="splash-tag">Smart Nutrition &amp; Food Safety</p>
    <p class="splash-sub">Membangun generasi sehat melalui makanan bergizi dan aman</p>
  </div>
  <div class="splash-foot">
    <span class="splash-bar"><i></i></span>
    ${btn('Mulai', { go: '/pilih-mode', variant: 'primary', wide: true, ic: 'arrowRight' })}
  </div>
  <span class="splash-sparks">${sparkField(6)}</span>
</div>`,
    mount(root) {
      const t = setTimeout(() => {
        if (location.hash === '#/' || location.hash === '') go('/pilih-mode');
      }, 2600);
      root.querySelector('.btn')?.addEventListener('click', () => clearTimeout(t));
      return () => clearTimeout(t);
    },
  };
}

/* ─────────────── Pilih mode pengguna ─────────────── */
export function pilihMode() {
  return {
    title: 'Pilih Mode Pengguna',
    html: `
<div class="auth-screen">
  <div class="auth-deco">${blobField({ opacity: .8 })}</div>
  <header class="auth-top">
    <span class="auth-mark">${logoMark(52)}</span>
    <h1 class="h1">Pilih Mode Pengguna</h1>
    <p class="muted">Silakan pilih peran Anda untuk melanjutkan</p>
  </header>
  <div class="mode-list">
    ${ROLES.map((r, i) => `
      <button class="mode ic-host mode-${r.tone}" data-go="/login/${r.id}" style="--d:${i * 70}ms">
        <span class="mode-ic">${icon(r.icon, { size: 24 })}</span>
        <span class="mode-copy">
          <b>${esc(r.label)}</b>
          <i>${esc(r.desc)}</i>
        </span>
        <span class="mode-go">${icon('arrowRight', { size: 18 })}</span>
      </button>`).join('')}
  </div>
  <p class="auth-legal">Dengan melanjutkan Anda menyetujui Syarat &amp; Ketentuan Nutricense.</p>
</div>`,
  };
}

/* ─────────────── Akun demo ───────────────
   Akun Firebase sungguhan, satu per peran. Sengaja dibuka untuk uji coba.
   Pengenal alternatif (NPSN / ID SPPG / NISN) dipetakan ke akun yang sama
   supaya penguji bisa masuk memakai formulir seperti pengguna asli.

   Catatan: sebelumnya login non-email jatuh ke signInAnonymous(), padahal
   provider Anonymous tidak diaktifkan pada project ini — jalur itu selalu
   gagal. Sekarang semua peran memakai akun sungguhan di bawah ini. */
export const DEMO = {
  sekolah: {
    email: 'guru.demo@nutricense.id', pass: 'nutricense2026',
    alias: ['20312345'], name: 'Guru MBG', org: 'SMA Negeri 4 Surakarta',
  },
  sppg: {
    email: 'sppg.demo@nutricense.id', pass: 'nutricense2026',
    alias: ['SPPG0101'], name: 'Budi Santoso', org: 'SPPG Sukoharjo 01',
  },
  pemerintah: {
    email: 'dinas.demo@nutricense.id', pass: 'nutricense2026',
    alias: ['admin'], name: 'Admin Pusat', org: 'Kementerian Pendidikan',
  },
  murid: {
    email: 'siswa.demo@nutricense.id', pass: 'nutricense2026',
    alias: ['0071234567'], name: 'Siswa Demo', org: 'SMA Negeri 4 Surakarta',
  },
};

/** Ubah kode galat Firebase menjadi kalimat yang berguna bagi pengguna. */
function friendlyAuthError(msg) {
  const m = String(msg || '');
  if (m.includes('OPERATION_NOT_ALLOWED'))
    return 'Metode masuk ini belum diaktifkan pada project Firebase.';
  if (m.includes('INVALID_LOGIN_CREDENTIALS') || m.includes('INVALID_PASSWORD') ||
      m.includes('EMAIL_NOT_FOUND') || m.includes('invalid-credential'))
    return 'Email atau kata sandi tidak cocok. Coba tombol “Isi & masuk” pada kartu akun demo.';
  if (m.includes('TOO_MANY_ATTEMPTS')) return 'Terlalu banyak percobaan. Tunggu sebentar lalu ulangi.';
  if (m.includes('NETWORK')) return 'Koneksi bermasalah. Periksa jaringan Anda.';
  if (m.includes('MISSING_PASSWORD') || m.includes('missing-password'))
    return 'Kata sandi wajib diisi.';
  return m;
}

/** Cocokkan apa yang diketik dengan akun demo peran ini. */
function matchDemo(role, ident) {
  const d = DEMO[role];
  if (!d) return null;
  const v = (ident || '').trim().toLowerCase();
  if (!v) return null;
  if (v === d.email.toLowerCase()) return d;
  if (d.alias.some((a) => a.toLowerCase() === v)) return d;
  return null;
}

/* ─────────────── Login per peran ─────────────── */
const LOGIN_META = {
  sekolah: {
    judul: 'Login Guru / Sekolah', sub: 'Masukkan NPSN sekolah Anda',
    idLabel: 'NPSN Sekolah', idPh: 'Masukkan NPSN', hint: 'Contoh: 20312345',
    ic: 'school', home: '/sekolah',
  },
  sppg: {
    judul: 'Login SPPG', sub: 'Masukkan akun SPPG Anda',
    idLabel: 'ID SPPG', idPh: 'Masukkan ID SPPG', hint: 'Contoh: SPPG0101',
    ic: 'utensils', home: '/sppg',
  },
  pemerintah: {
    judul: 'Login Pemerintah', sub: 'Masukkan akun Anda',
    idLabel: 'ID / Email', idPh: 'Masukkan ID / Email', hint: '',
    ic: 'building', home: '/pemerintah',
  },
  murid: {
    judul: 'Login Murid', sub: 'Masukkan NISN Anda',
    idLabel: 'NISN', idPh: 'Masukkan NISN', hint: '',
    ic: 'user', home: '/murid',
  },
};

export function login({ params }) {
  const role = params.role;
  const m = LOGIN_META[role];
  if (!m) return { html: '<div class="pad-page">Peran tidak dikenal.</div>' };

  /* Aksen mengikuti peran sejak layar login */
  document.documentElement.setAttribute('data-role', role);

  return {
    title: m.judul,
    html: `
<div class="auth-screen is-login" data-role-form="${role}">
  <div class="auth-deco">${blobField({ opacity: .7 })}</div>
  <header class="appbar">
    <button class="icon-btn" data-go="back" aria-label="Kembali">${icon('arrowLeft')}</button>
    <div class="appbar-title is-center"><h1>${esc(m.judul)}</h1></div>
    <span class="appbar-spacer"></span>
  </header>

  <div class="auth-hero">
    <span class="auth-hero-art">
      ${lordIcon(LORD[role] || LORD.sukses, { size: 76, trigger: 'loop', fallback: m.ic })}
      ${sparkField(4)}
    </span>
    <p class="muted">${esc(m.sub)}</p>
  </div>

  <form class="auth-form" novalidate>
    ${textField(m.idLabel, { ph: m.idPh, hint: m.hint, id: 'f-id', ic: 'idCard' })}
    ${textField('Kata Sandi', { ph: 'Masukkan kata sandi', type: 'password', id: 'f-pw', ic: 'lock', pw: true })}
    <div class="field-row">
      <label class="check"><input type="checkbox"> Ingat saya</label>
      <button type="button" class="link" data-act="forgot">Lupa kata sandi?</button>
    </div>
    ${btn('Masuk', { variant: 'primary', wide: true, type: 'submit' })}
    <p class="auth-alt">Belum punya akun? <button type="button" class="link" data-act="daftar">Daftar</button></p>
  </form>

  <div class="demo-card">
    <div class="demo-head">
      ${icon('sparkle', { size: 15 })}<b>Akun demo</b>
      <button type="button" class="link" data-act="isi-demo">Isi &amp; masuk</button>
    </div>
    <div class="demo-kv"><span>${esc(m.idLabel)}</span><code>${esc(DEMO[role].alias[0])}</code></div>
    <div class="demo-kv"><span>Email</span><code>${esc(DEMO[role].email)}</code></div>
    <div class="demo-kv"><span>Kata sandi</span><code>${esc(DEMO[role].pass)}</code></div>
  </div>
</div>`,

    mount(root) {
      const form = root.querySelector('.auth-form');
      const idEl = root.querySelector('#f-id');
      const pwEl = root.querySelector('#f-pw');

      root.querySelector('[data-act="toggle-pw"]')?.addEventListener('click', (e) => {
        const on = pwEl.type === 'password';
        pwEl.type = on ? 'text' : 'password';
        e.currentTarget.innerHTML = icon(on ? 'eyeOff' : 'eye', { size: 18 });
      });

      root.querySelector('[data-act="forgot"]')?.addEventListener('click', () =>
        toast('Atur ulang kata sandi', 'Hubungi admin instansi Anda untuk mengatur ulang.', 'info'));
      root.querySelector('[data-act="daftar"]')?.addEventListener('click', () =>
        toast('Pendaftaran akun', 'Akun dibuat oleh admin instansi, bukan mandiri.', 'info'));

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submit = form.querySelector('button[type="submit"]');
        const ident = (idEl.value || '').trim();
        const pw = pwEl.value || '';

        if (!ident) {
          idEl.closest('.field-box').classList.add('is-bad');
          toast('Belum lengkap', m.idLabel + ' wajib diisi.', 'warn');
          setTimeout(() => idEl.closest('.field-box').classList.remove('is-bad'), 1600);
          return;
        }

        submit.disabled = true;
        submit.innerHTML = '<span class="spin"></span><span>Memproses…</span>';

        /* Pengenal demo (NPSN / ID SPPG / NISN / email demo) memakai akun
           demo peran ini; selain itu email + kata sandi biasa. */
        const demo = matchDemo(role, ident);
        const res = demo
          ? await AuthService.signInEmail(demo.email, pw || demo.pass)
          : await AuthService.signInEmail(ident, pw);

        if (res.error) {
          submit.disabled = false;
          submit.innerHTML = '<span>Masuk</span>';
          toast('Gagal masuk', friendlyAuthError(res.error), 'bad', 6000);
          return;
        }

        const d = demo || DEMO[role];
        saveSession({
          role,
          id: ident,
          user: res.user,
          name: res.user?.displayName || d.name,
          org: d.org,
        });

        toast('Berhasil masuk', 'Selamat datang di Nutricense.', 'ok', 2600);
        go(m.home);
      });

      /* Satu ketuk: isi kredensial demo peran ini lalu kirim */
      root.querySelector('[data-act="isi-demo"]')?.addEventListener('click', () => {
        const d = DEMO[role];
        idEl.value = d.alias[0];
        pwEl.value = d.pass;
        form.requestSubmit();
      });

      return () => {};
    },
  };
}

/* Jaga rute peran: jika belum login, lempar ke pemilihan mode. */
export function requireRole(role) {
  if (session.role !== role) { go('/pilih-mode'); return false; }
  return true;
}
