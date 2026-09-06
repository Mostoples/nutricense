# Nutricense — Catatan Arsitektur

Peta berkas, cara menyunting hal yang sering diubah, dan sisa pekerjaan.
Live di <https://nutricense.web.app>.

## Tiga entri

| Berkas       | Isi                                                       |
|--------------|-----------------------------------------------------------|
| `index.html` | Company profile / landing page publik                     |
| `app.html`   | Aplikasi (SPA) untuk Sekolah, SPPG, Pemerintah, dan Murid  |
| `legacy/`    | Halaman lama, **tidak** di-deploy — aman dihapus           |

## Peta berkas

```
css/
  tokens.css    design token; aksen berganti per peran ([data-role])
  icons.css     animasi ikon (draw-on + reaksi hover)
  app.css       kerangka + komponen aplikasi (mobile-first → rail desktop)
  screens.css   gaya khusus tiap layar + animasi dekorasi SVG
  site.css      landing page (mandiri, tidak memakai app.css)
js/
  icons.js      registri 57 ikon (geometri Lucide) + jembatan Lordicon
  decor.js      dekorasi SVG orisinal: monogram nc, blob, kontur, gauge
  nc3d.js       model 3D NC-BOX-09X (Three.js, geometri prosedural)
  router.js     router hash + mesin transisi halaman
  store.js      data demo, sesi, simulasi sensor, perhitungan FSI
  ui.js         komponen bersama (app bar, kartu, chip makro, toast, sheet)
  main.js       bootstrap aplikasi + registrasi rute
  site.js       skrip landing page (termasuk data TIM)
  views/        satu berkas per peran + shell.js (navigasi) + shared.js
blender/        model & render 3D NC-BOX-09X — lihat blender/README.md
video/          promo produk, showreel, draft CapCut — lihat video/README.md
```

## Yang paling sering disunting

- **Nama & peran anggota tim** → array `TEAM` di bagian atas `js/site.js`.
- **Foto tim** → simpan di `assets/img/` (lihat `assets/img/README.md`).
- **Data demo** (menu, SPPG, sekolah, stok, notifikasi) → `js/store.js`.
- **Warna merek** → skala `--g-*` dan `--lime-*` di `css/tokens.css`.
- **Menu navigasi tiap peran** → objek `NAV` di `js/views/shell.js`.
- **Kredensial demo** → tabel `DEMO` di `js/views/auth.js`.
- **Bentuk perangkat 3D** → konstanta di `blender/nc_box.py`; salinan Three.js
  di `js/nc3d.js` memakai dimensi yang sama (×10), ubah keduanya bersamaan.

## Mode tampilan

Empat mode pada `<html data-theme>`, kunci localStorage `nutricense-theme`:

| Mode   | Ciri                                                          |
|--------|---------------------------------------------------------------|
| `light`| Putih bersih, kontras tinggi (bawaan)                         |
| `dark` | Gelap standar                                                  |
| `neu`  | Neumorphism — kartu sewarna latar, kedalaman dari dua bayangan |
| `aura` | Latar gelap berkabut warna, kartu kaca, tepi berpendar        |

- Token warna: blok `[data-theme="…"]` di `css/tokens.css`
- Bentuk permukaan per mode: `css/modes.css`
- Pengelola mode + lapisan efek: `js/fx.js`

Pemilih mode ada di navbar landing (ringkas) dan di Pengaturan aplikasi
(lengkap dengan keterangan). Tombol `[data-act="theme"]` menyiklus mode dan
**hanya ditangani `fx.js`** — jangan menambah handler kedua, mode akan
melompat dua langkah sekali klik.

`js/nc3d.js` punya satu entri palet per mode; menambah mode baru tanpa entri
membuat model 3D memakai pencahayaan mode terang di atas latar gelap.

## Efek & dekorasi

- `js/fx.js` menempelkan `.fx-layer` ke `<body>`: kabut aurora, kisi teknis,
  garis pindai, dan derau halus. Intensitasnya diatur per mode.
- Kartu mendapat kilau saat kursor lewat (`.has-shine`) dan sorot mengikuti
  kursor (`.has-spot`). Pointer dilacak satu listener di dokumen, bukan satu
  per kartu.
- `scatterDeco()` di `js/decor.js` menaburkan delapan motif SVG (sirkuit,
  gelombang, heksagon, cincin radar, urat daun, batang data, bingkai ukur,
  orbit) ke sudut kartu. Router mengumumkan `nc:rendered` setiap layar baru
  supaya kartu yang baru dirender ikut dihias.

**Jebakan CSS yang sudah ditangani:** aturan pengangkat isi kartu harus
memakai `:not(.card-deco)`. Tanpa itu `.card > *` (lebih spesifik daripada
`.card-deco`) menimpa `position:absolute` menjadi `relative`, dekorasi ikut
alur, dan isi kartu terdorong ke bawah.

## Video latar hero

`assets/video/hero-loop.mp4` / `.webm` (±300 KB) — potongan turntable 360°
dari render Blender, jadi sambungannya mulus tanpa perlu crossfade. Diputar
diam, berulang, sangat samar dan diblur agar tidak bersaing dengan judul.
Berhenti otomatis saat hero keluar layar atau tab disembunyikan, dan
dihapus seluruhnya bila pengguna memilih `prefers-reduced-motion`.

## Autentikasi

Provider yang aktif pada project `nutricense`: **Email/Password saja**.
Anonymous **tidak** aktif — jangan menambahkan `signInAnonymous()`, selalu
gagal dengan `ADMIN_ONLY_OPERATION`.

Empat akun demo terbuka, satu per peran. Detail lengkap dan risikonya ada di
`DEMO-ACCOUNTS.md`. Uji ulang kapan saja:

```bash
python video/verify_demo.py
```

## Belum selesai

- **Foto tim belum ada.** Kartu menampilkan inisial sampai berkasnya disimpan,
  dan nama anggota masih placeholder ("Anggota 1", dst) di `js/site.js`.
- **`serviceacounts.json` masih milik project lama** (`nutrilense-id`).
  Ganti dengan key baru dari project `nutricense`, lalu cabut key lama.
  Tidak dipakai aplikasi web, tetapi jangan dianggap valid.
- **Aturan Firestore terlalu longgar untuk data sungguhan** — setiap pengguna
  terautentikasi dapat menulis ke `scans`, `sensorLogs`, `alerts`, `schools`.
  Wajar untuk demo, harus diperketat sebelum ada data program.
- **Tidak ada musik pada kedua video.** Tambahkan di draft CapCut lalu Export.
- Unggah foto pada layar laporan masih placeholder.
- Data masih dari `store.js`; hanya hasil pindai yang menulis ke Firestore.

## Catatan deploy

`firebase.json` mengecualikan `video/**`, `blender/**`, `legacy/**`, `*.md`,
`config.js`, dan `serviceacounts.json`. Deploy yang sehat memuat **43 berkas**;
bila jumlahnya melonjak, ada folder kerja yang bocor ke hosting.
Saat ini **47 berkas** setelah penambahan modes.css, fx.js, dan video hero.
