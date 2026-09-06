# Pipeline video Nutricense

Dua video dihasilkan di sini, keduanya dari script sehingga dapat diulang:

| Berkas                     | Isi                                              | Durasi |
|----------------------------|--------------------------------------------------|--------|
| `nutricense-promo.mp4`     | Promo produk NC-BOX-09X (render Blender 3D)      | 29 s   |
| `nutricense-showreel.mp4`  | Showreel penggunaan aplikasi (rekaman layar asli)| 35 s   |

Versi web yang lebih ringan disalin ke `../assets/video/`.

## Pembagian alat

Ketiganya dipakai untuk hal berbeda, dan pembagiannya bukan pilihan gaya:

- **Blender** — merender 3D produk (`../blender/`, lihat README di sana).
- **ffmpeg** — merakit video akhir. Ini yang menghasilkan mp4 jadi.
- **capcut-cli** — membangun draft CapCut yang bisa diedit.
  **Tidak bisa merender video final**: perintah `render` miliknya hanya
  membuat pratinjau proxy ffmpeg, bukan keluaran CapCut.
- **Playwright** — merekam penggunaan aplikasi untuk showreel.

## Berkas

| Berkas               | Peran                                                     |
|----------------------|-----------------------------------------------------------|
| `make_cards.py`      | Kartu judul, kartu akhir, lower third (Pillow)            |
| `build_video.py`     | Rakit promo produk: 10 segmen → xfade → mp4               |
| `record_app.py`      | Rekam tur aplikasi per peran (Playwright)                 |
| `build_showreel.py`  | Bingkai telepon + judul → showreel                        |
| `make_capcut.py`     | Draft CapCut yang bisa diedit                             |
| `verify_demo.py`     | Uji akun demo pada situs yang tayang                      |

Folder `segments/`, `segments_clean/`, `reel_segments/`, `app_clips/`, dan
`cards/` adalah keluaran antara. Semuanya dapat dibangun ulang; aman dihapus.

## Menjalankan

```bash
# ffmpeg tidak ada di PATH Node/Python di mesin ini — tunjuk langsung
export FFMPEG_BIN="/c/Users/mosto/AppData/Local/Microsoft/WinGet/Packages/\
Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0-full_build/bin/ffmpeg.exe"
export FFPROBE_BIN="${FFMPEG_BIN%ffmpeg.exe}ffprobe.exe"
export CAPCUT_BIN="C:\\Program Files\\nodejs\\capcut-cli.cmd"

python make_cards.py          # kartu grafis
python build_video.py         # promo produk  (butuh render Blender selesai)
python record_app.py          # rekam 4 peran (butuh situs tayang)
python build_showreel.py      # showreel aplikasi
python make_capcut.py         # draft CapCut
python verify_demo.py         # uji login demo
```

`build_video.py --fast` memakai CRF 20 + preset veryfast untuk iterasi cepat.

## Papan cerita

**Promo produk** — `STORYBOARD` di `build_video.py`. Berselang-seling antara
potongan render 3D, still Ken Burns, dan kartu angka. Lower third di-*bake*
pada versi mp4; versi CapCut memakai segmen bersih agar teksnya tetap bisa
diedit.

**Showreel** — `REEL` di `build_showreel.py`. Tiap entri memilih rentang dari
klip peran yang direkam. Bila naskah tur di `record_app.py` diubah, waktu
mulai di `REEL` ikut bergeser dan perlu disetel ulang.

## Jebakan yang sudah ditangani

Empat hal ini memakan waktu untuk ditemukan; jangan diulang:

1. **`zoompan` melipatgandakan durasi.** `d=N` menghasilkan N frame *per frame
   masukan*, bukan total — klip 2 detik pernah jadi 100 detik. Pakai `d=1`,
   kendalikan panjang dengan `-t`, dan samakan laju masukan dengan
   `-framerate`.
2. **Blur RGBA menghitamkan tepi.** Memblur gambar RGBA yang piksel
   transparannya hitam membuat hitam merembes (alpha pramultiplikasi).
   `blob_layer()` menggambar di atas dasar putih sebagai RGB.
3. **`capcut init` mencetak JSON lalu teks biasa.** `json.loads` atas seluruh
   stdout akan gagal; ambil baris JSON pertama.
4. **`capcut-cli` di Windows adalah shim tanpa ekstensi.** `subprocess` Python
   memerlukan `capcut-cli.cmd`. capcut-cli juga memanggil `ffprobe` lewat PATH
   miliknya sendiri, jadi direktori ffmpeg disisipkan ke PATH subprocess.

## Batasan yang diketahui

- **Tidak ada musik.** Kedua video memiliki trek audio senyap agar kompatibel
  di semua pemutar. Tambahkan musik pada draft CapCut, lalu Export dari
  aplikasi.
- **Layar Scan tampak hitam pada showreel.** Bukan bug aplikasi: screencast
  Playwright tidak menangkap lapisan WebGL. Diukur langsung, kanvas merender
  (kecerahan 102,7) dan hero 3D di landing terang (196,9). Di peramban
  sungguhan pratinjau 3D tampil normal.
