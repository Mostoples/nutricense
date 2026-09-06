# NC-BOX-09X — Pipeline 3D Blender

Model, studio, dan render dibangun sepenuhnya lewat script Python. Tidak ada
langkah manual di GUI, sehingga hasilnya dapat diulang persis dan setiap
perubahan desain cukup dilakukan di kode.

Diuji pada **Blender 5.2.0 LTS**, render **Cycles + OptiX** (RTX 3070 Ti).

## Berkas

| Berkas             | Peran                                                        |
|--------------------|--------------------------------------------------------------|
| `nc_box.py`        | Pustaka: material, utilitas mesh, dan seluruh bagian perangkat |
| `studio.py`        | Environment: world, cyclorama, 6 lampu, kamera, setelan engine |
| `build_model.py`   | Bangun model + studio → `nc_box.blend`                        |
| `render_stills.py` | Enam still produk → `out/stills/`                             |
| `render_video.py`  | Video 4 shot → `out/nc_box_product.mp4`                       |
| `export_web.py`    | PNG → WebP/JPEG + salin mp4 ke `assets/`                      |
| `check_frames.py`  | Render frame kunci dengan sampel rendah untuk meninjau shot   |

## Menjalankan

```bash
B="/c/Program Files/Blender Foundation/Blender 5.2/blender.exe"

# 1. Bangun model, simpan .blend, plus satu render pratinjau
"$B" --background --factory-startup --python build_model.py -- --preview

# 2. Enam still produk 1080p
"$B" --background --factory-startup --python render_stills.py -- --samples 96

# 3. Video 17 detik (408 frame @24fps) — sekitar 45 menit
"$B" --background --factory-startup --python render_video.py -- --samples 48

# 4. Ubah hasil render menjadi aset web
"$B" --background --factory-startup --python export_web.py
```

Tinjau shot sebelum render penuh — jauh lebih murah daripada mengulang:

```bash
"$B" --background --factory-startup --python render_video.py -- --dry
"$B" --background nc_box_video.blend --python check_frames.py
```

## Papan cerita video

| Shot | Frame     | Isi                                                    |
|------|-----------|--------------------------------------------------------|
| A    | 1–96      | Reveal, turntable lambat dari tiga-perempat depan       |
| B    | 97–180    | Dolly mendekat ke panel hasil analisis                  |
| C    | 181–264   | Masuk ke ruang pindai, berkas pemindai menyapu nampan   |
| D    | 265–408   | Putaran penuh 360° sambil kamera menarik mundur         |

Kamera diikat ke timeline marker, jadi potongan antar-shot terjadi otomatis
saat render animasi.

## Dimensi model

Semua ukuran dalam meter dan mengikuti spesifikasi produk **45 × 32 × 42 cm**.
Konstanta ada di bagian atas `nc_box.py` (`W`, `D`, `H`, `TOWER_W`, dst.) —
mengubahnya akan menyesuaikan seluruh bagian karena setiap komponen
diposisikan relatif terhadap konstanta tersebut, bukan angka mati.

## Catatan versi Blender

Tiga hal berubah di Blender 4.4–5.x dan sudah ditangani di script:

1. `Action.fcurves` dihapus (slotted actions) — lihat `action_fcurves()`
   di `render_video.py`, yang menelusuri layer → strip → channelbag.
2. `FFMPEG` tidak muncul di enum `file_format` sampai
   `image_settings.media_type` diset ke `'VIDEO'` — lihat `setup_video_output()`.
3. Nama operator shade-smooth berbeda antar versi — `NC.smooth()` mencoba
   `shade_auto_smooth`, lalu `shade_smooth_by_angle`, lalu `shade_smooth`.

Nama input Principled BSDF juga berubah antara 3.x dan 4.x (`Clearcoat` →
`Coat Weight`, `Transmission` → `Transmission Weight`); `mat_principled()`
mencoba beberapa nama sehingga script tetap jalan di kedua rentang versi.
