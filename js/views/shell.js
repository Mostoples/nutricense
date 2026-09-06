/* ============================================================
   NUTRICENSE — Chrome aplikasi (rail + tabbar)
   Navigasi sengaja hidup DI LUAR outlet router supaya tidak
   ikut teranimasi setiap pindah layar — hanya penanda aktif
   yang bergeser, persis seperti aplikasi native.
   ============================================================ */

'use strict';

import { icon } from '../icons.js';
import { logoMark } from '../decor.js';
import { applyRoleAccent } from '../store.js';

/* Lima tujuan utama per peran, mengikuti tabbar pada rancangan. */
export const NAV = {
  sekolah: [
    { id: 'home',    label: 'Home',    ic: 'home',      go: '/sekolah' },
    { id: 'riwayat', label: 'Riwayat', ic: 'clipboard', go: '/sekolah/riwayat' },
    { id: 'scan',    label: 'Scan',    ic: 'scan',      go: '/sekolah/scan' },
    { id: 'laporan', label: 'Laporan', ic: 'fileText',  go: '/sekolah/laporan' },
    { id: 'profil',  label: 'Profil',  ic: 'user',      go: '/sekolah/profil' },
  ],
  sppg: [
    { id: 'home',   label: 'Home',        ic: 'home',      go: '/sppg' },
    { id: 'menu',   label: 'Menu',        ic: 'utensils',  go: '/sppg/menu' },
    { id: 'bahan',  label: 'Bahan',       ic: 'package',   go: '/sppg/bahan' },
    { id: 'periksa',label: 'Pemeriksaan', ic: 'shield',    go: '/sppg/pemeriksaan' },
    { id: 'laporan',label: 'Laporan',     ic: 'fileText',  go: '/sppg/laporan' },
  ],
  pemerintah: [
    { id: 'home',     label: 'Dashboard', ic: 'home',      go: '/pemerintah' },
    { id: 'sppg',     label: 'SPPG',      ic: 'utensils',  go: '/pemerintah/sppg' },
    { id: 'sekolah',  label: 'Sekolah',   ic: 'school',    go: '/pemerintah/sekolah' },
    { id: 'laporan',  label: 'Laporan',   ic: 'fileText',  go: '/pemerintah/laporan' },
    { id: 'pengguna', label: 'Pengguna',  ic: 'users',     go: '/pemerintah/pengguna' },
  ],
  murid: [
    { id: 'home',    label: 'Dashboard', ic: 'home',      go: '/murid' },
    { id: 'menu',    label: 'Menu',      ic: 'utensils',  go: '/murid/menu' },
    { id: 'edukasi', label: 'Edukasi',   ic: 'book',      go: '/murid/edukasi' },
    { id: 'riwayat', label: 'Riwayat',   ic: 'clipboard', go: '/murid/riwayat' },
    { id: 'profil',  label: 'Profil',    ic: 'user',      go: '/murid/profil' },
  ],
};

const RAIL_TITLE = {
  sekolah: 'Sekolah', sppg: 'SPPG', pemerintah: 'Pemerintah', murid: 'Murid',
};

/** Pasang / perbarui navigasi. Panggil `setChrome(null)` untuk menyembunyikan. */
export function setChrome(role, activeId) {
  const rail = document.getElementById('rail');
  const tabbar = document.getElementById('tabbar');
  const shell = document.getElementById('shell');
  if (!rail || !tabbar) return;

  if (!role) {
    rail.innerHTML = '';
    tabbar.innerHTML = '';
    shell?.classList.add('is-bare');
    document.documentElement.removeAttribute('data-role');
    return;
  }

  shell?.classList.remove('is-bare');
  applyRoleAccent();

  const items = NAV[role] || [];

  /* Bangun ulang hanya bila perannya berganti; selain itu cukup
     pindahkan penanda aktif agar transisi terasa mulus. */
  if (rail.dataset.role !== role) {
    rail.dataset.role = role;
    rail.className = 'rail';
    rail.innerHTML = `
      <div class="rail-brand">
        <span class="rail-mark">${logoMark(34)}</span>
        <span class="rail-name"><b>Nutricense</b><i>${RAIL_TITLE[role] || ''}</i></span>
      </div>
      <nav class="rail-nav">
        ${items.map((it) => `
          <a class="rail-item ic-host" href="#${it.go}" data-nav="${it.id}">
            <span class="rail-ic">${icon(it.ic, { size: 20 })}</span><span>${it.label}</span>
          </a>`).join('')}
      </nav>
      <div class="rail-foot">
        <button class="rail-item ic-host" data-act="theme">
          ${icon('moon', { size: 20 })}<span>Ganti Tema</span></button>
        <button class="rail-item ic-host is-danger" data-act="logout">
          ${icon('logout', { size: 20 })}<span>Keluar</span></button>
      </div>`;
  }

  if (tabbar.dataset.role !== role) {
    tabbar.dataset.role = role;
    tabbar.className = 'tabbar';
    tabbar.setAttribute('aria-label', 'Navigasi utama');
    tabbar.innerHTML = items.map((it) => `
      <a class="tab ic-host" href="#${it.go}" data-nav="${it.id}">
        <span class="tab-ic">${icon(it.ic, { size: 21 })}</span>
        <span class="tab-lbl">${it.label}</span>
        <span class="tab-pip"></span>
      </a>`).join('');
  }

  /* Sinkronkan penanda aktif di kedua navigasi */
  document.querySelectorAll('#rail [data-nav], #tabbar [data-nav]').forEach((n) =>
    n.classList.toggle('is-active', n.dataset.nav === activeId));
}
