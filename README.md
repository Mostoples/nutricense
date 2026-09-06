# NUTRICENSE

**An AI-Powered Smart Food Safety and Nutritional Assessment Box
for School Feeding Programs**

Perangkat NC-BOX-09X memadukan kamera AI dan empat sensor presisi untuk
memverifikasi **keamanan** dan **gizi** setiap porsi program Makan Bergizi
Gratis — sebelum porsi pertama sampai ke siswa. Repositori ini berisi
seluruh sisi digitalnya: situs profil, aplikasi empat peran, model 3D
produk, dan pipeline video.

🌐 **Live:** <https://nutricense.web.app>

| | |
|---|---|
| Situs profil | <https://nutricense.web.app> |
| Aplikasi | <https://nutricense.web.app/app.html> |
| Coba peran | <https://nutricense.web.app/app.html#/pilih-mode> |
| Repositori | <https://github.com/Mostoples/nutricense> |

## Isi repositori

| Bagian | Keterangan |
|---|---|
| `index.html` | Situs profil perusahaan — hero 3D, galeri render, video, tim |
| `app.html` | Aplikasi (SPA) untuk Sekolah, SPPG, Pemerintah, dan Murid |
| `css/` `js/` | Sumber front-end, tanpa framework dan tanpa build step |
| `assets/` | Aset yang disajikan: render produk, video, foto |
| `blender/` | Model & render 3D NC-BOX-09X (Python, headless) |
| `video/` | Perakitan video promo, showreel, dan draft CapCut |
| `legacy/` | Halaman versi lama, tidak di-deploy |

Peta berkas yang lebih rinci ada di [`progress.md`](progress.md).

## Menjalankan

Tanpa build step — seluruh front-end adalah ES module yang dijalankan
peramban langsung. Cukup sajikan foldernya lewat HTTP (bukan `file://`,
karena ES module butuh origin):

```bash
python -m http.server 8000
# lalu buka http://localhost:8000
```

Deploy:

```bash
firebase deploy --only hosting --project nutricense
```

## Aplikasi

Satu SPA, empat peran, 45 layar. Router berbasis hash dengan transisi
halaman (View Transitions API bila tersedia, jatuh ke animasi CSS bila
tidak). Aksen warna berganti per peran — hijau untuk Sekolah/SPPG/Murid,
ungu untuk Pemerintah.

**Empat mode tampilan:** Terang · Gelap · Neumorphism · Aura.
Pemilihnya ada di navbar situs dan di Pengaturan aplikasi.

### Akun demo

Terbuka untuk uji coba. Kata sandi semua peran: `nutricense2026`

| Peran | Pengenal | Email |
|---|---|---|
| Guru / Sekolah | NPSN `20312345` | `guru.demo@nutricense.id` |
| SPPG | `SPPG0101` | `sppg.demo@nutricense.id` |
| Pemerintah | `admin` | `dinas.demo@nutricense.id` |
| Murid | NISN `0071234567` | `siswa.demo@nutricense.id` |

Setiap layar login punya tombol **Isi & masuk** satu ketuk. Rincian dan
catatan keamanannya di [`DEMO-ACCOUNTS.md`](DEMO-ACCOUNTS.md).

## Model 3D

Bentuk NC-BOX-09X dibangun **sepenuhnya lewat script Python**, bukan
dimodelkan manual — jadi setiap perubahan desain adalah perubahan kode dan
hasilnya dapat diulang persis. Ada dua salinan yang sengaja dijaga sejalan:

- `blender/nc_box.py` — untuk render Cycles (still & video)
- `js/nc3d.js` — untuk pratinjau interaktif di web (Three.js)

Keduanya memakai dimensi yang sama (45 × 32 × 42 cm). Detail di
[`blender/README.md`](blender/README.md).

## Video

Dua video, keduanya dari script:

- **Promo produk** (29 s) — render Blender + still Ken Burns + kartu
- **Showreel aplikasi** (35 s) — rekaman layar asli via Playwright

Pipeline dan jebakan yang sudah ditangani ada di
[`video/README.md`](video/README.md).

## Teknologi

Vanilla ES modules · Three.js (pratinjau 3D) · Firebase Auth + Firestore +
Hosting · Blender 5.2 (Cycles/OptiX) · ffmpeg · Playwright · Pillow ·
capcut-cli.

Tidak ada framework, bundler, atau langkah build. Ikon adalah SVG inline
bergeometri Lucide dengan animasi CSS lokal; seluruh dekorasi digambar
khusus untuk proyek ini.

## Pemeriksaan

```bash
python video/verify_site.py     # aset, mode, video, login keempat peran
python video/verify_demo.py     # khusus akun demo
```

## Status

Berjalan dan tayang. Yang masih terbuka tercatat di bagian
**Belum selesai** pada [`progress.md`](progress.md) — antara lain foto &
nama tim, penggantian service account key, dan pengetatan aturan Firestore
sebelum ada data program yang sebenarnya.

## Catatan

`serviceacounts.json` **tidak** ada di repositori ini dan tidak boleh
ditambahkan — berkas itu memuat private key. Konfigurasi Firebase pada
`js/firebase-config.js` berisi Web API key yang memang bersifat publik dan
diamankan oleh Firestore Security Rules, bukan oleh kerahasiaan kunci.

Seluruh hak cipta dipegang tim Nutricense. Belum ada lisensi terbuka yang
dilampirkan.
