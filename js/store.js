/* ============================================================
   NUTRICENSE — Lapisan data & sesi
   Angka, nama, dan status mengikuti rancangan layar yang
   diberikan (SPPG Sukoharjo 01, SMA Negeri 4 Surakarta, dst).
   Data demo disimpan di memori + localStorage; hasil pemindaian
   baru tetap disinkronkan ke Firestore lewat services.js.
   ============================================================ */

'use strict';

const LS_KEY = 'nutricense.session';

/* ─────────────── Sesi ─────────────── */
export const session = {
  role: null,          /* 'sekolah' | 'sppg' | 'pemerintah' | 'murid' */
  name: null,
  org: null,
  id: null,
  user: null,          /* objek Firebase Auth */
};

export function loadSession() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) Object.assign(session, JSON.parse(raw));
  } catch (e) { /* mode privat */ }
  applyRoleAccent();
  return session;
}

export function saveSession(patch) {
  Object.assign(session, patch);
  try { localStorage.setItem(LS_KEY, JSON.stringify({
    role: session.role, name: session.name, org: session.org, id: session.id,
  })); } catch (e) { /* abaikan */ }
  applyRoleAccent();
}

export function clearSession() {
  session.role = session.name = session.org = session.id = session.user = null;
  try { localStorage.removeItem(LS_KEY); } catch (e) { /* abaikan */ }
  document.documentElement.removeAttribute('data-role');
}

/** Aksen ungu khusus peran Pemerintah, hijau untuk sisanya. */
export function applyRoleAccent() {
  if (session.role) document.documentElement.setAttribute('data-role', session.role);
  else document.documentElement.removeAttribute('data-role');
}

/* ─────────────── Katalog peran ─────────────── */
export const ROLES = [
  { id: 'sekolah',    label: 'Guru / Sekolah', desc: 'Cek kesesuaian MBG dan pantau makanan di sekolah', icon: 'school',   tone: 'g' },
  { id: 'sppg',       label: 'SPPG',           desc: 'Kelola menu, nutrisi, dan food safety',            icon: 'utensils', tone: 'k' },
  { id: 'pemerintah', label: 'Pemerintah',     desc: 'Pantau data SPPG dan distribusi MBG',             icon: 'building', tone: 'p' },
  { id: 'murid',      label: 'Murid',          desc: 'Lihat menu harian dan edukasi gizi',              icon: 'user',     tone: 'g' },
];

/* ─────────────── Menu & gizi ─────────────── */
export const MENU_HARI_INI = {
  tanggal: '2026-08-08',
  sppg: 'SPPG Sukoharjo 01',
  judul: 'Nasi Ayam Teriyaki',
  batch: 'MBG-080826-01',
  items: [
    { nama: 'Nasi Putih',    kal: 200, ket: 'Karbohidrat 45 g', tone: 'krb' },
    { nama: 'Ayam Teriyaki', kal: 250, ket: 'Protein 30 g · Lemak 10 g', tone: 'pro' },
    { nama: 'Tumis Sayur',   kal: 80,  ket: 'Serat 4 g', tone: 'g' },
    { nama: 'Pisang',        kal: 70,  ket: 'Serat 2 g', tone: 'kal' },
  ],
  gizi: { kal: 650, protein: 28, karbo: 85, lemak: 20 },
  detail: [
    ['Serat', '6 g'], ['Gula', '10 g'], ['Natrium', '450 mg'],
    ['Kalsium', '120 mg'], ['Zat Besi', '3,5 mg'],
    ['Vitamin A', '300 mcg'], ['Vitamin C', '25 mg'],
  ],
};

/* ─────────────── Pemeriksaan / Food Safety Index ─────────────── */
export const PEMERIKSAAN_HARI_INI = {
  fsi: 92,
  status: 'AMAN',
  baris: [
    { label: 'Suhu',            nilai: '65°C',   status: 'ok',   ic: 'thermometer' },
    { label: 'pH',              nilai: '6,2',    status: 'ok',   ic: 'droplet' },
    { label: 'Kelembapan',      nilai: '58%',    status: 'ok',   ic: 'wind' },
    { label: 'Gas (MQ135)',     nilai: 'Normal', status: 'ok',   ic: 'beaker' },
    { label: 'Kondisi Makanan', nilai: 'Baik',   status: 'ok',   ic: 'checkCircle' },
  ],
  tren: [88, 86, 84, 87, 90, 89, 92],
  trenLabel: ['2/8', '3/8', '4/8', '5/8', '6/8', '7/8', '8/8'],
};

/* ─────────────── Riwayat pemeriksaan ─────────────── */
export const RIWAYAT = [
  { tgl: '8 Agustus 2026',  menu: 'Nasi + Ayam Teriyaki + Sayur + Pisang', sppg: 'SPPG Sukoharjo 01', sesuai: 100, fsi: 89, status: 'sesuai' },
  { tgl: '7 Agustus 2026',  menu: 'Nasi + Telur + Sayur + Buah',           sppg: 'SPPG Sukoharjo 01', sesuai: 75,  fsi: 72, status: 'tidak' },
  { tgl: '6 Agustus 2026',  menu: 'Nasi + Ayam + Sayur',                   sppg: 'SPPG Sukoharjo 01', sesuai: 100, fsi: 91, status: 'sesuai' },
  { tgl: '5 Agustus 2026',  menu: 'Nasi + Ikan + Sayur + Buah',            sppg: 'SPPG Sukoharjo 01', sesuai: 90,  fsi: 85, status: 'tidak' },
  { tgl: '4 Agustus 2026',  menu: 'Nasi + Tempe Orek + Sayur',             sppg: 'SPPG Sukoharjo 01', sesuai: 100, fsi: 88, status: 'sesuai' },
];

/* ─────────────── Bahan & stok ─────────────── */
export const BAHAN = [
  { nama: 'Beras',        stok: 50, unit: 'kg',   kat: 'Pokok',   pct: 90, status: 'Tersedia' },
  { nama: 'Ayam Fillet',  stok: 25, unit: 'kg',   kat: 'Protein', pct: 62, status: 'Tersedia' },
  { nama: 'Wortel',       stok: 10, unit: 'kg',   kat: 'Sayur',   pct: 40, status: 'Tersedia' },
  { nama: 'Kangkung',     stok: 6,  unit: 'kg',   kat: 'Sayur',   pct: 28, status: 'Tersedia' },
  { nama: 'Pisang',       stok: 60, unit: 'buah', kat: 'Buah',    pct: 95, status: 'Tersedia' },
  { nama: 'Minyak Goreng',stok: 8,  unit: 'liter',kat: 'Bumbu',   pct: 34, status: 'Tersedia' },
  { nama: 'Gula Pasir',   stok: 5,  unit: 'kg',   kat: 'Bumbu',   pct: 22, status: 'Tersedia' },
];

/* ─────────────── Produksi & pengiriman ─────────────── */
export const PRODUKSI = [
  { tgl: '7 Agustus 2026', menu: 'Nasi + Ikan Bakar',    porsi: 1200, fsi: 95, status: 'Aman' },
  { tgl: '6 Agustus 2026', menu: 'Nasi + Telur Dadar',   porsi: 1150, fsi: 90, status: 'Aman' },
  { tgl: '5 Agustus 2026', menu: 'Nasi + Ayam Teriyaki', porsi: 1300, fsi: 92, status: 'Aman' },
  { tgl: '4 Agustus 2026', menu: 'Nasi + Tempe Orek',    porsi: 1100, fsi: 88, status: 'Perlu Perhatian' },
];

export const PENGIRIMAN = {
  ringkas: { terkirim: 12, proses: 3, belum: 0, total: 15 },
  sekolah: [
    { nama: 'SMA Negeri 4 Surakarta',  porsi: 1250, status: 'Terkirim' },
    { nama: 'SMP Negeri 2 Sukoharjo',  porsi: 800,  status: 'Dalam Proses' },
    { nama: 'SD Negeri Grogol 1',      porsi: 600,  status: 'Terkirim' },
    { nama: 'SD Muhammadiyah Sukoharjo',porsi: 350, status: 'Terkirim' },
    { nama: 'SMA Muhammadiyah 1 Sukoharjo', porsi: 300, status: 'Dalam Proses' },
  ],
};

/* ─────────────── Data nasional (Pemerintah) ─────────────── */
export const NASIONAL = {
  totalSppg: 125, sekolah: 420, porsi: 85240,
  status: { aman: 112, perhatian: 10, bermasalah: 3 },
  kesesuaian: 91, fsiRata: 92, kalRata: 650,
  tren: [90, 88, 86, 89, 91, 90, 92],
  trenLabel: ['2/8', '3/8', '4/8', '5/8', '6/8', '7/8', '8/8'],
};

export const DAFTAR_SPPG = [
  { id: 'SPPG0101', nama: 'SPPG Sukoharjo 01',   wil: 'Sukoharjo, Jawa Tengah',   fsi: 92, sekolah: 12, status: 'Aman' },
  { id: 'SPPG0102', nama: 'SPPG Sukoharjo 02',   wil: 'Sukoharjo, Jawa Tengah',   fsi: 78, sekolah: 8,  status: 'Perlu Perhatian' },
  { id: 'SPPG0201', nama: 'SPPG Surakarta 01',   wil: 'Surakarta, Jawa Tengah',   fsi: 94, sekolah: 15, status: 'Aman' },
  { id: 'SPPG0301', nama: 'SPPG Karanganyar 01', wil: 'Karanganyar, Jawa Tengah', fsi: 70, sekolah: 10, status: 'Bermasalah' },
  { id: 'SPPG0401', nama: 'SPPG Boyolali 01',    wil: 'Boyolali, Jawa Tengah',    fsi: 90, sekolah: 9,  status: 'Aman' },
];

export const SEKOLAH_TERLAYANI = [
  { nama: 'SMA Negeri 4 Surakarta',       siswa: 600, status: 'Aktif' },
  { nama: 'SMP Negeri 2 Sukoharjo',       siswa: 450, status: 'Aktif' },
  { nama: 'SD Negeri Grogol 1',           siswa: 350, status: 'Aktif' },
  { nama: 'SD Muhammadiyah Sukoharjo',    siswa: 300, status: 'Aktif' },
  { nama: 'SMA Muhammadiyah 1 Sukoharjo', siswa: 250, status: 'Aktif' },
];

export const NOTIFIKASI = [
  { tone: 'warn', judul: 'SPPG Sukoharjo 02',   isi: 'Food Safety Index turun menjadi 78/100', waktu: '10 menit lalu' },
  { tone: 'bad',  judul: 'SPPG Karanganyar 01', isi: 'Menu tidak sesuai di 2 sekolah hari ini', waktu: '30 menit lalu' },
  { tone: 'warn', judul: 'SPPG Boyolali 01',    isi: 'Suhu makanan melebihi batas (>70°C)',     waktu: '1 jam lalu' },
  { tone: 'info', judul: 'SPPG Surakarta 01',   isi: 'Pemeriksaan harian belum diisi',          waktu: '2 jam lalu' },
];

export const PENGGUNA = [
  { nama: 'Admin Pusat',      email: 'admin@kemendikbud.go.id',           peran: 'Super Admin' },
  { nama: 'Admin Provinsi',   email: 'jateng@kemendikbud.go.id',          peran: 'Admin Provinsi' },
  { nama: 'Operator Kab/Kota',email: 'sukoharjo@kemendikbud.go.id',       peran: 'Operator' },
  { nama: 'Viewer',           email: 'viewer.solo@kemendikbud.go.id',     peran: 'Viewer' },
];

/* ─────────────── Edukasi (Murid) ─────────────── */
export const ARTIKEL = [
  { judul: 'Pentingnya Sarapan Sehat',      ic: 'sun',    tone: 'kal' },
  { judul: 'Manfaat Protein untuk Tubuh',   ic: 'apple',  tone: 'pro' },
  { judul: 'Cara Menjaga Kebersihan Makanan',ic: 'shield',tone: 'g'   },
  { judul: 'Mengenal Gizi Seimbang',        ic: 'leaf',   tone: 'krb' },
  { judul: 'Bahaya Makanan Tidak Aman',     ic: 'alertCircle', tone: 'lem' },
];

/* ─────────────── Laporan masalah ─────────────── */
export const JENIS_MASALAH = [
  'Menu tidak sesuai', 'Jumlah kurang', 'Kondisi makanan kurang baik',
  'Kemasan rusak', 'Makanan terlalu dingin/panas', 'Komponen makanan tidak lengkap', 'Lainnya',
];

export const LAPORAN_SAYA = [
  { tgl: '8 Agustus 2026 · 10:30 WIB', judul: 'Menu tidak sesuai',          sppg: 'SPPG Sukoharjo 01', status: 'Diproses' },
  { tgl: '7 Agustus 2026 · 11:15 WIB', judul: 'Kondisi makanan kurang baik',sppg: 'SPPG Sukoharjo 01', status: 'Selesai' },
  { tgl: '5 Agustus 2026 · 09:20 WIB', judul: 'Jumlah kurang',              sppg: 'SPPG Sukoharjo 01', status: 'Selesai' },
];

/* ─────────────── Profil ─────────────── */
export const PROFIL_SEKOLAH = {
  nama: 'SMA Negeri 4 Surakarta', npsn: '20312345',
  alamat: 'Jl. Tentara Pelajar No. 7, Surakarta',
  email: 'info@sman4-ska.sch.id', kontak: '(0271) 123456',
  user: { nama: 'Guru MBG', email: 'guru.mbg@sman4-ska.sch.id', peran: 'Guru / Koordinator MBG' },
};

export const PROFIL_SPPG = {
  nama: 'SPPG Sukoharjo 01', id: 'SPPG0101', koordinator: 'Budi Santoso',
  alamat: 'Jl. Raya Sukoharjo No. 45, Sukoharjo, Jawa Tengah',
  telepon: '(0271) 1234567', email: 'sppg.sukoharjo01@gmail.com',
  sekolah: 15, kapasitas: '2.500 Porsi/Hari',
};

/* ─────────────── Utilitas ─────────────── */
export const fmtNum = (n) => new Intl.NumberFormat('id-ID').format(n);

/** Nada warna dari nilai Food Safety Index. */
export function fsiTone(v) { return v >= 85 ? 'ok' : v >= 70 ? 'warn' : 'bad'; }

export function statusTone(s) {
  const k = String(s).toLowerCase();
  if (k.includes('aman') || k.includes('sesuai') || k.includes('terkirim') || k.includes('selesai') || k.includes('aktif') || k.includes('tersedia')) return 'ok';
  if (k.includes('perhatian') || k.includes('proses') || k.includes('diproses')) return 'warn';
  if (k.includes('bermasalah') || k.includes('tidak')) return 'bad';
  return 'info';
}

/* ─────────────── Simulasi sensor NC-BOX ─────────────── */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const jitter = (base, r, d = 1) => parseFloat((base + (Math.random() - .5) * 2 * r).toFixed(d));

let snap = { suhu: 65, ph: 6.2, gas: 120, hum: 58 };

export function nextSensorSnapshot() {
  snap = {
    suhu: clamp(jitter(snap.suhu, 0.6, 1), 20, 100),
    ph:   clamp(jitter(snap.ph, 0.06, 2), 2, 14),
    gas:  clamp(Math.round(jitter(snap.gas, 9, 0)), 0, 2000),
    hum:  clamp(Math.round(jitter(snap.hum, 1.4, 0)), 10, 99),
    t: new Date(),
  };
  return snap;
}

/** Hitung Food Safety Index dari satu snapshot sensor. */
export function computeFSI(s) {
  let skor = 100;
  if (s.suhu < 60) skor -= (60 - s.suhu) * 2.5;
  if (s.suhu > 75) skor -= (s.suhu - 75) * 1.5;
  if (s.ph < 4 || s.ph > 8) skor -= 18;
  if (s.gas > 600) skor -= (s.gas - 600) / 25;
  if (s.hum < 40 || s.hum > 65) skor -= 6;
  return Math.round(clamp(skor, 0, 100));
}
